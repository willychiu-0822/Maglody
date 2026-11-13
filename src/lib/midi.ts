// 匯出標準 MIDI 檔（SMF Type 1），讓作品可以帶進 REAPER、Ableton Live 等 DAW 繼續製作。
import type { Project } from './store'
import { chordVoicing, diatonicChords } from './theory'

const PPQ = 480
const EIGHTH = PPQ / 2
/** General MIDI 鼓組（第 10 軌道）：大鼓、小鼓、閉合 hi-hat */
const KICK = 36, SNARE = 38, HAT = 42
const DRUM_LEN = PPQ / 4

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
  const plan = p.arrangement.length ? p.arrangement.map((s) => ({ kind: s.kind, bars: s.bars, mel: s.layers.melody, harm: s.layers.keys || s.layers.pad, bass: s.layers.bass, drums: !!s.layers.drums })) : [{ kind: 'verse', bars: 4, mel: true, harm: true, bass: true, drums: true }, { kind: 'chorus', bars: 4, mel: true, harm: true, bass: true, drums: true }]
  const melody: Ev[] = [], harm: Ev[] = [], bass: Ev[] = [], drums: Ev[] = []
  const hit = (t: number, note: number, vel: number) => { drums.push({ t, data: [0x99, note, vel] }, { t: t + DRUM_LEN, data: [0x89, note, 0] }) }
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
      // 鼓：跟 audio.ts 播放的節奏同一組（八分音符第 0、5 格大鼓，第 2、6 格小鼓，每格 hi-hat），匯出的和耳朵聽到的一致。
      if (s.drums) {
        for (let i = 0; i < 8; i++) {
          const st = t + i * EIGHTH
          if (i === 0 || i === 5) hit(st, KICK, 100)
          if (i === 2 || i === 6) hit(st, SNARE, 96)
          hit(st, HAT, i % 2 ? 54 : 70)
        }
      }
    }
    bar0 += s.bars
  })
  const tempo = Math.round(60_000_000 / p.idea.bpm)
  const meta = track('Tempo', [{ t: 0, data: [0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255] }, { t: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] }])
  const header = [...str('MThd'), ...u32(6), 0, 1, 0, 5, PPQ >> 8, PPQ & 255]
  return new Uint8Array([...header, ...meta, ...track('主旋律 Melody', melody), ...track('和弦 Chords', harm), ...track('貝斯 Bass', bass), ...track('鼓 Drums', drums)])
}

/** 讀出 .mid 裡每個 MTrk 的軌道名稱（FF 03）；沒有名稱的軌回傳空字串。 */
export function midiTrackNames(bytes: Uint8Array): string[] {
  const names: string[] = []
  const u32at = (i: number) => bytes[i] * 16777216 + bytes[i + 1] * 65536 + bytes[i + 2] * 256 + bytes[i + 3]
  let pos = 0
  while (pos + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[pos], bytes[pos + 1], bytes[pos + 2], bytes[pos + 3])
    const start = pos + 8
    const end = Math.min(start + u32at(pos + 4), bytes.length)
    pos = end
    if (id !== 'MTrk') continue
    let i = start, running = 0, name = ''
    const readVlq = () => { let n = 0, b = 0; do { b = bytes[i++]; n = n * 128 + (b & 0x7f) } while (b & 0x80 && i < end); return n }
    while (i < end) {
      readVlq()
      let status = bytes[i]
      if (status & 0x80) i++
      else status = running
      if (status === 0xff) {
        const type = bytes[i++]
        const len = readVlq()
        if (type === 0x03 && !name) name = new TextDecoder().decode(bytes.subarray(i, Math.min(i + len, end)))
        i += len
        if (type === 0x2f) break
      } else if (status === 0xf0 || status === 0xf7) {
        const len = readVlq()
        i += len
      } else {
        running = status
        const kind = status & 0xf0
        i += kind === 0xc0 || kind === 0xd0 ? 1 : 2
      }
    }
    names.push(name)
  }
  return names
}

export function downloadMidi(p: Project) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([buildMidi(p) as BlobPart], { type: 'audio/midi' }))
  a.download = `${p.idea.title || 'maglody-song'}.mid`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
