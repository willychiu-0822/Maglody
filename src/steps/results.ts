// 每章「可聽見的成果」：完成一小步就能聽到自己的歌長出來，而不是只有勾勾。
import { scheduleAudio, ac, click, playChord, playLoop, tone } from '../lib/audio'
import type { Project } from '../lib/store'
import { chordVoicing, diatonicChord, diatonicChords } from '../lib/theory'
import { sectionAudio } from './Arrangement'
import { lyricLines } from './Lyrics'

export interface StepResult { label: string; available: (p: Project) => boolean; play: (p: Project) => void }

function playHum(p: Project) {
  if (!p.hum) return
  const t0 = ac().currentTime + 0.05
  p.hum.notes.forEach((n) => tone(n.midi, t0 + n.start, Math.max(0.08, n.dur), { gain: 0.2 }))
  const end = p.hum.notes.length ? p.hum.notes[p.hum.notes.length - 1].start + p.hum.notes[p.hum.notes.length - 1].dur : 1
  tone(48 + p.hum.keyRoot, t0, end, { type: 'sine', gain: 0.1, attack: 0.3 })
}

function playVibe(p: Project) {
  const c = ac()
  const beat = 60 / p.idea.bpm
  const mode = p.harmony.mode
  for (let i = 0; i < 8; i++) click(c.currentTime + 0.05 + i * beat, i % 4 === 0)
  playChord(chordVoicing(diatonicChord(p.harmony.root, mode, 0)), beat * 4)
  scheduleAudio(() => playChord(chordVoicing(diatonicChord(p.harmony.root, mode, mode === 'major' ? 3 : 5)), beat * 4), beat * 4000)
}

function playProgressions(p: Project) {
  const ch = diatonicChords(p.harmony.root, p.harmony.mode)
  const bars = [...p.harmony.verse, ...p.harmony.chorus].filter((d): d is number => d != null).map((d) => chordVoicing(ch[d]))
  if (bars.length) playLoop({ bpm: p.idea.bpm, bars, layers: { drums: true, bass: true, keys: true, pad: false, melody: false } })
}

function playVerseChorus(p: Project) {
  const v = sectionAudio(p, 'verse'), c = sectionAudio(p, 'chorus')
  playLoop({ bpm: p.idea.bpm, bars: [...v.bars, ...c.bars], melody: [...(v.melody ?? []), ...(c.melody ?? [])], layers: { drums: false, bass: true, keys: true, pad: false, melody: true } })
}

/** 用瀏覽器內建的中文語音，在和弦上「唸」出副歌：讓歌詞第一次跟音樂相遇 */
function speakChorus(p: Project) {
  const sec = p.lyrics.find((s) => s.kind === 'chorus' && s.text.trim()) ?? p.lyrics.find((s) => s.text.trim())
  const c = sectionAudio(p, 'chorus')
  playLoop({ bpm: p.idea.bpm, bars: c.bars, melody: c.melody, layers: { drums: false, bass: false, keys: true, pad: true, melody: true } })
  if (sec && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(lyricLines(sec.text).slice(0, 2).join('，'))
    u.lang = 'zh-TW'
    u.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }
}

function playSong(p: Project) {
  const secs = p.arrangement.slice(0, 4)
  let t = 0
  secs.forEach((s) => {
    const { bars, melody } = sectionAudio(p, s.kind)
    scheduleAudio(() => playLoop({ bpm: p.idea.bpm, bars, melody, layers: s.layers }), t)
    t += bars.length * 4 * (60 / p.idea.bpm) * 1000
  })
}

/** 目前為止的 Demo：有什麼放什麼（和弦、旋律或哼唱、已排的段落），讓「完整爛草稿」隨時聽得到 */
export function demoAvailable(p: Project) {
  return !!p.hum || [...p.harmony.verse, ...p.harmony.chorus].some((d) => d != null) || [...p.melody.verse, ...p.melody.chorus].some((m) => m != null)
}
export function playDemo(p: Project) {
  const hasChords = [...p.harmony.verse, ...p.harmony.chorus].some((d) => d != null)
  const hasMelody = [...p.melody.verse, ...p.melody.chorus].some((m) => m != null && m >= 0)
  if (p.arrangement.length && hasChords) return playSong(p)
  if (hasChords || hasMelody) {
    const ch = diatonicChords(p.harmony.root, p.harmony.mode)
    const bars = [...p.harmony.verse, ...p.harmony.chorus].map((d) => (d != null ? chordVoicing(ch[d]) : []))
    playLoop({ bpm: p.idea.bpm, bars, melody: [...p.melody.verse, ...p.melody.chorus], layers: { drums: hasChords, bass: hasChords, keys: hasChords, pad: false, melody: true } })
    return
  }
  playHum(p)
}

export const RESULTS: Record<string, StepResult> = {
  hum: { label: '你的哼唱＋主音', available: (p) => !!p.hum, play: playHum },
  idea: { label: '你的情緒與速度', available: (p) => !!p.idea.mood, play: playVibe },
  harmony: { label: '主歌＋副歌和弦', available: (p) => [...p.harmony.verse, ...p.harmony.chorus].some((d) => d != null), play: playProgressions },
  melody: { label: '旋律＋和弦（主歌→副歌）', available: (p) => [...p.melody.verse, ...p.melody.chorus].some((m) => m != null), play: playVerseChorus },
  lyrics: { label: '副歌：旋律配上你的詞', available: (p) => p.lyrics.some((s) => s.text.trim()), play: speakChorus },
  arrange: { label: '前 4 段編曲', available: (p) => p.arrangement.length > 0, play: playSong },
  record: { label: '錄音用的伴奏', available: (p) => p.arrangement.length > 0, play: playSong },
  mix: { label: '副歌循環', available: () => true, play: playVerseChorus },
  review: { label: '前 4 段', available: (p) => p.arrangement.length > 0, play: playSong },
}
