import { useEffect, useRef, useState } from 'react'
import type { AgentAction, AgentMessage } from '../agent/types'
import { agentMode } from '../agent/client'

const QUICK: Record<string, string[]> = {
  hum: ['為什麼是這個調？', '下一步'],
  idea: ['Hook 要怎麼想？', '下一步'],
  harmony: ['為什麼這和弦？', '換一個更哀傷的走向', '換更明亮的走向'],
  melody: ['旋律怎麼改？', '太高唱不上去', '為什麼這和弦？'],
  lyrics: ['押韻怎麼找？', '幫我寫一句', '下一步'],
  arrange: ['下一步', '副歌怎麼更有爆發力？'],
  record: ['下一步', '太高唱不上去'],
  mix: ['下一步'],
  review: ['下一步'],
}

interface Props {
  step: string
  messages: AgentMessage[]
  busy: boolean
  onAsk: (q: string) => void
  onAction: (a: AgentAction, apply: boolean) => void
  onPlayResult?: () => void
}

/** 大師旁白條：收合時顯示最新一句旁白；展開後可以看完整對話並提問 */
export function MasterPanel({ step, messages, busy, onAsk, onAction, onPlayResult }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const latest = [...messages].reverse().find((m) => m.role === 'master')
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [messages, open])
  const send = (text: string) => { if (!text.trim()) return; onAsk(text.trim()); setQ(''); setOpen(true) }

  const Msg = ({ m }: { m: AgentMessage }) => (
    <div className={`msg msg-${m.role}`}>
      {m.role === 'master' && <div className="msg-avatar" aria-hidden>師</div>}
      <div className="msg-body">
        {m.text && <div>{m.text}</div>}
        {m.reply?.learned && <div className="msg-learned"><strong>你學到：</strong>{m.reply.learned}</div>}
        {m.reply?.next && <div className="msg-next"><strong>下一步：</strong>{m.reply.next}</div>}
        {!!m.reply?.suggestions?.length && (
          <div className="msg-sugs">
            {m.reply.suggestions.map((s, i) => (
              <span key={i} className="sug">
                {s.action?.type === 'tryProgression' ? (
                  <>
                    <button className="chip" onClick={() => onAction(s.action!, false)}>▶ {s.label}</button>
                    <button className="chip on" onClick={() => onAction(s.action!, true)}>選這個</button>
                  </>
                ) : (
                  <button className="chip" onClick={() => s.action && onAction(s.action, true)}>{s.label}</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`master ${open ? 'open' : ''}`}>
      {open && (
        <div className="master-sheet">
          <div className="row between">
            <strong>大師</strong>
            <span className="muted small">{agentMode() === 'llm' ? 'LLM 模式' : '離線模式'}</span>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="收合">⌄</button>
          </div>
          <div className="master-list" ref={listRef}>
            {messages.length === 0 && <p className="muted small">先動手做做看，我會在你做完時告訴你剛剛發生了什麼。</p>}
            {messages.map((m) => <Msg key={m.id} m={m} />)}
            {busy && <div className="msg msg-master"><div className="msg-avatar">師</div><div className="msg-body typing">聽你剛剛做的…</div></div>}
          </div>
          <div className="master-quick">
            {(QUICK[step] ?? ['下一步']).map((t) => <button key={t} className="chip" onClick={() => send(t)}>{t}</button>)}
          </div>
          <form className="master-input" onSubmit={(e) => { e.preventDefault(); send(q) }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="問大師：為什麼這和弦？幫我換更哀傷的走向…" />
            <button className="btn btn-primary" type="submit">問</button>
          </form>
        </div>
      )}
      {!open && (
        <div className="master-bar-wrap">
        {onPlayResult && <button className="master-play" onClick={onPlayResult} aria-label="聽本章成果">▶</button>}
        <button className="master-bar" onClick={() => setOpen(true)}>
          <span className="msg-avatar" aria-hidden>師</span>
          <span className="master-bar-text">
            {busy ? '聽你剛剛做的…' : latest ? (latest.reply?.learned && !latest.text ? latest.reply.learned : latest.text) : '我在這裡。先動手，做完我會解釋。點這裡可以問我問題。'}
          </span>
          <span className="master-bar-cta">對話</span>
        </button>
        </div>
      )}
    </div>
  )
}
