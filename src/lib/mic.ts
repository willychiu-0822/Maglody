import { useCallback, useEffect, useRef, useState } from 'react'
import { ac, setAudioSession } from './audio'
import { CaptureGate } from './capture'
import { decimate, detectPitch } from './pitch'
import { freqToMidi } from './theory'

export interface LiveState {
  running: boolean
  midi: number | null
  levelDb: number
  peakDb: number
  error: string | null
}
type Recorded = { data: Float32Array; sampleRate: number }

export function useMic(opts: { record?: boolean; maxSec?: number; onFrame?: (midi: number | null, t: number) => void; onLimit?: (recording: Recorded | null) => void } = {}) {
  const [state, setState] = useState<LiveState>({ running: false, midi: null, levelDb: -100, peakDb: -100, error: null })
  const refs = useRef<{ gate: CaptureGate; raf?: number; limit?: number; chunks: Float32Array[]; proc?: ScriptProcessorNode; src?: MediaStreamAudioSourceNode; analyser?: AnalyserNode; mute?: GainNode; sampleRate: number; t0: number; peak: number }>({ gate: new CaptureGate(), chunks: [], sampleRate: 44100, t0: 0, peak: -100 })
  const optsRef = useRef(opts)
  optsRef.current = opts

  const stop = useCallback((): Recorded | null => {
    const r = refs.current
    r.gate.cancel()
    if (r.raf !== undefined) cancelAnimationFrame(r.raf)
    clearTimeout(r.limit)
    if (r.proc) r.proc.onaudioprocess = null
    r.proc?.disconnect(); r.src?.disconnect(); r.analyser?.disconnect(); r.mute?.disconnect()
    r.proc = undefined; r.src = undefined; r.analyser = undefined; r.mute = undefined
    r.raf = undefined; r.limit = undefined
    setAudioSession('playback')
    setState((s) => ({ ...s, running: false, midi: null }))
    const chunks = r.chunks
    r.chunks = []
    if (!chunks.length) return null
    const data = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
    let offset = 0
    chunks.forEach((chunk) => { data.set(chunk, offset); offset += chunk.length })
    return { data, sampleRate: r.sampleRate }
  }, [])

  const start = useCallback(async () => {
    const r = refs.current
    const generation = r.gate.begin()
    if (generation === null) return
    try {
      const c = ac()
      setAudioSession('play-and-record')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      if (!r.gate.accept(generation, stream)) return
      r.chunks = []; r.peak = -100; r.t0 = c.currentTime; r.sampleRate = c.sampleRate
      const src = r.src = c.createMediaStreamSource(stream)
      const analyser = r.analyser = c.createAnalyser()
      analyser.fftSize = 2048
      src.connect(analyser)
      if (optsRef.current.record) {
        const proc = r.proc = c.createScriptProcessor(4096, 1, 1)
        proc.onaudioprocess = (e) => { if (r.gate.current(generation)) r.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))) }
        const mute = r.mute = c.createGain()
        mute.gain.value = 0
        src.connect(proc); proc.connect(mute).connect(c.destination)
      }
      const maxSec = optsRef.current.maxSec ?? (optsRef.current.record ? 60 : 300)
      r.limit = window.setTimeout(() => { const recording = stop(); optsRef.current.onLimit?.(recording) }, maxSec * 1000)
      const buf = new Float32Array(analyser.fftSize)
      setState({ running: true, midi: null, levelDb: -100, peakDb: -100, error: null })
      let lastFrame = -Infinity
      const tick = (now: number) => {
        if (!r.gate.current(generation)) return
        if (now - lastFrame >= 32) {
          lastFrame = now
          analyser.getFloatTimeDomainData(buf)
          let peak = 0
          for (const sample of buf) peak = Math.max(peak, Math.abs(sample))
          const db = peak > 0 ? 20 * Math.log10(peak) : -100
          r.peak = Math.max(r.peak, db)
          const d = decimate(buf, c.sampleRate)
          const frequency = detectPitch(d.data, d.sampleRate)
          const midi = frequency > 0 ? freqToMidi(frequency) : null
          optsRef.current.onFrame?.(midi, c.currentTime - r.t0)
          setState((s) => ({ ...s, midi, levelDb: db, peakDb: r.peak }))
        }
        r.raf = requestAnimationFrame(tick)
      }
      r.raf = requestAnimationFrame(tick)
    } catch {
      if (!r.gate.current(generation)) return
      stop()
      setState((s) => ({ ...s, error: '無法使用麥克風：請確認瀏覽器已允許麥克風權限，並使用 https 或 localhost 開啟。' }))
    }
  }, [stop])

  const resetPeak = useCallback(() => { refs.current.peak = -100; setState((s) => ({ ...s, peakDb: -100 })) }, [])
  useEffect(() => () => { stop() }, [stop])
  return { ...state, start, stop, resetPeak }
}
