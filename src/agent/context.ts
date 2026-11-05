import type { Project } from '../lib/store'
import { diatonicChords, keyName, noteNameOct } from '../lib/theory'
import { KIND_ZH } from '../steps/Lyrics'

/** 把專案壓成一段精簡文字，給 LLM 或 mock 當「學生的歌目前狀態」 */
export function songContext(p: Project): string {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = (d: (number | null)[]) => d.map((x) => (x == null ? '?' : `${chords[x].name}(${chords[x].roman})`)).join(' ')
  const mel = (c: (number | null)[]) => c.map((m) => (m == null ? '.' : m < 0 ? '-' : noteNameOct(m))).join(' ')
  const lines: string[] = []
  if (p.hum) lines.push(`哼唱：${p.hum.notes.length} 音，估計 ${keyName(p.hum.keyRoot, p.hum.keyMode)}，音域 ${noteNameOct(p.hum.rangeLow)}–${noteNameOct(p.hum.rangeHigh)}，建議和弦 ${[...new Set(p.hum.chordHints)].join('、')}`)
  lines.push(`情緒：${p.idea.mood || '未選'}；速度 ${p.idea.bpm} BPM；vibe：${p.idea.vibe || '—'}`)
  if (p.idea.story) lines.push(`故事：${p.idea.story}`)
  if (p.idea.image) lines.push(`核心畫面：${p.idea.image}`)
  if (p.idea.title || p.idea.hook) lines.push(`歌名：${p.idea.title || '—'}；Hook：${p.idea.hook || '—'}`)
  lines.push(`調：${keyName(p.harmony.root, p.harmony.mode)}；主歌和弦 ${prog(p.harmony.verse)}；副歌和弦 ${prog(p.harmony.chorus)}`)
  if (p.melody.verse.some((m) => m != null)) lines.push(`主歌旋律（每格半拍，.=休止，-=延長）：${mel(p.melody.verse)}`)
  if (p.melody.chorus.some((m) => m != null)) lines.push(`副歌旋律：${mel(p.melody.chorus)}`)
  p.lyrics.filter((s) => s.text.trim()).forEach((s) => lines.push(`【${KIND_ZH[s.kind]}】${s.text.trim().replace(/\n/g, ' / ')}`))
  if (p.arrangement.length) lines.push(`結構：${p.arrangement.map((s) => `${KIND_ZH[s.kind]}${s.bars}小節[${Object.entries(s.layers).filter(([, v]) => v).map(([k]) => k).join(',')}]`).join(' → ')}`)
  lines.push(`已完成章節：${p.done.map((d, i) => (d ? i + 1 : null)).filter(Boolean).join('、') || '無'}`)
  return lines.join('\n')
}
