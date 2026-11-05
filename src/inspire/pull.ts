// 「拉進創作」：把一則靈感放進目前這一章（或從它開始一首新歌）。
// 只把學生自己的素材放到他指定的位置，不替他改寫。
import { summarizeNotes } from '../lib/pitch'
import type { Project, Update } from '../lib/store'
import { KIND_ZH } from '../steps/Lyrics'
import type { Inspiration } from './store'

export interface PullOption {
  label: string
  how: string
  /** 回傳要跳去的章節（可省略＝留在原地） */
  apply: (p: Project, update: Update) => string | void
}

const words = (x: Inspiration) => (x.text || x.voice?.transcript || '').trim()
const appendLine = (base: string, line: string) => (base.trim() ? `${base.replace(/\s+$/, '')}\n${line}` : line)

function humSeed(x: Inspiration, update: Update) {
  if (!x.hum) return
  const a = summarizeNotes(x.hum.notes, x.hum.durationSec)
  update('hum', {
    notes: x.hum.notes, duration: x.hum.durationSec, keyRoot: x.hum.keyRoot, keyMode: x.hum.keyMode,
    confidence: Math.max(0, a.keys[0].score - a.keys[1].score), chordHints: a.chordHints.map((h) => h.chord),
    rangeLow: x.hum.rangeLow, rangeHigh: x.hum.rangeHigh, source: 'mic',
  })
  update('harmony', (h) => ({ ...h, root: x.hum!.keyRoot, mode: x.hum!.keyMode }))
}

export function pullOptions(x: Inspiration, step: string, p: Project): { here: PullOption[]; start: PullOption } {
  const w = words(x)
  const here: PullOption[] = []
  const idea = (k: 'title' | 'vibe' | 'image' | 'story' | 'hook', label: string) =>
    here.push({
      label, how: `idea.${k}`,
      apply: (pp, update) => update('idea', { ...pp.idea, [k]: k === 'vibe' || k === 'story' ? appendLine(pp.idea[k], w) : w }),
    })

  if (w) {
    if (step === 'idea' || step === 'hum') {
      if (x.tags.includes('title')) idea('title', `設為歌名「${w.slice(0, 12)}」`)
      idea('vibe', '加進 Vibe 板')
      if (x.tags.includes('image')) idea('image', '設為核心畫面')
      if (x.tags.includes('story')) idea('story', '加進故事')
      idea('hook', '設為記憶點（Hook）')
    }
    if (step === 'lyrics' || x.tags.includes('lyric')) {
      p.lyrics.forEach((s, i) => here.push({
        label: `加進歌詞：${KIND_ZH[s.kind]}${p.lyrics.filter((y) => y.kind === s.kind).length > 1 ? ` #${i + 1}` : ''}`,
        how: `lyrics.${s.kind}`,
        apply: (pp, update) => { update('lyrics', pp.lyrics.map((y) => (y.id === s.id ? { ...y, text: appendLine(y.text, w) } : y))); return 'lyrics' },
      }))
    }
    if (!['idea', 'hum'].includes(step)) idea('vibe', '帶到構想：加進 Vibe 板')
  }
  if (x.hum && x.hum.notes.length) {
    here.unshift({ label: `用這段哼唱（${x.hum.notes.length} 音）當旋律種子`, how: 'hum.seed', apply: (_pp, update) => { humSeed(x, update); return step === 'melody' ? 'melody' : 'hum' } })
  }

  const start: PullOption = {
    label: '從這則靈感開始一首歌',
    how: 'start',
    apply: (pp, update) => {
      update('idea', {
        ...pp.idea,
        title: x.tags.includes('title') && w ? w : pp.idea.title,
        vibe: w && !pp.idea.vibe.includes(w) ? appendLine(pp.idea.vibe, w) : pp.idea.vibe,
        image: x.tags.includes('image') && w && !pp.idea.image ? w : pp.idea.image,
      })
      if (x.hum) humSeed(x, update)
      // 先用這則靈感定 vibe（情緒／速度），再去哼唱或排和弦：心裡有這句話，旋律會跟著它的情緒走
      return 'idea'
    },
  }
  return { here, start }
}
