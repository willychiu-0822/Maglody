import { createContext, useContext, useState, type ReactNode } from 'react'

/** 發想期：零審查。回饋不出現紅燈，只有「可以試試」 */
export const GentleContext = createContext(false)

export type Level = 'good' | 'warn' | 'bad'
export interface Feedback { level: Level; text: string; tip?: string }

const LEVEL_ZH: Record<Level, string> = { good: '很好', warn: '可以更好', bad: '需要調整' }

/** 大師最新一句話（由 App 提供）；有的話取代開場白 */
export const WhisperContext = createContext<string | null>(null)

/**
 * 每一檯最上方只有一句話：大師剛說的，或這一檯要做的事。
 * children（較長的說明）不再顯示在畫面上，避免一開頭就是一面字牆。
 */
export function Coach({ short }: { children?: ReactNode; short?: ReactNode; title?: string }) {
  return <p className="whisper">{short}</p>
}

/** 一個畫面只允許：1 個主動作（大、輕柔）＋ 最多 1 個次要動作（文字連結） */
export function DeskActions({ primary, secondary }: {
  primary?: { label: ReactNode; onClick: () => void; disabled?: boolean }
  secondary?: { label: ReactNode; onClick: () => void }
}) {
  return (
    <div className="desk-actions">
      {primary && <button className="primary-action" onClick={primary.onClick} disabled={primary.disabled}>{primary.label}</button>}
      {secondary && <button className="link-btn" onClick={secondary.onClick}>{secondary.label}</button>}
    </div>
  )
}

/** 工具箱：進階功能、回饋、原理全部收在這裡，預設關閉 */
export function Toolbox({ children, label = '工具箱' }: { children: ReactNode; label?: string }) {
  return (
    <details className="toolbox">
      <summary>{label}</summary>
      <div className="toolbox-body">{children}</div>
    </details>
  )
}

/**
 * 「為什麼」卡片：先做再解釋。
 * ready=false 時不顯示；ready 後只出現一行，主動展開才解釋。
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

export function FeedbackList({ items: raw, empty = '動手試試，夥伴會在這裡留下小發現。' }: { items: Feedback[]; empty?: string }) {
  const gentle = useContext(GentleContext)
  const items = gentle ? raw.map((f) => (f.level === 'bad' ? { ...f, level: 'warn' as const } : f)) : raw
  const [extra, setExtra] = useState(0)
  if (!items.length) return <p className="muted small">{empty}</p>
  // 一次只說兩件事：一件做得好的、一件可以試的；其他想看再展開
  const good = items.find((f) => f.level === 'good')
  const tryOne = items.find((f) => f.level === 'bad') ?? items.find((f) => f.level === 'warn')
  const top = [good, tryOne].filter((f): f is Feedback => !!f)
  const remaining = items.filter(f=>!top.includes(f))
  const shown = [...top, ...remaining.slice(0,extra)]
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
      {items.length > shown.length && <li><button className="link-btn" onClick={() => setExtra(n=>n+1)}>還有 {items.length - shown.length} 則觀察（再看一則）</button></li>}
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

/** Ink sketch for an idle stage: the companion has set things up and is waiting. */
export function StageSketch({ kind }: { kind: 'piano' | 'mic' }) {
  return (
    <svg className="stage-sketch" viewBox="0 0 120 84" width="120" height="84" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse className="sketch-wash" cx="60" cy="46" rx="50" ry="30" />
      {kind === 'piano' ? (
        <g className="sketch-ink">
          <path d="M22 52 C40 50, 80 50, 99 52 L97 66 C78 68, 42 68, 24 66 Z" />
          <path d="M33 52 L32 66 M44 51.5 L43.5 67 M55 51 L55 67.5 M66 51 L66.5 67.5 M77 51.5 L77.5 67 M88 52 L89 66" />
          <path d="M24 50 C30 30, 58 20, 96 26 L99 50" />
          <path className="sketch-accent" d="M48 36 q5 -6 10 0 t10 0 t10 0" />
        </g>
      ) : (
        <g className="sketch-ink">
          <path d="M52 20 C52 10, 68 10, 68 20 L68 36 C68 46, 52 46, 52 36 Z" />
          <path d="M53 24 L67 24 M53 30 L67 30" />
          <path d="M45 34 C46 52, 74 52, 75 34 M60 49 L60 66 M46 68 C54 65, 66 65, 74 68" />
          <path className="sketch-accent" d="M84 20 q7 9 0 18 M92 15 q11 14 0 28 M36 20 q-7 9 0 18 M28 15 q-11 14 0 28" />
        </g>
      )}
    </svg>
  )
}
