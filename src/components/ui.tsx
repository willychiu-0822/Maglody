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

/** 「為什麼」卡片：原理 + 還能用在哪 */
export function Why({ title, children, apply }: { title: string; children: ReactNode; apply?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`why ${open ? 'open' : ''}`}>
      <button className="why-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="why-q">為什麼？</span>
        <span className="why-title">{title}</span>
        <span className="why-caret">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="why-body">
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
