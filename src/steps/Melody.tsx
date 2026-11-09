import { useEffect, useMemo, useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback, type Level } from '../components/ui'
import { playLoop, playNote, type Player } from '../lib/audio'
import { chordVoicing, diatonicChords, inScale, jianpu, noteNameOct, pc, scaleNote, snapToScale, SCALES, type Chord, type Mode } from '../lib/theory'
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

/** 五聲音階要避開的音：大調的 4、7 級；小調的 2、6 級 */
export const isAvoid = (m: number, root: number, mode: Mode) => {
  const deg = SCALES[mode].indexOf(pc(m - root))
  return mode === 'major' ? deg === 3 || deg === 6 : deg === 1 || deg === 5
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
  // 動機：第 1 小節的節奏型是否在後面重複出現（重複＋變化）
  const rhythm = (b: number) => cells.slice(b * 8, b * 8 + 8).map((c) => (c != null && c >= 0 ? 'x' : c === HOLD ? '-' : '.')).join('')
  const r0 = rhythm(0)
  if (r0.includes('x')) {
    const rep = [1, 2, 3].filter((b) => rhythm(b) === r0).length
    fb.push(rep >= 1 && rep <= 2 ? { level: 'good', text: `第 1 小節的節奏在後面重複了 ${rep} 次：這叫「動機」，重複讓人記住、變化讓人不膩。` } : rep === 3 ? { level: 'warn', text: '四個小節節奏完全一樣。', tip: '重複很好，但第 4 小節換個節奏（例如拉長最後一個音）當作句尾。' } : { level: 'warn', text: '每小節的節奏都不一樣，聽眾比較難記。', tip: '試試把第 1 小節的節奏照抄到第 2 小節，只改音高——這就是「動機重複」。' })
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

/** 手機直向：一次顯示 2 小節，格子才夠大好點 */
function useNarrow() {
  const q = '(max-width: 640px)'
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setN(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return n
}

function MelodyStep({ p, update, notify, next }: StepProps) {
  const narrow = useNarrow()
  const [page, setPage] = useState(0)
  const [part, setPart] = useState<Part>('chorus')
  const [hold, setHold] = useState(false)
  const [penta, setPenta] = useState(() => ![...p.melody.verse, ...p.melody.chorus].some((m) => m != null && m >= 0 && isAvoid(m, p.harmony.root, p.harmony.mode)))
  const [col, setCol] = useState(-1)
  const [player, setPlayer] = useState<Player | null>(null)
  const allRows = useMemo(() => melodyRows(p), [p.harmony.root, p.harmony.mode, p.hum])
  // 五聲音階安全區：拿掉 4、7 級（半音關係），新手怎麼排都和諧
  const rows = penta ? allRows.filter((m) => !isAvoid(m, p.harmony.root, p.harmony.mode)) : allRows
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
    const bars = prog.map((d) => (d != null ? chordVoicing(chords[d]) : []))
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody: cells, loop: true, layers: { drums: false, bass: true, keys: true, pad: false, melody: true }, onStep: setCol }))
    notify('melody.play', part)
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
      if (penta && !rows.includes(m)) m = rows.reduce((b, r) => (Math.abs(r - m) < Math.abs(b - m) ? r : b), rows[0])
      if (n[s] == null || n[s] === HOLD) n[s] = m
      for (let k = 1; k < len && s + k < STEPS; k++) if (n[s + k] == null) n[s + k] = HOLD
    })
    setCells(n)
  }

  const fb = melodyFeedback(p, part)
  // 播放時頁面跟著播放頭走
  const shownPage = narrow && col >= 0 ? Math.floor(col / 8) : page
  const visible = Array.from({ length: narrow ? 8 : STEPS }, (_, k) => (narrow ? shownPage * 8 : 0) + k)
  const missingChords = prog.some((d) => d == null)
  const notes = cells.filter((m) => m != null && m >= 0).length
  const empty = notes === 0
  const bothReady = p.melody.verse.filter((m) => m != null && m >= 0).length >= 4 && p.melody.chorus.filter((m) => m != null && m >= 0).length >= 4

  return (
    <>
      <Coach short={empty && p.hum ? '先把你的哼唱倒進格子裡，再一格一格修。' : missingChords ? '先點格子寫旋律；和弦之後再補也可以。' : notes < 4 ? '點格子放音。綠色的最穩。' : '播放，哪裡聽起來怪就改哪裡。'} />
      <div className="seg seg-quiet">
        <button className={part === 'verse' ? 'on' : ''} onClick={() => { stop(); setPart('verse') }}>主歌</button>
        <button className={part === 'chorus' ? 'on' : ''} onClick={() => { stop(); setPart('chorus') }}>副歌</button>
      </div>
        {narrow && (
          <div className="seg roll-pager" aria-label="選擇小節">
            {[0, 1, 2, 3].map((b) => (
              <button key={b} className={shownPage === b ? 'on' : ''} onClick={() => setPage(b)}>
                第{b + 1}小節{prog[b] != null ? ` · ${chords[prog[b]!].name}` : ''}
              </button>
            ))}
          </div>
        )}
        <div className="roll-scroll">
          <div className={`roll ${narrow ? 'narrow' : ''}`} style={{ gridTemplateColumns: `44px repeat(${visible.length}, minmax(${narrow ? 34 : 26}px, 1fr))` }}>
            <div className="roll-corner" />
            {(narrow ? [shownPage] : [0, 1, 2, 3]).map((b) => (
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
                  {visible.map((i) => {
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
      {player ? (
        <DeskActions primary={{ label: '■ 停', onClick: stop }} />
      ) : empty && p.hum ? (
        <DeskActions primary={{ label: '用我的哼唱當草稿', onClick: importHum }} />
      ) : bothReady && next ? (
        <DeskActions primary={{ label: <>旋律有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 循環聽', onClick: play }} />
      ) : (
        <DeskActions primary={{ label: '▶ 循環聽', onClick: play, disabled: notes === 0 }}
          secondary={part === 'verse' && notes >= 4 && p.melody.chorus.every((m) => m == null) ? { label: '換副歌 →', onClick: () => setPart('chorus') } : undefined} />
      )}

      <Toolbox>
        <div className="row wrap">
          <button className={`btn small ${penta ? 'on' : ''}`} onClick={() => setPenta(!penta)}>{penta ? '只用五聲音階（安全）' : '用完整音階'}</button>
          <button className={`btn small ${hold ? 'on' : ''}`} onClick={() => setHold(!hold)}>{hold ? '點格子＝拉長前一個音' : '拉長模式'}</button>
          {p.hum && <button className="btn small" onClick={importHum}>重新匯入哼唱</button>}
          {part === 'chorus' && p.melody.verse.some((x) => x != null) && <button className="btn small" onClick={() => setCells(p.melody.verse.map((m) => (m != null && m >= 0 ? (inScale(m + 4, p.harmony.root, p.harmony.mode) ? m + 4 : m + 3) : m)))}>從主歌複製並升高</button>}
          <button className="btn small" onClick={() => setCells(new Array(STEPS).fill(null))}>清空</button>
        </div>
        {penta && cells.some((m) => m != null && m >= 0 && !rows.includes(m)) && <p className="muted small">有些音不在五聲音階裡，切到「完整音階」才看得到。</p>}
        <p className="muted small">左邊的數字是簡譜，點一下可以試聽。淡綠底的格子是當下和弦裡的音。</p>
        <FeedbackList items={fb} />
        <Why ready={notes >= 4} title="為什麼綠色的音特別穩？" listen={{ label: '再聽一次', play }}>
          <p>綠色是當下和弦裡的音。放在每拍的開頭，旋律和伴奏會融在一起；黃色的音放在中間，會變成兩個綠色之間的過門，讓旋律流動。</p>
        </Why>
      </Toolbox>
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
    { label: '主歌有幾個音', ok: p.melody.verse.filter((m) => m != null && m >= 0).length >= 4 },
    { label: '副歌有幾個音', ok: p.melody.chorus.filter((m) => m != null && m >= 0).length >= 4 },
  ],
}
