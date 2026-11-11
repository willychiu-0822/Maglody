import { speakLyrics } from '../lib/lyricsAudio'
import { useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { ABSTRACT_WORDS, CONCRETE_HINTS, RHYME_GROUPS, cleanLine, countHits, lastChar, rhymeOf } from '../lib/rhyme'
import { uid, type LyricSection, type Project, type SectionKind } from '../lib/store'
import type { StepDef, StepProps } from './types'

export const KIND_ZH: Record<SectionKind, string> = { intro: '前奏', verse: '主歌', pre: '導歌', chorus: '副歌', bridge: '橋段', inter: '間奏', outro: '尾奏' }
const LYRIC_KINDS: SectionKind[] = ['verse', 'pre', 'chorus', 'bridge']

const melodyOnsets = (p: Project, part: 'verse' | 'chorus') => p.melody[part].filter((m) => m != null && m >= 0).length

const lines = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean)

export function analyzeSection(s: LyricSection, hook: string) {
  const ls = lines(s.text)
  const lens = ls.map((l) => cleanLine(l).length)
  const ends = ls.map((l) => rhymeOf(lastChar(l)))
  const fb: Feedback[] = []
  if (ls.length < 2) return { ls, lens, ends, fb }
  // 1. 字數對稱
  const pairs = Math.floor(ls.length / 2)
  let sym = 0
  for (let i = 0; i < pairs; i++) if (Math.abs(lens[2 * i] - lens[2 * i + 1]) <= 2) sym++
  const symR = pairs ? sym / pairs : 1
  fb.push(symR >= 0.75 ? { level: 'good', text: '這幾句字數接近，可以試著用同一段旋律唱唱看。' } : symR >= 0.5 ? { level: 'warn', text: '有些上下句字數差很多。', tip: '想用同一段旋律的話，可以試著調整字數，再唱唱看。' } : { level: 'bad', text: '這幾句長短不太一樣。', tip: '可以試試不同的唱法，或調整句子的長度。' })
  // 2. 押韻
  const known = ends.filter(Boolean)
  const counts = new Map<number, number>()
  known.forEach((e) => counts.set(e!.idx, (counts.get(e!.idx) ?? 0) + 1))
  const top = Math.max(0, ...counts.values())
  const rr = ls.length ? top / ls.length : 0
  const target = s.kind === 'chorus' ? 0.5 : 0.4
  fb.push(rr >= target ? { level: 'good', text: `${top}/${ls.length} 句押同一個韻，聽起來有「收」的感覺。` } : known.length < ls.length / 2 ? { level: 'warn', text: '有幾個句尾字，我還認不出它們的韻。', tip: '大聲唸句尾字，聽韻母（a、ang、i…）是不是一樣。' } : { level: 'warn', text: '這幾句的句尾聽起來不太一樣。', tip: '想試試押韻的話，可以挑幾句換個相近的句尾。' })
  // 3. 具體 vs 抽象
  const abs = countHits(s.text, ABSTRACT_WORDS)
  const con = countHits(s.text, CONCRETE_HINTS)
  if (s.kind === 'verse') fb.push(con >= abs ? { level: 'good', text: '唸唸這段，看看有沒有你想留下的畫面。' } : { level: 'warn', text: `主歌抽象詞較多（${abs}）。`, tip: '想讓畫面更清楚的話，可以加一個當時的細節。' })
  // 4. 副歌包含 hook
  if (s.kind === 'chorus') {
    const h = cleanLine(hook)
    const has = h && cleanLine(s.text).includes(h)
    fb.push(has ? { level: 'good', text: '副歌包含你的記憶點。' } : { level: 'bad', text: '副歌裡找不到記憶點那一句。', tip: `想繼續往下一頁，可以先把「${hook || '你那句話'}」放進副歌。` })
  }
  // 5. 句長
  const long = lens.filter((n) => n > 14).length
  if (long) fb.push({ level: 'warn', text: `${long} 句超過 14 個字。`, tip: '唱唱看哪裡想換氣；也可以把句子分開。' })
  return { ls, lens, ends, fb }
}

function LyricsStep({ p, update, notify, next }: StepProps) {
  const secs = p.lyrics
  const setSec = (id: string, patch: Partial<LyricSection>) => update('lyrics', secs.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const add = (kind: SectionKind) => { const id = uid(); update('lyrics', [...secs, { id, kind, text: '' }]); setCurId(id) }
  const remove = (id: string) => update('lyrics', secs.filter((s) => s.id !== id))
  const move = (i: number, d: number) => {
    const n = [...secs]
    const j = i + d
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    update('lyrics', n)
  }

  const [curId, setCurId] = useState<string | null>(null)
  const cur = secs.find((s) => s.id === curId) ?? secs[0]
  const ci = cur ? secs.indexOf(cur) : -1
  const a = cur ? analyzeSection(cur, p.idea.hook) : null
  const target = cur ? melodyOnsets(p, cur.kind === 'chorus' ? 'chorus' : 'verse') : 0
  const ready = lyricsStep.requirements(p).every((r) => r.ok)
  const missingHook = !!p.idea.hook.trim() && secs.some(s => s.kind === 'chorus' && lines(s.text).length >= 2) && !lyricsStep.requirements(p)[2].ok
  const say = missingHook ? `副歌再放進「${p.idea.hook}」，就能繼續。` : !cur ? '' : !cur.text.trim()
    ? cur.kind === 'chorus' ? `副歌。把「${p.idea.hook || '你那句話'}」放進來。${target ? `大約 ${target} 個字。` : ''}` : `${KIND_ZH[cur.kind]}。先寫你看到的畫面。${target ? `大約 ${target} 個字。` : ''}`
    : '寫下來就好，之後還能改。'
  return (
    <>
      <Coach short={say} />

      {secs.length > 1 && (
        <div className="seg seg-quiet">
          {secs.map((s) => <button key={s.id} className={s.id === cur?.id ? 'on' : ''} onClick={() => setCurId(s.id)}>{KIND_ZH[s.kind]}</button>)}
        </div>
      )}

      {cur && (
        <div className={`lyric-wrap paper ${!cur.text.trim() ? 'nudge' : ''}`}>
          <textarea
            className="lyric-input" aria-label={`${KIND_ZH[cur.kind]}歌詞`}
            rows={Math.max(4, cur.text.split('\n').length + 1)}
            value={cur.text}
            placeholder="一行一句……"
            onChange={(e) => { setSec(cur.id, { text: e.target.value }); notify('lyrics.edit', cur.kind) }}
          />
          <div className="lyric-meta">
            {cur.text.split('\n').map((raw, j) => {
              const n = cleanLine(raw).length
              const r = rhymeOf(lastChar(raw))
              return (
                <div key={j} className="lyric-meta-row">
                  {n > 0 && <>
                    <span className={`count ${n > 14 ? 'over' : ''}`}>{n}</span>
                    <span className={`rhyme-tag ${r ? `rh-${r.idx}` : 'rh-none'}`}>{r?.group ?? '?'}</span>
                  </>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {ready && next ? (
        <DeskActions primary={{ label: <>詞有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽詞配旋律', onClick: () => speakLyrics(p, cur?.id) }} />
      ) : cur && lines(cur.text).length >= 2 ? (
        <DeskActions primary={{ label: '▶ 聽詞配旋律', onClick: () => speakLyrics(p, cur?.id) }}
          secondary={cur.kind === 'verse' && !secs.some((s) => s.kind === 'chorus' && s.text.trim()) ? { label: '換副歌 →', onClick: () => setCurId(secs.find((s) => s.kind === 'chorus')?.id ?? null) } : undefined} />
      ) : <DeskActions primary={{ label: cur?.text.trim() ? '繼續寫下一句' : '先寫眼前的一個畫面', onClick: () => { if (!cur) add('verse'); else document.querySelector<HTMLTextAreaElement>('.lyric-input')?.focus() } }} />}

      <Toolbox>
        {cur && (
          <div className="row wrap">
            <select value={cur.kind} onChange={(e) => setSec(cur.id, { kind: e.target.value as SectionKind })}>
              {LYRIC_KINDS.map((k) => <option key={k} value={k}>{KIND_ZH[k]}</option>)}
            </select>
            <button className="btn small" onClick={() => move(ci, -1)}>往前</button>
            <button className="btn small" onClick={() => move(ci, 1)}>往後</button>
            {secs.length > 1 && <button className="btn small" onClick={() => { remove(cur.id); setCurId(null) }}>刪掉這段</button>}
          </div>
        )}
        <div className="row wrap">
          {LYRIC_KINDS.map((k) => <button key={k} className="btn small" onClick={() => { add(k) }}>＋ {KIND_ZH[k]}</button>)}
        </div>
        {a && <FeedbackList items={a.fb} empty="寫兩句以上，這裡會有幾句觀察。" />}
        <details className="templates">
          <summary>找押韻的字</summary>
          <div className="rhyme-table">
            {RHYME_GROUPS.map((g, i) => (
              <div key={g.group} className="rhyme-row">
                <span className={`rhyme-tag rh-${i}`}>{g.group}</span>
                <span className="muted small">{g.sound}</span>
                <span className="small">{g.sample}</span>
              </div>
            ))}
          </div>
        </details>
        <Why ready={secs.some((s) => lines(s.text).length >= 2)} title="右邊的數字和顏色是什麼？">
          <p>數字是字數，色塊幫你看句尾有沒有押韻。兩句字數接近時，可以試著唱同一段旋律；不一樣也沒關係，唱唱看順不順。字調聽起來變了，叫做「倒字」。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const lyricsStep: StepDef = {
  key: 'lyrics',
  title: '歌詞',
  subtitle: '用你的話，把心裡的畫面唱出來',
  glyph: '詞',
  Component: LyricsStep,
  requirements: (p) => [
    { label: '至少一段主歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'verse' && lines(s.text).length >= 2) },
    { label: '至少一段副歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'chorus' && lines(s.text).length >= 2) },
    { label: '把那句話放進副歌', ok: !cleanLine(p.idea.hook) || p.lyrics.some((s) => s.kind === 'chorus' && !!cleanLine(p.idea.hook) && cleanLine(s.text).includes(cleanLine(p.idea.hook))) },
  ],
}

export { lines as lyricLines }
