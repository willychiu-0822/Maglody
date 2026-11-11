import { useEffect, useRef } from 'react'
import type { Project } from '../lib/store'
import type { Inspiration } from './store'
import type { PullOption } from './pull'

export type NotebookDecision = { kind: 'start'; item: Inspiration; option: PullOption } | { kind: 'remove'; item: Inspiration }
export const decisionTitle = (decision: NotebookDecision) => decision.kind === 'start' ? '把這則靈感帶進歌裡' : '移除這張紙片'

/** A deliberate choice inside the notebook, before changing the creator's work. */
export function NotebookDecisionPage({ decision, project, error, onConfirm, onCancel }: {
  decision: NotebookDecision; project: Project; error: boolean; onConfirm: () => void; onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { cancelRef.current?.focus() }, [])
  const item = decision.item
  return <div className="notebook-decision">
    <article className="revision-snapshot" aria-label="選中的靈感">
      <small>從本子裡挑出的紙片</small>
      <p className="decision-words" tabIndex={0}>{item.text || item.voice?.transcript || '沒有文字的靈感'}</p>
      <span>{[item.voice && '語音', item.hum && '哼唱', item.images.length > 0 && `${item.images.length} 張照片`].filter(Boolean).join(' · ') || '一則文字靈感'}</span>
    </article>
    {decision.kind === 'start' ? <div className="decision-effect">
      <p>帶進這首歌：</p><p className="decision-song-title" tabIndex={0}>《{project.idea.title || '還沒取名字的歌'}》</p>
      <ul>
        {(item.text || item.voice?.transcript) && <li>{item.tags.includes('title') ? '歌名與記憶點會換成這句話。' : '記憶點會換成這句話，歌名留在原處。'}這句話也會加進 Vibe。</li>}
        {item.tags.includes('image') && !project.idea.image && <li>這句話會成為核心畫面。</li>}
        {item.hum && <li>這段哼唱會換掉目前的哼唱種子與調性；格子裡已寫的旋律仍保留。</li>}
        <li>已有的歌詞、和弦格與編曲會保留；採用後回到構想檯。</li>
      </ul>
    </div> : <p className="revision-effect">這張紙片會從本子移除，無法復原。已帶進歌曲的內容，以及其他拼貼紙片共用的錄音與照片，會繼續留著。</p>}
    {error && <p className="revision-error" role="status">{decision.kind === 'remove' ? '還沒移除，紙片仍在本子裡。騰出一點瀏覽器空間，再按「重試移除」吧。' : '本子還沒記好這次使用，歌曲尚未更動。騰出一點瀏覽器空間，再按「重試採用」吧。'}</p>}
    <button className="primary-action" onClick={onConfirm}>{decision.kind === 'start' ? error ? '重試採用' : '帶進這首歌' : error ? '重試移除' : '確定移除這張紙片'}</button>
    <button ref={cancelRef} className="link-btn revision-cancel" onClick={onCancel}>{decision.kind === 'start' ? '先不帶入' : '留在本子裡'}</button>
  </div>
}
