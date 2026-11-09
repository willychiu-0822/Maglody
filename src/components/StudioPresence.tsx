import type { Role } from '../agent/roles'

/** A single musician shares the desk; props stay quiet and never become extra controls. */
export function StudioPresence({ role, whisper, busy, onChat }: { role: Role; whisper: string | null; busy: boolean; onChat: () => void }) {
  return <div className="studio-presence" data-state={busy ? 'listening' : whisper ? 'responding' : 'idle'}>
    <div className="studio-scene" aria-hidden="true"><img src="/studio/room.webp" alt="" width="1000" height="563" fetchPriority="high" /></div>
    <button className="presence" onClick={onChat} aria-label={`跟${role.name}聊`}>
      <img className="studio-character" src={`/studio/roles/${role.id}.webp`} alt="" width="360" height="480" fetchPriority="high" />
      <span className="presence-avatar" aria-hidden="true">{role.glyph}</span>
      <span className="presence-name"><strong>{role.name}</strong><span className="presence-state">{busy ? '正側耳聽你說……' : whisper || role.enter}</span><span className="presence-invite">點夥伴，聊聊這首歌</span></span>
    </button>
  </div>
}
