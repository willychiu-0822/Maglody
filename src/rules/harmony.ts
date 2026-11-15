import type { Mode } from '../lib/theory'
import type { Feedback } from './types'

export function progressionFeedback(degs: (number | null)[], mode: Mode, label: string): Feedback[] {
  const d = degs.filter((x): x is number => x != null)
  const fb: Feedback[] = []
  if (d.length < degs.length) return [{ level: 'warn', text: `${label}還有 ${degs.length - d.length} 格空著。` }]
  const tonicLike = mode === 'major' ? [0, 5] : [0, 2]
  fb.push(tonicLike.includes(d[0]) ? { level: 'good', text: `${label}從穩定的和弦開始，聽眾馬上知道「家」在哪。` } : { level: 'warn', text: `${label}一開頭就帶點懸著的感覺。`, tip: '這種開場很有戲；想先讓人安心的話，也可以試試從 I 或 vi 起頭。' })
  const last = d[d.length - 1]
  if (last === 4) fb.push({ level: 'good', text: `${label}停在 V：像一個問號，耳朵會想回到開頭，循環起來很順。` })
  else if (last === 0) fb.push({ level: 'good', text: `${label}停在 I：像句號，很適合段落或整首歌的結尾。` })
  else if (last === 3) fb.push({ level: 'good', text: `${label}停在 IV：溫柔、未完待續，回到 I 時很自然。` })
  else fb.push({ level: 'warn', text: `${label}的結尾比較少見，聽起來有點特別。`, tip: '想讓它接回開頭，可以試試停在 V（問號）或 I（句號）。' })
  const uniq = new Set(d).size
  fb.push(uniq >= 3 ? { level: 'good', text: `用了 ${uniq} 種和弦，走起來有起伏。` } : uniq === 2 ? { level: 'warn', text: '現在只有 2 種和弦，聽起來很簡單。', tip: '想多一點變化的話，可以加一個 IV 或 vi 聽聽。' } : { level: 'bad', text: '現在只有一種和弦，像一直停在同一個地方。', tip: '想往前走一步的話，換一格試試別的和弦。' })
  if (!d.includes(4) && !d.includes(3)) fb.push({ level: 'warn', text: '這一圈還沒用到 IV 或 V。', tip: 'IV（離家）和 V（想回家）會讓歌往前走，想要動感的話可以放一個聽聽。' })
  if (d.includes(6)) fb.push({ level: 'warn', text: '這裡用了 vii°（減和弦），聽起來有點懸著。', tip: '聽聽看，這是你想要的感覺嗎？' })
  return fb
}
