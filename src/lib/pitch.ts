// 音高偵測：自實作 normalized autocorrelation（McLeod Pitch Method 簡化版）
import { estimateKey, freqToMidi, pc, diatonicChords, type Mode, type KeyGuess, midiToFreq } from './theory'

/** 回傳頻率（Hz），偵測不到回傳 -1 */
export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 70, maxHz = 1100): number {
  const n = buf.length
  let rms = 0
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / n)
  if (rms < 0.01) return -1

  const minLag = Math.floor(sampleRate / maxHz)
  const maxLag = Math.min(Math.floor(sampleRate / minHz), n - 1)
  const nsdf = new Float32Array(maxLag + 1)
  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0, m = 0
    for (let i = 0; i + lag < n; i++) {
      acf += buf[i] * buf[i + lag]
      m += buf[i] * buf[i] + buf[i + lag] * buf[i + lag]
    }
    nsdf[lag] = m > 0 ? (2 * acf) / m : 0
  }
  // 找第一個超過最大峰值 * 0.9 的局部峰
  let maxVal = 0
  for (let lag = minLag; lag <= maxLag; lag++) if (nsdf[lag] > maxVal) maxVal = nsdf[lag]
  if (maxVal < 0.5) return -1
  const thr = maxVal * 0.9
  let best = -1
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (nsdf[lag] >= thr && nsdf[lag] >= nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) { best = lag; break }
  }
  if (best < 0) return -1
  // 拋物線內插讓頻率更準
  const a = nsdf[best - 1], b = nsdf[best], c = nsdf[best + 1]
  const denom = a - 2 * b + c
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0
  return sampleRate / (best + shift)
}

export interface PitchFrame { t: number; midi: number | null }
export interface HumNote { start: number; dur: number; midi: number }

export interface HumAnalysis {
  frames: PitchFrame[]
  notes: HumNote[]
  duration: number
  hist: number[]
  keys: KeyGuess[]
  chordHints: { start: number; end: number; chord: string; roman: string; why: string }[]
  rangeLow: number
  rangeHigh: number
}

function median(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

/** 降取樣到約 11 kHz：人聲基頻都在 1 kHz 以下，計算量可少 4~16 倍 */
export function decimate(data: Float32Array, sampleRate: number, target = 11025): { data: Float32Array; sampleRate: number } {
  const f = Math.max(1, Math.floor(sampleRate / target))
  if (f === 1) return { data, sampleRate }
  const out = new Float32Array(Math.floor(data.length / f))
  for (let i = 0; i < out.length; i++) {
    let s = 0
    for (let k = 0; k < f; k++) s += data[i * f + k]
    out[i] = s / f
  }
  return { data: out, sampleRate: sampleRate / f }
}

export function trackPitch(raw: Float32Array, rawRate: number): PitchFrame[] {
  const { data, sampleRate } = decimate(raw, rawRate)
  const win = Math.pow(2, Math.ceil(Math.log2(sampleRate * 0.05)))
  const hop = Math.floor(sampleRate * 0.01)
  const frames: PitchFrame[] = []
  for (let i = 0; i + win < data.length; i += hop) {
    const f = detectPitch(data.subarray(i, i + win), sampleRate)
    frames.push({ t: i / sampleRate, midi: f > 0 ? freqToMidi(f) : null })
  }
  // 中位數濾波去除八度跳動與雜點
  const out: PitchFrame[] = frames.map((fr, i) => {
    if (fr.midi == null) return fr
    const nb: number[] = []
    for (let k = -3; k <= 3; k++) {
      const x = frames[i + k]?.midi
      if (x != null) nb.push(x)
    }
    return { t: fr.t, midi: nb.length >= 3 ? median(nb) : null }
  })
  return out
}

export function segmentNotes(frames: PitchFrame[], minDur = 0.09): HumNote[] {
  const notes: HumNote[] = []
  let cur: { start: number; vals: number[]; last: number } | null = null
  const flush = () => {
    if (cur && cur.last - cur.start >= minDur) {
      notes.push({ start: cur.start, dur: cur.last - cur.start, midi: Math.round(median(cur.vals)) })
    }
    cur = null
  }
  for (const f of frames) {
    if (f.midi == null) { flush(); continue }
    if (cur && Math.abs(f.midi - median(cur.vals)) < 0.7) {
      cur.vals.push(f.midi)
      cur.last = f.t + 0.01
    } else {
      flush()
      cur = { start: f.t, vals: [f.midi], last: f.t + 0.01 }
    }
  }
  flush()
  // 合併極短的間隔中斷（同一音）
  const merged: HumNote[] = []
  for (const n of notes) {
    const p = merged[merged.length - 1]
    if (p && p.midi === n.midi && n.start - (p.start + p.dur) < 0.06) p.dur = n.start + n.dur - p.start
    else merged.push({ ...n })
  }
  return merged
}

function hintChords(notes: HumNote[], root: number, mode: Mode, duration: number) {
  const chords = diatonicChords(root, mode).filter((c) => c.quality !== 'dim')
  const seg = Math.max(1.2, duration / 8)
  const hints: HumAnalysis['chordHints'] = []
  for (let s = 0; s < duration; s += seg) {
    const e = Math.min(duration, s + seg)
    const w = new Array(12).fill(0)
    notes.forEach((n) => {
      const ov = Math.min(e, n.start + n.dur) - Math.max(s, n.start)
      if (ov > 0) w[pc(n.midi)] += ov
    })
    const total = w.reduce((a, b) => a + b, 0)
    if (total < 0.15) continue
    let best = chords[0], bestScore = -1
    chords.forEach((c, idx) => {
      // 和弦音覆蓋的時間越多越好；主和弦稍微加分（穩定）
      const score = c.pcs.reduce((a, p) => a + w[p], 0) / total + (idx === 0 ? 0.05 : 0)
      if (score > bestScore) { bestScore = score; best = c }
    })
    const top = w
      .map((v, i) => ({ v, i }))
      .filter((x) => x.v > 0 && best.pcs.includes(x.i))
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map((x) => ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][x.i])
    hints.push({
      start: s,
      end: e,
      chord: best.name,
      roman: best.roman,
      why: `這段你唱最久的音裡有 ${top.join('、')}，剛好都是 ${best.name} 和弦的組成音（覆蓋 ${Math.round(bestScore * 100)}%）。`,
    })
  }
  return hints
}

export function analyzeBuffer(data: Float32Array, sampleRate: number): HumAnalysis {
  const frames = trackPitch(data, sampleRate)
  const notes = segmentNotes(frames)
  const duration = data.length / sampleRate
  const hist = new Array(12).fill(0)
  notes.forEach((n) => (hist[pc(n.midi)] += n.dur))
  const keys = estimateKey(hist)
  const top = keys[0]
  const mids = notes.map((n) => n.midi)
  return {
    frames,
    notes,
    duration,
    hist,
    keys,
    chordHints: notes.length ? hintChords(notes, top.root, top.mode, duration) : [],
    rangeLow: mids.length ? Math.min(...mids) : 60,
    rangeHigh: mids.length ? Math.max(...mids) : 60,
  }
}

export function toMono(buf: AudioBuffer): Float32Array {
  if (buf.numberOfChannels === 1) return buf.getChannelData(0)
  const a = buf.getChannelData(0), b = buf.getChannelData(1)
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) / 2
  return out
}

/** 產生一段「示範哼唱」讓沒有麥克風的人也能體驗分析流程（帶顫音與滑音的人聲般正弦波） */
export function synthDemoHum(sampleRate = 22050): Float32Array {
  const tune: [number, number][] = [
    [67, 0.4], [69, 0.4], [71, 0.8], [74, 0.4], [71, 0.4], [69, 0.8],
    [67, 0.4], [64, 0.4], [67, 0.8], [62, 0.6], [0, 0.2], [64, 0.4], [67, 0.4], [69, 0.4], [67, 1.0],
  ]
  const total = tune.reduce((s, [, d]) => s + d, 0) + 0.3
  const out = new Float32Array(Math.floor(total * sampleRate))
  let t = 0.15, phase = 0, prev = midiToFreq(tune[0][0])
  for (const [m, d] of tune) {
    const s0 = Math.floor(t * sampleRate), s1 = Math.floor((t + d) * sampleRate)
    const target = m ? midiToFreq(m) : 0
    for (let i = s0; i < s1; i++) {
      const lt = (i - s0) / sampleRate
      if (!target) { out[i] = 0; continue }
      const glide = Math.min(1, lt / 0.05)
      const f = (prev + (target - prev) * glide) * (1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * lt))
      phase += (2 * Math.PI * f) / sampleRate
      const env = Math.min(1, lt / 0.03, (d - lt) / 0.05)
      out[i] = 0.35 * env * (Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase))
    }
    if (target) prev = target
    t += d
  }
  return out
}
