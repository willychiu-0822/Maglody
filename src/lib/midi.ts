// 匯出標準 MIDI 檔（SMF Type 1），讓作品可以帶進 REAPER 等 DAW 繼續製作。
import type { Project } from './store'
import { chordVoicing, diatonicChords } from './theory'

const PPQ = 480
const EIGHTH = PPQ / 2

function vlq(n: number): number[] {
  const out = [n & 0x7f]
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80)
  return out
}
const str = (s: string) => [...new TextEncoder().encode(s)]
const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]

interface Ev { t: number; data: number[] }

function track(name: string, evs: Ev[]): number[] {
  const all: Ev[] = [{ t: 0, data: [0xff, 0x03, ...vlq(str(name).length), ...str(name)] }, ...evs].sort((a, b) => a.t - b.t || (a.data[0] & 0xf0) - (b.data[0] & 0xf0))
  const bytes: number[] = []
  let last = 0
  all.forEach((e) => { bytes.push(...vlq(e.t - last), ...e.data); last = e.t })
  bytes.push(0, 0xff, 0x2f, 0)
  return [...str('MTrk'), ...u32(bytes.length), ...bytes]
}

/** 依編曲結構展開（沒有編曲時用 主歌→副歌） */
export function buildMidi(p: Project): Uint8Array {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const plan = p.arrangement.length ? p.arrangement.map((s) => ({ kind: s.kind, bars: s.bars, mel: s.layers.melody, harm: s.layers.keys || s.layers.pad, bass: s.layers.bass })) : [{ kind: 'verse', bars: 4, mel: true, harm: true, bass: true }, { kind: 'chorus', bars: 4, mel: true, harm: true, bass: true }]
  const melody: Ev[] = [], harm: Ev[] = [], bass: Ev[] = []
  let bar0 = 0
  plan.forEach((s) => {
    const useChorus = ['chorus', 'intro', 'inter', 'outro'].includes(s.kind)
    const prog = p.harmony[useChorus ? 'chorus' : 'verse']
    const cells = s.kind === 'chorus' ? p.melody.chorus : ['verse', 'pre', 'bridge'].includes(s.kind) ? p.melody.verse : null
    for (let b = 0; b < s.bars; b++) {
      const t = (bar0 + b) * PPQ * 4
      const d = prog[b % 4]
      if (d != null) {
        const v = chordVoicing(chords[d])
        if (s.harm) v.slice(0, 3).forEach((m) => { harm.push({ t, data: [0x91, m, 70] }, { t: t + PPQ * 4 - 10, data: [0x81, m, 0] }) })
        if (s.bass) { const r = v[v.length - 1] - 12; bass.push({ t, data: [0x92, r, 90] }, { t: t + PPQ * 4 - 10, data: [0x82, r, 0] }) }
      }
      if (s.mel && cells) {
        const base = (b % 4) * 8
        for (let i = 0; i < 8; i++) {
          const m = cells[base + i]
          if (m == null || m < 0) continue
          let len = 1
          while (base + i + len < cells.length && b * 8 + i + len < s.bars * 8 && cells[base + i + len] === -1) len++
          const st = t + i * EIGHTH
          melody.push({ t: st, data: [0x90, m, 100] }, { t: st + len * EIGHTH - 10, data: [0x80, m, 0] })
        }
      }
    }
    bar0 += s.bars
  })
  const tempo = Math.round(60_000_000 / p.idea.bpm)
  const meta = track('Tempo', [{ t: 0, data: [0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] }, { t: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] }])
  const header = [...str('MThd'), ...u32(6), 0, 1, 0, 4, PPQ >> 8, PPQ & 255]
  return new Uint8Array([...header, ...meta, ...track('主旋律 Melody', melody), ...track('和弦 Chords', harm), ...track('貝斯 Bass', bass)])
}

export function downloadMidi(p: Project) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([buildMidi(p) as BlobPart], { type: 'audio/midi' }))
  a.download = `${p.idea.title || 'maglody-song'}.mid`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
