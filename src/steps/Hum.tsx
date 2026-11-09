import { useRef, useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { PitchCanvas } from '../components/PitchCanvas'
import { ac, playNote, tone } from '../lib/audio'
import { useMic } from '../lib/mic'
import { analyzeBuffer, synthDemoHum, toMono, type HumAnalysis, type PitchFrame } from '../lib/pitch'
import { keyName, noteNameOct, NOTE_NAMES, SCALES, inScale, pc } from '../lib/theory'
import type { StepDef, StepProps } from './types'

function HumStep({ p, update, notify, next }: StepProps) {
  const [live, setLive] = useState<PitchFrame[]>([])
  const [ana, setAna] = useState<HumAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [playhead, setPlayhead] = useState<number | null>(null)
  const rawRef = useRef<{ data: Float32Array; sampleRate: number } | null>(null)
  const liveRef = useRef<PitchFrame[]>([])
  const mic = useMic({
    record: true,
    maxSec: 25,
    onLimit: (recording) => { if (recording) runAnalysis(recording.data, recording.sampleRate, 'mic') },
    onFrame: (midi, t) => {
      liveRef.current.push({ t, midi })
      if (liveRef.current.length % 3 === 0) setLive([...liveRef.current])
    },
  })

  const runAnalysis = (data: Float32Array, sampleRate: number, source: 'mic' | 'file' | 'demo') => {
    rawRef.current = { data, sampleRate }
    setBusy(true)
    setTimeout(() => {
      const a = analyzeBuffer(data, sampleRate)
      setAna(a)
      setBusy(false)
      const k = a.keys[0]
      update('hum', {
        notes: a.notes.slice(0, 200),
        duration: a.duration,
        keyRoot: k.root,
        keyMode: k.mode,
        confidence: Math.max(0, k.score - a.keys[1].score),
        chordHints: a.chordHints.map((h) => h.chord),
        rangeLow: a.rangeLow,
        rangeHigh: a.rangeHigh,
        source,
      })
      // 把估計結果帶進和聲章節的預設值（學生之後仍可修改）
      update('harmony', (h) => ({ ...h, root: k.root, mode: k.mode }))
      notify('hum.analyzed', `${a.notes.length}`)
    }, 30)
  }

  const toggleRec = async () => {
    if (mic.running) {
      const rec = mic.stop()
      if (rec) runAnalysis(rec.data, rec.sampleRate, 'mic')
    } else {
      liveRef.current = []
      setLive([])
      setAna(null)
      await mic.start()
    }
  }

  const onFile = async (f: File) => {
    try {
      const buf = await ac().decodeAudioData(await f.arrayBuffer())
      const mono = toMono(buf)
      runAnalysis(mono.slice(0, Math.min(mono.length, buf.sampleRate * 40)), buf.sampleRate, 'file')
    } catch {
      alert('這個檔案無法解析，請改用 mp3 / wav / m4a。')
    }
  }

  const demo = () => {
    const sr = 22050
    runAnalysis(synthDemoHum(sr), sr, 'demo')
  }

  const playOriginal = () => {
    const r = rawRef.current
    if (!r) return
    const c = ac()
    const b = c.createBuffer(1, r.data.length, r.sampleRate)
    b.getChannelData(0).set(r.data)
    const s = c.createBufferSource()
    s.buffer = b
    s.connect(c.destination)
    s.start()
  }

  const playNotes = (withRoot = false) => {
    const notes = ana?.notes ?? p.hum?.notes ?? []
    if (!notes.length) return
    const c = ac()
    const t0 = c.currentTime + 0.05
    notes.forEach((n) => tone(n.midi, t0 + n.start, Math.max(0.08, n.dur), { type: 'triangle', gain: 0.2 }))
    if (withRoot && p.hum) {
      const dur = notes[notes.length - 1].start + notes[notes.length - 1].dur
      tone(48 + p.hum.keyRoot, t0, dur, { type: 'sine', gain: 0.12, attack: 0.2 })
    }
    const start = performance.now()
    const tick = () => {
      const el = (performance.now() - start) / 1000
      const dur = notes[notes.length - 1].start + notes[notes.length - 1].dur
      if (el > dur + 0.2) { setPlayhead(null); return }
      setPlayhead(el)
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  const hum = p.hum
  const shownFrames = ana ? ana.frames : live
  const shownNotes = ana?.notes ?? (mic.running ? [] : hum?.notes ?? [])
  const shownDur = ana ? ana.duration : mic.running ? Math.max(5, (live[live.length - 1]?.t ?? 0) + 1) : hum?.duration ?? 5

  const fb: Feedback[] = []
  if (hum) {
    const n = hum.notes.length
    const total = hum.notes.reduce((s, x) => s + x.dur, 0)
    fb.push(n >= 8 ? { level: 'good', text: `抓到 ${n} 個音，素材夠用。` } : n >= 3 ? { level: 'warn', text: `只抓到 ${n} 個音。`, tip: '用「嗯～」或「啦～」哼長一點（8 秒以上），每個音都撐住一下。' } : { level: 'bad', text: '幾乎沒偵測到穩定的音。', tip: '靠近麥克風一個拳頭的距離，環境安靜一點，聲音穩住不要用氣音。' })
    const inK = hum.notes.filter((x) => inScale(x.midi, hum.keyRoot, hum.keyMode)).reduce((s, x) => s + x.dur, 0)
    const ratio = total ? inK / total : 0
    fb.push(ratio > 0.85 ? { level: 'good', text: `${Math.round(ratio * 100)}% 的時間都落在 ${keyName(hum.keyRoot, hum.keyMode)} 裡，你的耳朵天生就有調性感。` } : ratio > 0.65 ? { level: 'warn', text: `${Math.round(ratio * 100)}% 落在調內。`, tip: '紅色的音可能是故意的色彩，也可能是唱偏了；播放「整理後的音」聽聽看是不是你要的。' } : { level: 'bad', text: '調性不太明確。', tip: '試著哼一段你很熟的旋律（例如生日快樂歌）先暖耳，再哼自己的。' })
    const range = hum.rangeHigh - hum.rangeLow
    fb.push(range <= 12 && range >= 4 ? { level: 'good', text: `音域 ${noteNameOct(hum.rangeLow)}–${noteNameOct(hum.rangeHigh)}（${range} 個半音），很好唱。` } : range > 12 ? { level: 'warn', text: `音域跨了 ${range} 個半音，超過一個八度。`, tip: '對新手來說，主歌待在中低音、副歌再往上，會比較好唱也比較有層次。' } : { level: 'warn', text: '音域很窄，旋律可能有點平。', tip: '試著讓某一句往上「衝」一下，製造高點。' })
    fb.push(hum.confidence > 0.08 ? { level: 'good', text: '調性判斷信心高。' } : { level: 'warn', text: '有兩個調都很像，判斷信心偏低。', tip: '可以在下方改選第二候選，或到「和聲」章節用耳朵決定。' })
  }

  const hist = ana?.hist
  const histMax = hist ? Math.max(...hist, 0.001) : 1

  const hasResult = !!hum && !mic.running && !busy
  return (
    <>
      <Coach short={mic.running ? '我在聽……哼完按停止。' : hum ? '聽聽整理後的樣子，喜歡就帶著它繼續。' : '哼一段腦中的旋律給我聽。不用好聽，有就好。'} />

      <div className="stage">
        {mic.running && <div className={`big-note ${mic.midi != null ? 'on' : ''}`}>{mic.midi != null ? noteNameOct(mic.midi) : '…'}</div>}
        {(shownFrames.length > 0 || shownNotes.length > 0) ? (
          <PitchCanvas frames={shownFrames} notes={shownNotes} duration={shownDur} keyRoot={hum?.keyRoot} keyMode={hum?.keyMode} playhead={playhead} height={180} />
        ) : !mic.running && <div className="stage-empty" aria-hidden>～</div>}
        {busy && <p className="muted small center">在聽你剛剛哼的……</p>}
        {mic.error && <p className="error small">{mic.error}</p>}
      </div>

      {mic.running ? (
        <DeskActions primary={{ label: '■ 哼完了', onClick: toggleRec }} />
      ) : hasResult && next ? (
        <DeskActions primary={{ label: <>用這段繼續：{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽聽整理後的音', onClick: () => playNotes(true) }} />
      ) : (
        <DeskActions primary={{ label: '● 哼一段', onClick: toggleRec }} secondary={{ label: '沒有麥克風？聽示範', onClick: demo }} />
      )}

      <Toolbox>
        <div className="row wrap">
          {hum && <button className="btn small" onClick={toggleRec}>● 再哼一次</button>}
          <label className="btn small">
            上傳音檔
            <input type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          {ana && <button className="btn small" onClick={playOriginal}>▶ 原始錄音</button>}
          {hum && <button className="btn small" onClick={() => playNotes(false)}>▶ 只聽旋律</button>}
        </div>
        {hum && (
          <div className="result-grid">
            <div className="result"><div className="muted small">調</div><div className="result-big">{keyName(hum.keyRoot, hum.keyMode)}</div></div>
            <div className="result"><div className="muted small">舒服的音域</div><div className="result-big">{noteNameOct(hum.rangeLow)}–{noteNameOct(hum.rangeHigh)}</div></div>
            <div className="result"><div className="muted small">可能適合的和弦</div><div className="result-big">{[...new Set(hum.chordHints)].slice(0, 4).join(' · ') || '—'}</div></div>
          </div>
        )}
        {ana && hum && (
          <div className="row wrap small">
            <span className="muted">聽起來不像？換一個調：</span>
            {ana.keys.slice(0, 3).map((k, i) => (
              <button key={i} className={`chip ${k.root === hum.keyRoot && k.mode === hum.keyMode ? 'on' : ''}`}
                onClick={() => { update('hum', { ...hum, keyRoot: k.root, keyMode: k.mode }); update('harmony', (h) => ({ ...h, root: k.root, mode: k.mode })); playNote(60 + k.root, 0.8) }}>
                {keyName(k.root, k.mode)}
              </button>
            ))}
          </div>
        )}
        {hist && hum && (
          <div className="hist">
            {hist.map((v, i) => (
              <div key={i} className="hist-col" title={`${NOTE_NAMES[i]}：${v.toFixed(1)} 秒`}>
                <div className={`hist-bar ${SCALES[hum.keyMode].includes(pc(i - hum.keyRoot)) ? 'in' : ''} ${i === hum.keyRoot ? 'tonic' : ''}`} style={{ height: `${(v / histMax) * 100}%` }} />
                <span>{NOTE_NAMES[i]}</span>
              </div>
            ))}
          </div>
        )}
        <FeedbackList items={fb} empty="哼完之後，這裡會有幾句觀察。" />
        <Why ready={!!hum} title="我怎麼聽出你的「家」？" listen={{ label: '只聽主音', play: () => hum && playNote(60 + hum.keyRoot, 1.5) }}>
          <p>我把你每個音「唱了多久」加起來（上面的長條圖）。停留最久、最常回去的音，通常就是這首歌的家，也就是主音。再拿這個分佈去比對 24 個調的典型樣子，最像的那個就是你的調。</p>
          {ana && ana.chordHints.length > 0 && (
            <ol className="hint-list">
              {ana.chordHints.slice(0, 4).map((h, i) => <li key={i}><strong>{h.start.toFixed(1)}–{h.end.toFixed(1)} 秒 → {h.chord}</strong><div className="muted small">{h.why}</div></li>)}
            </ol>
          )}
        </Why>
        <Why ready={!!hum} title="電腦怎麼知道我唱什麼音？">
          <p>唱 A 音時，空氣每秒振動 440 次。程式把聲波跟「往後挪一點的自己」比較，重疊最好的位移量就是一次振動的長度，換算成頻率就是音高。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const humStep: StepDef = {
  key: 'hum',
  title: '哼唱解析',
  subtitle: '把腦中的旋律變成看得見的音',
  glyph: '哼',
  Component: HumStep,
  requirements: (p) => [
    { label: '完成一段哼唱分析（錄音、上傳或示範皆可）', ok: !!p.hum },
    { label: '至少偵測到 3 個音', ok: (p.hum?.notes.length ?? 0) >= 3 },
  ],
}
