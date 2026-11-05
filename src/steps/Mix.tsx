import { useEffect, useRef, useState } from 'react'
import { Card, Coach, FeedbackList, Meter, Why, type Feedback, type Level } from '../components/ui'
import { applyTrack, createMixGraph, playLoop, type MixGraph, type Player, type TrackId, type TrackSettings } from '../lib/audio'
import type { Project } from '../lib/store'
import { sectionAudio } from './Arrangement'
import type { StepDef, StepProps } from './types'

const TRACKS: { id: TrackId; name: string; role: string }[] = [
  { id: 'melody', name: '主旋律（代替人聲）', role: '主角，要清楚聽見每個字' },
  { id: 'chords', name: '和弦（鋼琴＋鋪底）', role: '舞台布景，撐住但不搶戲' },
  { id: 'bass', name: '貝斯', role: '地基，放中間' },
  { id: 'drums', name: '鼓', role: '心跳，底鼓和小鼓放中間' },
]

export function mixFeedback(p: Project, peakDb: number | null): Feedback[] {
  const t = p.mix.tracks
  const fb: Feedback[] = []
  const others = (['chords', 'bass', 'drums'] as TrackId[]).map((id) => t[id].vol)
  const loudest = Math.max(...others)
  fb.push(t.melody.vol >= loudest * 0.9 ? { level: 'good', text: '主旋律夠突出，聽眾能跟著唱。' } : { level: 'bad', text: '主旋律被伴奏蓋過了。', tip: '流行歌混音第一原則：人聲（主旋律）最清楚。把伴奏拉低，而不是一直把人聲拉高。' })
  fb.push(Math.abs(t.bass.pan) <= 0.15 ? { level: 'good', text: '貝斯在正中間，低頻穩。' } : { level: 'bad', text: '貝斯偏到一邊了。', tip: '低頻沒有方向感，偏一邊只會讓一個喇叭特別累、耳機聽起來歪。放中間。' })
  fb.push(Math.abs(t.melody.pan) <= 0.15 ? { level: 'good', text: '主旋律在中間，像歌手站在舞台中央。' } : { level: 'warn', text: '主旋律偏離中間。', tip: '主唱幾乎永遠放中間。' })
  fb.push(Math.abs(t.chords.pan) >= 0.2 ? { level: 'good', text: '和弦稍微偏一側，為主旋律讓出中間的空間。' } : { level: 'warn', text: '所有東西都擠在中間。', tip: '把和弦往左或右推一點（20–50%），聲音會變寬，主旋律也更清楚。' })
  fb.push(t.chords.hp && t.melody.hp ? { level: 'good', text: '和弦與主旋律都切掉了不需要的低頻，貝斯更乾淨。' } : { level: 'warn', text: '還有軌道沒有切低頻。', tip: '打開「低頻切除」：鋼琴和人聲的超低頻沒什麼用，卻會和貝斯混成一團（混濁）。' })
  if (t.bass.hp) fb.push({ level: 'warn', text: '貝斯也開了低頻切除。', tip: '貝斯的低頻是它的工作，通常只切 40Hz 以下的極低頻（這裡已經做了），影響不大，但注意聽聽是否變薄。' })
  if (peakDb != null) fb.push(peakDb > -1 ? { level: 'bad', text: `總輸出峰值 ${peakDb.toFixed(0)} dB，接近破音。`, tip: '每軌都往下拉一點，而不是把總音量推到底。' } : { level: 'good', text: `總輸出峰值 ${peakDb.toFixed(0)} dB，有餘裕。` })
  return fb
}

function MixStep({ p, update, notify }: StepProps) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [peak, setPeak] = useState<number | null>(null)
  const [level, setLevel] = useState(-60)
  const [bypass, setBypass] = useState(false)
  const graphRef = useRef<MixGraph | null>(null)
  const peakRef = useRef(-100)
  const tracks = p.mix.tracks

  const neutral: TrackSettings = { vol: 0.8, pan: 0, hp: false, mute: false }
  useEffect(() => {
    const g = graphRef.current
    if (!g) return
    ;(Object.keys(g.buses) as TrackId[]).forEach((id) => applyTrack(g.buses[id], bypass ? neutral : tracks[id], id === 'bass'))
  }, [tracks, bypass, player]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!player) return
    const g = graphRef.current!
    const buf = new Float32Array(g.analyser.fftSize)
    let raf = 0
    const tick = () => {
      g.analyser.getFloatTimeDomainData(buf)
      let pk = 0
      for (let i = 0; i < buf.length; i++) pk = Math.max(pk, Math.abs(buf[i]))
      const db = pk > 0 ? 20 * Math.log10(pk) : -100
      peakRef.current = Math.max(peakRef.current, db)
      setLevel(db)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const id = window.setInterval(() => setPeak(peakRef.current), 500)
    return () => { cancelAnimationFrame(raf); clearInterval(id) }
  }, [player])

  const playerRef = useRef<Player | null>(null)
  playerRef.current = player
  useEffect(() => () => { playerRef.current?.stop(); graphRef.current?.dispose() }, [])

  const play = () => {
    player?.stop()
    if (!graphRef.current) graphRef.current = createMixGraph()
    peakRef.current = -100
    const { bars, melody } = sectionAudio(p, 'chorus')
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody, loop: true, mix: graphRef.current, layers: { drums: true, bass: true, keys: true, pad: true, melody: true } }))
    update('mix', { ...p.mix, listened: true })
    notify('mix.play', '')
  }
  const stop = () => { player?.stop(); setPlayer(null); graphRef.current?.dispose(); graphRef.current = null }

  const setT = (id: TrackId, patch: Partial<TrackSettings>) => { update('mix', { ...p.mix, tracks: { ...tracks, [id]: { ...tracks[id], ...patch } } }); notify('mix.change', '') }
  const meterLevel: Level = level > -1 ? 'bad' : level > -6 ? 'warn' : 'good'
  const fb = mixFeedback(p, peak)

  return (
    <>
      <Coach>
        混音就是「讓每個聲音都有自己的位置」。我故意把起始設定弄得有點亂：主旋律太小聲、貝斯偏到右邊。
        按下播放，一邊聽一邊調整，看回饋燈怎麼變。隨時按「A/B 比較」聽聽原始狀態，訓練你的耳朵。
      </Coach>

      <Card>
        <div className="row wrap">
          {!player ? <button className="btn btn-primary" onClick={play}>▶ 播放副歌循環</button> : <button className="btn btn-danger" onClick={stop}>■ 停止</button>}
          <button className={`btn ${bypass ? 'btn-primary' : ''}`} onClick={() => { setBypass(!bypass); if (!bypass) notify('mix.ab', '') }} disabled={!player}>{bypass ? 'B：未混音（點我回到你的混音）' : 'A/B 比較'}</button>
        </div>
        <div className="level-box">
          <div className="row between small"><span>總輸出</span><span>{player ? `${level.toFixed(0)} dB` : '—'}</span></div>
          <Meter value={(level + 48) / 48} level={meterLevel} />
        </div>
      </Card>

      <div className="mixer">
        {TRACKS.map((tr) => {
          const s = tracks[tr.id]
          return (
            <Card key={tr.id} className="strip">
              <div className="strip-head">
                <strong>{tr.name}</strong>
                <span className="muted small">{tr.role}</span>
              </div>
              <label className="field">
                <span>音量 {Math.round(s.vol * 100)}%</span>
                <input type="range" min={0} max={1.2} step={0.01} value={s.vol} onChange={(e) => setT(tr.id, { vol: +e.target.value })} />
              </label>
              <label className="field">
                <span>左右 {s.pan === 0 ? '中' : s.pan < 0 ? `左 ${Math.round(-s.pan * 100)}%` : `右 ${Math.round(s.pan * 100)}%`}</span>
                <input type="range" min={-1} max={1} step={0.05} value={s.pan} onChange={(e) => setT(tr.id, { pan: +e.target.value })} />
              </label>
              <div className="row wrap">
                <button className={`chip ${s.hp ? 'on' : ''}`} onClick={() => setT(tr.id, { hp: !s.hp })}>低頻切除</button>
                <button className={`chip ${s.mute ? 'on' : ''}`} onClick={() => setT(tr.id, { mute: !s.mute })}>靜音</button>
              </div>
            </Card>
          )
        })}
      </div>

      <Card title="即時回饋">
        <FeedbackList items={fb} />
      </Card>

      <Why ready={p.mix.listened} hint="先按播放。" title="為什麼主旋律最重要？" apply="Podcast 對話、影片旁白配樂，都要讓「說話」最清楚。">
        <p>聽眾哼的是主旋律、記的是歌詞。伴奏再好聽，蓋過人聲就失敗了。專業混音師常先把人聲調好，再把其他東西「放到它周圍」。</p>
      </Why>
      <Why ready={p.mix.listened} title="左右聲像（Pan）的邏輯" apply="戴耳機聽喜歡的歌：鼓、吉他、和聲各在哪個位置？">
        <p>想像一個舞台：主唱、貝斯、大鼓站中間；吉他、鋼琴、和聲分站左右。把不同樂器放在不同位置，就算音量一樣，也能聽得更清楚。</p>
      </Why>
      <Why ready={tracks.chords.hp || tracks.melody.hp} hint="先在任一軌打開「低頻切除」聽聽差別。" title="為什麼要切低頻？" apply="手機錄影的風切聲、冷氣低鳴，也都用 High-pass 濾掉。">
        <p>每個樂器都會產生一點點低頻，疊起來就變成「悶、糊」。只讓貝斯和大鼓負責低頻，其他軌切掉 150Hz 以下，整體就會清楚很多。這叫「頻率分工」。</p>
      </Why>
      <Why ready={p.mix.listened} title="為什麼要 A/B 比較？" apply="修照片、改文章時，也要常常和原稿比較。">
        <p>耳朵會很快「習慣」聲音，調久了就不知道自己變好還是變差。回到原始狀態聽一下，是混音師最常用的校準方法。</p>
      </Why>
    </>
  )
}

export const mixStep: StepDef = {
  key: 'mix',
  title: '混音觀念',
  subtitle: '讓每個聲音都有位置',
  glyph: '混',
  Component: MixStep,
  requirements: (p) => [
    { label: '播放並聆聽混音', ok: p.mix.listened },
    { label: '回饋中沒有紅燈', ok: !mixFeedback(p, null).some((f) => f.level === 'bad') },
  ],
}
