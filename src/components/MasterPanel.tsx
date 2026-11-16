import { Modal } from './Modal'
import { useEffect, useRef, useState } from 'react'
import type { AgentAction, AgentMessage } from '../agent/types'
import { ROLES, ROLE_ORDER, type RoleId } from '../agent/roles'
import { quickPrompts } from '../agent/quick'
import type { Project } from '../lib/store'
import { asset } from '../lib/asset'

interface Props {
  p: Project
  open: boolean
  roleId: RoleId
  setRoleId: (r: RoleId) => void
  onCapture: () => void
  onClose: () => void
  step: string
  messages: AgentMessage[]
  busy: boolean
  onAsk: (q: string, roleId: RoleId) => void
  onAction: (a: AgentAction, apply: boolean) => void
}

/** 跟工作室夥伴聊天：點誰就跟誰聊，不限目前的工作檯 */
export function MasterPanel({ p, open, roleId, setRoleId, onClose, onCapture, messages, busy, onAsk, onAction }: Props) {
  const [q, setQ] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [messages, open])
  if (!open) return null
  const role = ROLES[roleId]
  const send = (text: string) => { if (!text.trim()) return; onAsk(text.trim(), roleId); setQ('') }

  return (
    <Modal label={`跟${role.name}聊`} className="chat-sheet" onClose={onClose} closeLabel="聊到這裡，回去做歌">
        <div className="row between chat-toolbar">
          <div className="role-switch" role="tablist" aria-label="選擇夥伴">
            {ROLE_ORDER.map((id) => (
              <button key={id} role="tab" aria-selected={id === roleId} className={`role-dot ${id === roleId ? 'on' : ''}`} onClick={() => setRoleId(id)} title={ROLES[id].label} aria-label={ROLES[id].label}><img src={asset(`/studio/roles/${id}.webp`)} width="40" height="40" alt="" /></button>
            ))}
          </div>
          <button className="link-btn modal-capture" onClick={onCapture}>✎ 記一下</button>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">✕</button>
        </div>
        <div className="chat-identity">
          <img className="chat-room" src={asset('/studio/room.webp')} width="1000" height="563" alt="" />
          <img data-character-portrait src={asset(`/studio/roles/${role.id}.webp`)} width="84" height="112" alt={`${role.name}，工作室夥伴`} />
          <div className="chat-companion-note"><span>工作室裡，慢慢聊</span><strong>{role.label}</strong><p>{role.focus}</p></div>
        </div>

        <div className="master-list" ref={listRef}>
          {messages.length === 0 && <div className="msg chat-empty"><div className="msg-avatar" aria-hidden="true"><img src={asset(`/studio/roles/${role.id}.webp`)} width="40" height="48" alt="" /></div><div className="msg-body"><strong className="msg-speaker">{role.name}</strong>{role.name}把椅子拉過來了。靈感、卡住的地方、哪一版比較好，都可以慢慢說。下面有幾個開場句，點一下就行。</div></div>}
          {messages.map((m) => {
            const r = m.role_id ? ROLES[m.role_id as RoleId] : null
            return (
              <div key={m.id} className={`msg msg-${m.role}`}>
                {m.role === 'master' && <div className="msg-avatar" aria-hidden="true">{r && <img src={asset(`/studio/roles/${r.id}.webp`)} width="40" height="48" alt="" />}</div>}
                <div className="msg-body">
                  {m.role === 'master' && <strong className="msg-speaker">{r?.name ?? '工作室夥伴'}</strong>}
                  {m.text && <div>{m.text}</div>}
                  {m.reply?.learned && <div className="msg-learned">{m.reply.learned}</div>}
                  {m.reply?.next && <div className="msg-next">{m.reply.next}</div>}
                  {!!m.reply?.suggestions?.length && (
                    <div className="msg-sugs">
                      {m.reply.suggestions.map((s, i) => (
                        <span key={i} className="sug">
                          {s.action?.type === 'tryProgression' ? (
                            <>
                              <button className="chip" onClick={() => onAction(s.action!, false)}>▶ {s.label}</button>
                              <button className="link-btn" onClick={() => onAction(s.action!, true)}>就用這個</button>
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
          })}
          {busy && <div className="msg msg-master"><div className="msg-avatar" aria-hidden="true"><img src={asset(`/studio/roles/${role.id}.webp`)} width="40" height="48" alt="" /></div><div className="msg-body typing"><strong className="msg-speaker">{role.name}</strong>想一下……</div></div>}
        </div>

        <div className="master-quick">
          {quickPrompts(roleId, p).map((t) => <button key={t} className="chip" onClick={() => send(t)}>{t}</button>)}
        </div>
        <form className="master-input" onSubmit={(e) => { e.preventDefault(); send(q) }}>
          <input aria-label="跟夥伴說的話" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`跟${role.name}說……`} />
          <button className="primary-action" disabled={busy || !q.trim()} type="submit">送出</button>
        </form>
    </Modal>
  )
}
