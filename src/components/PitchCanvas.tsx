import { useEffect, useRef } from 'react'
import type { HumNote, PitchFrame } from '../lib/pitch'
import { inScale, noteNameOct, pc, type Mode } from '../lib/theory'

interface Props {
  frames: PitchFrame[]
  notes?: HumNote[]
  duration: number
  keyRoot?: number
  keyMode?: Mode
  playhead?: number | null
  height?: number
}

/** 音高軌跡圖：灰線＝原始偵測，色塊＝整理後的音符（綠＝調內、紅＝調外） */
export function PitchCanvas({ frames, notes = [], duration, keyRoot, keyMode, playhead, height = 220 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = window.devicePixelRatio || 1
    const w = cv.clientWidth
    const h = height
    cv.width = w * dpr
    cv.height = h * dpr
    const g = cv.getContext('2d')!
    g.scale(dpr, dpr)
    const css = getComputedStyle(cv)
    const col = (n: string) => css.getPropertyValue(n).trim()
    g.clearRect(0, 0, w, h)
    const mids = [...frames.map((f) => f.midi).filter((m): m is number => m != null), ...notes.map((n) => n.midi)]
    let lo = mids.length ? Math.floor(Math.min(...mids)) - 2 : 55
    let hi = mids.length ? Math.ceil(Math.max(...mids)) + 2 : 72
    if (hi - lo < 12) { const mid = (hi + lo) / 2; lo = Math.floor(mid - 6); hi = Math.ceil(mid + 6) }
    const padL = 40
    const x = (t: number) => padL + (t / Math.max(duration, 0.5)) * (w - padL - 6)
    const y = (m: number) => h - 8 - ((m - lo) / (hi - lo)) * (h - 16)
    // 背景格線：每個半音一條，調內音較明顯
    g.font = '10px system-ui'
    for (let m = lo; m <= hi; m++) {
      const isTonic = keyRoot != null && pc(m - keyRoot) === 0
      const inK = keyRoot != null && keyMode ? inScale(m, keyRoot, keyMode) : pc(m) === 0
      g.strokeStyle = isTonic ? col('--accent-soft') : inK ? col('--grid-strong') : col('--grid')
      g.lineWidth = isTonic ? 2 : 1
      g.beginPath(); g.moveTo(padL, y(m)); g.lineTo(w, y(m)); g.stroke()
      if (inK || isTonic) {
        g.fillStyle = col('--muted')
        g.fillText(noteNameOct(m), 2, y(m) + 3)
      }
    }
    // 整理後音符
    notes.forEach((n) => {
      const ok = keyRoot == null || !keyMode || inScale(n.midi, keyRoot, keyMode)
      g.fillStyle = ok ? col('--good') : col('--bad')
      g.globalAlpha = 0.55
      g.fillRect(x(n.start), y(n.midi) - 4, Math.max(2, x(n.start + n.dur) - x(n.start)), 8)
      g.globalAlpha = 1
    })
    // 原始軌跡
    g.strokeStyle = col('--ink')
    g.lineWidth = 1.5
    g.beginPath()
    let pen = false
    frames.forEach((f) => {
      if (f.midi == null || f.midi < lo || f.midi > hi) { pen = false; return }
      if (!pen) { g.moveTo(x(f.t), y(f.midi)); pen = true } else g.lineTo(x(f.t), y(f.midi))
    })
    g.stroke()
    if (playhead != null) {
      g.strokeStyle = col('--accent')
      g.lineWidth = 2
      g.beginPath(); g.moveTo(x(playhead), 0); g.lineTo(x(playhead), h); g.stroke()
    }
  }, [frames, notes, duration, keyRoot, keyMode, playhead, height])
  return <canvas ref={ref} className="pitch-canvas" style={{ height }} />
}
