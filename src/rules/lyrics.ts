import { ABSTRACT_WORDS, CONCRETE_HINTS, cleanLine, countHits, lastChar, rhymeOf } from '../lib/rhyme'
import type { LyricSection, SectionKind } from '../lib/store'
import type { Feedback } from './types'

export const KIND_ZH: Record<SectionKind, string> = { intro: '前奏', verse: '主歌', pre: '導歌', chorus: '副歌', bridge: '橋段', inter: '間奏', outro: '尾奏' }
export const lyricLines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean)

export function analyzeSection(s: LyricSection, hook: string) {
  const ls = lyricLines(s.text)
  const lens = ls.map((l) => cleanLine(l).length)
  const ends = ls.map((l) => rhymeOf(lastChar(l)))
  const fb: Feedback[] = []
  if (ls.length < 2) return { ls, lens, ends, fb }
  // 1. 字數對稱
  const pairs = Math.floor(ls.length / 2)
  let sym = 0
  for (let i = 0; i < pairs; i++) if (Math.abs(lens[2 * i] - lens[2 * i + 1]) <= 2) sym++
  const symR = pairs ? sym / pairs : 1
  fb.push(symR >= 0.75 ? { level: 'good', text: '這幾句字數接近，可以試著用同一段旋律唱唱看。' } : symR >= 0.5 ? { level: 'warn', text: '有些上下句字數差很多。', tip: '想用同一段旋律的話，可以試著調整字數，再唱唱看。' } : { level: 'bad', text: '這幾句長短不太一樣。', tip: '可以試試不同的唱法，或調整句子的長度。' })
  // 2. 押韻
  const known = ends.filter(Boolean)
  const counts = new Map<number, number>()
  known.forEach((e) => counts.set(e!.idx, (counts.get(e!.idx) ?? 0) + 1))
  const top = Math.max(0, ...counts.values())
  const rr = ls.length ? top / ls.length : 0
  const target = s.kind === 'chorus' ? 0.5 : 0.4
  fb.push(rr >= target ? { level: 'good', text: `${top}/${ls.length} 句押同一個韻，聽起來有「收」的感覺。` } : known.length < ls.length / 2 ? { level: 'warn', text: '有幾個句尾字，我還認不出它們的韻。', tip: '大聲唸句尾字，聽韻母（a、ang、i…）是不是一樣。' } : { level: 'warn', text: '這幾句的句尾聽起來不太一樣。', tip: '想試試押韻的話，可以挑幾句換個相近的句尾。' })
  // 3. 具體 vs 抽象
  const abs = countHits(s.text, ABSTRACT_WORDS)
  const con = countHits(s.text, CONCRETE_HINTS)
  if (s.kind === 'verse') fb.push(con >= abs ? { level: 'good', text: '唸唸這段，看看有沒有你想留下的畫面。' } : { level: 'warn', text: `主歌裡心情的字（${abs} 個）比畫面多。`, tip: '想讓畫面更清楚的話，可以加一個當時的細節。' })
  // 4. 副歌包含 hook
  if (s.kind === 'chorus') {
    const h = cleanLine(hook)
    const has = h && cleanLine(s.text).includes(h)
    fb.push(has ? { level: 'good', text: '副歌有你的一句話。' } : { level: 'warn', text: '副歌裡還沒看到你的一句話。', tip: `想留著它的話，把「${hook || '你的一句話'}」放進副歌；改了主意也沒關係。` })
  }
  // 5. 句長
  const long = lens.filter((n) => n > 14).length
  if (long) fb.push({ level: 'warn', text: `${long} 句超過 14 個字。`, tip: '唱唱看哪裡想換氣；也可以把句子分開。' })
  return { ls, lens, ends, fb }
}
