import { useEffect, useRef, useState } from 'react'
import { Card, Coach, DeskActions, FeedbackList, Light, Toolbox, Why, type Feedback, type Level } from '../components/ui'
import { SongSheet } from '../components/SongSheet'
import { playSequence, type Player } from '../lib/audio'
import type { Project } from '../lib/store'
import { downloadMidi } from '../lib/midi'
import { diatonicChords, keyName } from '../lib/theory'
import { analyzeSection, KIND_ZH } from './Lyrics'
import { progressionFeedback } from './Harmony'
import { melodyFeedback } from './Melody'
import { arrangementFeedback, arrangedAudio } from './Arrangement'
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

function ReviewStep({ p, update, notify, next, goTo }: StepProps) {
  void next
  const r = p.review
  const hasScore = [...p.harmony.verse, ...p.harmony.chorus].some(d=>d!=null) || [...p.melody.verse, ...p.melody.chorus].some(m=>m!=null && m>=0)
  const missing = [
    {label:'主歌和弦', step:'harmony', ok:!p.harmony.verse.includes(null)},
    {label:'副歌和弦', step:'harmony', ok:!p.harmony.chorus.includes(null)},
    {label:'主歌旋律', step:'melody', ok:p.melody.verse.some(n=>n!=null&&n>=0)},
    {label:'副歌旋律', step:'melody', ok:p.melody.chorus.some(n=>n!=null&&n>=0)},
    {label:'主歌歌詞', step:'lyrics', ok:p.lyrics.some(s=>s.kind==='verse'&&s.text.trim())},
    {label:'副歌歌詞', step:'lyrics', ok:p.lyrics.some(s=>s.kind==='chorus'&&s.text.trim())},
  ].filter(item=>!item.ok)
  const [playing, setPlaying] = useState<number>(-1)
  const playerRef = useRef<Player | null>(null)
  const stopSong = () => { playerRef.current?.stop(); setPlaying(-1) }
  useEffect(() => () => { playerRef.current?.stop() }, [])
  const playSong = () => {
    playerRef.current?.stop()
    const plan = p.arrangement.length ? p.arrangement : (['verse','chorus'] as const).map(kind => ({id:kind,kind,bars:4,layers:{drums:false,bass:true,keys:true,pad:false,melody:true}}))
    playerRef.current = playSequence(plan.map(s => ({bpm:p.idea.bpm, ...arrangedAudio(p,s), layers:s.layers})), setPlaying, () => { setPlaying(-1); notify('review.play','') })
  }

  const rate = (id: string, v: number) => update('review', { ...r, ratings: { ...r.ratings, [id]: v } })

  return (
    <>
      <Coach short={!hasScore ? '歌還是一張空白紙。先挑幾個和弦，或去旋律檯寫幾個音。' : playing >= 0 ? `正在播：${KIND_ZH[p.arrangement[playing]?.kind ?? (playing === 0 ? 'verse' : 'chorus')]}` : r.verdict.trim() ? '寫下來了。這是你的歌。' : '從頭聽一次。這次換你當老師：哪一句你最想再聽？'} />

      <SongSheet p={p} />
      {missing.length > 0 && <p className="demo-missing small muted">草稿還缺：{missing.map(item=>item.label).join('、')}。{hasScore ? '可以先聽已有的部分。' : '先留下一點聲音。'}</p>}

      <textarea aria-label="我對這首歌的想法" className="one-line" rows={3} value={r.verdict} placeholder="這首歌好嗎？最喜歡哪裡？下一版想改什麼？" onChange={(e) => update('review', { ...r, verdict: e.target.value })} />

      {!hasScore ? (
        <DeskActions primary={{label:'先去挑幾個和弦',onClick:()=>goTo?.('harmony')}} />
      ) : playing >= 0 ? (
        <DeskActions primary={{ label: '■ 停', onClick: stopSong }} />
      ) : (
        <DeskActions primary={{ label: '▶ 從頭聽我的歌', onClick: playSong }} secondary={missing.length ? { label: `去補${missing[0].label} →`, onClick: () => goTo?.(missing[0].step) } : { label: '下載 MIDI，帶進 REAPER', onClick: () => downloadMidi(p) }} />
      )}

      <Toolbox>
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

      <Card title="匯出">
        <div className="row wrap">
          <button className="btn" onClick={() => exportText(p)}>下載歌詞＋和弦表（.txt）</button>
          <button className="btn" disabled={!hasScore} onClick={() => downloadMidi(p)}>下載 MIDI（帶進 REAPER）</button>
          <button className="btn btn-ghost" onClick={() => download('music-lab-project.json', JSON.stringify(p, null, 2), 'application/json')}>備份專案（.json）</button>
        </div>
      </Card>

      <Why title="為什麼要自己評分，而不是讓電腦評分？" apply="任何創作、報告、作品集，都需要先建立自己的判斷標準。">
        <p>電腦只能檢查「規則」：有沒有押韻、強拍是不是和弦音。但一首歌會不會打動人，取決於它有沒有說出你真正想說的話。規則是起點，不是終點——很多名曲故意打破規則。</p>
        <p>學會評價自己的作品，才是從學生變成創作者的那一步。</p>
      </Why>
      </Toolbox>
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
    { label: '寫下你自己的判斷', ok: p.review.verdict.trim().length >= 4 },
  ],
}
