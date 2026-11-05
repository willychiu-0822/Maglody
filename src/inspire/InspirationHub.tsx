import { useEffect, useRef, useState } from 'react'
import { ac, tone } from '../lib/audio'
import { getBlob, putBlob, shrinkImage } from '../lib/media'
import { analyzeBuffer, toMono } from '../lib/pitch'
import type { Project, Update } from '../lib/store'
import { uid } from '../lib/store'
import { keyName } from '../lib/theory'
import { pullOptions } from './pull'
import { canTranscribe, useRecorder } from './recorder'
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
}

/**
 * 靈感入口：任何一章都能打開，不會離開目前的位置。
 * 一則靈感可以同時有 文字 + 語音（自動聽寫）+ 哼唱（自動分析音高）+ 多張照片。
 */
export function InspirationHub({ api, p, update, step, stepTitle, onGo, onEvent }: Props) {
  const [open, setOpen] = useState<null | 'capture' | 'library'>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const rec = useRecorder()
  const fileRef = useRef<HTMLInputElement>(null)

  // 快捷鍵：Alt + I 隨時記靈感（桌面）
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); setOpen('capture') } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

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
    flash(`已存進靈感庫。你還在「${stepTitle}」，接著做吧。`)
    onEvent('inspiration.saved', item.text || '（沒有文字的靈感）')
  }

  const pull = (x: Inspiration, opt: { label: string; how: string; apply: (p: Project, u: Update) => string | void }) => {
    const goto = opt.apply(p, update)
    api.markUsed(x.id, step, opt.how)
    setOpen(null)
    flash(`已放進：${opt.label.replace(/^設為|^加進/, '')}`)
    onEvent(opt.how === 'start' ? 'inspiration.start' : 'inspiration.used', x.text || '')
    if (goto && goto !== step) onGo(goto)
  }

  const recBtn = (kind: 'voice' | 'hum', label: string, sub: string) => (
    <button className={`inspo-big ${rec.recording === kind ? 'rec' : ''}`} onClick={() => void toggleRec(kind)} disabled={busy}>
      <span className="inspo-big-icon">{rec.recording === kind ? '■' : kind === 'voice' ? '說' : '哼'}</span>
      <span>{rec.recording === kind ? `停止（${fmt(rec.elapsed)}）` : label}</span>
      <span className="small muted">{sub}</span>
    </button>
  )

  return (
    <>
      {!open && (
        <button className={`inspo-fab ${rec.recording ? 'rec' : ''}`} onClick={() => setOpen('capture')} aria-label="記下靈感">
          <span className="inspo-fab-plus">＋</span>靈感
        </button>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}

      {open && (
        <div className="inspo-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="inspo-sheet" role="dialog" aria-label="靈感">
            <div className="row between">
              <div className="seg">
                <button className={open === 'capture' ? 'on' : ''} onClick={() => setOpen('capture')}>記下靈感</button>
                <button className={open === 'library' ? 'on' : ''} onClick={() => setOpen('library')}>靈感庫（{api.list.length}）</button>
              </div>
              <button className="icon-btn" onClick={() => setOpen(null)} aria-label="關閉">✕</button>
            </div>

            {open === 'capture' && (
              <div className="inspo-capture">
                <p className="muted small">想到什麼就丟進來，可以同時打字、說話、哼歌、拍照。記完會回到「{stepTitle}」，不會打斷你。</p>
                <textarea autoFocus rows={3} value={draft.text} placeholder="一句詞、幾個字、一種感覺…（例如：負罪前行）" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
                {rec.recording === 'voice' && rec.live && <div className="inspo-live">聽寫中：{rec.live}</div>}
                <div className="inspo-bigs">
                  {recBtn('voice', '說話', canTranscribe() ? '錄音＋自動聽寫' : '錄一段語音')}
                  {recBtn('hum', '哼一段', '錄音＋音高分析')}
                  <button className="inspo-big" onClick={() => fileRef.current?.click()}>
                    <span className="inspo-big-icon">照</span>
                    <span>拍照／選圖</span>
                    <span className="small muted">錄音中也能加</span>
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
                <div className="inspo-tags">
                  <span className="small muted">它可能是：</span>
                  {(Object.keys(TAG_ZH) as InspoTag[]).map((t) => (
                    <button key={t} className={`chip ${draft.tags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>{TAG_ZH[t]}</button>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg inspo-save" disabled={!hasContent && !rec.recording} onClick={() => void save()}>
                  {busy ? '處理中…' : '存進靈感庫，回去繼續'}
                </button>
              </div>
            )}

            {open === 'library' && (
              <div className="inspo-list">
                {api.list.length === 0 && <p className="muted">還沒有靈感。任何時候按右下角「＋靈感」就能記。</p>}
                {api.list.map((x) => {
                  const { here, start } = pullOptions(x, step, p)
                  const isOpen = expanded === x.id
                  return (
                    <article key={x.id} className="inspo-card">
                      <button className="inspo-card-head" onClick={() => setExpanded(isOpen ? null : x.id)}>
                        <strong className="inspo-text">{x.text || x.voice?.transcript || '（無文字）'}</strong>
                        <span className="small muted">{new Date(x.createdAt).toLocaleDateString('zh-TW')} · {x.tags.map((t) => TAG_ZH[t]).join('、') || '未分類'}{x.used.length ? ` · 已用 ${x.used.length} 次` : ''}</span>
                        {x.note && <span className="small">{x.note}</span>}
                      </button>
                      <div className="inspo-attached">
                        {x.voice && <button className="chip" onClick={() => void playAsset(x.voice!.assetId)}>▶ 語音</button>}
                        {x.hum && x.hum.notes.length > 0 && <button className="chip" onClick={() => playHumNotes(x.hum!)}>▶ 哼唱 {x.hum.notes.length} 音</button>}
                        {x.images.map((im) => <Thumb key={im.assetId} id={im.assetId} />)}
                      </div>
                      <div className="inspo-actions">
                        <button className="btn btn-primary" onClick={() => pull(x, start)}>{start.label}</button>
                        {here.slice(0, isOpen ? 99 : 2).map((o) => <button key={o.how + o.label} className="btn" onClick={() => pull(x, o)}>{o.label}</button>)}
                        {here.length > 2 && <button className="btn btn-ghost small" onClick={() => setExpanded(isOpen ? null : x.id)}>{isOpen ? '收起' : `更多（${here.length - 2}）`}</button>}
                        {isOpen && x.id !== 'seed-fuzui-qianxing' && <button className="btn btn-ghost small" onClick={() => { if (confirm('刪除這則靈感？')) api.remove(x.id) }}>刪除</button>}
                      </div>
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
