import { useCallback, useEffect, useRef, useState } from 'react'
import { RecordingSession, type RecorderState } from './recording-session'
export type { Recording } from './recording-session'

export const canTranscribe = () => !!((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition)

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({ recording: null, elapsed: 0, live: '', error: null })
  const session = useRef<RecordingSession | null>(null)
  const get = useCallback(() => session.current ??= new RecordingSession(setState), [])
  const start = useCallback((kind: 'voice' | 'hum') => get().start(kind), [get])
  const stop = useCallback(() => get().stop(), [get])
  useEffect(() => () => { session.current?.dispose(); session.current = null }, [])
  return { ...state, start, stop }
}
