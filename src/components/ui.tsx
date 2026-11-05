import { useState, type ReactNode } from 'react'

export type Level = 'good' | 'warn' | 'bad'
export interface Feedback { level: Level; text: string; tip?: string }

const LEVEL_ZH: Record<Level, string> = { good: '很好', warn: '可以更好', bad: '需要調整' }

export function Coach({ children, title = '老師說' }: { children: ReactNode; title?: string }) {
  return (
    <div className="coach">
      <div className="coach-avatar" aria-hidden>師</div>
      <div className="coach-bubble">
        <div className="coach-title">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}

/**
 * 「為什麼」卡片：先做再解釋。
 * ready=false 時只顯示「先動手」提示；ready 後自動展開，並可用剛才的聲音重聽。
 */
export function Why({ title, children, apply, ready = true, hint, listen }: {
  title: string
  children: ReactNode
  apply?: ReactNode
  ready?: boolean
  hint?: string
  listen?: { label: string; play: () => void }
}) {
  const [open, setOpen] = useState(false)
  const [seenReady, setSeenReady] = useState(ready)
  if (ready && !seenReady) { setSeenReady(true); setOpen(true) }
  if (!ready) {
    return (
      <div className="why locked">
        <div className="why-head">
          <span className="why-q">為什麼？</span>
          <span className="why-title">{title}</span>
        </div>
        <div className="why-body muted small">先動手：{hint ?? '完成上面的練習後，老師會用你剛才的聲音解釋。'}</div>
      </div>
    )
  }
  return (
    <div className={`why ${open ? 'open' : ''}`}>
      <button className="why-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="why-q">為什麼？</span>
        <span className="why-title">{title}</span>
        <span className="why-caret">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="why-body">
          {listen && <button className="btn small why-listen" onClick={listen.play}>▶ {listen.label}</button>}
          {children}
          {apply && (
            <div className="why-apply">
              <strong>還能用在哪：</strong>
              {apply}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function FeedbackList({ items, empty = '開始動手後，老師會在這裡即時回饋。' }: { items: Feedback[]; empty?: string }) {
  if (!items.length) return <p className="muted small">{empty}</p>
  return (
    <ul className="fb-list">
      {items.map((f, i) => (
        <li key={i} className={`fb fb-${f.level}`}>
          <span className="fb-dot" aria-label={LEVEL_ZH[f.level]} />
          <div>
            <div>{f.text}</div>
            {f.tip && <div className="fb-tip">{f.tip}</div>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Card({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </section>
  )
}

export function Light({ level }: { level: Level }) {
  return <span className={`light light-${level}`} aria-label={LEVEL_ZH[level]} />
}

export function Meter({ value, level }: { value: number; level: Level }) {
  return (
    <div className="meter">
      <div className={`meter-fill meter-${level}`} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function scoreOf(items: Feedback[]) {
  const g = items.filter((f) => f.level === 'good').length
  return items.length ? Math.round((g / items.length) * 100) : 0
}
