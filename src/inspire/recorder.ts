import { useCallback, useEffect, useRef, useState } from 'react'
import { ac, setAudioSession } from '../lib/audio'

type SR = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void }

function speechRecognition(): SR | null {
  const W = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition
  return C ? new C() : null
}

export const canTranscribe = () => !!((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition)

export interface Recording { blob: Blob; durationSec: number; transcript: string }

/**
 * 錄一段語音或哼唱（MediaRecorder，手機瀏覽器都支援）。
 * transcribe=true 時同時用瀏覽器的語音辨識做中文聽寫（Chrome、Safari 有；不支援時只存錄音）。
 * 錄音中仍可操作頁面其他部分（例如加照片），不會被打斷。
 */
export function useRecorder() {
  const [recording, setRecording] = useState<null | 'voice' | 'hum'>(null)
  const [completed, setCompleted] = useState<null | 'voice' | 'hum'>(null)
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [live, setLive] = useState('')
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)
  const requesting = useRef(false)
  const mounted = useRef(true)
  const stopPromise = useRef<Promise<Recording | null> | null>(null)
  const r = useRef<{ rec?: MediaRecorder; stream?: MediaStream; result?: Recording; chunks: Blob[]; t0: number; sr?: SR | null; text: string; timer?: number; finishTimer?: number; resolve?: (x: Recording) => void }>({ chunks: [], t0: 0, text: '' })

  const start = useCallback(async (kind: 'voice' | 'hum') => {
    if (requesting.current || r.current.rec || r.current.result || stopPromise.current) return
    requesting.current = true
    setPending(true)
    const token = ++generation.current
    setError(null)
    try {
      ac()
      setAudioSession('play-and-record')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: kind === 'hum' ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true })
      if (token !== generation.current) { stream.getTracks().forEach(t => t.stop()); return }
      const st = r.current
      st.stream = stream
      const recorder = new MediaRecorder(stream)
      st.rec = recorder
      st.chunks = []
      st.text = ''
      st.sr = null
      st.t0 = Date.now()
      recorder.ondataavailable = e => { if (e.data.size) st.chunks.push(e.data) }
      recorder.onstop = () => {
        const value = { blob: new Blob(st.chunks, {type: recorder.mimeType || 'audio/webm'}), durationSec: (Date.now() - st.t0) / 1000, transcript: st.text.trim() }
        st.result = value
        st.rec = undefined
        st.stream?.getTracks().forEach(t => t.stop())
        try { st.sr?.stop() } catch { /* recognition may already be stopped */ }
        clearInterval(st.timer)
        clearTimeout(st.finishTimer)
        setAudioSession('playback')
        if (mounted.current) {
          setRecording(null)
          setCompleted(st.resolve ? null : kind)
        }
        st.resolve?.(value)
      }
      recorder.start(250)
      if (kind === 'voice') {
        const sr = speechRecognition()
        st.sr = sr
        if (sr) {
          sr.lang = 'zh-TW'; sr.continuous = true; sr.interimResults = true
          let finals = ''
          sr.onresult = e => {
            let interim = ''
            for (let i=e.resultIndex; i<e.results.length; i++) {
              if (e.results[i].isFinal) finals += e.results[i][0].transcript
              else interim += e.results[i][0].transcript
            }
            st.text = finals
            if (mounted.current) setLive(finals + interim)
          }
          sr.onerror = () => {}
          try { sr.start() } catch { /* audio remains usable without transcription */ }
        }
      }
      setRecording(kind); setCompleted(null); setLive(''); setElapsed(0)
      st.timer = window.setInterval(() => setElapsed((Date.now()-st.t0)/1000), 200)
    } catch {
      if (token !== generation.current) return
      r.current.stream?.getTracks().forEach(t => t.stop())
      setAudioSession('playback')
      setError('這次沒能用上麥克風。看看網址列旁有沒有允許使用麥克風，網址也要是 https 或 localhost。想先寫下來也可以。')
    } finally {
      if (token === generation.current) { requesting.current = false; setPending(false) }
    }
  }, [])

  const stop = useCallback((): Promise<Recording | null> => {
    const st = r.current
    if (stopPromise.current) return stopPromise.current
    if (st.result) {
      const result = st.result
      st.result = undefined
      setCompleted(null)
      return Promise.resolve(result)
    }
    if (!st.rec) return Promise.resolve(null)
    const recorder = st.rec
    stopPromise.current = new Promise<Recording | null>(resolve => {
      st.resolve = value => { st.result = undefined; st.resolve = undefined; resolve(value) }
      try { st.sr?.stop() } catch { /* already stopped */ }
      st.finishTimer = window.setTimeout(() => {
        // inactive means onstop is already queued; its retained result resolves us.
        if (recorder.state !== 'inactive') recorder.stop()
      }, st.sr ? 400 : 0)
    }).finally(() => { stopPromise.current = null })
    return stopPromise.current
  }, [])

  const cancelPending = useCallback(() => { generation.current++; requesting.current = false; setPending(false) }, [])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      generation.current++
      const st = r.current
      try { st.sr?.stop(); if (st.rec?.state === 'recording') st.rec.stop() } catch { /* already stopped */ }
      st.stream?.getTracks().forEach(t => t.stop())
      clearInterval(st.timer); clearTimeout(st.finishTimer)
    }
  }, [])
  return { recording, completed, pending, elapsed, live, error, start, stop, cancelPending }
}
