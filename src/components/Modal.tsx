import { useEffect, useRef, type ReactNode } from 'react'

/** Native modal makes the background inert, traps focus and restores the opener. */
/** closeLabel：每個彈窗底部一顆有字的離開鈕（右上角的 ✕ 只是備用）。 */
export function Modal({ label, className = '', onClose, closeLabel, children }: { label: string; className?: string; onClose: () => void; closeLabel?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    return () => { dialog.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  return <dialog ref={ref} className="inspo-overlay" aria-label={label} aria-modal="true" onKeyDown={e => {
    if (e.key !== 'Tab') return
    const dialog = e.currentTarget
    const items = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')].filter(el => el.checkVisibility())
    const first = items[0], last = items[items.length - 1]
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last?.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
  }} onCancel={e => { e.preventDefault(); onClose() }}>
    <div className={`inspo-sheet ${className}`}>{children}{closeLabel && <button type="button" className="link-btn modal-leave" onClick={onClose}>{closeLabel}</button>}</div>
  </dialog>
}
