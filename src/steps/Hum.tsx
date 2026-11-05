import { useRef, useState } from 'react'
import { Card, Coach, FeedbackList, Why, type Feedback } from '../components/ui'
import { PitchCanvas } from '../components/PitchCanvas'
import { ac, playNote, tone } from '../lib/audio'
import { useMic } from '../lib/mic'
import { analyzeBuffer, synthDemoHum, toMono, type HumAnalysis, type PitchFrame } from '../lib/pitch'
import { keyName, noteNameOct, NOTE_NAMES, SCALES, inScale, pc } from '../lib/theory'
import type { StepDef, StepProps } from './types'

function HumStep({ p, update, notify }: StepProps) {
  const [live, setLive] = useState<PitchFrame[]>([])
  const [ana, setAna] = useState<HumAnalysis | null>(null)
  const [busy, setBusy] = useState(false)
  const [playhead, setPlayhead] = useState<number | null>(null)
  const rawRef = useRef<{ data: Float32Array; sampleRate: number } | null>(null)
  const liveRef = useRef<PitchFrame[]>([])
  const mic = useMic({
    record: true,
    maxSec: 25,
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

  return (
    <>
      <Coach>
        每首歌都從一個「哼出來的念頭」開始。別擔心唱得好不好——先把腦中那段旋律哼給我聽，我幫你看見它：它在哪個調、喜歡哪些和弦。
        之後的每一章，我們都會回頭用到這段哼唱。
      </Coach>

      <Card title="錄一段哼唱（8–20 秒）">
        <div className="row wrap">
          <button className={`btn ${mic.running ? 'btn-danger' : 'btn-primary'}`} onClick={toggleRec}>
            {mic.running ? '■ 停止並分析' : '● 開始哼唱'}
          </button>
          <label className="btn">
            上傳音檔
            <input type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <button className="btn btn-ghost" onClick={demo}>沒有麥克風？用示範哼唱體驗</button>
        </div>
        {mic.error && <p className="error">{mic.error}</p>}
        {mic.running && (
          <div className="live-pitch">
            <span className={`big-note ${mic.midi != null ? 'on' : ''}`}>{mic.midi != null ? noteNameOct(mic.midi) : '—'}</span>
            <span className="muted small">即時音高：線條越平穩，代表你的音越穩。</span>
          </div>
        )}
        {busy && <p className="muted">分析中…</p>}
        {(shownFrames.length > 0 || shownNotes.length > 0) && (
          <PitchCanvas frames={shownFrames} notes={shownNotes} duration={shownDur} keyRoot={hum?.keyRoot} keyMode={hum?.keyMode} playhead={playhead} />
        )}
        {(ana || hum) && !mic.running && (
          <div className="row wrap" style={{ marginTop: 8 }}>
            {ana && <button className="btn" onClick={playOriginal}>▶ 原始錄音</button>}
            <button className="btn" onClick={() => playNotes(false)}>▶ 整理後的音</button>
            <button className="btn" onClick={() => playNotes(true)}>▶ 加上主音襯底</button>
          </div>
        )}
        <p className="muted small">灰線：每 10 毫秒偵測到的音高。色塊：整理成音符後的結果（綠＝在調內，紅＝調外音）。</p>
      </Card>

      {hum && (
        <Card title="老師的解析">
          <div className="result-grid">
            <div className="result">
              <div className="muted small">估計調性</div>
              <div className="result-big">{keyName(hum.keyRoot, hum.keyMode)}</div>
            </div>
            <div className="result">
              <div className="muted small">你的舒適音域</div>
              <div className="result-big">{noteNameOct(hum.rangeLow)}–{noteNameOct(hum.rangeHigh)}</div>
            </div>
            <div className="result">
              <div className="muted small">建議和弦</div>
              <div className="result-big">{[...new Set(hum.chordHints)].slice(0, 4).join(' · ') || '—'}</div>
            </div>
          </div>

          {hist && (
            <div className="hist">
              {hist.map((v, i) => (
                <div key={i} className="hist-col" title={`${NOTE_NAMES[i]}：${v.toFixed(1)} 秒`}>
                  <div className={`hist-bar ${SCALES[hum.keyMode].includes(pc(i - hum.keyRoot)) ? 'in' : ''} ${i === hum.keyRoot ? 'tonic' : ''}`} style={{ height: `${(v / histMax) * 100}%` }} />
                  <span>{NOTE_NAMES[i]}</span>
                </div>
              ))}
            </div>
          )}

          <div className="explain">
            <p>
              <strong>白話解釋：</strong>我把你唱的每個音「唱了多久」加總起來（上面的長條圖）。
              你停留最久、最常回去的音，通常就是這首歌的「家」——主音 <strong>{NOTE_NAMES[hum.keyRoot]}</strong>。
              再拿這個分佈去跟 24 個調的典型樣子比對，最像的是 <strong>{keyName(hum.keyRoot, hum.keyMode)}</strong>
              {hum.keyMode === 'major' ? '：大調通常聽起來明亮、開闊。' : '：小調通常聽起來內斂、帶點憂傷。'}
            </p>
            {ana && ana.chordHints.length > 0 && (
              <ol className="hint-list">
                {ana.chordHints.slice(0, 6).map((h, i) => (
                  <li key={i}>
                    <strong>{h.start.toFixed(1)}–{h.end.toFixed(1)} 秒 → {h.chord}（{h.roman}）</strong>
                    <div className="muted small">{h.why}</div>
                  </li>
                ))}
              </ol>
            )}
            {ana && (
              <div className="row wrap small">
                <span className="muted">不像嗎？試試其他候選：</span>
                {ana.keys.slice(0, 3).map((k, i) => (
                  <button
                    key={i}
                    className={`chip ${k.root === hum.keyRoot && k.mode === hum.keyMode ? 'on' : ''}`}
                    onClick={() => {
                      update('hum', { ...hum, keyRoot: k.root, keyMode: k.mode })
                      update('harmony', (h) => ({ ...h, root: k.root, mode: k.mode }))
                      playNote(60 + k.root, 0.8)
                    }}
                  >
                    {keyName(k.root, k.mode)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <Card title="即時回饋">
        <FeedbackList items={fb} empty="哼完之後，這裡會用綠／黃／紅燈告訴你哪裡很棒、哪裡可以調。" />
      </Card>

      <Why ready={!!hum} hint="先哼一段（或用示範哼唱）。" listen={{ label: '再聽一次你的哼唱＋主音', play: () => playNotes(true) }} title="為什麼要從哼唱開始？" apply="寫歌卡關時、在路上想到旋律時，先錄音再分析，比坐在鋼琴前硬想更自然。">
        <p>旋律是一首歌最容易被記住的部分。直接從身體裡的聲音出發，比從理論出發更像「你的歌」。分析只是幫你看見你已經會的事。</p>
      </Why>
      <Why ready={!!hum} title="電腦怎麼知道我唱什麼音？" apply="調音器 App、卡拉 OK 評分、自動修音（Auto-Tune）都用類似原理。">
        <p>聲音是空氣的振動。唱 A 音時，每秒振動 440 次。程式把聲波跟「往後挪一點的自己」比較（自相關），重疊最好的位移量就是一次振動的長度，換算成頻率就得到音高。</p>
      </Why>
      <Why ready={!!hum} listen={{ label: '只聽主音（家）', play: () => hum && playNote(60 + hum.keyRoot, 1.5) }} title="什麼是「調」？為什麼重要？" apply="選翻唱的 Key、跟樂手溝通、即興伴奏都要先知道調。">
        <p>調就是一首歌的「家」和它常用的 7 個音。知道調，就知道哪些和弦一定好聽（下一章會用到），也知道哪些音會製造張力。</p>
      </Why>
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
