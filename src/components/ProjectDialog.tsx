import { useState } from 'react'
import type { Project } from '../lib/store'
import type { DemoVersion } from '../lib/versions'
import { Modal } from './Modal'

export type ProjectDecision = { kind: 'save' } | { kind: 'restore'; version: DemoVersion } | { kind: 'reset' } | { kind: 'import'; project: Project; fileName: string } | { kind: 'remove'; version: DemoVersion }

/** Keep revision decisions on the same paper as the song; commit only on confirmation. */
export function ProjectDialog({ decision, project, full, onSave, onRestore, onReset, onImport, onRemove, onClose, onCapture }: {
  decision: ProjectDecision; project: Project; onSave: (note: string) => string
  /** 版本本子滿了（20 版）時，最舊那一版的名字；存新的一版會換掉它，所以要先問 */
  full: string | null
  onRestore: (version: DemoVersion) => void; onReset: () => void; onImport: (imported: Project) => void; onRemove: (version: DemoVersion) => void; onClose: () => void; onCapture: () => void
}) {
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState('')
  const [error, setError] = useState(false)
  const title = decision.kind === 'save' ? '留住這一版' : decision.kind === 'restore' ? '回到這一版' : decision.kind === 'import' ? '打開備份檔' : decision.kind === 'remove' ? '刪掉這一版' : '翻開新的一頁'
  const song = decision.kind === 'restore' || decision.kind === 'remove' ? decision.version.project : decision.kind === 'import' ? decision.project : project
  const confirm = () => {
    if (saved) { onClose(); return }
    if (decision.kind === 'save') {
      try { setSaved(onSave(note)); setError(false) } catch { setError(true) }
    } else if (decision.kind === 'restore') { onRestore(decision.version); onClose() }
    else if (decision.kind === 'remove') { onRemove(decision.version); onClose() }
    else if (decision.kind === 'import') { try { onImport(decision.project); setError(false); onClose() } catch { setError(true) } }
    else { onReset(); onClose() }
  }
  return <Modal label={title} className="notebook-sheet revision-sheet" onClose={onClose}>
    <div className="revision-toolbar">
      <span className="notebook-kicker">改稿手記</span>
      <button className="link-btn" onClick={onCapture}>✎ 記一下</button>
      <button className="icon-btn" aria-label="關閉" onClick={onClose}>✕</button>
    </div>
    <div className="notebook-cover"><h1>{title}</h1><p>{decision.kind === 'save' ? '先收好這一版，接著放心試。' : decision.kind === 'restore' ? '翻翻那時留下的樣子，再決定要不要回去。' : decision.kind === 'import' ? '備份檔裡的歌長這樣。決定了再打開。' : decision.kind === 'remove' ? '刪掉之前，再看一眼。' : '把桌面留給下一個念頭。'}</p></div>
    <article className="revision-snapshot" aria-label="這次的作品">
      <small>{decision.kind === 'restore' || decision.kind === 'remove' ? decision.version.name : decision.kind === 'import' ? decision.fileName : '現在這首歌'}</small>
      <strong>{song.idea.title || song.idea.hook || '還沒取名字的歌'}</strong>
      {(decision.kind === 'restore' || decision.kind === 'remove') && decision.version.note && <p>{decision.version.note}</p>}
      <span>{decision.kind === 'restore' || decision.kind === 'remove' ? '一起看看這一版的樣子。' : decision.kind === 'import' ? '這是備份檔裡的那首歌。' : '一起看看這首歌現在的樣子。'}</span>
    </article>
    <form className="revision-form" onSubmit={e => { e.preventDefault(); confirm() }}>
      {saved ? <p className="revision-saved" role="status">存好了：{saved}<span>這首歌留在原處。想改時，還能回到這一版。</span></p> : decision.kind === 'save' && full ? <p className="revision-effect">本子只放得下 20 版。要把最舊的 {full} 換掉，收下這一版嗎？換掉的那一版就找不回來了。</p> : decision.kind === 'save' ? <label className="field"><span>這一版的說明（選填）</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="例如：副歌多留了一口氣" /></label> : <p className="revision-effect">{decision.kind === 'remove' ? '這一版會從本子裡拿掉，之後找不回來。桌上的歌不受影響。' : decision.kind === 'import' ? `桌上這首歌會先收成一版，再換成備份裡的歌。${full ? `本子已經滿了，最舊的 ${full} 會被換掉。` : ''}想回來，到選單「更多」按「回到這版」就行。` : decision.kind === 'restore' ? '目前桌上的內容會換成這一版。想保留剛才的修改，可以先取消、存成新的一版。' : '目前桌上的歌與夥伴對話會清空。靈感本子與存好的 Demo 版本會保留；想留下這首歌，可以先取消、存成新的一版。'}</p>}
      {error && <p className="revision-error" role="status">{decision.kind === 'import' ? '桌上這首歌還沒收好，所以備份先沒有打開，你的歌都還在。騰出瀏覽器的儲存空間，再試一次。' : '這版還沒存好，說明和作品都還在。騰出瀏覽器的儲存空間，再按「再存一次」。'}</p>}
      <button type="submit" className="primary-action">{saved ? '好，回到工作室' : decision.kind === 'save' ? error ? '再存一次' : full ? `換掉 ${full}，收好這一版` : '收好這一版' : decision.kind === 'restore' ? `回到 ${decision.version.name}` : decision.kind === 'import' ? '打開這份備份' : decision.kind === 'remove' ? `刪掉 ${decision.version.name}` : '開始新的歌'}</button>
      {!saved && <button type="button" className="link-btn revision-cancel" onClick={onClose}>{decision.kind === 'save' ? '先不存' : decision.kind === 'restore' || decision.kind === 'import' ? '先不換' : decision.kind === 'remove' ? '先不刪' : '繼續這首歌'}</button>}
    </form>
  </Modal>
}
