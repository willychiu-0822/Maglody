import { useEffect, useMemo, useState } from 'react'
import { melodyRows, isAvoid, soundingAt, cellLevel, melodyFeedback, HOLD } from '../rules/melody'
import { Coach, DeskActions, FeedbackList, Toolbox, Why } from '../components/ui'
import { playLoop, playNote, type Player } from '../lib/audio'
import { chordVoicing, diatonicChords, inScale, jianpu, noteNameOct, pc, snapToScale } from '../lib/theory'
import type { StepProps } from './types'

type Part = 'verse' | 'chorus'
const STEPS = 32






/** 手機直向：一次顯示 1 小節，格子才夠大好點 */
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
  // 一進來就停在「第一個還沒完成的那一段」，這樣小任務、亮著的分頁、主按鈕講的是同一段
  const [part, setPart] = useState<Part>(() => p.melody.verse.filter((m) => m != null && m >= 0).length >= 4 ? 'chorus' : 'verse')
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
  const partName = part === 'verse' ? '主歌' : '副歌'
  const other: Part = part === 'verse' ? 'chorus' : 'verse'
  const otherNotes = p.melody[other].filter((m) => m != null && m >= 0).length
  const switchTo = notes >= 4 && otherNotes < 4 ? other : null
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
        <p className="muted small">左右滑動格子，接著寫後面的音。</p>
        <div className="roll-scroll" role="region" aria-label="音符格，可以左右捲動" tabIndex={0}>
          <div className={`roll ${narrow ? 'narrow' : ''}`} style={{ gridTemplateColumns: `44px repeat(${visible.length}, minmax(44px, 1fr))` }}>
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
        <DeskActions primary={{ label: `把哼唱倒進${partName}`, onClick: importHum }} />
      ) : bothReady && next ? (
        <DeskActions primary={{ label: <>旋律有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 循環聽', onClick: play }} />
      ) : (
        <DeskActions primary={{ label: '▶ 循環聽', onClick: play, disabled: notes === 0 }}
          secondary={switchTo ? { label: `換${switchTo === 'verse' ? '主歌' : '副歌'} →`, onClick: () => setPart(switchTo) } : undefined} />
      )}

      <Toolbox>
        <div className="row wrap">
          <button className={`btn small ${penta ? 'on' : ''}`} onClick={() => setPenta(!penta)}>{penta ? '只留好搭的音（怎麼排都順）' : '全部的音都給我'}</button>
          <button className={`btn small ${hold ? 'on' : ''}`} onClick={() => setHold(!hold)}>{hold ? '點格子＝拉長前一個音' : '拉長模式'}</button>
          {p.hum && <button className="btn small" onClick={importHum}>重新匯入哼唱</button>}
          {part === 'chorus' && p.melody.verse.some((x) => x != null) && <button className="btn small" onClick={() => setCells(p.melody.verse.map((m) => (m != null && m >= 0 ? (inScale(m + 4, p.harmony.root, p.harmony.mode) ? m + 4 : m + 3) : m)))}>從主歌複製並升高</button>}
          <button className="btn small" onClick={() => setCells(new Array(STEPS).fill(null))}>清空</button>
        </div>
        {penta && cells.some((m) => m != null && m >= 0 && !rows.includes(m)) && <p className="muted small">有些音不在這幾列裡，按「只留好搭的音」切回全部的音才看得到。</p>}
        <p className="muted small">左邊的數字是簡譜，點一下可以試聽。淡綠底的格子是當下和弦裡的音。</p>
        <FeedbackList items={fb} />
        <Why ready={notes >= 4} title="為什麼綠色的音特別穩？" listen={{ label: '再聽一次', play }}>
          <p>綠色是和弦裡的音，黃色可以幫旋律走到下一個音。試著把綠色放在拍子的開頭，聽聽和伴奏搭起來的感覺。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export default MelodyStep
