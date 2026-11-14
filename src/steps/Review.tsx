import { useEffect, useRef, useState } from 'react'
import { Card, Coach, DeskActions, FeedbackList, Light, Toolbox, Why, type Feedback, type Level } from '../components/ui'
import { SongSheet } from '../components/SongSheet'
import { AbletonGuide } from '../components/AbletonGuide'
import { afterSound, playSequence, stopAll, type Player } from '../lib/audio'
import { useMidiLab } from '../lib/lab'
import type { Project } from '../lib/store'
import { downloadMidi } from '../lib/midi'
import { diatonicChords, keyName } from '../lib/theory'
import { analyzeSection, KIND_ZH } from './Lyrics'
import { progressionFeedback } from './Harmony'
import { melodyFeedback } from './Melody'
import { arrangementFeedback } from './Arrangement'
import { renderSong, songSpecs } from './songFile'
import { playHum } from './results'
import { safeFileName, shareOrDownload } from '../lib/share'
import { downloadBackup } from '../lib/backup'
import { mixFeedback } from './Mix'
import type { StepDef, StepProps } from './types'

const DIMENSIONS: { id: string; q: string; source: (p: Project) => Feedback[] }[] = [
  { id: 'story', q: '歌詞有讓我看見畫面嗎？', source: (p) => p.lyrics.flatMap((s) => analyzeSection(s, p.idea.hook).fb) },
  { id: 'hook', q: '副歌那句會卡在腦中嗎？', source: (p) => p.lyrics.filter((s) => s.kind === 'chorus').flatMap((s) => analyzeSection(s, p.idea.hook).fb.slice(-2)) },
  { id: 'harmony', q: '和弦有支撐住情緒嗎？', source: (p) => [...progressionFeedback(p.harmony.verse, p.harmony.mode, '主歌'), ...progressionFeedback(p.harmony.chorus, p.harmony.mode, '副歌')] },
  { id: 'melody', q: '旋律唱起來順嗎？有哪段留在心裡？', source: (p) => [...melodyFeedback(p, 'verse'), ...melodyFeedback(p, 'chorus')] },
  { id: 'arc', q: '整首歌的起伏，是你喜歡的樣子嗎？', source: arrangementFeedback },
  { id: 'mix', q: '每個聲音都聽得清楚嗎？', source: (p) => mixFeedback(p, null) },
  { id: 'me', q: '這首歌像「我」嗎？我想再聽一次嗎？', source: () => [] },
]

const FINAL_CHECKS = [
  { id: 'sing', label: '跟著伴奏唱一遍', why: '聽聽有沒有哪個字卡住，或哪裡想換口氣。' },
  { id: 'tone', label: '聽聽字和旋律合不合', why: '如果有字聽起來不太清楚，可以換個唱法試試。' },
  { id: 'sleep', label: '明天再聽一次', why: '歇一晚，說不定會聽見新的地方。' },
  { id: 'friend', label: '放給朋友聽，問問「你記得哪一句？」', why: '聽聽別人帶走了哪一句，也挺有趣。' },
  { id: 'demo', label: '用手機錄一版', why: '留住現在的樣子，以後想比較時就能拿出來聽。' },
  { id: 'three', label: '記下想再試的地方', why: '一個也好，三個也好，留給下次慢慢玩。' },
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
    `一句話：${p.idea.hook}`,
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
  const lab = useMidiLab()
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
  const [humPlaying, setHumPlaying] = useState(false)
  const [listened, setListened] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveNote, setSaveNote] = useState('')
  const playerRef = useRef<Player | null>(null)
  const stopSong = () => { stopAll(); playerRef.current?.stop(); setPlaying(-1); setHumPlaying(false) }
  useEffect(() => () => { playerRef.current?.stop() }, [])
  const playSong = () => {
    playerRef.current?.stop()
    setHumPlaying(false)
    playerRef.current = playSequence(songSpecs(p), setPlaying, () => { setPlaying(-1); setListened(true); notify('review.play','') })
  }
  // 整趟旅程最有感的一刻：先聽你一開始哼的，再聽現在長成的樣子
  const playHumThenSong = () => {
    if (!p.hum) return playSong()
    stopAll()
    setHumPlaying(true)
    playHum(p)
    const last = p.hum.notes[p.hum.notes.length - 1]
    afterSound(playSong, ((last ? last.start + last.dur : 1) + 0.9) * 1000)
  }
  const saveSong = async () => {
    setSaving(true); setSaveNote('')
    try {
      const { wav } = await renderSong(p)
      const name = safeFileName(p.idea.title, '我的第一首歌')
      const result = await shareOrDownload(new File([wav], `${name}.wav`, { type: 'audio/wav' }), name)
      setSaveNote(result === 'shared' ? '送出去了。' : result === 'downloaded' ? '存好了，在手機的下載資料夾裡。用一般的播放器就能播，也能傳給朋友聽。' : '')
    } catch { setSaveNote('這次沒錄成，再按一次試試。') }
    finally { setSaving(false) }
  }

  const rate = (id: string, v: number) => update('review', { ...r, ratings: { ...r.ratings, [id]: v } })

  return (
    <>
      <Coach short={!hasScore ? '歌還是一張空白紙。先挑幾個和弦，或去旋律檯寫幾個音。' : playing >= 0 ? `正在播：${KIND_ZH[p.arrangement[playing]?.kind ?? (playing === 0 ? 'verse' : 'chorus')]}` : r.verdict.trim() ? '寫下來了。這是你的歌。' : '一起從頭聽聽。哪一句你最想再聽？'} />

      <SongSheet p={p} />
      {missing.length > 0 && <p className="demo-missing small muted">草稿還缺：{missing.map(item=>item.label).join('、')}。{hasScore ? '可以先聽已有的部分。' : '先留下一點聲音。'}</p>}

      <textarea aria-label="我對這首歌的想法" className="one-line" rows={3} value={r.verdict} placeholder="哪裡讓你想再聽一次？想留什麼給下次？" onChange={(e) => update('review', { ...r, verdict: e.target.value })} />

      {!hasScore ? (
        <DeskActions primary={{label:'先去挑幾個和弦',onClick:()=>goTo?.('harmony')}} />
      ) : playing >= 0 || humPlaying ? (
        <DeskActions primary={{ label: '■ 停', onClick: stopSong }} />
      ) : listened ? (
        <DeskActions primary={{ label: saving ? '正在把歌錄成聲音檔……' : '把歌存成聲音檔', onClick: saveSong, disabled: saving }} secondary={{ label: '再聽一遍', onClick: playSong }} />
      ) : (
        <DeskActions primary={{ label: '▶ 從頭聽我的歌', onClick: playSong }} secondary={missing.length ? { label: `去補${missing[0].label} →`, onClick: () => goTo?.(missing[0].step) } : p.hum ? { label: '先聽你一開始哼的，再聽現在的', onClick: playHumThenSong } : { label: '下載 MIDI，帶進 REAPER', onClick: () => downloadMidi(p) }} />
      )}
      {saveNote && <p className="demo-missing small muted" role="status">{saveNote}</p>}

      <Toolbox>
      <Card title="聽完覺得呢？（1 想再試試，5 很喜歡）">
        {DIMENSIONS.map((d) => {
          const items = d.source(p)
          const lvl = summarize(items)
          const tips = items.filter((f) => f.level !== 'good').slice(0, 2)
          return (
            <div key={d.id} className="dim">
              <div className="row between">
                <strong>{d.q}</strong>
                {lvl && <span className="row small muted"><Light level={lvl} />夥伴的小發現</span>}
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

      <Card title="再聽聽這些地方">
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

      <Card title="把歌帶走">
        <div className="row wrap">
          <button className="btn" disabled={!hasScore || saving} onClick={saveSong}>存成聲音檔（.wav）</button>
          <button className="btn" onClick={() => exportText(p)}>下載歌詞＋和弦表（.txt）</button>
          <button className="btn" disabled={!hasScore} onClick={() => downloadMidi(p)}>下載 MIDI（帶進 REAPER）</button>
          <button className="btn btn-ghost" onClick={() => downloadBackup(p)}>備份這首歌（.json）</button>
        </div>
      </Card>

      {lab && <AbletonGuide p={p} />}

      <Why title="為什麼留一點自己的想法？" apply="下次回來聽，也能想起當時喜歡哪裡。">
        <p>小提示可以陪你找找不同的地方；喜不喜歡，還是交給你的耳朵。先記下一處你想再聽的地方就好。</p>
      </Why>
      </Toolbox>
    </>
  )
}

export const reviewStep: StepDef = {
  key: 'review',
  title: '總檢討',
  subtitle: '聽聽這首歌現在的樣子',
  glyph: '成',
  Component: ReviewStep,
  requirements: (p) => [
    { label: '記下你聽完的想法', ok: p.review.verdict.trim().length >= 4 },
  ],
}
