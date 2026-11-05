import { useEffect, useRef, useState } from 'react'
import { ac, tone } from '../lib/audio'
import { getBlob, putBlob, shrinkImage } from '../lib/media'
import { analyzeBuffer, toMono } from '../lib/pitch'
import type { Project, Update } from '../lib/store'
import { uid } from '../lib/store'
import { keyName } from '../lib/theory'
import { pullOptions, collageOptions } from './pull'
import { useRecorder } from './recorder'
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
  const b = await getBlob(id)
  if (!b) return
  const a = new Audio(URL.createObjectURL(b))
  void a.play()
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
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [collage, setCollage] = useState(false)
  const [moreOpen, setMoreOpen] = useState<string | null>(null)
  const togglePick = (id: string) => setPicked((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]))
  const rec = useRecorder()
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { onRecordingChange?.(!!rec.recording) }, [rec.recording]) // eslint-disable-line react-hooks/exhaustive-deps

  // 快捷鍵：Alt + I 隨時記靈感（桌面）
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); setOpen('capture') } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [setOpen])

  const flash = (t: string) => { setToast(t); window.setTimeout(() => setToast(null), 2600) }
  const toggleTag = (t: InspoTag) => setDraft((d) => ({ ...d, tags: d.tags.includes(t) ? d.tags.filter((x) => x !== t) : [...d.tags, t] }))

  const toggleRec = async (kind: 'voice' | 'hum') => {
    if (rec.recording === kind) {
      setBusy(true)
      const r = await rec.stop()
      if (r) {
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
      setBusy(false)
    } else {
      if (rec.recording) await toggleRec(rec.recording)
      await rec.start(kind)
    }
  }

  const addImages = async (files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files).slice(0, 6)) {
      try {
        const { blob, w, h } = await shrinkImage(f)
        const assetId = uid()
        await putBlob(assetId, blob)
        setDraft((d) => ({ ...d, images: [...d.images, { assetId, w, h }], tags: d.tags.includes('image') ? d.tags : [...d.tags, 'image'] }))
      } catch { flash('這張照片讀不到，換一張試試。') }
    }
  }

  const hasContent = !!(draft.text.trim() || draft.voice || draft.hum || draft.images.length)
  const save = async () => {
    if (rec.recording) await toggleRec(rec.recording)
    if (!hasContent) return
    const item = api.add({ ...draft, text: draft.text.trim(), fromStep: step })
    setDraft(emptyDraft())
    setOpen(null)
    flash(`收好了。你還在「${stepTitle}」。`)
    onEvent('inspiration.saved', item.text || '（沒有文字的靈感）')
  }

  const pull = (x: Inspiration, opt: { label: string; how: string; apply: (p: Project, u: Update) => string | void }) => {
    // 不默默覆蓋：目前的歌已有歌名或進度時，先問一聲
    if (opt.how === 'start' && (p.idea.title || p.done.some(Boolean)) && p.idea.title !== x.text) {
      const ok = confirm(`目前這首${p.idea.title ? `《${p.idea.title}》` : ''}已經有進度。\n\n確定：把「${x.text || '這則靈感'}」帶進這首（成為歌名與 vibe，其他內容都保留）。\n取消：先不要動。想開全新的一首，可以用頁面最下方「重新開始一首新歌」。`)
      if (!ok) return
    }
    const goto = opt.apply(p, update)
    api.markUsed(x.id, step, opt.how)
    setOpen(null)
    flash(`已放進：${opt.label.replace(/^設為|^加進/, '')}`)
    onEvent(opt.how === 'start' ? 'inspiration.start' : 'inspiration.used', x.text || '')
    if (goto && goto !== step) onGo(goto)
  }

  const recBtn = (kind: 'voice' | 'hum', label: string, _sub: string) => (
    <button className={`inspo-big ${rec.recording === kind ? 'rec' : ''}`} onClick={() => void toggleRec(kind)} disabled={busy}>
      <span className="inspo-big-icon">{rec.recording === kind ? '■' : kind === 'voice' ? '說' : '哼'}</span>
      <span className="small">{rec.recording === kind ? fmt(rec.elapsed) : label}</span>
    </button>
  )

  return (
    <>
      {toast && <div className="toast" role="status">{toast}</div>}

      {open && (
        <div className="inspo-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="inspo-sheet" role="dialog" aria-label="靈感">
            <div className="row between">
              {open === 'capture'
                ? <button className="link-btn" onClick={() => setOpen('library')}>翻翻本子（{api.list.length}）</button>
                : <button className="link-btn" onClick={() => setOpen('capture')}>← 記新的</button>}
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="關閉">✕</button>
            </div>

            {open === 'capture' && (
              <div className="inspo-capture">
                <textarea autoFocus rows={3} value={draft.text} placeholder="幾個字就好……" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                {rec.recording === 'voice' && rec.live && <div className="inspo-live">聽寫中：{rec.live}</div>}
                <div className="inspo-media">
                  {recBtn('voice', '說', '')}
                  {recBtn('hum', '哼', '')}
                  <button className="inspo-big" onClick={() => fileRef.current?.click()}>
                    <span className="inspo-big-icon">拍</span>
                    <span className="small">拍照</span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void addImages(e.target.files); e.target.value = '' }} />
                </div>
                {rec.error && <p className="error small">{rec.error}</p>}
                {(draft.voice || draft.hum || draft.images.length > 0) && (
                  <div className="inspo-attached">
                    {draft.voice && <button className="chip" onClick={() => void playAsset(draft.voice!.assetId)}>▶ 語音 {fmt(draft.voice.durationSec)}</button>}
                    {draft.hum && <button className="chip" onClick={() => playHumNotes(draft.hum!)}>▶ 哼唱 {draft.hum.notes.length} 音{draft.hum.notes.length ? ` · ${keyName(draft.hum.keyRoot, draft.hum.keyMode)}` : ''}</button>}
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
                <DeskActions primary={{ label: busy ? '收好中…' : '夾進本子', onClick: () => void save(), disabled: !hasContent && !rec.recording }} />
              </div>
            )}

            {open === 'library' && (
              <div className="inspo-list">
                <button className="link-btn" onClick={() => { setCollage(!collage); setPicked([]) }}>{collage ? '不拼了' : '拼貼：挑幾則拼成新東西'}</button>
                {picked.length >= 2 && (
                  <div className="collage-bar">
                    <strong className="small">拼貼 {picked.length} 則：</strong>
                    {collageOptions(api.list.filter((x) => picked.includes(x.id)), p).map((o) => (
                      <button key={o.how} className="btn small" onClick={() => {
                        const items = api.list.filter((x) => picked.includes(x.id))
                        const goto = o.apply(p, update, api)
                        items.forEach((x) => api.markUsed(x.id, step, o.how))
                        setPicked([])
                        setOpen(null)
                        flash(`拼好了：${o.label}`)
                        onEvent('inspiration.used', items.map((x) => x.text).filter(Boolean).join(' / '))
                        if (goto && goto !== step) onGo(goto)
                      }}>{o.label}</button>
                    ))}
                  </div>
                )}
                {api.list.length === 0 && <p className="muted">本子還是空的。任何時候按右下角那張小紙條就能記。</p>}
                {api.list.map((x) => {
                  const { here, start } = pullOptions(x, step, p)
                  const isOpen = expanded === x.id
                  return (
                    <article key={x.id} className={`inspo-card ${picked.includes(x.id) ? 'picked' : ''}`}>
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
                        {x.hum && x.hum.notes.length > 0 && <button className="chip" onClick={() => playHumNotes(x.hum!)}>▶ 哼唱 {x.hum.notes.length} 音</button>}
                        {x.images.map((im) => <Thumb key={im.assetId} id={im.assetId} />)}
                      </div>}
                      {isOpen && !collage && (
                        <div className="inspo-actions">
                          <DeskActions primary={{ label: start.label, onClick: () => pull(x, start) }}
                            secondary={moreOpen === x.id ? undefined : { label: '其他用法…', onClick: () => setMoreOpen(x.id) }} />
                          {moreOpen === x.id && <div className="inspo-more">
                            {here.map((o) => <button key={o.how + o.label} className="link-btn" onClick={() => pull(x, o)}>{o.label}</button>)}
                            {x.id !== 'seed-fuzui-qianxing' && <button className="link-btn muted" onClick={() => { if (confirm('刪除這則靈感？')) api.remove(x.id) }}>刪除</button>}
                          </div>}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
