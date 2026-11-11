import { useEffect, useRef, useState } from 'react'
import { Card, Coach, DeskActions, FeedbackList, Meter, Toolbox, Why, type Feedback, type Level } from '../components/ui'
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
  const others = (['chords', 'bass', 'drums'] as TrackId[]).map((id) => t[id].mute ? 0 : t[id].vol)
  const loudest = Math.max(...others)
  fb.push(!t.melody.mute && t.melody.vol > 0 && t.melody.vol >= loudest * 0.9 ? { level: 'good', text: '主旋律的音量和伴奏差不多，聽聽喜不喜歡。' } : { level: 'bad', text: '主旋律的音量比伴奏小，或是靜音了。', tip: '想讓旋律靠近一點？試著把伴奏調小，再聽聽看。' })
  fb.push(Math.abs(t.bass.pan) <= 0.15 ? { level: 'good', text: '貝斯靠近中間，聽聽這個位置。' } : { level: 'bad', text: '貝斯偏在一邊。', tip: '也試試把貝斯放回中間，聽聽兩邊有什麼不同。' })
  fb.push(Math.abs(t.melody.pan) <= 0.15 ? { level: 'good', text: '主旋律在中間，像站在舞台中央。' } : { level: 'warn', text: '主旋律靠近一邊。', tip: '也可以試著放回中間，聽聽你喜歡哪裡。' })
  fb.push(Math.abs(t.chords.pan) >= 0.2 ? { level: 'good', text: '和弦偏在一邊，聽聽跟旋律的距離。' } : { level: 'warn', text: '和弦靠近中間。', tip: '試著往左或右移一點，聽聽空間有沒有變化。' })
  fb.push(t.chords.hp && t.melody.hp ? { level: 'good', text: '和弦和主旋律都開了低頻切除。' } : { level: 'warn', text: '有些軌道還沒開低頻切除。', tip: '試著打開「低頻切除」，再關掉比較，聽聽聲音有什麼不同。' })
  if (t.bass.hp) fb.push({ level: 'warn', text: '貝斯也開了低頻切除。', tip: '聽聽低音有沒有變薄；喜歡原本的聲音也可以關掉。' })
  if (peakDb != null) fb.push(peakDb > -1 ? { level: 'bad', text: `總輸出峰值 ${peakDb.toFixed(0)} dB，接近破音。`, tip: '每軌都往下拉一點，而不是把總音量推到底。' } : { level: 'good', text: `總輸出峰值 ${peakDb.toFixed(0)} dB，有餘裕。` })
  return fb
}

function MixStep({ p, update, notify, next, goTo }: StepProps) {
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
    setBypass(false)
    if (!graphRef.current) graphRef.current = createMixGraph()
    peakRef.current = -100
    const { bars, melody } = sectionAudio(p, 'chorus')
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody, loop: true, mix: graphRef.current, layers: { drums: true, bass: true, keys: true, pad: true, melody: true } }))
    update('mix', { ...p.mix, listened: true })
    notify('mix.play', '')
  }
  const stop = () => { player?.stop(); setPlayer(null); setBypass(false); graphRef.current?.dispose(); graphRef.current = null }

  const setT = (id: TrackId, patch: Partial<TrackSettings>) => { update('mix', { ...p.mix, tracks: { ...tracks, [id]: { ...tracks[id], ...patch } } }); notify('mix.change', '') }
  const meterLevel: Level = level > -1 ? 'bad' : level > -6 ? 'warn' : 'good'
  const fb = mixFeedback(p, peak)
  const hasMelody = p.melody.chorus.some(m => m != null && m >= 0)

  return (
    <>
      <Coach short={!hasMelody ? '先留下幾個副歌的音，回來就能聽到自己的混音。' : !p.mix.listened ? '按播放，聽聽每個聲音在哪。' : '想先聽見哪個聲音？試著把它推近一點。'} />

      <div className="mix-simple">
        {TRACKS.map((tr) => (
          <label key={tr.id} className="mix-row">
            <span>{tr.name.replace(/（.*）/, '')}</span>
            <input type="range" min={0} max={1.2} step={0.01} value={tracks[tr.id].vol} onChange={(e) => setT(tr.id, { vol: +e.target.value })} />
          </label>
        ))}
      </div>

      {!hasMelody ? (
        <DeskActions primary={{label: '先寫一小句旋律', onClick: () => goTo?.('melody')}} />
      ) : player ? (
        <DeskActions primary={{ label: '■ 停', onClick: stop }} secondary={{ label: bypass ? '回到我的混音' : '聽聽沒混之前', onClick: () => { setBypass(!bypass); if (!bypass) notify('mix.ab', '') } }} />
      ) : mixStep.requirements(p).every((x) => x.ok) && next ? (
        <DeskActions primary={{ label: <>聽清楚了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 再聽一次', onClick: play }} />
      ) : (
        <DeskActions primary={{ label: '▶ 播放副歌', onClick: play }} />
      )}

      <Toolbox>
        <div className="level-box">
          <div className="row between small"><span>總輸出</span><span>{player ? `${level.toFixed(0)} dB` : '—'}</span></div>
          <Meter value={(level + 48) / 48} level={meterLevel} />
        </div>
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

      <Why ready={p.mix.listened} hint="先按播放。" title="想讓旋律靠近一點？" apply="Podcast 對話或影片旁白，也可以試著調整和配樂的距離。">
        <p>想讓人聲靠近一點的話，先把它調到喜歡的音量，再慢慢加回其他聲音。聽聽這樣的距離喜不喜歡。</p>
      </Why>
      <Why ready={p.mix.listened} title="聲音要站在哪裡？" apply="戴耳機聽喜歡的歌：鼓、吉他、和聲各在哪個位置？">
        <p>把聲音想成站在舞台上。試著讓樂器分站左右，再聽聽和原來有什麼不同。</p>
      </Why>
      <Why ready={tracks.chords.hp || tracks.melody.hp} hint="先在任一軌打開「低頻切除」聽聽差別。" title="切掉一些低音，會怎樣？" apply="錄到風聲或冷氣聲時，也可以試試低頻切除。">
        <p>聲音裡的低頻疊在一起，有時會聽起來比較悶。試著切掉一些，再聽聽你比較喜歡哪一種。</p>
      </Why>
      <Why ready={p.mix.listened} title="為什麼要 A/B 比較？" apply="修照片、改文章時，也要常常和原稿比較。">
        <p>耳朵會很快「習慣」聲音，調久了就不知道自己變好還是變差。回到原始狀態聽一下，是混音師最常用的校準方法。</p>
      </Why>
      </Toolbox>
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
    { label: '播放並聆聽混音', ok: p.mix.listened && p.melody.chorus.some(m => m != null && m >= 0) },
    { label: '回饋中沒有紅燈', ok: !mixFeedback(p, null).some((f) => f.level === 'bad') },
  ],
}
