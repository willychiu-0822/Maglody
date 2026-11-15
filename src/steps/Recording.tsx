import { useEffect, useRef, useState } from 'react'
import { Card, Coach, StageSketch, DeskActions, FeedbackList, Light, Meter, Toolbox, Why, type Feedback, type Level } from '../components/ui'
import { ac, click, playNote } from '../lib/audio'
import { useMic } from '../lib/mic'
import { jianpu, noteNameOct } from '../lib/theory'
import type { StepDef, StepProps } from './types'
import { recordingRequirements } from '../rules/requirements'
import { DESK_NAMES } from '../../server/shared/names.ts'
import { ROLES } from '../agent/roles'

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
    fb.push(pk > -3 ? { level: 'bad', text: '最大聲的那一下太滿了，快破音了。', tip: '往後退一步，或唱小聲一點，再試一次，聲音就不容易破。' } : pk >= -18 ? { level: 'good', text: '最大聲的那一下剛剛好，還留有空間。' } : { level: 'warn', text: '這次聲音有點小。', tip: '靠近麥克風一些再試。聲音太小的話，之後放大，雜音也會跟著出來。' })
  }
  const nChecked = REC_CHECKS.filter((c) => r.checks[c.id]).length
  fb.push(nChecked >= 6 ? { level: 'good', text: `錄音前的小準備，勾了 ${nChecked}/${REC_CHECKS.length} 項。` } : { level: 'warn', text: `錄音前的小準備，勾了 ${nChecked}/${REC_CHECKS.length} 項。` })
  if (r.pitchHits) fb.push(r.pitchHits >= 3 ? { level: 'good', text: `音準練習命中 ${r.pitchHits} 次，聲音準備好了。` } : { level: 'warn', text: `音準練習命中 ${r.pitchHits} 次，想再暖暖聲的話，可以多唱幾次。` })

  return (
    <>
      <Coach short={mode === 'level' ? '唱唱看歌裡最大聲的那一句。' : r.levelPeakDb != null ? (r.levelPeakDb <= -60 ? '還沒收到聲音，靠近麥克風再試；也可以先跳過。' : r.levelPeakDb > -3 ? '剛剛最大聲那一下太滿了，退後一點再試。' : r.levelPeakDb < -18 ? '收到了，聲音有點小；靠近一點再試，或就這樣往下走。' : '音量剛好，還留有空間。') : '錄之前，先來試試音量。'} />

      <div className="stage">
        {mode === 'level' ? (
          <div className="level-box">
            <Meter value={(mic.levelDb + 60) / 60} level={lvl} />
            <div className="meter-scale small muted"><span>小聲</span><span>剛好</span><span>太滿</span></div>
          </div>
        ) : <div className="stage-empty"><StageSketch kind="mic" /><small>{ROLES.engineer.name}把麥克風架好了，等你開口。</small></div>}
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
      <Card title="暖嗓：音準跟唱">
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
              <span>{cents == null ? '來，唱唱看…' : pitchLevel === 'good' ? '準！撐住' : cents > 0 ? '高了一點，稍微放低' : '低了一點，稍微抬高'}</span>
              <span>偏高</span>
            </div>
            <p className="small">本次命中：{hits}</p>
          </div>
        )}
      </Card>

      <Card title="錄音環境清單">
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

      <Card title="節拍器（你的歌速度）">
        <div className="row">
          {metro == null ? <button className="btn" onClick={() => setMetro(Date.now())}>▶ 每分鐘 {p.idea.bpm} 拍</button> : <button className="btn btn-danger" onClick={() => setMetro(null)}>■ 停止</button>}
          <span className="muted small">錄音時戴耳機聽它，人聲才會跟伴奏對齊。</span>
        </div>
      </Card>

      <Card title="一起看看">
        <FeedbackList items={fb} />
        <div className="legend small muted"><Light level="good" /> 剛好，留有空間 <Light level="warn" /> 太小，或快滿了 <Light level="bad" /> 太滿，會破音</div>
      </Card>

      <Why ready={r.levelPeakDb != null || !!r.checks.nomic} title="為什麼要留一點空間？" apply="直播、Podcast、錄 Vlog 旁白都用同樣標準。">
        <p>錄音有一個上限，聲音一碰到它就會破掉，事後救不回來。先留一點空間，就算唱得更激動，也不容易碰到。（錄音的人會說：最大聲的地方留在 -6 dB 以下。你剛剛那次是 {r.levelPeakDb ?? '—'} dB。）</p>
      </Why>
      <Why ready={hits > 0 || r.pitchHits > 0} listen={target != null ? { label: '再聽一次目標音', play: () => playNote(target, 1.2, { type: 'sine', gain: 0.3 }) } : undefined} title="偏多少才算走音？" apply="調樂器、用修音軟體、看調音器時都會看到它。">
        <p>指針在中間綠色那一格，大多數人聽不出偏差；跑到最外面，就會聽得出「走音」。（調音器上的單位叫「音分」：鋼琴上相鄰兩個鍵差 100 音分，綠色那一格是正負 25。{cents != null ? `你現在是 ${cents > 0 ? '+' : ''}${cents}。` : ''}）</p>
      </Why>
      </Toolbox>
    </>
  )
}

export const recordingStep: StepDef = {
  key: 'record',
  title: DESK_NAMES.record,
  subtitle: '測音量、暖嗓、整理環境',
  glyph: '錄',
  Component: RecordingStep,
  requirements: recordingRequirements,
}
