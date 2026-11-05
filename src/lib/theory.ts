// 樂理核心：音名、音階、和弦、調性估計
export type Mode = 'major' | 'minor'

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
export const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']

export const SCALES: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
}

export const MODE_ZH: Record<Mode, string> = { major: '大調', minor: '小調' }

export const pc = (n: number) => ((n % 12) + 12) % 12
export const noteName = (midi: number) => NOTE_NAMES[pc(Math.round(midi))]
export const noteNameOct = (midi: number) => `${noteName(midi)}${Math.floor(Math.round(midi) / 12) - 1}`
export const keyName = (root: number, mode: Mode) => `${NOTE_NAMES[pc(root)]} ${MODE_ZH[mode]}`
export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
export const freqToMidi = (f: number) => 69 + 12 * Math.log2(f / 440)

export interface Chord {
  degree: number // 0-6
  root: number // pitch class
  quality: 'maj' | 'min' | 'dim'
  name: string
  roman: string
  pcs: number[]
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function diatonicChord(keyRoot: number, mode: Mode, degree: number): Chord {
  const s = SCALES[mode]
  const r = s[degree % 7]
  const third = s[(degree + 2) % 7] + ((degree + 2) >= 7 ? 12 : 0)
  const fifth = s[(degree + 4) % 7] + ((degree + 4) >= 7 ? 12 : 0)
  const i3 = third - r
  const i5 = fifth - r
  const quality: Chord['quality'] = i3 === 4 ? 'maj' : i5 === 6 ? 'dim' : 'min'
  const root = pc(keyRoot + r)
  const suffix = quality === 'maj' ? '' : quality === 'min' ? 'm' : 'dim'
  const rn = ROMAN[degree]
  const roman = quality === 'maj' ? rn : quality === 'min' ? rn.toLowerCase() : rn.toLowerCase() + '°'
  return {
    degree,
    root,
    quality,
    name: NOTE_NAMES[root] + suffix,
    roman,
    pcs: [root, pc(keyRoot + third), pc(keyRoot + fifth)],
  }
}

export const diatonicChords = (keyRoot: number, mode: Mode) =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => diatonicChord(keyRoot, mode, d))

/** 和弦的三個音（以 C3~C4 區間為主的鋼琴按法） */
export function chordVoicing(c: Chord): number[] {
  const base = 48 + c.root
  const intervals = c.quality === 'maj' ? [0, 4, 7] : c.quality === 'min' ? [0, 3, 7] : [0, 3, 6]
  const root = base > 54 ? base - 12 : base
  return intervals.map((i) => root + 12 + i).concat([root])
}

/** 每個級數在流行歌裡的「角色」，用白話解釋 */
export const CHORD_ROLE: Record<Mode, string[]> = {
  major: [
    '家：最穩定，聽起來「到了」',
    '準備出發：常接 V，柔和的過渡',
    '朦朧：介於家與憂傷之間，少用但有味道',
    '離家：溫暖、敞開，像走出門看天空',
    '想回家：張力最大，耳朵會期待回到 I',
    '憂傷的家：同樣穩定，但帶一點眼淚',
    '緊繃：很不穩定，通常一閃而過',
  ],
  minor: [
    '家（小調）：穩定但帶點陰影',
    '緊繃：不穩定，常接 v 或 i',
    '光：小調裡的大三和弦，像雲縫透光',
    '沉思：往下沉的感覺',
    '想回家：小調裡較含蓄的張力',
    '溫柔的遠方：讓憂傷變得寬廣',
    '推進：常帶著歌往前走回 i 或 III',
  ],
}

// Krumhansl–Schmuckler 調性輪廓
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

function corr(a: number[], b: number[]) {
  const ma = a.reduce((s, x) => s + x, 0) / a.length
  const mb = b.reduce((s, x) => s + x, 0) / b.length
  let num = 0, da = 0, db = 0
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb)
    da += (a[i] - ma) ** 2
    db += (b[i] - mb) ** 2
  }
  return da && db ? num / Math.sqrt(da * db) : 0
}

export interface KeyGuess { root: number; mode: Mode; score: number }

/** 以「每個音唱了多久」的直方圖，跟 24 個調的輪廓比對 */
export function estimateKey(hist: number[]): KeyGuess[] {
  const res: KeyGuess[] = []
  for (let r = 0; r < 12; r++) {
    const rot = hist.map((_, i) => hist[(i + r) % 12])
    res.push({ root: r, mode: 'major', score: corr(rot, KS_MAJOR) })
    res.push({ root: r, mode: 'minor', score: corr(rot, KS_MINOR) })
  }
  return res.sort((a, b) => b.score - a.score)
}

export function inScale(midi: number, keyRoot: number, mode: Mode) {
  return SCALES[mode].includes(pc(midi - keyRoot))
}

/** 把任意音對到調內最近的音 */
export function snapToScale(midi: number, keyRoot: number, mode: Mode) {
  const m = Math.round(midi)
  for (let d = 0; d < 6; d++) {
    if (inScale(m - d, keyRoot, mode)) return m - d
    if (inScale(m + d, keyRoot, mode)) return m + d
  }
  return m
}

/** 以 tonic 為基準列出音階音（step 可為負） */
export function scaleNote(keyRoot: number, mode: Mode, step: number, baseOctaveMidi = 60) {
  const s = SCALES[mode]
  const oct = Math.floor(step / 7)
  const idx = ((step % 7) + 7) % 7
  return baseOctaveMidi + pc(keyRoot) + oct * 12 + s[idx]
}

/** 簡譜數字（小調以關係大調為 1，即小調主音唱 6） */
export const jianpu = (midi: number, keyRoot: number, mode: Mode) => {
  const rel = mode === 'minor' ? keyRoot + 3 : keyRoot
  const i = SCALES.major.indexOf(pc(Math.round(midi) - rel))
  return i >= 0 ? String(i + 1) : '♯'
}
