import { useCallback, useEffect, useRef, useState } from 'react'
import { ac, setAudioSession } from './audio'
import { decimate, detectPitch } from './pitch'
import { freqToMidi } from './theory'

export interface LiveState {
  pending: boolean
  running: boolean
  midi: number | null
  levelDb: number
  peakDb: number
  error: string | null
}

/**
 * 開麥克風並即時回報音高與音量。
 * record=true 時會同時把原始取樣收起來，stop() 回傳完整錄音。
 */
export function useMic(opts: { record?: boolean; maxSec?: number; onFrame?: (midi: number | null, t: number) => void; onLimit?: (data: {data: Float32Array; sampleRate: number} | null) => void } = {}) {
  const [state, setState] = useState<LiveState>({ pending: false, running: false, midi: null, levelDb: -100, peakDb: -100, error: null })
  const refs = useRef<{ stream?: MediaStream; raf?: number; limitTimer?: number; chunks: Float32Array[]; proc?: ScriptProcessorNode; src?: MediaStreamAudioSourceNode; t0: number; peak: number }>({ chunks: [], t0: 0, peak: -100 })
  const generation = useRef(0)
  const requesting = useRef(false)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const stop = useCallback((): { data: Float32Array; sampleRate: number } | null => {
    generation.current++
    requesting.current = false
    const r = refs.current
    window.clearTimeout(r.limitTimer)
    r.limitTimer = undefined
    if (r.raf) cancelAnimationFrame(r.raf)
    r.proc?.disconnect()
    r.src?.disconnect()
    r.stream?.getTracks().forEach((t) => t.stop())
    r.stream = undefined
    setAudioSession('playback')
    setState((s) => ({ ...s, pending: false, running: false, midi: null }))
    if (!optsRef.current.record || !r.chunks.length) return null
    const len = r.chunks.reduce((a, c) => a + c.length, 0)
    const data = new Float32Array(len)
    let o = 0
    r.chunks.forEach((c) => { data.set(c, o); o += c.length })
    r.chunks = []
    return { data, sampleRate: ac().sampleRate }
  }, [])

  const start = useCallback(async () => {
    if (requesting.current || refs.current.stream) return false
    requesting.current = true
    const token = ++generation.current
    setState(s => ({...s,pending:true,error:null}))
    const c = ac()
    setAudioSession('play-and-record')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      if (token !== generation.current) { stream.getTracks().forEach(t => t.stop()); return false }
      const r = refs.current
      r.stream = stream
      r.chunks = []
      r.peak = -100
      r.t0 = c.currentTime
      const src = c.createMediaStreamSource(stream)
      r.src = src
      const analyser = c.createAnalyser()
      analyser.fftSize = 2048
      src.connect(analyser)
      if (optsRef.current.record) {
        // ScriptProcessor 雖已過時，但在各瀏覽器（含 iOS Safari）最穩定
        const proc = c.createScriptProcessor(4096, 1, 1)
        proc.onaudioprocess = (e) => { r.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))) }
        src.connect(proc)
        const mute = c.createGain()
        mute.gain.value = 0
        proc.connect(mute).connect(c.destination)
        r.proc = proc
      }
      const buf = new Float32Array(analyser.fftSize)
      setState({ pending: false, running: true, midi: null, levelDb: -100, peakDb: -100, error: null })
      const finishAtLimit = () => {
        if (token !== generation.current || r.stream !== stream) return
        const rec = stop()
        optsRef.current.onLimit?.(rec)
      }
      // A background tab can stop animation frames or suspend the audio clock.
      // Releasing the microphone must not depend on drawing the pitch display.
      if (optsRef.current.maxSec) r.limitTimer = window.setTimeout(finishAtLimit, optsRef.current.maxSec * 1000)
      const tick = () => {
        analyser.getFloatTimeDomainData(buf)
        let pk = 0
        for (let i = 0; i < buf.length; i++) pk = Math.max(pk, Math.abs(buf[i]))
        const db = pk > 0 ? 20 * Math.log10(pk) : -100
        r.peak = Math.max(r.peak, db)
        const d = decimate(buf, c.sampleRate)
        const f = detectPitch(d.data, d.sampleRate)
        const midi = f > 0 ? freqToMidi(f) : null
        const t = c.currentTime - r.t0
        optsRef.current.onFrame?.(midi, t)
        setState((s) => ({ ...s, midi, levelDb: db, peakDb: r.peak }))
        if (optsRef.current.maxSec && t >= optsRef.current.maxSec) { finishAtLimit(); return }
        r.raf = requestAnimationFrame(tick)
      }
      r.raf = requestAnimationFrame(tick)
      return true
    } catch {
      if (token !== generation.current) return false
      setAudioSession('playback')
      setState((s) => ({ ...s, pending: false, running: false, error: '無法使用麥克風：請確認瀏覽器已允許麥克風權限，並使用 https 或 localhost 開啟。' }))
      return false
    } finally { if (token === generation.current) requesting.current = false }
  }, [stop])

  const resetPeak = useCallback(() => { refs.current.peak = -100; setState((s) => ({ ...s, peakDb: -100 })) }, [])

  useEffect(() => () => { stop() }, [stop])
  return { ...state, start, stop, resetPeak }
}
