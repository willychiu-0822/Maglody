import type { TrackId } from '../lib/audio'
import type { Project } from '../lib/store'
import type { Feedback } from './types'

export function mixFeedback(p: Project, peakDb: number | null): Feedback[] {
  const t = p.mix.tracks
  const fb: Feedback[] = []
  const others = (['chords', 'bass', 'drums'] as TrackId[]).map((id) => t[id].mute ? 0 : t[id].vol)
  const loudest = Math.max(...others)
  fb.push(!t.melody.mute && t.melody.vol > 0 && t.melody.vol >= loudest * 0.9 ? { level: 'good', text: '旋律跟伴奏的音量差不多，主角站得出來嗎？聽聽看。' } : { level: 'bad', text: '旋律現在比伴奏小聲，或是被靜音了，可能有點被蓋住。', tip: '想讓旋律靠近一點，先把伴奏拉小一點，再聽聽看。' })
  fb.push(Math.abs(t.bass.pan) <= 0.15 ? { level: 'good', text: '貝斯站在中間，低音穩穩的。' } : { level: 'warn', text: '貝斯偏到一邊去了。', tip: '試試把它放回中間，聽聽兩邊差在哪。' })
  fb.push(Math.abs(t.melody.pan) <= 0.15 ? { level: 'good', text: '旋律站在中間，像站在舞台正中央。' } : { level: 'warn', text: '旋律偏向一邊。', tip: '放回中間也行，聽聽你喜歡它站哪裡。' })
  fb.push(Math.abs(t.chords.pan) >= 0.2 ? { level: 'good', text: '和弦往旁邊站了一點，聽聽它跟旋律隔了多遠。' } : { level: 'warn', text: '和弦跟旋律站在差不多的位置。', tip: '往左或右推一點，聽聽空間有沒有變。' })
  fb.push(t.chords.hp && t.melody.hp ? { level: 'good', text: '和弦和旋律都開了低頻切除，下面的位置留給貝斯和鼓。' } : { level: 'warn', text: '和弦或旋律還沒開低頻切除。', tip: '開開看，再關掉比一比，聽聽差在哪。' })
  if (t.bass.hp) fb.push({ level: 'warn', text: '貝斯也開了低頻切除。', tip: '聽聽低音有沒有變薄；比較喜歡原本的聲音，關掉就好。' })
  if (peakDb != null) fb.push(peakDb > -1 ? { level: 'bad', text: '最大聲的地方太滿了，快破音了。', tip: '每一條推桿各自往左拉一點，比全部推到底安全。' } : { level: 'good', text: '最大聲的地方還留有空間。' })
  return fb
}
