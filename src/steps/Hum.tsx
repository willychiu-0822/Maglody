import { useRef, useState } from 'react'
import { Coach, StageSketch, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { PitchCanvas } from '../components/PitchCanvas'
import { ac, playNote, tone, trackAudioSource } from '../lib/audio'
import { useMic } from '../lib/mic'
import { analyzeBuffer, synthDemoHum, toMono, type HumAnalysis, type PitchFrame } from '../lib/pitch'
import { keyName, noteNameOct, NOTE_NAMES, SCALES, inScale, pc } from '../lib/theory'
import type { StepDef, StepProps } from './types'

function HumStep({ p, update, notify, next }: StepProps) {
  const [live, setLive] = useState<PitchFrame[]>([])
  const [ana, setAna] = useState<HumAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [analysisSource, setAnalysisSource] = useState<'mic' | 'file' | 'demo'>('mic')
  const [playhead, setPlayhead] = useState<number | null>(null)
  const rawRef = useRef<{ data: Float32Array; sampleRate: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLButtonElement>(null)
  const [fileError, setFileError] = useState(false)
  const liveRef = useRef<PitchFrame[]>([])
  const mic = useMic({
    record: true,
    maxSec: 25,
    onLimit: rec => { if (rec) runAnalysis(rec.data, rec.sampleRate, 'mic') },
    onFrame: (midi, t) => {
      liveRef.current.push({ t, midi })
      if (liveRef.current.length % 3 === 0) setLive([...liveRef.current])
    },
  })

  const runAnalysis = (data: Float32Array, sampleRate: number, source: 'mic' | 'file' | 'demo') => {
    setFileError(false)
    setAnalysisSource(source)
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
      setFileError(false)
      liveRef.current = []
      setLive([])
      setAna(null)
      await mic.start()
    }
  }

  const onFile = async (f: File) => {
    setFileError(false)
    try {
      const buf = await ac().decodeAudioData(await f.arrayBuffer())
      const mono = toMono(buf)
      runAnalysis(mono.slice(0, Math.min(mono.length, buf.sampleRate * 40)), buf.sampleRate, 'file')
    } catch {
      setFileError(true)
    }
  }

  const demo = () => {
    const sr = 22050
    runAnalysis(synthDemoHum(sr), sr, 'demo')
    playOriginal()
  }

  const playOriginal = () => {
    const r = rawRef.current
    if (!r) return
    const c = ac()
    const b = c.createBuffer(1, r.data.length, r.sampleRate)
    b.getChannelData(0).set(r.data)
    const s = trackAudioSource(c.createBufferSource())
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
    fb.push(n >= 8 ? { level: 'good', text: `聽到 ${n} 個音，夠我們玩了。來聽聽看。` } : n >= 3 ? { level: 'warn', text: `聽到 ${n} 個音，有點少。`, tip: '想多留一點，可以用「嗯～」或「啦～」拖長一點，試試哼超過 8 秒。' } : { level: 'bad', text: '這次沒聽清楚幾個音。', tip: '離麥克風大約一個拳頭，找個安靜的地方，再哼一次看看。' })
    const inK = hum.notes.filter((x) => inScale(x.midi, hum.keyRoot, hum.keyMode)).reduce((s, x) => s + x.dur, 0)
    const ratio = total ? inK / total : 0
    fb.push(ratio > 0.85 ? { level: 'good', text: `這段有 ${Math.round(ratio * 100)}% 落在 ${keyName(hum.keyRoot, hum.keyMode)} 裡，滿貼的。` } : ratio > 0.65 ? { level: 'warn', text: `這段有 ${Math.round(ratio * 100)}% 落在目前選的調裡。`, tip: '紅色的音說不定正是你要的味道。按「聽聽整理後的音」聽聽。' } : { level: 'bad', text: '這段的調，我還不太確定。', tip: '先哼一小段熟悉的歌暖暖耳朵，再哼你自己的。' })
    const range = hum.rangeHigh - hum.rangeLow
    fb.push(range <= 12 && range >= 4 ? { level: 'good', text: `這段從 ${noteNameOct(hum.rangeLow)} 到 ${noteNameOct(hum.rangeHigh)}，跨了 ${range} 個半音。` } : range > 12 ? { level: 'warn', text: `這段跨了 ${range} 個半音，超過一個八度。`, tip: '唱起來如果有點吃力，可以試試把某一句放低，聽聽喜不喜歡。' } : { level: 'warn', text: '這段的音都靠得很近，起伏不大。', tip: '想換個感覺，可以讓某一句往上走走看。' })
    fb.push(hum.confidence > 0.08 ? { level: 'good', text: '這個調跟這段旋律滿貼的。' } : { level: 'warn', text: '有兩個調我聽起來都像。', tip: '可以在下方換個調聽聽，或到「和聲」用耳朵決定。' })
  }

  const hist = ana?.hist
  const histMax = hist ? Math.max(...hist, 0.001) : 1

  const hasResult = !!hum && !mic.running && !busy
  return (
    <>
      <Coach short={mic.running ? '我在聽……哼完按停止。' : hum ? hum.source === 'demo' ? '這是示範旋律。先聽一小段，喜歡就帶著它繼續。' : hum.source === 'file' ? '音檔整理好了，聽聽是不是你要的樣子。' : '聽聽整理後的樣子，喜歡就帶著它繼續。' : '哼一段腦中的旋律給我聽。不用好聽，有就好。'} />

      <div className="stage">
        {mic.running && <div className={`big-note ${mic.midi != null ? 'on' : ''}`}>{mic.midi != null ? noteNameOct(mic.midi) : '…'}</div>}
        {(shownFrames.length > 0 || shownNotes.length > 0) ? (
          <PitchCanvas frames={shownFrames} notes={shownNotes} duration={shownDur} keyRoot={hum?.keyRoot} keyMode={hum?.keyMode} playhead={playhead} height={180} />
        ) : !mic.running && <div className="stage-empty"><StageSketch kind="piano" /><small>作曲家把琴蓋掀開了，等你起個頭。</small></div>}
        {busy && <p className="muted small center">{analysisSource === 'demo' ? '在聽示範旋律……' : analysisSource === 'file' ? '在聽這段音檔……' : '在聽你剛剛哼的……'}</p>}
        {mic.error && !hasResult && !busy && <p className="error small">{mic.error}</p>}
      </div>

      {mic.running ? (
        <DeskActions primary={{ label: '■ 哼完了', onClick: toggleRec }} />
      ) : hasResult && next ? (
        <DeskActions primary={{ label: <>用這段繼續：{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽聽整理後的音', onClick: () => playNotes(true) }} />
      ) : (
        <DeskActions primary={{ label: mic.pending ? '等麥克風許可…' : busy ? '在聽剛才那段…' : '● 哼一段', onClick: toggleRec, disabled: busy || mic.pending }} secondary={{ label: '沒有麥克風？聽示範', onClick: () => { mic.stop(); demo() } }} />
      )}

      <Toolbox>
        <div className="row wrap">
          {hum && <button className="btn small" disabled={busy || mic.pending} onClick={toggleRec}>● 再哼一次</button>}
          <button ref={uploadRef} type="button" className="btn small" disabled={busy || mic.pending || mic.running} onClick={() => fileRef.current?.click()}>上傳音檔</button>
          <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void onFile(file)
          }} />
          {ana && <button className="btn small" onClick={playOriginal}>▶ {analysisSource === 'demo' ? '再聽示範' : analysisSource === 'file' ? '再聽音檔' : '再聽錄音'}</button>}
          {hum && <button className="btn small" onClick={() => playNotes(false)}>▶ 只聽旋律</button>}
        </div>
        {fileError && <div className="audio-file-notice" role="status" aria-label="音檔提示"><p>這個檔案還讀不出聲音，原本的哼唱還在。換成 mp3 / wav / m4a，再按「上傳音檔」試試看。</p><button className="btn" onClick={() => { setFileError(false); uploadRef.current?.focus() }}>好</button></div>}
        {hum && (
          <div className="result-grid">
            <div className="result"><div className="muted small">調</div><div className="result-big">{keyName(hum.keyRoot, hum.keyMode)}</div></div>
            <div className="result"><div className="muted small">這段的音域</div><div className="result-big">{noteNameOct(hum.rangeLow)}–{noteNameOct(hum.rangeHigh)}</div></div>
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
        <FeedbackList items={fb} empty="哼完之後，我會在這裡跟你說聽到了什麼。" />
        <Why ready={!!hum} title="我怎麼聽出你的「家」？" listen={{ label: '只聽主音', play: () => hum && playNote(60 + hum.keyRoot, 1.5) }}>
          <p>上面的長條圖記下每個音停留了多久。我用這些音猜猜看哪個調可能適合；不一定猜得準，換個調聽聽，挑你喜歡的就好。</p>
          {ana && ana.chordHints.length > 0 && (
            <ol className="hint-list">
              {ana.chordHints.slice(0, 4).map((h, i) => <li key={i}><strong>{h.start.toFixed(1)}–{h.end.toFixed(1)} 秒 → {h.chord}</strong><div className="muted small">{h.why}</div></li>)}
            </ol>
          )}
        </Why>
        <Why ready={!!hum} title="怎麼聽出音的高低？">
          <p>聲音振動得快慢不同，聽起來就有不同的高低。這裡會找聲波重複的節奏，猜猜這段裡有哪些音；有時也會聽錯。</p>
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
    { label: '先留一段聲音：自己哼、上傳，或聽示範都可以', ok: !!p.hum },
    { label: '讓我聽見至少 3 個音', ok: (p.hum?.notes.length ?? 0) >= 3 },
  ],
}
