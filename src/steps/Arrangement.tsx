import { useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
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
  const bars = prog.map((d) => (d != null ? chordVoicing(chords[d]) : []))
  const melody = kind === 'chorus' ? p.melody.chorus : ['verse', 'pre', 'bridge'].includes(kind) ? p.melody.verse : undefined
  return { bars, melody }
}

/** Repeat the four-bar sketch to exactly the section length, including partial repeats. */
export function arrangedAudio(p: Project, section: ArrSection) {
  const { bars, melody } = sectionAudio(p, section.kind)
  return {
    bars: Array.from({length: section.bars}, (_,i) => bars[i % bars.length]),
    melody: melody ? Array.from({length: section.bars * 8}, (_,i) => melody[i % melody.length]) : undefined,
  }
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

function ArrangementStep({ p, update, notify, next }: StepProps) {
  const a = p.arrangement
  const [sel, setSel] = useState<string | null>(a[0]?.id ?? null)
  const [player, setPlayer] = useState<Player | null>(null)
  const set = (id: string, patch: Partial<ArrSection>) => { update('arrangement', a.map((s) => (s.id === id ? { ...s, ...patch } : s))); notify('arrange.change', '') }
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
    const { bars, melody } = arrangedAudio(p, s)
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody, layers: s.layers, onStep: (x) => x < 0 && setPlayer(null) }))
    notify('arrange.preview', s.kind)
  }
  const cur = a.find((s) => s.id === sel)
  const maxE = LAYERS.reduce((x, l) => x + l.w, 0)
  const fb = arrangementFeedback(p)

  const sketch = () => {
    // 只排「骨架」：前奏 → 主歌 → 副歌 → 主歌 → 副歌 → 尾奏，全部只有鋼琴與主唱；誰要加進來，由你決定
    const kinds: SectionKind[] = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro']
    const list = kinds.map((k) => ({ id: uid(), kind: k, bars: k === 'intro' || k === 'outro' ? 4 : 8, layers: { ...DEFAULT_LAYERS[k] } }))
    update('arrangement', list)
    setSel(list[2].id)
    notify('arrange.change', '')
  }
  const ready = arrangementStep.requirements(p).every((r) => r.ok)
  const say = a.length === 0 ? '先排出段落，再決定每一段誰上場。'
    : !ready ? '點一段，決定誰上場。也試試讓主歌和副歌有點不同。'
    : '能量有起伏了。聽聽看。'
  return (
    <>
      <Coach short={say} />

      {a.length > 0 && (
        <div className="energy">
          {a.map((s) => (
            <button key={s.id} className={`energy-col ${sel === s.id ? 'on' : ''} k-${s.kind}`} style={{ flexGrow: s.bars }} onClick={() => setSel(s.id)}>
              <div className="energy-bar" style={{ height: `${(energy(s) / maxE) * 100}%` }} />
              <span className="energy-label">{KIND_ZH[s.kind]}</span>
            </button>
          ))}
        </div>
      )}

      {cur && (
        <div className="layer-grid">
          {LAYERS.map((l) => (
            <button key={l.id} className={`layer ${cur.layers[l.id] ? 'on' : ''}`} onClick={() => set(cur.id, { layers: { ...cur.layers, [l.id]: !cur.layers[l.id] } })}>{l.name}</button>
          ))}
        </div>
      )}

      {player ? (
        <DeskActions primary={{ label: '■ 停', onClick: () => { player.stop(); setPlayer(null) } }} />
      ) : a.length === 0 ? (
        <DeskActions primary={{ label: '排一個常見的骨架', onClick: sketch }} />
      ) : ready && next ? (
        <DeskActions primary={{ label: <>編好了，去{next.label} →</>, onClick: next.go }} secondary={cur ? { label: `▶ 試聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) } : undefined} />
      ) : cur ? (
        <DeskActions primary={{ label: `▶ 試聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) }} />
      ) : null}

      <Toolbox>
        <div className="row wrap">
          {(['intro', 'verse', 'pre', 'chorus', 'bridge', 'inter', 'outro'] as SectionKind[]).map((k) => (
            <button key={k} className="btn small" onClick={() => add(k)}>＋ {KIND_ZH[k]}</button>
          ))}
        </div>
        {cur && (
          <div className="row wrap">
            <label className="row small">{KIND_ZH[cur.kind]} 小節數
              <select value={cur.bars} onChange={(e) => set(cur.id, { bars: +e.target.value })}>
                {[2, 4, 8, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn small" onClick={() => move(a.indexOf(cur), -1)}>往前</button>
            <button className="btn small" onClick={() => move(a.indexOf(cur), 1)}>往後</button>
            <button className="btn small" onClick={() => { update('arrangement', a.filter((s) => s.id !== cur.id)); setSel(null) }}>刪掉</button>
          </div>
        )}
        {a.length > 0 && <p className="muted small">長條越高越熱鬧，越寬越長。全長約 {fmtTime(songSeconds(p))}。</p>}
        <FeedbackList items={fb} />
        <Why ready={a.length >= 3} title="主歌收一點，會是什麼感覺？">
          <p>試試讓主歌安靜一點，副歌再多加個聲音。兩段聽起來有什麼不同？</p>
        </Why>
      </Toolbox>
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
