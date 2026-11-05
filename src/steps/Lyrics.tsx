import { useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { ABSTRACT_WORDS, CONCRETE_HINTS, RHYME_GROUPS, cleanLine, countHits, lastChar, rhymeOf } from '../lib/rhyme'
import { uid, type LyricSection, type Project, type SectionKind } from '../lib/store'
import type { StepDef, StepProps } from './types'

export const KIND_ZH: Record<SectionKind, string> = { intro: '前奏', verse: '主歌', pre: '導歌', chorus: '副歌', bridge: '橋段', inter: '間奏', outro: '尾奏' }
const LYRIC_KINDS: SectionKind[] = ['verse', 'pre', 'chorus', 'bridge']

const melodyOnsets = (p: Project, part: 'verse' | 'chorus') => p.melody[part].filter((m) => m != null && m >= 0).length
// 延遲載入避免循環引用（results → Arrangement → Lyrics）
const RESULTS_SPEAK = (p: Project) => { void import('./results').then((m) => m.RESULTS.lyrics.play(p)) }

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
  fb.push(symR >= 0.75 ? { level: 'good', text: '上下句字數接近，旋律可以重複使用，好唱好記。' } : symR >= 0.5 ? { level: 'warn', text: '有些上下句字數差很多。', tip: '同一段裡第 1、2 句字數接近（相差 2 字以內），旋律才能「對稱」。' } : { level: 'bad', text: '句子長短不一，旋律會很難套。', tip: '先數字數，讓成對的句子長度接近。' })
  // 2. 押韻
  const known = ends.filter(Boolean)
  const counts = new Map<number, number>()
  known.forEach((e) => counts.set(e!.idx, (counts.get(e!.idx) ?? 0) + 1))
  const top = Math.max(0, ...counts.values())
  const rr = ls.length ? top / ls.length : 0
  const target = s.kind === 'chorus' ? 0.5 : 0.4
  fb.push(rr >= target ? { level: 'good', text: `${top}/${ls.length} 句押同一個韻，聽起來有「收」的感覺。` } : known.length < ls.length / 2 ? { level: 'warn', text: '有幾個句尾字不在老師的韻表裡。', tip: '大聲唸句尾字，聽韻母（a、ang、i…）是不是一樣。' } : { level: 'warn', text: '押韻偏少。', tip: s.kind === 'chorus' ? '副歌最好每句或隔句押韻，讓人一聽就記住。' : '主歌可以隔句押韻，不用每句都押。' })
  // 3. 具體 vs 抽象
  const abs = countHits(s.text, ABSTRACT_WORDS)
  const con = countHits(s.text, CONCRETE_HINTS)
  if (s.kind === 'verse') fb.push(con >= abs ? { level: 'good', text: '主歌有畫面，負責「演」故事。' } : { level: 'warn', text: `主歌抽象詞較多（${abs}）。`, tip: '主歌負責交代場景和細節，情緒的結論留給副歌。' })
  // 4. 副歌包含 hook
  if (s.kind === 'chorus') {
    const h = cleanLine(hook)
    const has = h && cleanLine(s.text).includes(h)
    fb.push(has ? { level: 'good', text: '副歌包含你的記憶點。' } : { level: 'bad', text: '副歌裡找不到記憶點那一句。', tip: `把「${hook || '你的 Hook'}」放進副歌第一句或最後一句（或兩者）。` })
  }
  // 5. 句長
  const long = lens.filter((n) => n > 14).length
  if (long) fb.push({ level: 'warn', text: `${long} 句超過 14 個字。`, tip: '太長的句子唱的時候換不了氣，試著從中間切成兩句。' })
  return { ls, lens, ends, fb }
}

function LyricsStep({ p, update, notify, next }: StepProps) {
  const secs = p.lyrics
  const setSec = (id: string, patch: Partial<LyricSection>) => update('lyrics', secs.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const add = (kind: SectionKind) => update('lyrics', [...secs, { id: uid(), kind, text: '' }])
  const remove = (id: string) => update('lyrics', secs.filter((s) => s.id !== id))
  const move = (i: number, d: number) => {
    const n = [...secs]
    const j = i + d
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    update('lyrics', n)
  }

  const [curId, setCurId] = useState<string | null>(null)
  const cur = secs.find((s) => s.id === curId) ?? secs.find((s) => s.kind === 'chorus' && !s.text.trim() && secs.some((x) => x.kind === 'verse' && lines(x.text).length >= 2)) ?? secs[0]
  const ci = cur ? secs.indexOf(cur) : -1
  const a = cur ? analyzeSection(cur, p.idea.hook) : null
  const target = cur ? melodyOnsets(p, cur.kind === 'chorus' ? 'chorus' : 'verse') : 0
  const ready = lyricsStep.requirements(p).every((r) => r.ok)
  const say = !cur ? '' : !cur.text.trim()
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
        <div className={`lyric-wrap paper${!cur.text.trim() ? " awaiting-touch" : ""}`}>
          <textarea
            className="lyric-input"
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
        <DeskActions primary={{ label: <>詞有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽詞配旋律', onClick: () => RESULTS_SPEAK(p) }} />
      ) : cur && lines(cur.text).length >= 2 ? (
        <DeskActions primary={{ label: '▶ 聽詞配旋律', onClick: () => RESULTS_SPEAK(p) }}
          secondary={cur.kind === 'verse' && !secs.some((s) => s.kind === 'chorus' && s.text.trim()) ? { label: '換副歌 →', onClick: () => setCurId(secs.find((s) => s.kind === 'chorus')?.id ?? null) } : undefined} />
      ) : null}

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
          <p>數字是字數，旁邊的色塊是句尾的韻。上下兩句字數差不多，旋律才能重複；同一個顏色代表押韻，聽起來會有回音。唱一遍時，注意有沒有字被旋律唱歪了，這叫「倒字」。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const lyricsStep: StepDef = {
  key: 'lyrics',
  title: '歌詞',
  subtitle: '主歌演故事，副歌說結論',
  glyph: '詞',
  Component: LyricsStep,
  requirements: (p) => [
    { label: '至少一段主歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'verse' && lines(s.text).length >= 2) },
    { label: '至少一段副歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'chorus' && lines(s.text).length >= 2) },
    { label: '副歌包含記憶點', ok: p.lyrics.some((s) => s.kind === 'chorus' && !!cleanLine(p.idea.hook) && cleanLine(s.text).includes(cleanLine(p.idea.hook))) },
  ],
}

export { lines as lyricLines }
