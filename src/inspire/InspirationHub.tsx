import { NotebookDecisionPage, decisionTitle, type NotebookDecision } from './NotebookDecision'
import { Modal } from '../components/Modal'
import { useEffect, useRef, useState } from 'react'
import { ac, audioGeneration, playMedia, tone } from '../lib/audio'
import { getBlob, putBlob, shrinkImage } from '../lib/media'
import { analyzeBuffer, toMono } from '../lib/pitch'
import type { Project, Update } from '../lib/store'
import { uid } from '../lib/store'
import { keyName } from '../lib/theory'
import { pullOptions, collageOptions, type PullOption } from './pull'
import { useRecorder, type Recording } from './recorder'
import { DeskActions } from '../components/ui'
import { TAG_ZH, type InspoApi, type InspoTag, type Inspiration } from './store'

interface Draft {
  text: string
  tags: InspoTag[]
  voice?: Inspiration['voice']
  hum?: Inspiration['hum']
  images: Inspiration['images']
}
const emptyDraft = (): Draft => ({ text: '', tags: [], images: [] })

function useBlobUrl(id?: string) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    let u: string | null = null
    void getBlob(id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u) } })
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [id])
  return url
}

function Thumb({ id }: { id: string }) {
  const url = useBlobUrl(id)
  return url ? <img className="inspo-thumb" src={url} alt="靈感照片" /> : <span className="inspo-thumb ph" />
}

async function playAsset(id?: string) {
  if (!id) return
  const generation = audioGeneration()
  const b = await getBlob(id)
  if (!b || generation !== audioGeneration()) return
  playMedia(b)
}

function playHumNotes(h: NonNullable<Inspiration['hum']>) {
  const t0 = ac().currentTime + 0.05
  const first = h.notes[0]?.start ?? 0
  h.notes.forEach((n) => tone(n.midi, t0 + n.start - first, Math.max(0.08, n.dur), { gain: 0.2 }))
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

interface Props {
  api: InspoApi
  p: Project
  update: Update
  step: string
  stepTitle: string
  onGo: (step: string) => void
  onEvent: (kind: string, detail: string) => void
  open: null | 'capture' | 'library'
  setOpen: (v: null | 'capture' | 'library') => void
  onRecordingChange?: (rec: boolean) => void
}

/**
 * 靈感入口：任何一章都能打開，不會離開目前的位置。
 * 一則靈感可以同時有 文字 + 語音（自動聽寫）+ 哼唱（自動分析音高）+ 多張照片。
 */
export function InspirationHub({ api, p, update, step, stepTitle, onGo, onEvent, open, setOpen, onRecordingChange }: Props) {
  const [draft, renderDraft] = useState<Draft>(emptyDraft)
  const draftRef = useRef(draft)
  const setDraft = (value: Draft | ((d: Draft) => Draft)) => {
    const next = typeof value === 'function' ? value(draftRef.current) : value
    draftRef.current = next
    renderDraft(next)
  }
  const operation = useRef(false)
  const pendingRecording = useRef<{ kind: 'voice' | 'hum'; value: Recording } | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [collage, setCollage] = useState(false)
  const [decision, setDecision] = useState<NotebookDecision | null>(null)
  const [decisionError, setDecisionError] = useState(false)
  const decisionOpener = useRef<HTMLElement | null>(null)
  const [moreOpen, setMoreOpen] = useState<string | null>(null)
  const togglePick = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]))
  const [mediaSaveError, setMediaSaveError] = useState(false)
  const rec = useRecorder()
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open !== 'capture') rec.cancelPending() }, [open, rec.cancelPending])
  useEffect(() => { onRecordingChange?.(!!rec.recording) }, [rec.recording]) // eslint-disable-line react-hooks/exhaustive-deps

  // 快捷鍵：Alt + I 隨時記靈感（桌面）
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); setOpen('capture') } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [setOpen])

  const flash = (t: string) => setToast(t)
  const toggleTag = (t: InspoTag) => setDraft((d) => ({ ...d, tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t] }))

  const toggleRec = async (kind: 'voice' | 'hum') => {
    if (rec.recording === kind || rec.completed === kind || pendingRecording.current?.kind === kind) {
      setBusy(true)
      try {
      const r = (pendingRecording.current?.kind === kind ? pendingRecording.current.value : null) ?? await rec.stop()
      if (r) {
        pendingRecording.current = {kind, value: r}
        const assetId = uid()
        await putBlob(assetId, r.blob)
        if (kind === 'voice') {
          setDraft((d) => ({ ...d, voice: { assetId, durationSec: r.durationSec, transcript: r.transcript }, text: d.text || r.transcript }))
        } else {
          try {
            const buf = await ac().decodeAudioData(await r.blob.arrayBuffer())
            const a = analyzeBuffer(toMono(buf), buf.sampleRate)
            const k = a.keys[0]
            setDraft((d) => ({ ...d, tags: d.tags.includes('melody') ? d.tags : [...d.tags, 'melody'], hum: { assetId, notes: a.notes.slice(0, 200), durationSec: a.duration, keyRoot: k.root, keyMode: k.mode, rangeLow: a.rangeLow, rangeHigh: a.rangeHigh } }))
          } catch {
            setDraft((d) => ({ ...d, hum: { assetId, notes: [], durationSec: r.durationSec, keyRoot: 0, keyMode: 'major', rangeLow: 60, rangeHigh: 60 } }))
          }
        }
      }
        pendingRecording.current = null
        setMediaSaveError(false)
      } catch (e) { setMediaSaveError(true); flash('錄音還沒收好，聲音暫時留在這頁。騰出一些空間後，再試一次。'); throw e }
      finally { setBusy(false) }
    } else {
      if (pendingRecording.current) await toggleRec(pendingRecording.current.kind)
      if (rec.completed) await toggleRec(rec.completed)
      if (rec.recording) await toggleRec(rec.recording)
      await rec.start(kind)
    }
  }

  const addImages = async (files: FileList | null) => {
    if (!files || operation.current) return
    operation.current = true
    setBusy(true)
    try {
    for (const f of Array.from(files).slice(0, 6)) {
      try {
        const { blob, w, h } = await shrinkImage(f)
        const assetId = uid()
        await putBlob(assetId, blob)
        setDraft((d) => ({ ...d, images: [...d.images, { assetId, w, h }], tags: d.tags.includes('image') ? d.tags : [...d.tags, 'image'] }))
      } catch { flash('這張照片讀不到，換一張試試。') }
    }
    } finally { operation.current = false; setBusy(false) }
  }

  const hasContent = !!(draft.text.trim() || draft.voice || draft.hum || draft.images.length)
  const save = async () => {
    if (operation.current || busy || rec.pending) return
    operation.current = true
    setBusy(true)
    try {
      if (rec.recording || rec.completed || pendingRecording.current) await toggleRec(rec.recording ?? rec.completed ?? pendingRecording.current!.kind)
      const saved = draftRef.current
      if (!(saved.text.trim() || saved.voice || saved.hum || saved.images.length)) return
      const item = api.add({ ...saved, text: saved.text.trim(), fromStep: step })
      setDraft(emptyDraft())
      setOpen(decision ? 'library' : null)
      flash(`收好了。你還在「${stepTitle}」。`)
      onEvent('inspiration.saved', item.text || '（沒有文字的靈感）')
    } catch { flash('本子還沒存好，草稿留在這裡。騰出一些瀏覽器空間後，再試一次。') }
    finally { operation.current = false; setBusy(false) }
  }

  const saveTextCopy = () => {
    try {
      const item = api.add({...emptyDraft(), text:draftRef.current.text.trim(), fromStep:step})
      setOpen(decision ? 'library' : null)
      flash('文字先收好了。錄音仍留在草稿，回來可以重試。')
      onEvent('inspiration.saved',item.text)
    } catch { flash('文字還沒存好，草稿留在這裡。請釋出空間後重試。') }
  }

  const choose = (choice: NotebookDecision) => {
    decisionOpener.current = document.activeElement as HTMLElement | null
    setDecisionError(false)
    setDecision(choice)
  }
  const cancelDecision = () => {
    setDecision(null)
    setDecisionError(false)
    requestAnimationFrame(() => {
      if (decisionOpener.current?.isConnected && decisionOpener.current.checkVisibility()) decisionOpener.current.focus()
      else if (decision) {
        const card = [...document.querySelectorAll<HTMLElement>('[data-inspiration-id]')].find(e => e.dataset.inspirationId === decision.item.id)
        card?.querySelector<HTMLButtonElement>(decision.kind === 'start' ? '.primary-action' : '[data-notebook-remove]')?.focus()
      }
    })
  }
  const closeNotebook = () => {
    if (decision && open === 'capture') setOpen('library')
    else if (decision) cancelDecision()
    else setOpen(null)
  }
  const applyPull = (x: Inspiration, opt: PullOption) => {
    // Persist use history before applying; a full notebook must not silently change the song.
    api.markUsed(x.id, step, opt.how)
    const goto = opt.apply(p, update)
    setDecision(null)
    setOpen(null)
    flash(`已放進：${opt.label.replace(/^設為|^加進/, '')}`)
    onEvent(opt.how === 'start' ? 'inspiration.start' : 'inspiration.used', x.text || '')
    if (goto && goto !== step) onGo(goto)
  }
  const pull = (x: Inspiration, opt: PullOption) => {
    const hasProgress = p.idea.title || p.idea.hook || p.idea.mood || p.idea.vibe || p.idea.image || p.idea.story || p.idea.theme || p.done.some(Boolean)
      || [...p.harmony.verse, ...p.harmony.chorus, ...p.melody.verse, ...p.melody.chorus].some(n => n != null)
      || p.hum || p.lyrics.some(s => s.text.trim()) || p.arrangement.length > 0
    if (opt.how === 'start' && hasProgress) { choose({ kind: 'start', item: x, option: opt }); return }
    try { applyPull(x, opt) } catch { flash('本子還沒記好這次使用，歌曲尚未更動。騰出一點瀏覽器空間，再試一次吧。') }
  }
  const confirmDecision = () => {
    if (!decision) return
    try {
      if (decision.kind === 'start') applyPull(decision.item, decision.option)
      else {
        api.remove(decision.item.id)
        setPicked(ids => ids.filter(id => id !== decision.item.id))
        setExpanded(null)
        setMoreOpen(null)
        setDecision(null)
        flash('紙片已從本子移除。歌曲與其他紙片留在原處。')
        requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.notebook-tools .link-btn')?.focus())
      }
      setDecisionError(false)
    } catch { setDecisionError(true) }
  }

  const collageChoices = collageOptions(api.list.filter(x => picked.includes(x.id)), p)
  const performCollage = (option: ReturnType<typeof collageOptions>[number]) => {
    try {
      const items = api.list.filter(x => picked.includes(x.id))
      const goto = option.apply(p, update, api)
      items.forEach(x => api.markUsed(x.id, step, option.how))
      setPicked([])
      setCollage(false)
      setOpen(null)
      flash(`拼好了：${option.label}`)
      onEvent('inspiration.used', items.map(x => x.text).filter(Boolean).join(' / '))
      if (goto && goto !== step) onGo(goto)
    } catch { flash('拼貼還沒全部存好，先留在這頁，釋出瀏覽器空間後再試。') }
  }

  const recBtn = (kind: 'voice' | 'hum', label: string, _sub: string) => (
    <button className={`inspo-big ${rec.recording === kind ? 'rec' : ''}`} onClick={() => { void toggleRec(kind).catch(() => {}) }} disabled={busy || rec.pending}>
      <span className="inspo-big-icon">{rec.recording === kind ? '■' : kind === 'voice' ? '說' : '哼'}</span>
      <span className="small">{rec.recording === kind ? fmt(rec.elapsed) : label}</span>
    </button>
  )

  return (
    <>
      {toast && !open && <div className="toast" role="status"><span>{toast}</span><button className="btn notice-ack" onClick={() => setToast(null)}>好</button></div>}

      {open && (
        <Modal label={decision && open === 'library' ? decisionTitle(decision) : '靈感'} className={`notebook-sheet ${open === 'capture' ? 'capture-notebook' : 'library-notebook'} ${decision && open === 'library' ? 'decision-notebook' : ''}`} onClose={closeNotebook}>
            <div className="row between notebook-tools">
              {open === 'capture'
                ? <button className="link-btn" onClick={() => setOpen('library')}>翻翻本子（{api.list.length}）</button>
                : <button className="link-btn" onClick={() => setOpen('capture')}>{decision ? '✎ 記一下' : '← 記新的'}</button>}
              <button className="icon-btn" onClick={closeNotebook} aria-label="關閉">✕</button>
            </div>

            {toast && <div className="toast" role="status"><span>{toast}</span><button className="btn notice-ack" onClick={() => setToast(null)}>好</button></div>}

            <div className="notebook-cover">
              <span className="notebook-kicker">{open === 'capture' ? '工作室的隨手記' : '收著，等一首歌長出來'}</span>
              <h1>{open === 'capture' ? '先把這一點留下來' : decision ? decisionTitle(decision) : '靈感本子'}</h1>
              <p>{open === 'capture' ? '不用完整，一句話、一段哼唱都好。' : decision ? '先看清楚，決定後再動這一筆。' : '翻開一張小紙片，就能帶回歌裡。'}</p>
            </div>

            {open === 'capture' && (
              <div className="inspo-capture">
                <textarea aria-label="靈感文字" autoFocus rows={3} value={draft.text} placeholder="幾個字就好……" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                {rec.recording === 'voice' && rec.live && <div className="inspo-live">聽寫中：{rec.live}</div>}
                <div className="inspo-media">
                  {recBtn('voice', '說', '')}
                  {recBtn('hum', '哼', '')}
                  <button className="inspo-big" disabled={busy || rec.pending} onClick={() => fileRef.current?.click()}>
                    <span className="inspo-big-icon">拍</span>
                    <span className="small">拍照</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void addImages(e.target.files); e.target.value = '' }} />
                </div>
                {mediaSaveError && <p className="small muted">錄音還沒收好，聲音暫留在這頁。可以再試一次，或先另存文字。</p>}
                {rec.completed && <p className="small muted" role="status">剛才的錄音還在，按「夾進本子」收好。</p>}
                {rec.pending && <p className="small muted" role="status">等麥克風許可……也可以先寫文字。</p>}
                {rec.error && <p className="error small">{rec.error}</p>}
                {(draft.voice || draft.hum || draft.images.length > 0) && (
                  <div className="inspo-attached">
                    {draft.voice && <button className="chip" onClick={() => void playAsset(draft.voice!.assetId)}>▶ 語音 {fmt(draft.voice.durationSec)}</button>}
                    {draft.hum?.assetId && <button className="chip" onClick={() => void playAsset(draft.hum!.assetId)}>▶ 原始哼唱</button>}
                    {!!draft.hum?.notes.length && <button className="chip" onClick={() => playHumNotes(draft.hum!)}>▶ 哼唱 {draft.hum.notes.length} 音 · {keyName(draft.hum.keyRoot, draft.hum.keyMode)}</button>}
                    {draft.images.map((im) => <Thumb key={im.assetId} id={im.assetId} />)}
                  </div>
                )}
                <details className="inspo-tags-wrap">
                  <summary className="small muted">它也許是……（可不選）</summary>
                  <div className="inspo-tags">
                    {(Object.keys(TAG_ZH) as InspoTag[]).map((t) => (
                      <button key={t} className={`chip ${draft.tags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>{TAG_ZH[t]}</button>
                    ))}
                  </div>
                </details>
                <p className="capture-return" aria-label="記下後的返回位置">收好後，回到「{stepTitle}」繼續。</p>
                <DeskActions primary={{ label: busy ? '收好中…' : '夾進本子', onClick: () => void save(), disabled: busy || rec.pending || (!hasContent && !rec.recording && !rec.completed && !pendingRecording.current) }} secondary={mediaSaveError && draft.text.trim() ? {label:'先另存文字，錄音留著', onClick:saveTextCopy} : undefined} />
              </div>
            )}

            {open === 'library' && decision && <NotebookDecisionPage decision={decision} project={p} error={decisionError} onConfirm={confirmDecision} onCancel={cancelDecision} />}
            {open === 'library' && (
              <div className="inspo-list" style={decision ? { display: 'none' } : undefined}>
                {(collage ? picked.length < 2 : !api.list.some(x => x.id === expanded)) && <div className="library-entry"><DeskActions primary={{ label: '記下一點新靈感', onClick: () => setOpen('capture') }} /></div>}
                <button className="link-btn" onClick={() => { setCollage(!collage); setPicked([]) }}>{collage ? '不拼了' : '拼貼：挑幾則拼成新東西'}</button>
                {picked.length >= 2 && (
                  <div className="collage-bar">
                    <strong className="small">拼貼 {picked.length} 則：</strong>
                    {collageChoices.filter(o => o.how === 'collage.new').map(o => <button key={o.how} className="btn primary-action" onClick={() => performCollage(o)}>{o.label}</button>)}
                    {collageChoices.some(o => o.how !== 'collage.new') && <details className="collage-more"><summary>其他拼法</summary>{collageChoices.filter(o => o.how !== 'collage.new').map(o => <button key={o.how} className="link-btn" onClick={() => performCollage(o)}>{o.label}</button>)}</details>}
                  </div>
                )}
                {api.list.length === 0 && <p className="muted">本子還是空的。隨時按右上角「記一下」，或上方「記新的」，留幾個字就好。</p>}
                {api.list.map((x) => {
                  const { here, start } = pullOptions(x, step, p)
                  const isOpen = expanded === x.id
                  return (
                    <article key={x.id} data-inspiration-id={x.id} className={`inspo-card ${picked.includes(x.id) ? 'picked' : ''}`}>
                      {collage && <label className="pick"><input type="checkbox" checked={picked.includes(x.id)} onChange={() => togglePick(x.id)} /> 拿來拼</label>}
                      <button className="inspo-card-head" onClick={() => setExpanded(isOpen ? null : x.id)}>
                        <strong className="inspo-text">{x.text || x.voice?.transcript || '（無文字）'}</strong>
                        <span className="small muted">{new Date(x.createdAt).toLocaleDateString('zh-TW')} · {x.tags.map((t) => TAG_ZH[t]).join('、') || '未分類'}{x.used.length ? ` · 已用 ${x.used.length} 次` : ''}</span>
                        {x.note && <span className="small">{x.note}</span>}
                      </button>
                      {!isOpen && (x.voice || x.hum || x.images.length > 0) && (
                        <div className="inspo-attached small muted">
                          {[x.voice && '語音', x.hum && '哼唱', x.images.length && `${x.images.length} 張照片`].filter(Boolean).join('・')}
                        </div>
                      )}
                      {isOpen && <div className="inspo-attached">
                        {x.voice && <button className="chip" onClick={() => void playAsset(x.voice!.assetId)}>▶ 語音</button>}
                        {x.hum?.assetId && <button className="chip" onClick={() => void playAsset(x.hum!.assetId)}>▶ 原始哼唱</button>}
                        {x.hum && x.hum.notes.length > 0 && <button className="chip" onClick={() => playHumNotes(x.hum!)}>▶ 哼唱 {x.hum.notes.length} 音</button>}
                        {x.images.map((im) => <Thumb key={im.assetId} id={im.assetId} />)}
                      </div>}
                      {isOpen && !collage && (
                        <div className="inspo-actions">
                          <DeskActions primary={{ label: start.label, onClick: () => pull(x, start) }}
                            secondary={moreOpen === x.id ? undefined : { label: '其他用法…', onClick: () => setMoreOpen(x.id) }} />
                          {moreOpen === x.id && <div className="inspo-more">
                            {here.map((o) => <button key={o.how + o.label} className="link-btn" onClick={() => pull(x, o)}>{o.label}</button>)}
                            {x.id !== 'seed-fuzui-qianxing' && <button className="link-btn muted" data-notebook-remove onClick={() => choose({ kind: 'remove', item: x })}>刪除</button>}
                          </div>}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
        </Modal>
      )}
    </>
  )
}
