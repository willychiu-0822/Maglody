import { useState } from 'react'
import type { Project } from '../lib/store'
import type { DemoVersion } from '../lib/versions'
import { Modal } from './Modal'

export type ProjectDecision = { kind: 'save' } | { kind: 'restore'; version: DemoVersion } | { kind: 'reset' }

/** Keep revision decisions on the same paper as the song; commit only on confirmation. */
export function ProjectDialog({ decision, project, onSave, onRestore, onReset, onClose, onCapture }: {
  decision: ProjectDecision; project: Project; onSave: (note: string) => string
  onRestore: (version: DemoVersion) => void; onReset: () => void; onClose: () => void; onCapture: () => void
}) {
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState('')
  const [error, setError] = useState(false)
  const title = decision.kind === 'save' ? '留住這一版' : decision.kind === 'restore' ? '回到這一版' : '翻開新的一頁'
  const song = decision.kind === 'restore' ? decision.version.project : project
  const confirm = () => {
    if (saved) { onClose(); return }
    if (decision.kind === 'save') {
      try { setSaved(onSave(note)); setError(false) } catch { setError(true) }
    } else if (decision.kind === 'restore') { onRestore(decision.version); onClose() }
    else { onReset(); onClose() }
  }
  return <Modal label={title} className="notebook-sheet revision-sheet" onClose={onClose}>
    <div className="revision-toolbar">
      <span className="notebook-kicker">改稿手記</span>
      <button className="link-btn" onClick={onCapture}>✎ 記一下</button>
      <button className="icon-btn" aria-label="關閉" onClick={onClose}>✕</button>
    </div>
    <div className="notebook-cover"><h1>{title}</h1><p>{decision.kind === 'save' ? '先收好這一版，接著放心試。' : decision.kind === 'restore' ? '再聽一次那時的心情，決定要不要回去。' : '把桌面留給下一個念頭。'}</p></div>
    <article className="revision-snapshot" aria-label="這次的作品">
      <small>{decision.kind === 'restore' ? decision.version.name : '現在這首歌'}</small>
      <strong>{song.idea.title || song.idea.hook || '還沒取名字的歌'}</strong>
      {decision.kind === 'restore' && decision.version.note && <p>{decision.version.note}</p>}
      <span>一句話、和弦、旋律與詞，都在這一頁裡。</span>
    </article>
    <form className="revision-form" onSubmit={e => { e.preventDefault(); confirm() }}>
      {saved ? <p className="revision-saved" role="status">存好了：{saved}<span>這首歌留在原處。想改時，還能回到這一版。</span></p> : decision.kind === 'save' ? <label className="field"><span>這一版的說明（選填）</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="例如：副歌多留了一口氣" /></label> : <p className="revision-effect">{decision.kind === 'restore' ? '目前桌上的內容會換成這一版。想保留剛才的修改，可以先取消、存成新的一版。' : '目前桌上的歌與夥伴對話會清空。靈感本子與存好的 Demo 版本會保留；想留下這首歌，可以先取消、存成新的一版。'}</p>}
      {error && <p className="revision-error" role="status">這版還沒存好。說明與作品都還在，請釋出瀏覽器儲存空間後，按「重試保存」。</p>}
      <button type="submit" className="primary-action">{saved ? '好，回到工作室' : decision.kind === 'save' ? error ? '重試保存' : '收好這一版' : decision.kind === 'restore' ? `回到 ${decision.version.name}` : '開始新的歌'}</button>
      {!saved && <button type="button" className="link-btn revision-cancel" onClick={onClose}>{decision.kind === 'save' ? '先不存' : decision.kind === 'restore' ? '先不換' : '繼續這首歌'}</button>}
    </form>
  </Modal>
}
