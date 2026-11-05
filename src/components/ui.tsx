import { createContext, useContext, useState, type ReactNode } from 'react'

/** 發想期：零審查。回饋不出現紅燈，只有「可以試試」 */
export const GentleContext = createContext(false)

export type Level = 'good' | 'warn' | 'bad'
export interface Feedback { level: Level; text: string; tip?: string }

const LEVEL_ZH: Record<Level, string> = { good: '很好', warn: '可以更好', bad: '需要調整' }

/**
 * 老師的開場：只說一句「先做什麼」（short），想聽再多說（children）。
 * 學習是火種，不是一開始就把知識倒滿。
 */
export function Coach({ children, short, title = '老師說' }: { children?: ReactNode; short?: ReactNode; title?: string }) {
  const [more, setMore] = useState(false)
  return (
    <div className="coach">
      <div className="coach-avatar" aria-hidden>師</div>
      <div className="coach-bubble">
        <div className="coach-title">{title}</div>
        <div>{short ?? children}</div>
        {short && children && (more ? <div className="coach-more">{children}</div> : <button className="link-btn" onClick={() => setMore(true)}>多說一點</button>)}
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
  void hint
  // 先做先聽：還沒動手就不出現；動手後只亮一行好奇心的火種，想知道才點開
  if (!ready) return null
  return (
    <div className={`why ${open ? 'open' : ''}`}>
      <button className="why-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="why-q">想知道？</span>
        <span className="why-title">{title}</span>
        <span className="why-caret">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="why-body">
          {listen && <button className="btn small why-listen" onClick={listen.play}>▶ {listen.label}</button>}
          {children}
          {apply && open && (
            <details className="why-apply">
              <summary>再深一點：還能用在哪</summary>
              <strong>還能用在哪：</strong>
              {apply}
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export function FeedbackList({ items: raw, empty = '開始動手後，老師會在這裡即時回饋。' }: { items: Feedback[]; empty?: string }) {
  const gentle = useContext(GentleContext)
  const items = gentle ? raw.map((f) => (f.level === 'bad' ? { ...f, level: 'warn' as const } : f)) : raw
  const [all, setAll] = useState(false)
  if (!items.length) return <p className="muted small">{empty}</p>
  // 一次只說兩件事：一件做得好的、一件可以試的；其他想看再展開
  const good = items.find((f) => f.level === 'good')
  const tryOne = items.find((f) => f.level === 'bad') ?? items.find((f) => f.level === 'warn')
  const top = [good, tryOne].filter((f): f is Feedback => !!f)
  const shown = all ? items : top
  return (
    <ul className="fb-list">
      {gentle && <li className="fb-gentle small muted">現在是發想期：先不審查，有就好。下面只是可以試試的方向。</li>}
      {shown.map((f, i) => (
        <li key={i} className={`fb fb-${f.level}`}>
          <span className="fb-dot" aria-label={LEVEL_ZH[f.level]} />
          <div>
            <div>{f.text}</div>
            {f.tip && <div className="fb-tip">{f.tip}</div>}
          </div>
        </li>
      ))}
      {items.length > shown.length && <li><button className="link-btn" onClick={() => setAll(true)}>還有 {items.length - shown.length} 則觀察</button></li>}
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
