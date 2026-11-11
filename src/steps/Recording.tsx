import { useEffect, useRef, useState } from 'react'
import { Card, Coach, DeskActions, FeedbackList, Light, Meter, Toolbox, Why, type Feedback, type Level } from '../components/ui'
import { ac, click, playNote } from '../lib/audio'
import { useMic } from '../lib/mic'
import { jianpu, noteNameOct } from '../lib/theory'
import type { StepDef, StepProps } from './types'

export const REC_CHECKS = [
  { id: 'room', label: '找個安靜的角落', why: '聽聽有沒有風扇或冷氣聲；方便的話，錄音時先關掉。' },
  { id: 'soft', label: '找找窗簾、棉被或衣櫃', why: '附近有些柔軟的東西，可能讓回音少一點。' },
  { id: 'dist', label: '離麥克風約一個拳頭', why: '先從 10–15 公分試試，聽聽遠近有什麼不同。' },
  { id: 'pop', label: '找個防噴罩', why: '它能幫忙減少唱到ㄅ、ㄆ時的「噗」聲；也可以試試絲襪套衣架。' },
  { id: 'phones', label: '戴上耳機聽伴奏', why: '這樣伴奏比較不會跟著人聲一起錄進去。' },
  { id: 'takes', label: '多錄幾次，挑喜歡的', why: '不用急著一次唱好，留幾個版本慢慢聽。' },
  { id: 'warm', label: '先暖暖嗓、喝點水', why: '給聲音一點時間準備，唱起來舒服最重要。' },
  { id: 'sheet', label: '把歌詞和和弦放在手邊', why: '忘詞時看一眼，就能繼續唱。' },
]

function dbLevel(db: number): Level {
  if (db > -3) return 'bad'
  if (db > -24 && db <= -6) return 'good'
  return 'warn'
}

function RecordingStep({ p, update, notify, next }: StepProps) {
  const r = p.recording
  const mic = useMic()
  const [mode, setMode] = useState<'level' | 'pitch' | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  const holdRef = useRef(0)
  const [hits, setHits] = useState(0)
  const [metro, setMetro] = useState<number | null>(null)

  const notes = [...p.melody.chorus, ...p.melody.verse].filter((m): m is number => m != null && m >= 0)
  const lo = notes.length ? Math.min(...notes) : p.hum?.rangeLow ?? 57
  const hi = notes.length ? Math.max(...notes) : p.hum?.rangeHigh ?? 69
  const targets = [lo, Math.round((lo + hi) / 2), hi].filter((v, i, a) => a.indexOf(v) === i)

  // 音準練習：連續在 ±25 cents 內約 0.6 秒算一次命中
  const cents = target != null && mic.midi != null ? Math.round((mic.midi - target - Math.round((mic.midi - target) / 12) * 12) * 100) : null
  const pitchLevel: Level | null = cents == null ? null : Math.abs(cents) <= 25 ? 'good' : Math.abs(cents) <= 50 ? 'warn' : 'bad'
  useEffect(() => {
    if (pitchLevel === 'good') {
      holdRef.current++
      if (holdRef.current === 36) {
        setHits((h) => h + 1)
        notify('record.pitch', target != null ? noteNameOct(target) : '')
        update('recording', (x) => ({ ...x, pitchHits: x.pitchHits + 1 }))
      }
    } else holdRef.current = 0
  }, [mic.midi]) // eslint-disable-line react-hooks/exhaustive-deps

  const startLevel = async () => { mic.resetPeak(); const ok = mic.running || await mic.start(); setMode(ok ? 'level' : null) }
  const endLevel = () => { update('recording', { ...r, levelPeakDb: Math.round(mic.peakDb) }); mic.stop(); setMode(null); notify('record.level', '') }
  const startPitch = async (m: number) => { setTarget(m); holdRef.current = 0; const ok = mic.running || await mic.start(); setMode(ok ? 'pitch' : null); if (ok) playNote(m, 1.2, { type: 'sine', gain: 0.3 }) }

  useEffect(() => {
    if (metro == null) return
    const c = ac()
    const beat = 60 / p.idea.bpm
    let n = 0
    let t = c.currentTime + 0.1
    const id = window.setInterval(() => {
      while (t < c.currentTime + 0.2) { click(t, n % 4 === 0); t += beat; n++ }
    }, 50)
    return () => clearInterval(id)
  }, [metro, p.idea.bpm])

  const lvl = dbLevel(mic.levelDb)
  const fb: Feedback[] = []
  if (r.levelPeakDb != null) {
    const pk = r.levelPeakDb
    fb.push(pk > -3 ? { level: 'bad', text: `峰值 ${pk} dB，離上限很近了。`, tip: '把麥克風或錄音介面的增益調小一點，或退後一些，再唱一次。太大聲可能會破音。' } : pk >= -18 ? { level: 'good', text: `峰值 ${pk} dB，這次還留有空間。` } : { level: 'warn', text: `峰值 ${pk} dB，聲音有點小。`, tip: '試著把增益調大一點，或靠近麥克風。錄得太小聲，放大時雜音也可能跟著變大。' })
  }
  const nChecked = REC_CHECKS.filter((c) => r.checks[c.id]).length
  fb.push(nChecked >= 6 ? { level: 'good', text: `錄音前的小準備，勾了 ${nChecked}/${REC_CHECKS.length} 項。` } : { level: 'warn', text: `錄音前的小準備，勾了 ${nChecked}/${REC_CHECKS.length} 項。` })
  if (r.pitchHits) fb.push(r.pitchHits >= 3 ? { level: 'good', text: `音準練習命中 ${r.pitchHits} 次，聲音準備好了。` } : { level: 'warn', text: `音準練習命中 ${r.pitchHits} 次，再多練幾次。` })

  return (
    <>
      <Coach short={mode === 'level' ? '唱唱看歌裡最大聲的那一句。' : r.levelPeakDb != null ? (r.levelPeakDb <= -60 ? '還沒收到聲音，靠近麥克風再試；也可以先跳過。' : r.levelPeakDb > -3 ? `最大聲到 ${r.levelPeakDb} dB，太滿了，退後一點再試。` : `最大聲 ${r.levelPeakDb} dB，還留有空間。`) : '錄之前，先來試試音量。'} />

      <div className="stage">
        {mode === 'level' ? (
          <div className="level-box">
            <Meter value={(mic.levelDb + 60) / 60} level={lvl} />
            <div className="meter-scale small muted"><span>小聲</span><span>剛好</span><span>太滿</span></div>
          </div>
        ) : <div className="stage-empty" aria-hidden>◎</div>}
        {mic.error && <p className="error small">{mic.error}</p>}
      </div>

      {mode === 'level' ? (
        <DeskActions primary={{ label: '■ 唱完了', onClick: endLevel }} />
      ) : recordingStep.requirements(p).every((x) => x.ok) && next ? (
        <DeskActions primary={{ label: <>準備好了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '再測一次', onClick: startLevel }} />
      ) : (
        <DeskActions primary={{ label: mic.pending ? '等麥克風許可…' : '● 測音量', onClick: startLevel, disabled: mic.pending }} secondary={{ label: '沒有麥克風，先跳過', onClick: () => update('recording', { ...r, checks: { ...r.checks, nomic: true } }) }} />
      )}

      <Toolbox>
      <Card title="2. 暖嗓：音準跟唱">
        <p className="muted small">點一個音，聽完後跟著唱「啊～」，撐住。指針在中間綠區停留約 0.6 秒，就算一次命中。{notes.length ? '這幾個音來自你旋律的音域。' : p.hum ? '這幾個音來自剛才的音域。' : '先拿這幾個音暖暖嗓。'}</p>
        <div className="row wrap">
          {targets.map((m) => (
            <button key={m} className={`btn ${target === m ? 'btn-primary' : ''}`} onClick={() => startPitch(m)}>
              {noteNameOct(m)}（{jianpu(m, p.harmony.root, p.harmony.mode)}）
            </button>
          ))}
          {mode === 'pitch' && <button className="btn btn-danger" onClick={() => { mic.stop(); setMode(null) }}>■ 停止</button>}
        </div>
        {mode === 'pitch' && target != null && (
          <div className="tuner">
            <div className="tuner-scale">
              <div className="tuner-zone warn" /><div className="tuner-zone good" /><div className="tuner-zone warn" />
              {cents != null && <div className={`tuner-needle n-${pitchLevel}`} style={{ left: `${50 + Math.max(-100, Math.min(100, cents)) / 2}%` }} />}
            </div>
            <div className="row between small">
              <span>偏低</span>
              <span>{cents == null ? '來，唱唱看…' : `${cents > 0 ? '+' : ''}${cents} 音分 ${pitchLevel === 'good' ? '準！撐住' : cents > 0 ? '稍微放低' : '稍微抬高'}`}</span>
              <span>偏高</span>
            </div>
            <p className="small">本次命中：{hits}</p>
          </div>
        )}
      </Card>

      <Card title="3. 錄音環境清單">
        <ul className="checklist">
          {REC_CHECKS.map((c) => (
            <li key={c.id}>
              <label>
                <input type="checkbox" checked={!!r.checks[c.id]} onChange={(e) => update('recording', { ...r, checks: { ...r.checks, [c.id]: e.target.checked } })} />
                <span>
                  {c.label}
                  <span className="muted small block">{c.why}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="4. 節拍器（你的歌速度）">
        <div className="row">
          {metro == null ? <button className="btn" onClick={() => setMetro(Date.now())}>▶ {p.idea.bpm} BPM</button> : <button className="btn btn-danger" onClick={() => setMetro(null)}>■ 停止</button>}
          <span className="muted small">錄音時戴耳機聽它，人聲才會跟伴奏對齊。</span>
        </div>
      </Card>

      <Card title="一起看看">
        <FeedbackList items={fb} />
        <div className="legend small muted"><Light level="good" /> -24～-6 dB 留有空間 <Light level="warn" /> 太小或接近上限 <Light level="bad" /> -3 dB 以上接近上限</div>
      </Card>

      <Why ready={r.levelPeakDb != null || !!r.checks.nomic} hint="先做音量測試。" title="為什麼峰值要留在 -6 dB 以下？" apply="直播、Podcast、錄 Vlog 旁白都用同樣標準。">
        <p>數位錄音到了 0 dB 的上限，聲音可能會削波、聽起來破破的。先留約 6 dB 的空間，就算唱得更大聲，也比較不容易碰到上限。</p>
      </Why>
      <Why ready={hits > 0 || r.pitchHits > 0} hint="先跟唱一個音。" listen={target != null ? { label: '再聽一次目標音', play: () => playNote(target, 1.2, { type: 'sine', gain: 0.3 }) } : undefined} title="音分（cent）是什麼？" apply="調樂器、用修音軟體、看調音器時都會看到它。">
        <p>一個半音分成 100 音分。一般人耳對 ±10–25 音分的偏差不太敏感，超過 50 音分（半個半音）就會明顯「走音」。</p>
      </Why>
      </Toolbox>
    </>
  )
}

export const recordingStep: StepDef = {
  key: 'record',
  title: '錄音準備',
  subtitle: '測音量、暖嗓、整理環境',
  glyph: '錄',
  Component: RecordingStep,
  requirements: (p) => [
    { label: '試過音量，留一點空間（或先跳過）', ok: (p.recording.levelPeakDb != null && p.recording.levelPeakDb > -60 && p.recording.levelPeakDb <= -3) || !!p.recording.checks.nomic },
  ],
}
