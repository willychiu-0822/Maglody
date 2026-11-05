import { Card, Coach, FeedbackList, Light, Why, type Feedback, type Level } from '../components/ui'
import { ABSTRACT_WORDS, CONCRETE_HINTS, RHYME_GROUPS, cleanLine, countHits, lastChar, rhymeOf } from '../lib/rhyme'
import { uid, type LyricSection, type SectionKind } from '../lib/store'
import type { StepDef, StepProps } from './types'

export const KIND_ZH: Record<SectionKind, string> = { intro: '前奏', verse: '主歌', pre: '導歌', chorus: '副歌', bridge: '橋段', inter: '間奏', outro: '尾奏' }
const LYRIC_KINDS: SectionKind[] = ['verse', 'pre', 'chorus', 'bridge']

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

function LyricsStep({ p, update }: StepProps) {
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

  return (
    <>
      <Coach>
        歌詞不是作文，是要「被唱出來」的句子。我們一段一段寫：主歌演故事、副歌說結論。
        每寫一句，右邊會即時顯示字數和韻腳顏色——同顏色代表押韻。
        {p.idea.image && <> 別忘了你的核心畫面：「{p.idea.image}」。</>}
      </Coach>

      {secs.map((s, i) => {
        const a = analyzeSection(s, p.idea.hook)
        return (
          <Card key={s.id} className="lyric-card" title={
            <div className="row between">
              <select value={s.kind} onChange={(e) => setSec(s.id, { kind: e.target.value as SectionKind })}>
                {LYRIC_KINDS.map((k) => <option key={k} value={k}>{KIND_ZH[k]}</option>)}
              </select>
              <span className="row">
                <button className="icon-btn" onClick={() => move(i, -1)} aria-label="上移">↑</button>
                <button className="icon-btn" onClick={() => move(i, 1)} aria-label="下移">↓</button>
                <button className="icon-btn" onClick={() => remove(s.id)} aria-label="刪除">✕</button>
              </span>
            </div>
          }>
            <div className="lyric-wrap">
              <textarea
                className="lyric-input"
                rows={Math.max(4, s.text.split('\n').length + 1)}
                value={s.text}
                placeholder={s.kind === 'verse' ? '一行一句。先寫場景：在哪裡、看到什麼…' : s.kind === 'chorus' ? '一行一句。放進你的記憶點，說出情緒的結論…' : '一行一句'}
                onChange={(e) => setSec(s.id, { text: e.target.value })}
              />
              <div className="lyric-meta">
                {s.text.split('\n').map((raw, j) => {
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
            <FeedbackList items={a.fb} empty="寫兩句以上，老師就會開始回饋。" />
          </Card>
        )
      })}

      <div className="row wrap">
        {LYRIC_KINDS.map((k) => <button key={k} className="btn btn-ghost" onClick={() => add(k)}>＋ {KIND_ZH[k]}</button>)}
      </div>

      <Card title="韻腳小抄（十三轍簡化版）">
        <div className="rhyme-table">
          {RHYME_GROUPS.map((g, i) => (
            <div key={g.group} className="rhyme-row">
              <span className={`rhyme-tag rh-${i}`}>{g.group}</span>
              <span className="muted small">{g.sound}</span>
              <span className="small">{g.sample}</span>
            </div>
          ))}
        </div>
      </Card>

      <Why title="為什麼主歌和副歌分工？" apply="簡報也是：先給案例和數據（主歌），再下結論（副歌）。">
        <p>主歌像電影的鏡頭，帶聽眾進入場景；副歌是情緒的爆發點和結論，會重複出現。如果主歌就把話說完，副歌就沒有力量。</p>
      </Why>
      <Why title="為什麼要押韻、要字數對稱？" apply="寫口號、對聯、Rap、廣告詞都靠押韻和節奏記憶。">
        <p>押韻讓句子有「回音」，耳朵會期待並記住它。字數對稱讓同一段旋律可以重複使用——重複是流行歌好記的秘密。</p>
        <p>中文歌常用「十三轍」分韻：只要韻母相近就算押韻，不必完全相同。</p>
      </Why>
      <Why title="華語歌詞的聲調問題" apply="填詞、翻唱改詞時都要注意。">
        <p>中文有四聲。如果旋律往下走，卻填上二聲（往上揚）的字，聽起來會像別的字（倒字）。寫完旋律後，記得回來唱一遍，聽聽有沒有字被唱歪。</p>
      </Why>
      <div className="legend small muted">
        <Light level={'good' as Level} /> 很好 <Light level="warn" /> 可以更好 <Light level="bad" /> 需要調整
      </div>
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
