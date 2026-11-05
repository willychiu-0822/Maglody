import { useMemo, useState } from 'react'
import { Card, Coach, FeedbackList, Why, type Feedback, type Level } from '../components/ui'
import { playLoop, playNote, type Player } from '../lib/audio'
import { chordVoicing, diatonicChords, inScale, jianpu, noteNameOct, pc, scaleNote, snapToScale, type Chord } from '../lib/theory'
import { cleanLine } from '../lib/rhyme'
import type { Project } from '../lib/store'
import { lyricLines } from './Lyrics'
import type { StepDef, StepProps } from './types'

type Part = 'verse' | 'chorus'
const STEPS = 32
const HOLD = -1

/** 依哼唱音域決定格子要顯示哪個八度 */
export function melodyRows(p: Project): number[] {
  const { root, mode } = p.harmony
  const mid = p.hum ? (p.hum.rangeLow + p.hum.rangeHigh) / 2 : 64
  const base = Math.round((mid - 4 - pc(root)) / 12) * 12
  const rows: number[] = []
  for (let s = -3; s <= 10; s++) rows.push(scaleNote(root, mode, s, base))
  return rows.reverse()
}

/** 找出某格實際在響的音（延長格往前追） */
export const soundingAt = (cells: (number | null)[], i: number): number | null => {
  let k = i
  while (k >= 0 && cells[k] === HOLD) k--
  return k >= 0 ? cells[k] : null
}

export function cellLevel(m: number, col: number, chord: Chord | null): Level {
  if (!chord) return 'warn'
  if (chord.pcs.includes(pc(m))) return 'good'
  const strong = col % 8 === 0 || col % 8 === 4
  return strong ? 'bad' : 'warn'
}

export function melodyFeedback(p: Project, part: Part): Feedback[] {
  const cells = p.melody[part]
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = p.harmony[part]
  const notes = cells.map((m, i) => ({ m, i })).filter((x): x is { m: number; i: number } => x.m != null && x.m >= 0)
  const fb: Feedback[] = []
  if (notes.length < 4) return [{ level: 'warn', text: '再多放幾個音，老師才能給建議。' }]
  // 強拍和弦音
  const strong = notes.filter((n) => n.i % 4 === 0)
  const chordAt = (i: number) => { const d = prog[Math.floor(i / 8)]; return d != null ? chords[d] : null }
  const fit = strong.filter((n) => chordAt(n.i)?.pcs.includes(pc(n.m))).length
  const r = strong.length ? fit / strong.length : 1
  fb.push(r >= 0.7 ? { level: 'good', text: `強拍上 ${Math.round(r * 100)}% 是和弦音，旋律和伴奏很「黏」。` } : r >= 0.45 ? { level: 'warn', text: `強拍上只有 ${Math.round(r * 100)}% 是和弦音。`, tip: '紅色格子在強拍上和和弦打架。移到上下相鄰的綠色格，或把它放到弱拍當「經過音」。' } : { level: 'bad', text: '強拍上的音大多不在和弦裡，聽起來會很不穩。', tip: '每小節第 1 格先放和弦音（綠色），再用其他音連接。' })
  // 音域
  const ms = notes.map((n) => n.m)
  const range = Math.max(...ms) - Math.min(...ms)
  fb.push(range <= 12 ? { level: 'good', text: `音域 ${range} 個半音，在一個八度內，好唱。` } : { level: 'warn', text: `音域 ${range} 個半音，超過一個八度。`, tip: '新手歌手會唱得很辛苦。試著把最高或最低的幾個音往中間收。' })
  if (p.hum) {
    const hi = Math.max(...ms), lo = Math.min(...ms)
    if (hi > p.hum.rangeHigh + 2 || lo < p.hum.rangeLow - 2) fb.push({ level: 'warn', text: `有音超出你哼唱時的舒適音域（${noteNameOct(p.hum.rangeLow)}–${noteNameOct(p.hum.rangeHigh)}）。`, tip: '可以留著當挑戰，但錄音前要確認唱得上去。' })
  }
  // 大跳
  let leaps = 0
  for (let k = 1; k < notes.length; k++) if (Math.abs(notes[k].m - notes[k - 1].m) > 7) leaps++
  fb.push(leaps === 0 ? { level: 'good', text: '沒有超過五度的大跳，旋律走得流暢。' } : leaps <= 2 ? { level: 'good', text: `有 ${leaps} 次大跳：適量的大跳很有戲劇性。`, tip: '大跳之後，往反方向「級進」（一步一步走）回來會更自然。' } : { level: 'warn', text: `大跳 ${leaps} 次，偏多。`, tip: '大部分的好旋律以級進（相鄰音）為主，大跳是調味料。' })
  // 換氣
  const restHalves = [0, 1].map((h) => cells.slice(h * 16, h * 16 + 16).some((c) => c == null))
  fb.push(restHalves.every(Boolean) ? { level: 'good', text: '每兩小節都有休止，歌手可以換氣。' } : { level: 'warn', text: '有兩小節完全沒留空。', tip: '唱歌要換氣，聽眾也需要「消化」——在句尾留一兩格空白。' })
  // 結尾
  const last = notes[notes.length - 1]
  const tonic = pc(last.m - p.harmony.root) === 0
  if (part === 'chorus') fb.push(tonic ? { level: 'good', text: '副歌結尾落在主音，有「說完了」的完整感。' } : { level: 'warn', text: '副歌結尾沒有回到主音。', tip: `停在 ${noteNameOct(last.m)} 會有「未完」的感覺。如果想要收尾，試試最後一個音放主音（簡譜 ${jianpu(p.harmony.root + 60, p.harmony.root, p.harmony.mode)}）。` })
  // 副歌比主歌高
  const other = p.melody[part === 'verse' ? 'chorus' : 'verse'].filter((m): m is number => m != null && m >= 0)
  if (other.length >= 4) {
    const vMax = Math.max(...(part === 'verse' ? ms : other)), cMax = Math.max(...(part === 'chorus' ? ms : other))
    fb.push(cMax > vMax ? { level: 'good', text: '副歌的最高音比主歌高，情緒有往上推。' } : { level: 'warn', text: '副歌沒有比主歌高。', tip: '最常見的副歌技巧：整體往上移 3–5 度，讓情緒爆發。' })
  }
  // 歌詞對位
  const sec = p.lyrics.find((s) => s.kind === part)
  if (sec) {
    const ls = lyricLines(sec.text)
    const syl = ls.slice(0, 2).reduce((a, l) => a + cleanLine(l).length, 0)
    const onsets = notes.length
    if (syl) fb.push(Math.abs(syl - onsets) <= 3 ? { level: 'good', text: `${part === 'verse' ? '主歌' : '副歌'}前兩句共 ${syl} 字，旋律有 ${onsets} 個音，一字一音剛好。` } : { level: 'warn', text: `前兩句 ${syl} 字，但旋律有 ${onsets} 個音。`, tip: onsets > syl ? '音比字多：可以把某些音改成「延長」，或一個字唱兩個音（轉音）。' : '字比音多：加音，或刪減歌詞。中文歌通常一字一音。' })
  }
  return fb
}

function MelodyStep({ p, update }: StepProps) {
  const [part, setPart] = useState<Part>('chorus')
  const [hold, setHold] = useState(false)
  const [col, setCol] = useState(-1)
  const [player, setPlayer] = useState<Player | null>(null)
  const rows = useMemo(() => melodyRows(p), [p.harmony.root, p.harmony.mode, p.hum])
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = p.harmony[part]
  const cells = p.melody[part]
  const setCells = (c: (number | null)[]) => update('melody', { ...p.melody, [part]: c })

  const tap = (rowMidi: number, i: number) => {
    const n = [...cells]
    if (hold) {
      if (i === 0) return
      n[i] = n[i] === HOLD ? null : HOLD
    } else if (n[i] === rowMidi) {
      n[i] = null
      for (let k = i + 1; k < STEPS && n[k] === HOLD; k++) n[k] = null
    } else {
      n[i] = rowMidi
      playNote(rowMidi, 0.3, { type: 'square', gain: 0.15 })
    }
    setCells(n)
  }

  const play = () => {
    player?.stop()
    const bars = prog.map((d) => (d != null ? chordVoicing(chords[d]) : [0]))
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody: cells, loop: true, layers: { drums: false, bass: true, keys: true, pad: false, melody: true }, onStep: setCol }))
  }
  const stop = () => { player?.stop(); setPlayer(null) }

  const importHum = () => {
    if (!p.hum) return
    const eighth = 60 / p.idea.bpm / 2
    const n: (number | null)[] = new Array(STEPS).fill(null)
    const lo = rows[rows.length - 1], hi = rows[0]
    const first = p.hum.notes[0]?.start ?? 0
    p.hum.notes.forEach((note) => {
      const s = Math.round((note.start - first) / eighth)
      const len = Math.max(1, Math.round(note.dur / eighth))
      if (s >= STEPS) return
      let m = snapToScale(note.midi, p.harmony.root, p.harmony.mode)
      while (m > hi) m -= 12
      while (m < lo) m += 12
      if (n[s] == null || n[s] === HOLD) n[s] = m
      for (let k = 1; k < len && s + k < STEPS; k++) if (n[s + k] == null) n[s + k] = HOLD
    })
    setCells(n)
  }

  const fb = melodyFeedback(p, part)
  const missingChords = prog.some((d) => d == null)

  return (
    <>
      <Coach>
        現在把旋律寫進格子裡。每一格是半拍，每 8 格是一小節，上方是你在「和聲」選的和弦。
        綠色＝和弦音（最穩）、黃色＝經過音（帶動流動）、紅色＝強拍上的衝突音（有張力，要小心用）。
        {p.hum && ' 可以先把你的哼唱匯入當草稿，再一格一格修。'}
        一邊播放一邊改，用耳朵當最後的裁判。
      </Coach>

      <Card>
        <div className="row wrap between">
          <div className="seg">
            <button className={part === 'verse' ? 'on' : ''} onClick={() => { stop(); setPart('verse') }}>主歌旋律</button>
            <button className={part === 'chorus' ? 'on' : ''} onClick={() => { stop(); setPart('chorus') }}>副歌旋律</button>
          </div>
          <div className="row wrap">
            <button className={`btn ${hold ? 'btn-primary' : ''}`} onClick={() => setHold(!hold)}>{hold ? '延長模式：開' : '延長模式'}</button>
            {!player ? <button className="btn btn-primary" onClick={play} disabled={missingChords}>▶ 循環播放</button> : <button className="btn btn-danger" onClick={stop}>■ 停止</button>}
          </div>
        </div>
        {missingChords && <p className="error small">請先回到「和聲」把{part === 'verse' ? '主歌' : '副歌'}的 4 個和弦排好。</p>}

        <div className="roll-scroll">
          <div className="roll" style={{ gridTemplateColumns: `44px repeat(${STEPS}, minmax(26px, 1fr))` }}>
            <div className="roll-corner" />
            {[0, 1, 2, 3].map((b) => (
              <div key={b} className="roll-chord" style={{ gridColumn: `span 8` }}>{prog[b] != null ? `${chords[prog[b]!].name}（${chords[prog[b]!].roman}）` : '—'}</div>
            ))}
            {rows.map((m) => {
              const isTonic = pc(m - p.harmony.root) === 0
              return (
                <div key={m} className="roll-row" style={{ display: 'contents' }}>
                  <button className={`roll-label ${isTonic ? 'tonic' : ''}`} onClick={() => playNote(m, 0.4)}>
                    <strong>{jianpu(m, p.harmony.root, p.harmony.mode)}</strong>
                    <span>{noteNameOct(m)}</span>
                  </button>
                  {cells.map((_, i) => {
                    const sounding = soundingAt(cells, i)
                    const isStart = cells[i] === m
                    const isHold = cells[i] === HOLD && sounding === m
                    const d = prog[Math.floor(i / 8)]
                    const ch = d != null ? chords[d] : null
                    const lvl = isStart ? cellLevel(m, i, ch) : null
                    const chordTone = ch?.pcs.includes(pc(m))
                    return (
                      <button
                        key={i}
                        className={`cell ${i % 8 === 0 ? 'bar' : ''} ${i % 2 === 0 ? 'beat' : ''} ${chordTone ? 'ct' : ''} ${isStart ? `note n-${lvl}` : ''} ${isHold ? `hold n-${cellLevel(m, i - 1, ch)}` : ''} ${col === i ? 'now' : ''} ${isTonic ? 'tonic-row' : ''}`}
                        onClick={() => tap(m, i)}
                        aria-label={`${noteNameOct(m)} 第${i + 1}格`}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 8 }}>
          {p.hum && <button className="btn btn-ghost" onClick={importHum}>匯入我的哼唱當草稿</button>}
          {part === 'chorus' && p.melody.verse.some((x) => x != null) && <button className="btn btn-ghost" onClick={() => setCells(p.melody.verse.map((m) => (m != null && m >= 0 ? (inScale(m + 4, p.harmony.root, p.harmony.mode) ? m + 4 : m + 3) : m)))}>從主歌複製並往上移（再自己改）</button>}
          <button className="btn btn-ghost" onClick={() => setCells(new Array(STEPS).fill(null))}>清空</button>
        </div>
        <p className="muted small">左側數字是簡譜（點一下可試聽）。淡綠底色的格子是當下和弦的組成音。延長模式下點格子＝把前一個音拉長。</p>
      </Card>

      <Card title="即時回饋">
        <FeedbackList items={fb} />
      </Card>

      <Card title="自我聆聽筆記">
        <textarea rows={3} value={p.melody.reflections} placeholder="播放 3 次後寫下：哪一句最想一直唱？哪一個音聽起來怪怪的？" onChange={(e) => update('melody', { ...p.melody, reflections: e.target.value })} />
      </Card>

      <Why title="為什麼強拍要放和弦音？" apply="即興 Solo、寫 Bass 線、編合聲都遵守同一個原則。">
        <p>強拍（每拍的開頭）是耳朵最注意的地方。在強拍上唱和弦音，旋律和伴奏會融在一起；把非和弦音放在弱拍，它就變成「從一個和弦音走到另一個」的經過音，讓旋律流動。</p>
      </Why>
      <Why title="為什麼級進為主、大跳為輔？" apply="分析任何一首你喜歡的歌，數數看有幾次大跳。">
        <p>人聲最自然的移動是相鄰音（級進）。大跳像說話時突然提高音量，偶爾用很有戲劇性，太多會難唱又沒重點。經典技巧：大跳之後往反方向級進回來。</p>
      </Why>
      <Why title="為什麼副歌要比主歌高？" apply="簡報的高潮、影片配樂的爆點，都靠「拉高」製造情緒。">
        <p>音高越高，聲帶越緊繃，聽起來越激動。主歌待在中低音域「說故事」，副歌往上「喊出來」，聽眾會自然感受到情緒升溫。</p>
      </Why>
    </>
  )
}

export const melodyStep: StepDef = {
  key: 'melody',
  title: '旋律',
  subtitle: '把哼唱整理成可以唱的旋律',
  glyph: '曲',
  Component: MelodyStep,
  requirements: (p) => [
    { label: '主歌旋律至少 8 個音', ok: p.melody.verse.filter((m) => m != null && m >= 0).length >= 8 },
    { label: '副歌旋律至少 8 個音', ok: p.melody.chorus.filter((m) => m != null && m >= 0).length >= 8 },
  ],
}
