import { speakLyrics } from '../lib/lyricsAudio'
import { KIND_ZH, analyzeSection, lyricLines } from '../rules/lyrics'
import { useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why } from '../components/ui'
import { RHYME_GROUPS, cleanLine, lastChar, rhymeOf } from '../lib/rhyme'
import { uid, type LyricSection, type Project, type SectionKind } from '../lib/store'
import type { StepProps } from './types'
import { lyricsRequirements } from '../rules/requirements'

const LYRIC_KINDS: SectionKind[] = ['verse', 'pre', 'chorus', 'bridge']

const melodyOnsets = (p: Project, part: 'verse' | 'chorus') => p.melody[part].filter((m) => m != null && m >= 0).length



function LyricsStep({ p, update, notify, next }: StepProps) {
  const secs = p.lyrics
  const setSec = (id: string, patch: Partial<LyricSection>) => update('lyrics', secs.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const add = (kind: SectionKind) => { const id = uid(); update('lyrics', [...secs, { id, kind, text: '' }]); setCurId(id) }
  // 寫歌的人改掉最早那句話很正常，所以這只是問一句，不擋前進
  const hook = cleanLine(p.idea.hook)
  const chorus = secs.find((s) => s.kind === 'chorus' && lyricLines(s.text).length >= 2) ?? secs.find((s) => s.kind === 'chorus')
  const hookDrifted = !!hook && secs.some((s) => s.kind === 'verse' && lyricLines(s.text).length >= 2) && secs.some((s) => s.kind === 'chorus' && lyricLines(s.text).length >= 2) && !secs.some((s) => s.kind === 'chorus' && cleanLine(s.text).includes(hook))
  const keepHook = () => { if (chorus) setSec(chorus.id, { text: `${chorus.text.replace(/\s+$/, '')}\n${p.idea.hook.trim()}` }) }
  const changeMind = () => { const first = chorus ? lyricLines(chorus.text)[0] : undefined; if (first) update('idea', { ...p.idea, hook: cleanLine(first) }) }
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
  const ready = lyricsRequirements(p).every((r) => r.ok)
  const say = hookDrifted ? `最早那句「${p.idea.hook.trim()}」還要留嗎？不急，也可以先往下走。` : !cur ? '' : !cur.text.trim()
    ? cur.kind === 'chorus' ? `副歌。把「${p.idea.hook || '你的一句話'}」放進來。${target ? `大約 ${target} 個字。` : ''}` : `${KIND_ZH[cur.kind]}。先寫你看到的畫面。${target ? `大約 ${target} 個字。` : ''}`
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
                    {r && <span className={`rhyme-tag rh-${r.idx}`}>{r.group}</span>}
                  </>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {hookDrifted && (
        <div className="hook-ask" role="group" aria-label="最早那句還要留嗎">
          <p>最早那句「{p.idea.hook.trim()}」還要留嗎？</p>
          <div className="row wrap">
            <button className="btn small" onClick={keepHook}>放進副歌</button>
            <button className="btn btn-ghost small" onClick={changeMind}>我改主意了</button>
          </div>
        </div>
      )}

      {ready && next ? (
        <DeskActions primary={{ label: <>詞有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽詞配旋律', onClick: () => speakLyrics(p, cur?.id) }} />
      ) : cur && lyricLines(cur.text).length >= 2 ? (
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
        <Why ready={secs.some((s) => lyricLines(s.text).length >= 2)} title="右邊的數字和顏色是什麼？">
          <p>數字是字數，色塊幫你看句尾有沒有押韻。兩句字數接近時，可以試著唱同一段旋律；不一樣也沒關係，唱唱看順不順。字調聽起來變了，叫做「倒字」。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export default LyricsStep

