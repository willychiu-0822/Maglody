import { useState } from 'react'
import { Card, Coach, FeedbackList, Why, type Feedback } from '../components/ui'
import { playLoop, type Player } from '../lib/audio'
import { uid, type ArrSection, type LayerId, type Project, type SectionKind } from '../lib/store'
import { chordVoicing, diatonicChords } from '../lib/theory'
import { KIND_ZH } from './Lyrics'
import type { StepDef, StepProps } from './types'

export const LAYERS: { id: LayerId; name: string; w: number; why: string }[] = [
  { id: 'drums', name: '鼓', w: 3, why: '節奏骨架，加入就像心跳開始' },
  { id: 'bass', name: '貝斯', w: 2, why: '低頻地基，讓和弦有重量' },
  { id: 'keys', name: '鋼琴/吉他', w: 2, why: '和弦主體，節奏型決定律動' },
  { id: 'pad', name: '弦樂鋪底', w: 1.5, why: '長音襯底，增加寬度和情緒' },
  { id: 'melody', name: '主唱旋律', w: 1.5, why: '歌的主角' },
]

const DEFAULT_LAYERS: Record<SectionKind, Record<LayerId, boolean>> = {
  intro: { drums: false, bass: false, keys: true, pad: false, melody: false },
  verse: { drums: false, bass: false, keys: true, pad: false, melody: true },
  pre: { drums: false, bass: false, keys: true, pad: false, melody: true },
  chorus: { drums: false, bass: false, keys: true, pad: false, melody: true },
  bridge: { drums: false, bass: false, keys: true, pad: false, melody: true },
  inter: { drums: false, bass: false, keys: true, pad: false, melody: false },
  outro: { drums: false, bass: false, keys: true, pad: false, melody: false },
}

export const energy = (s: ArrSection) => LAYERS.reduce((a, l) => a + (s.layers[l.id] ? l.w : 0), 0)
export const songSeconds = (p: Project) => p.arrangement.reduce((a, s) => a + s.bars, 0) * 4 * (60 / p.idea.bpm)
export const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

export function sectionAudio(p: Project, kind: SectionKind) {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const useChorus = ['chorus', 'intro', 'inter', 'outro'].includes(kind)
  const prog = p.harmony[useChorus ? 'chorus' : 'verse']
  const bars = prog.map((d) => (d != null ? chordVoicing(chords[d]) : chordVoicing(chords[0])))
  const melody = kind === 'chorus' ? p.melody.chorus : ['verse', 'pre', 'bridge'].includes(kind) ? p.melody.verse : undefined
  return { bars, melody }
}

export function arrangementFeedback(p: Project): Feedback[] {
  const a = p.arrangement
  const fb: Feedback[] = []
  if (a.length < 3) return [{ level: 'warn', text: '先排出至少 3 個段落。' }]
  const ch = a.filter((s) => s.kind === 'chorus')
  const vs = a.filter((s) => s.kind === 'verse')
  fb.push(ch.length >= 2 ? { level: 'good', text: `副歌出現 ${ch.length} 次，聽眾會記住它。` } : { level: 'warn', text: '副歌只出現一次。', tip: '流行歌的副歌通常出現 2–3 次，重複就是記憶。' })
  if (a[0].kind === 'intro') fb.push({ level: 'good', text: '有前奏，先讓聽眾進入氣氛。' })
  else fb.push({ level: 'warn', text: '沒有前奏，一開始就唱。', tip: '這很有衝擊力，但新手錄音時，1–2 小節前奏能幫歌手抓到速度和音準。' })
  if (ch.length && vs.length) {
    const ce = Math.min(...ch.map(energy)), ve = Math.max(...vs.map(energy))
    fb.push(ce > ve ? { level: 'good', text: '每段副歌的能量都比主歌高，有起伏。' } : { level: 'bad', text: '副歌的編曲沒有比主歌滿。', tip: '主歌少放一兩個樂器（例如先不要鼓），副歌再全部進來，對比就出來了。' })
  }
  const lastChorus = a.map((s) => s.kind).lastIndexOf('chorus')
  const dip = a.some((s, i) => i > 0 && i < lastChorus && energy(s) < energy(a[i - 1]) - 2)
  fb.push(dip ? { level: 'good', text: '中段有能量下降再拉起，最後一次副歌會更有力。' } : { level: 'warn', text: '整首能量一路持平或只往上。', tip: '在最後一次副歌前放一段「收起來」的橋段或間奏，像深呼吸後再衝。' })
  const dur = songSeconds(p)
  fb.push(dur >= 150 && dur <= 270 ? { level: 'good', text: `全長約 ${fmtTime(dur)}，是流行歌常見長度。` } : dur < 150 ? { level: 'warn', text: `全長約 ${fmtTime(dur)}，偏短。`, tip: '可以加長段落小節數，或多一次副歌。短歌也沒問題，Demo 階段 2 分鐘就很好。' } : { level: 'warn', text: `全長約 ${fmtTime(dur)}，偏長。`, tip: '聽眾注意力有限，試著刪掉重複太多的段落。' })
  const sameAll = a.every((s) => energy(s) === energy(a[0]))
  if (sameAll) fb.push({ level: 'bad', text: '所有段落的樂器完全一樣。', tip: '編曲的核心就是「何時加、何時減」。' })
  return fb
}

function ArrangementStep({ p, update }: StepProps) {
  const a = p.arrangement
  const [sel, setSel] = useState<string | null>(a[0]?.id ?? null)
  const [player, setPlayer] = useState<Player | null>(null)
  const set = (id: string, patch: Partial<ArrSection>) => update('arrangement', a.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const add = (kind: SectionKind) => {
    const s: ArrSection = { id: uid(), kind, bars: kind === 'intro' || kind === 'outro' || kind === 'inter' ? 4 : 8, layers: { ...DEFAULT_LAYERS[kind] } }
    update('arrangement', [...a, s])
    setSel(s.id)
  }
  const move = (i: number, d: number) => {
    const n = [...a]
    const j = i + d
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    update('arrangement', n)
  }
  const preview = (s: ArrSection) => {
    player?.stop()
    const { bars, melody } = sectionAudio(p, s.kind)
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody, layers: s.layers, onStep: (x) => x < 0 && setPlayer(null) }))
  }
  const cur = a.find((s) => s.id === sel)
  const maxE = LAYERS.reduce((x, l) => x + l.w, 0)
  const fb = arrangementFeedback(p)

  return (
    <>
      <Coach>
        同樣的旋律和和弦，靠「編曲」可以從安靜的獨白變成全場大合唱。編曲的秘密不是加很多樂器，而是決定<strong>什麼時候加、什麼時候拿掉</strong>。
        先排出歌曲的段落順序，再為每段決定要哪些樂器，看看下面的能量曲線有沒有起伏。
      </Coach>

      <Card title="1. 段落順序">
        <div className="row wrap">
          {(['intro', 'verse', 'pre', 'chorus', 'bridge', 'inter', 'outro'] as SectionKind[]).map((k) => (
            <button key={k} className="btn btn-ghost small" onClick={() => add(k)}>＋ {KIND_ZH[k]}</button>
          ))}
        </div>
        {a.length === 0 && <p className="muted small">提示：一首常見的流行歌是「前奏 → 主歌 → 副歌 → 主歌 → 副歌 → 橋段 → 副歌 → 尾奏」。你可以照這個排，也可以打破它。</p>}

        {a.length > 0 && (
          <div className="energy">
            {a.map((s, i) => (
              <button key={s.id} className={`energy-col ${sel === s.id ? 'on' : ''} k-${s.kind}`} style={{ flexGrow: s.bars }} onClick={() => setSel(s.id)}>
                <div className="energy-bar" style={{ height: `${(energy(s) / maxE) * 100}%` }} />
                <span className="energy-label">{KIND_ZH[s.kind]}</span>
                <span className="energy-sub">{i + 1}</span>
              </button>
            ))}
          </div>
        )}
        {a.length > 0 && <p className="muted small">長條高度＝能量（樂器越多越高），寬度＝小節數。全長約 {fmtTime(songSeconds(p))}（{p.idea.bpm} BPM）。</p>}
      </Card>

      {cur && (
        <Card title={`2. 編輯：${KIND_ZH[cur.kind]}（第 ${a.indexOf(cur) + 1} 段）`}>
          <div className="row wrap between">
            <label className="row small">小節數
              <select value={cur.bars} onChange={(e) => set(cur.id, { bars: +e.target.value })}>
                {[2, 4, 8, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="row">
              <button className="icon-btn" onClick={() => move(a.indexOf(cur), -1)} aria-label="往前">←</button>
              <button className="icon-btn" onClick={() => move(a.indexOf(cur), 1)} aria-label="往後">→</button>
              <button className="icon-btn" onClick={() => { update('arrangement', a.filter((s) => s.id !== cur.id)); setSel(null) }} aria-label="刪除">✕</button>
            </div>
          </div>
          <div className="layer-grid">
            {LAYERS.map((l) => (
              <button key={l.id} className={`layer ${cur.layers[l.id] ? 'on' : ''}`} onClick={() => set(cur.id, { layers: { ...cur.layers, [l.id]: !cur.layers[l.id] } })}>
                <strong>{l.name}</strong>
                <span className="small muted">{l.why}</span>
              </button>
            ))}
          </div>
          <div className="row">
            {!player ? <button className="btn btn-primary" onClick={() => preview(cur)}>▶ 試聽這段（4 小節）</button> : <button className="btn btn-danger" onClick={() => { player.stop(); setPlayer(null) }}>■ 停止</button>}
          </div>
        </Card>
      )}

      <Card title="即時回饋">
        <FeedbackList items={fb} />
      </Card>

      <Why title="為什麼要「減法編曲」？" apply="做簡報時，重點頁才放大圖大字；影片剪輯時，高潮前先安靜。">
        <p>耳朵對「變化」最敏感，而不是對「多」。如果從頭到尾都很滿，副歌就沒有爆發感。主歌少一點，副歌才顯得大。</p>
      </Why>
      <Why title="每種樂器的工作是什麼？" apply="聽歌時試著只聽貝斯、只聽鼓，你會開始聽見編曲。">
        <p>鼓＝時間與能量；貝斯＝連結鼓和和弦的低音地基；鋼琴/吉他＝和聲與律動；弦樂鋪底＝空間與情緒；主唱＝故事。每個樂器佔不同的音域和角色，才不會互相打架。</p>
      </Why>
      <Why title="為什麼結構常是主歌–副歌–主歌–副歌–橋段–副歌？" apply="寫文章的起承轉合、電影的三幕劇，都是同一套張力設計。">
        <p>重複讓人記住，變化讓人不膩。橋段（Bridge）是唯一「新的東西」，讓最後一次副歌聽起來像回家。</p>
      </Why>
    </>
  )
}

export const arrangementStep: StepDef = {
  key: 'arrange',
  title: '編曲',
  subtitle: '決定什麼時候加、什麼時候減',
  glyph: '編',
  Component: ArrangementStep,
  requirements: (p) => [
    { label: '至少 4 個段落', ok: p.arrangement.length >= 4 },
    { label: '包含主歌與副歌', ok: p.arrangement.some((s) => s.kind === 'verse') && p.arrangement.some((s) => s.kind === 'chorus') },
    { label: '各段樂器不完全相同', ok: new Set(p.arrangement.map(energy)).size > 1 },
  ],
}
