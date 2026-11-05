import { useRef, useState } from 'react'
import { Card, Coach, FeedbackList, Light, Why, type Feedback, type Level } from '../components/ui'
import { SongSheet } from '../components/SongSheet'
import { playLoop, type Player } from '../lib/audio'
import type { Project } from '../lib/store'
import { downloadMidi } from '../lib/midi'
import { diatonicChords, keyName } from '../lib/theory'
import { analyzeSection, KIND_ZH } from './Lyrics'
import { progressionFeedback } from './Harmony'
import { melodyFeedback } from './Melody'
import { arrangementFeedback, sectionAudio } from './Arrangement'
import { mixFeedback } from './Mix'
import type { StepDef, StepProps } from './types'

const DIMENSIONS: { id: string; q: string; source: (p: Project) => Feedback[] }[] = [
  { id: 'story', q: '歌詞有讓我看見畫面嗎？', source: (p) => p.lyrics.flatMap((s) => analyzeSection(s, p.idea.hook).fb) },
  { id: 'hook', q: '副歌那句會卡在腦中嗎？', source: (p) => p.lyrics.filter((s) => s.kind === 'chorus').flatMap((s) => analyzeSection(s, p.idea.hook).fb.slice(-2)) },
  { id: 'harmony', q: '和弦有支撐住情緒嗎？', source: (p) => [...progressionFeedback(p.harmony.verse, p.harmony.mode, '主歌'), ...progressionFeedback(p.harmony.chorus, p.harmony.mode, '副歌')] },
  { id: 'melody', q: '旋律好唱又好記嗎？', source: (p) => [...melodyFeedback(p, 'verse'), ...melodyFeedback(p, 'chorus')] },
  { id: 'arc', q: '整首歌有起伏、有高潮嗎？', source: arrangementFeedback },
  { id: 'mix', q: '每個聲音都聽得清楚嗎？', source: (p) => mixFeedback(p, null) },
  { id: 'me', q: '這首歌像「我」嗎？我想再聽一次嗎？', source: () => [] },
]

const FINAL_CHECKS = [
  { id: 'sing', label: '跟著伴奏從頭到尾大聲唱一遍', why: '紙上寫得再好，唱出來才知道哪個字卡、哪裡換不了氣。' },
  { id: 'tone', label: '檢查倒字：每個字的聲調跟旋律走向不衝突', why: '中文是聲調語言，倒字會讓聽眾聽錯詞。' },
  { id: 'sleep', label: '隔一天再聽一次', why: '剛寫完時大腦會自動美化。新鮮的耳朵最誠實。' },
  { id: 'friend', label: '給一個朋友聽，只問「哪一句你記得？」', why: '對方記得的，就是你真正的 Hook。' },
  { id: 'demo', label: '用手機錄下一版 Demo', why: '有錄音才有作品，也才能比較下一版有沒有更好。' },
  { id: 'three', label: '寫下下一版要改的 3 件事', why: '好歌是改出來的，不是一次寫出來的。' },
]

function summarize(items: Feedback[]): Level | null {
  if (!items.length) return null
  if (items.some((f) => f.level === 'bad')) return 'bad'
  const g = items.filter((f) => f.level === 'good').length / items.length
  return g >= 0.7 ? 'good' : 'warn'
}

function exportText(p: Project) {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = (d: (number | null)[]) => d.map((x) => (x == null ? '?' : chords[x].name)).join(' | ')
  const out = [
    `《${p.idea.title || '未命名'}》`,
    `調：${keyName(p.harmony.root, p.harmony.mode)}　速度：${p.idea.bpm} BPM`,
    `記憶點：${p.idea.hook}`,
    '',
    `主歌和弦：| ${prog(p.harmony.verse)} |`,
    `副歌和弦：| ${prog(p.harmony.chorus)} |`,
    '',
    `結構：${p.arrangement.map((s) => `${KIND_ZH[s.kind]}(${s.bars})`).join(' → ')}`,
    '',
    ...p.lyrics.flatMap((s) => [`【${KIND_ZH[s.kind]}】`, s.text.trim(), '']),
    '— 我的評語 —',
    p.review.verdict,
  ].join('\n')
  download(`${p.idea.title || 'my-song'}.txt`, out, 'text/plain')
}

function download(name: string, content: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function ReviewStep({ p, update, notify }: StepProps) {
  const r = p.review
  const [playing, setPlaying] = useState<number>(-1)
  const playerRef = useRef<Player | null>(null)
  const stopFlag = useRef(false)

  const playSong = (i = 0) => {
    if (i === 0) stopFlag.current = false
    if (stopFlag.current || i >= p.arrangement.length) { setPlaying(-1); if (i > 0 && !stopFlag.current) notify('review.play', ''); return }
    const s = p.arrangement[i]
    const { bars, melody } = sectionAudio(p, s.kind)
    const reps = Math.max(1, Math.round(s.bars / 4))
    const allBars = Array.from({ length: reps }, () => bars).flat().slice(0, Math.max(s.bars, 1))
    const mel = melody ? Array.from({ length: reps }, () => melody).flat() : undefined
    setPlaying(i)
    playerRef.current = playLoop({ bpm: p.idea.bpm, bars: allBars, melody: mel, layers: s.layers, onStep: (x) => { if (x < 0 && !stopFlag.current) playSong(i + 1) } })
  }
  const stopSong = () => { stopFlag.current = true; playerRef.current?.stop(); setPlaying(-1) }

  const rate = (id: string, v: number) => update('review', { ...r, ratings: { ...r.ratings, [id]: v } })

  return (
    <>
      <Coach title="老師最後的話" short="從頭聽一次你的歌。這次換你當老師。">
        你從一段哼唱走到這裡，已經完成了一首歌的骨架。我不會替你打分數——<strong>好不好，由你判斷</strong>。
        但我會把一路上的觀察攤開給你看，你再一題一題誠實地評分自己。評分低的地方，就是下一版要改的地方。
      </Coach>

      <Card title="完整試聽">
        <div className="row wrap">
          {playing < 0 ? <button className="btn btn-primary" onClick={() => playSong(0)} disabled={!p.arrangement.length}>▶ 從頭播放整首</button> : <button className="btn btn-danger" onClick={stopSong}>■ 停止</button>}
          {playing >= 0 && <span className="muted">正在播放：{KIND_ZH[p.arrangement[playing].kind]}（{playing + 1}/{p.arrangement.length}）</span>}
        </div>
        <SongSheet p={p} />
      </Card>

      <Card title="自我評量（1 = 還不行，5 = 我很滿意）">
        {DIMENSIONS.map((d) => {
          const items = d.source(p)
          const lvl = summarize(items)
          const tips = items.filter((f) => f.level !== 'good').slice(0, 2)
          return (
            <div key={d.id} className="dim">
              <div className="row between">
                <strong>{d.q}</strong>
                {lvl && <span className="row small muted"><Light level={lvl} />老師觀察</span>}
              </div>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} className={`star ${(r.ratings[d.id] ?? 0) >= v ? 'on' : ''}`} onClick={() => rate(d.id, v)} aria-label={`${v} 分`}>{v}</button>
                ))}
              </div>
              {tips.length > 0 && <FeedbackList items={tips} />}
            </div>
          )
        })}
      </Card>

      <Card title="完成前的最後檢查">
        <ul className="checklist">
          {FINAL_CHECKS.map((c) => (
            <li key={c.id}>
              <label>
                <input type="checkbox" checked={!!r.checks[c.id]} onChange={(e) => update('review', { ...r, checks: { ...r.checks, [c.id]: e.target.checked } })} />
                <span>{c.label}<span className="muted small block">{c.why}</span></span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="你的判斷">
        <label className="field">
          <span>這首歌好嗎？最滿意哪裡？下一版要改哪 3 件事？</span>
          <textarea rows={5} value={r.verdict} onChange={(e) => update('review', { ...r, verdict: e.target.value })} />
        </label>
        <div className="row wrap">
          <button className="btn" onClick={() => exportText(p)}>下載歌詞＋和弦表（.txt）</button>
          <button className="btn" onClick={() => downloadMidi(p)}>下載 MIDI（帶進 REAPER）</button>
          <button className="btn btn-ghost" onClick={() => download('music-lab-project.json', JSON.stringify(p, null, 2), 'application/json')}>備份專案（.json）</button>
        </div>
      </Card>

      <Why title="為什麼要自己評分，而不是讓電腦評分？" apply="任何創作、報告、作品集，都需要先建立自己的判斷標準。">
        <p>電腦只能檢查「規則」：有沒有押韻、強拍是不是和弦音。但一首歌會不會打動人，取決於它有沒有說出你真正想說的話。規則是起點，不是終點——很多名曲故意打破規則。</p>
        <p>學會評價自己的作品，才是從學生變成創作者的那一步。</p>
      </Why>
    </>
  )
}

export const reviewStep: StepDef = {
  key: 'review',
  title: '總檢討',
  subtitle: '由你判斷這首歌好不好',
  glyph: '成',
  Component: ReviewStep,
  requirements: (p) => [
    { label: '7 個面向都自評', ok: DIMENSIONS.every((d) => p.review.ratings[d.id]) },
    { label: '最後檢查至少完成 4 項', ok: FINAL_CHECKS.filter((c) => p.review.checks[c.id]).length >= 4 },
    { label: '寫下你的判斷（20 字以上）', ok: p.review.verdict.trim().length >= 20 },
  ],
}
