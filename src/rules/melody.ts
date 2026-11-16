import { cleanLine } from '../lib/rhyme'
import type { Project } from '../lib/store'
import { diatonicChords, jianpu, noteNameOct, pc, scaleNote, SCALES, type Chord, type Mode } from '../lib/theory'
import { lyricLines } from './lyrics'
import type { Feedback, Level } from './types'

export type Part = 'verse' | 'chorus'
export const HOLD = -1

/** 依哼唱音域決定格子要顯示哪個八度 */
export function melodyRows(p: Project): number[] {
  const { root, mode } = p.harmony
  const mid = p.hum ? (p.hum.rangeLow + p.hum.rangeHigh) / 2 : 64
  const base = Math.round((mid - 4 - pc(root)) / 12) * 12
  const rows: number[] = []
  for (let s = -3; s <= 10; s++) rows.push(scaleNote(root, mode, s, base))
  return rows.reverse()
}

/** 五聲音階要避開的音：大調的 4、7 級；小調的 2、6 級 */
export const isAvoid = (m: number, root: number, mode: Mode) => {
  const deg = SCALES[mode].indexOf(pc(m - root))
  return mode === 'major' ? deg === 3 || deg === 6 : deg === 1 || deg === 5
}

/** 找出某格實際在響的音（延長格往前追） */
export const soundingAt = (cells: (number | null)[], i: number): number | null => {
  let k = i
  while (k >= 0 && cells[k] === HOLD) k--
  return k >= 0 ? cells[k] : null
}

export function cellLevel(m: number, col: number, chord: Chord | null): Level {
  if (!chord) return 'warn'
  if (chord.pcs.includes(pc(m))) return 'good'
  const strong = col % 8 === 0 || col % 8 === 4
  return strong ? 'bad' : 'warn'
}

export function melodyFeedback(p: Project, part: Part): Feedback[] {
  const cells = p.melody[part]
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = p.harmony[part]
  const notes = cells.map((m, i) => ({ m, i })).filter((x): x is { m: number; i: number } => x.m != null && x.m >= 0)
  const fb: Feedback[] = []
  if (notes.length < 4) return [{ level: 'warn', text: '再放幾個音，我們就能一起聽聽這段旋律。' }]
  // 強拍和弦音
  const strong = notes.filter((n) => n.i % 4 === 0)
  const chordAt = (i: number) => { const d = prog[Math.floor(i / 8)]; return d != null ? chords[d] : null }
  const fit = strong.filter((n) => chordAt(n.i)?.pcs.includes(pc(n.m))).length
  const r = strong.length ? fit / strong.length : 1
  fb.push(r >= 0.7 ? { level: 'good', text: '每一拍開頭的音，大多踩在和弦上，旋律和伴奏很「黏」。' } : r >= 0.45 ? { level: 'warn', text: '每一拍開頭的音，大約只有一半踩在和弦上。', tip: '紅色格子落在拍子開頭，和和弦不太合。可以挪到上下相鄰的綠色格，或放到弱拍當「經過音」，聽聽差別。' } : { level: 'bad', text: '強拍上的音大多不在和弦裡，聽起來會有點飄。', tip: '想踏實一點，可以讓每小節第 1 格先放和弦音（綠色），再用其他音接起來。' })
  // 音域
  const ms = notes.map((n) => n.m)
  const range = Math.max(...ms) - Math.min(...ms)
  fb.push(range <= 12 ? { level: 'good', text: '這段最高和最低的音離得不遠，在一個八度內。唱唱看，感覺如何？' } : { level: 'warn', text: '這段最高和最低的音離得很遠，超過一個八度。', tip: '唱唱看；如果有點吃力，可以把最高或最低的音往中間收。' })
  if (p.hum) {
    const hi = Math.max(...ms), lo = Math.min(...ms)
    if (hi > p.hum.rangeHigh + 2 || lo < p.hum.rangeLow - 2) fb.push({ level: 'warn', text: `有些音比剛才哼的範圍（${noteNameOct(p.hum.rangeLow)}–${noteNameOct(p.hum.rangeHigh)}）更高或更低。`, tip: '跟著唱唱看，留意這些音唱起來舒不舒服。' })
  }
  // 大跳
  let leaps = 0
  for (let k = 1; k < notes.length; k++) if (Math.abs(notes[k].m - notes[k - 1].m) > 7) leaps++
  fb.push(leaps === 0 ? { level: 'good', text: '沒有超過五度的大跳，旋律走得流暢。' } : leaps <= 2 ? { level: 'good', text: `有 ${leaps} 次大跳：適量的大跳很有戲劇性。`, tip: '大跳之後，往反方向一步一步走回來，通常會順耳。' } : { level: 'warn', text: `大跳有 ${leaps} 次，旋律跳來跳去很有個性。`, tip: '如果唱起來有點喘，可以讓幾處改成相鄰音一步一步走，大跳留給最想強調的地方。' })
  // 換氣
  const restHalves = [0, 1].map((h) => cells.slice(h * 16, h * 16 + 16).some((c) => c == null))
  fb.push(restHalves.every(Boolean) ? { level: 'good', text: '每兩小節都有休止，歌手可以換氣。' } : { level: 'warn', text: '有兩小節從頭唱到尾，沒有留空。', tip: '唱唱看會不會喘；想換氣的話，在句尾留一兩格空白，聽的人也有時間回味。' })
  // 結尾
  const last = notes[notes.length - 1]
  const tonic = pc(last.m - p.harmony.root) === 0
  if (part === 'chorus') fb.push(tonic ? { level: 'good', text: '副歌結尾落在主音，有「說完了」的完整感。' } : { level: 'warn', text: '副歌結尾沒有回到主音。', tip: `停在 ${noteNameOct(last.m)} 會有「還沒說完」的感覺，這可以是你要的。想收得完整一點，可以試試最後一個音放主音（簡譜 ${jianpu(p.harmony.root + 60, p.harmony.root, p.harmony.mode)}）。` })
  // 副歌比主歌高
  const other = p.melody[part === 'verse' ? 'chorus' : 'verse'].filter((m): m is number => m != null && m >= 0)
  if (other.length >= 4) {
    const vMax = Math.max(...(part === 'verse' ? ms : other)), cMax = Math.max(...(part === 'chorus' ? ms : other))
    fb.push(cMax > vMax ? { level: 'good', text: '副歌的最高音比主歌高，情緒有往上推。' } : { level: 'warn', text: '副歌的最高音沒有比主歌高。', tip: '想讓副歌更有爆發力的話，可以試試把整段往上移 3–5 度，聽聽感覺。' })
  }
  // 動機：第 1 小節的節奏型是否在後面重複出現（重複＋變化）
  const rhythm = (b: number) => cells.slice(b * 8, b * 8 + 8).map((c) => (c != null && c >= 0 ? 'x' : c === HOLD ? '-' : '.')).join('')
  const r0 = rhythm(0)
  if (r0.includes('x')) {
    const rep = [1, 2, 3].filter((b) => rhythm(b) === r0).length
    fb.push(rep >= 1 && rep <= 2 ? { level: 'good', text: `第 1 小節的節奏在後面重複了 ${rep} 次：這叫「動機」，重複讓人記住、變化讓人不膩。` } : rep === 3 ? { level: 'warn', text: '四個小節的節奏都一樣。', tip: '重複很好記；想要一點變化，可以讓第 4 小節換個節奏（例如拉長最後一個音）當作句尾。' } : { level: 'warn', text: '每小節的節奏都不太一樣，旋律很自由。', tip: '想更好記的話，試試把第 1 小節的節奏照抄到第 2 小節，只改音高，聽聽看。' })
  }
  // 歌詞對位
  const sec = p.lyrics.find((s) => s.kind === part)
  if (sec) {
    const ls = lyricLines(sec.text)
    const syl = ls.slice(0, 2).reduce((a, l) => a + cleanLine(l).length, 0)
    const onsets = notes.length
    if (syl) fb.push(Math.abs(syl - onsets) <= 3 ? { level: 'good', text: `${part === 'verse' ? '主歌' : '副歌'}前兩句共 ${syl} 字，旋律有 ${onsets} 個音，一字一音剛好。` } : { level: 'warn', text: `前兩句 ${syl} 字，但旋律有 ${onsets} 個音。`, tip: onsets > syl ? '音比字多：可以把某些音改成「延長」，或一個字唱兩個音（轉音）。' : '字比音多：可以多放幾個音，或把歌詞刪掉幾個字，唱唱看哪個順口。' })
  }
  return fb
}
