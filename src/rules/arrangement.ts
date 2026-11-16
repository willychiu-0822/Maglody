import type { ArrSection, LayerId, Project, SectionKind } from '../lib/store'
import { chordVoicing, diatonicChords } from '../lib/theory'
import type { Feedback } from './types'

export const LAYERS: { id: LayerId; name: string; w: number; why: string }[] = [
  { id: 'drums', name: '鼓', w: 3, why: '節奏骨架，加入就像心跳開始' },
  { id: 'bass', name: '貝斯', w: 2, why: '低頻地基，讓和弦有重量' },
  { id: 'keys', name: '鋼琴/吉他', w: 2, why: '和弦主體，節奏型決定律動' },
  { id: 'pad', name: '弦樂鋪底', w: 1.5, why: '長音襯底，增加寬度和情緒' },
  { id: 'melody', name: '主唱旋律', w: 1.5, why: '歌的主角' },
]

export const energy = (s: ArrSection) => LAYERS.reduce((a, l) => a + (s.layers[l.id] ? l.w : 0), 0)

export const songSeconds = (p: Project) => p.arrangement.reduce((a, s) => a + s.bars, 0) * 4 * (60 / p.idea.bpm)

export const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

export function sectionAudio(p: Project, kind: SectionKind) {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const useChorus = ['chorus', 'intro', 'inter', 'outro'].includes(kind)
  const prog = p.harmony[useChorus ? 'chorus' : 'verse']
  const bars = prog.map((d) => (d != null ? chordVoicing(chords[d]) : []))
  const melody = kind === 'chorus' ? p.melody.chorus : ['verse', 'pre', 'bridge'].includes(kind) ? p.melody.verse : undefined
  return { bars, melody }
}

/** Repeat the four-bar sketch to exactly the section length, including partial repeats. */
export function arrangedAudio(p: Project, section: ArrSection) {
  const { bars, melody } = sectionAudio(p, section.kind)
  return {
    bars: Array.from({length: section.bars}, (_,i) => bars[i % bars.length]),
    melody: melody ? Array.from({length: section.bars * 8}, (_,i) => melody[i % melody.length]) : undefined,
  }
}

export function arrangementFeedback(p: Project): Feedback[] {
  const a = p.arrangement
  const fb: Feedback[] = []
  if (a.length < 3) return [{ level: 'warn', text: '再排幾個段落，湊到 3 個，我們就能一起聽整首的起伏。' }]
  const ch = a.filter((s) => s.kind === 'chorus')
  const vs = a.filter((s) => s.kind === 'verse')
  fb.push(ch.length >= 2 ? { level: 'good', text: `副歌出現 ${ch.length} 次，聽眾會記住它。` } : { level: 'warn', text: '副歌目前只出現一次。', tip: '很多歌會讓副歌回來 2–3 次，聽眾比較容易記住，想試的話再放一段。' })
  if (a[0].kind === 'intro') fb.push({ level: 'good', text: '有前奏，先讓聽眾進入氣氛。' })
  else fb.push({ level: 'warn', text: '沒有前奏，一開口就是歌。', tip: '這樣很有衝擊力；如果錄音時想先抓速度和音準，放 1–2 小節前奏也不錯。' })
  if (ch.length && vs.length) {
    const ce = Math.min(...ch.map(energy)), ve = Math.max(...vs.map(energy))
    fb.push(ce > ve ? { level: 'good', text: '每段副歌的能量都比主歌高，有起伏。' } : { level: 'bad', text: '副歌的樂器沒有比主歌多，聽起來不太有對比。', tip: '想拉開差距的話，可以讓主歌先少放一兩個樂器（例如先不要鼓），副歌再一起進來。' })
  }
  const lastChorus = a.map((s) => s.kind).lastIndexOf('chorus')
  const dip = a.some((s, i) => i > 0 && i < lastChorus && energy(s) < energy(a[i - 1]) - 2)
  fb.push(dip ? { level: 'good', text: '中段有能量下降再拉起，最後一次副歌會更有力。' } : { level: 'warn', text: '整首的力道一路平平的，或一直往上推。', tip: '想要喘口氣的感覺，可以在最後一次副歌前放一段「收起來」的橋段或間奏，像深呼吸後再衝。' })
  const dur = songSeconds(p)
  fb.push(dur >= 150 && dur <= 270 ? { level: 'good', text: `全長約 ${fmtTime(dur)}，是流行歌常見長度。` } : dur < 150 ? { level: 'warn', text: `全長約 ${fmtTime(dur)}，偏短。`, tip: '可以加長段落小節數，或多一次副歌。短歌也沒問題，Demo 階段 2 分鐘就很好。' } : { level: 'warn', text: `全長約 ${fmtTime(dur)}，偏長。`, tip: '如果覺得有點拖，可以試著拿掉重複比較多的段落，再聽聽看。' })
  const sameAll = a.every((s) => energy(s) === energy(a[0]))
  if (sameAll) fb.push({ level: 'bad', text: '每個段落用的樂器都一樣。', tip: '試試讓樂器有進有出，哪裡加、哪裡減，歌就有了呼吸。' })
  return fb
}
