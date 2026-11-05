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
  const [elapsed, setElapsed] = useState(0)
  const [live, setLive] = useState('')
  const [error, setError] = useState<string | null>(null)
  const r = useRef<{ rec?: MediaRecorder; stream?: MediaStream; chunks: Blob[]; t0: number; sr?: SR | null; text: string; timer?: number; resolve?: (x: Recording) => void }>({ chunks: [], t0: 0, text: '' })

  const start = useCallback(async (kind: 'voice' | 'hum') => {
    setError(null)
    ac()
    setAudioSession('play-and-record')
    try {
      // 哼唱要保留原始音高：關掉降噪與自動增益
      const stream = await navigator.mediaDevices.getUserMedia({ audio: kind === 'hum' ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true })
      const rec = new MediaRecorder(stream)
      const st = r.current
      st.stream = stream
      st.rec = rec
      st.chunks = []
      st.text = ''
      st.t0 = Date.now()
      rec.ondataavailable = (e) => e.data.size && st.chunks.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(st.chunks, { type: rec.mimeType || 'audio/webm' })
        st.resolve?.({ blob, durationSec: (Date.now() - st.t0) / 1000, transcript: st.text.trim() })
      }
      rec.start(250)
      if (kind === 'voice') {
        const sr = speechRecognition()
        st.sr = sr
        if (sr) {
          sr.lang = 'zh-TW'
          sr.continuous = true
          sr.interimResults = true
          let finals = ''
          sr.onresult = (e) => {
            let interim = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const res = e.results[i]
              if (res.isFinal) finals += res[0].transcript
              else interim += res[0].transcript
            }
            st.text = finals
            setLive(finals + interim)
          }
          sr.onerror = () => {}
          try { sr.start() } catch { /* 部分瀏覽器需使用者手勢，失敗就只存錄音 */ }
        }
      }
      setRecording(kind)
      setLive('')
      setElapsed(0)
      st.timer = window.setInterval(() => setElapsed((Date.now() - st.t0) / 1000), 200)
    } catch {
      setAudioSession('playback')
      setError('無法使用麥克風：請在瀏覽器網址列旁允許「麥克風」，並確認是用 https 開啟。')
    }
  }, [])

  const stop = useCallback((): Promise<Recording | null> => {
    const st = r.current
    if (!st.rec) return Promise.resolve(null)
    return new Promise((resolve) => {
      st.resolve = (x) => { resolve(x); st.resolve = undefined }
      try { st.sr?.stop() } catch { /* ignore */ }
      // 給語音辨識一點時間吐出最後一段結果
      setTimeout(() => {
        st.rec?.stop()
        st.stream?.getTracks().forEach((t) => t.stop())
        st.rec = undefined
        window.clearInterval(st.timer)
        setRecording(null)
        setAudioSession('playback')
      }, st.sr ? 400 : 0)
    })
  }, [])

  useEffect(() => () => { r.current.stream?.getTracks().forEach((t) => t.stop()); window.clearInterval(r.current.timer) }, [])
  return { recording, elapsed, live, error, start, stop }
}
