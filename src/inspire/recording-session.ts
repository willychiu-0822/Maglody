import { ac, setAudioSession } from '../lib/audio'
import { CaptureGate } from '../lib/capture'

type SR = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void }
function speechRecognition(): SR | null {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
  const Constructor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Constructor ? new Constructor() : null
}
export interface Recording { blob: Blob; durationSec: number; transcript: string }
export interface RecorderState { recording: 'voice' | 'hum' | null; elapsed: number; live: string; error: string | null }
const initial = (): RecorderState => ({ recording: null, elapsed: 0, live: '', error: null })

/** 可獨立測試的錄音生命週期；React hook 只負責訂閱狀態。 */
export class RecordingSession {
  private gate = new CaptureGate()
  private rec?: MediaRecorder
  private sr?: SR | null
  private chunks: Blob[] = []
  private started = 0
  private transcript = ''
  private timer?: ReturnType<typeof setInterval>
  private delay?: ReturnType<typeof setTimeout>
  private stopping?: Promise<Recording | null>
  private resolve?: (value: Recording | null) => void
  private state = initial()
  constructor(private changed: (state: RecorderState) => void, private prepare = () => { ac(); setAudioSession('play-and-record') }, private restore = () => setAudioSession('playback')) {}
  private publish(patch: Partial<RecorderState>) { this.state = { ...this.state, ...patch }; this.changed(this.state) }
  async start(kind: 'voice' | 'hum') {
    const generation = this.gate.begin()
    if (generation === null) return
    this.publish({ error: null })
    try {
      this.prepare()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: kind === 'hum' ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true })
      if (!this.gate.accept(generation, stream)) return
      const rec = this.rec = new MediaRecorder(stream)
      this.chunks = []; this.transcript = ''; this.started = Date.now(); this.stopping = undefined
      rec.ondataavailable = (event) => { if (event.data.size) this.chunks.push(event.data) }
      rec.onstop = () => {
        const result = { blob: new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }), durationSec: (Date.now() - this.started) / 1000, transcript: this.transcript.trim() }
        this.cleanup()
        this.publish({ recording: null })
        this.resolve?.(result); this.resolve = undefined
      }
      rec.onerror = () => this.fail()
      rec.start(250)
      if (kind === 'voice') {
        // 聽寫不可用時仍保留已開始的錄音。
        try {
          const sr = this.sr = speechRecognition()
          if (sr) {
            sr.lang = 'zh-TW'; sr.continuous = true; sr.interimResults = true
            let finals = ''
            sr.onresult = (event) => {
              if (!this.gate.current(generation)) return
              let interim = ''
              for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) finals += event.results[i][0].transcript
                else interim += event.results[i][0].transcript
              }
              this.transcript = finals
              this.publish({ live: finals + interim })
            }
            sr.onerror = () => {}
            sr.start()
          }
        } catch { /* 錄音仍可用 */ }
      }
      this.publish({ recording: kind, elapsed: 0, live: '' })
      this.timer = setInterval(() => this.publish({ elapsed: (Date.now() - this.started) / 1000 }), 200)
    } catch { if (this.gate.current(generation)) this.fail() }
  }
  stop(): Promise<Recording | null> {
    if (this.stopping) return this.stopping
    if (!this.rec) { this.gate.cancel(); this.restore(); return Promise.resolve(null) }
    this.stopping = new Promise((resolve) => { this.resolve = resolve })
    try { this.sr?.stop() } catch { /* 聽寫可能已停止 */ }
    this.delay = setTimeout(() => {
      try { if (this.rec?.state !== 'inactive') this.rec?.stop() } catch { this.fail() }
      this.gate.cancel()
      clearInterval(this.timer)
      this.restore()
    }, this.sr ? 400 : 0)
    return this.stopping
  }
  private cleanup() {
    clearInterval(this.timer); clearTimeout(this.delay)
    this.gate.cancel()
    if (this.sr) { this.sr.onresult = null; this.sr.onerror = null; try { this.sr.stop() } catch { /* 已停止 */ } }
    this.sr = undefined
    if (this.rec) {
      this.rec.ondataavailable = null; this.rec.onstop = null; this.rec.onerror = null
      try { if (this.rec.state !== 'inactive') this.rec.stop() } catch { /* 已停止 */ }
    }
    this.rec = undefined; this.chunks = []
    this.restore()
  }
  private fail() {
    this.cleanup()
    this.resolve?.(null); this.resolve = undefined
    this.publish({ recording: null, error: '無法使用麥克風：請在瀏覽器網址列旁允許「麥克風」，並確認是用 https 開啟。' })
  }
  dispose() {
    this.changed = () => {}
    this.cleanup()
    this.resolve?.(null); this.resolve = undefined
  }
}
