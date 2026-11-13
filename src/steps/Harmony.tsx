import { useState } from 'react'
import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { afterSound, playChord, playLoop, type Player } from '../lib/audio'
import { CHORD_ROLE, chordVoicing, diatonicChord, diatonicChords, keyName, NOTE_NAMES, type Mode } from '../lib/theory'
import type { StepDef, StepProps } from './types'

const TEMPLATES: { name: string; degs: number[]; note: string }[] = [
  { name: '萬用四和弦', degs: [0, 4, 5, 3], note: 'I–V–vi–IV：無數流行歌都用它，穩定又有起伏。' },
  { name: '憂傷開場', degs: [5, 3, 0, 4], note: 'vi–IV–I–V：從憂傷出發，最後停在想回家的 V。' },
  { name: '50 年代', degs: [0, 5, 3, 4], note: 'I–vi–IV–V：復古、甜，像老情歌。' },
  { name: '卡農走法', degs: [0, 4, 5, 2], note: 'I–V–vi–iii：往下走的感覺，常接 IV–I–IV–V。' },
]

type Q = { kind: 'quality' | 'cadence'; answer: 'a' | 'b'; play: () => void }

function makeQuiz(root: number): Q {
  if (Math.random() < 0.5) {
    const isMajor = Math.random() < 0.5
    const r = 48 + Math.floor(Math.random() * 12)
    const v = isMajor ? [r, r + 4, r + 7] : [r, r + 3, r + 7]
    return { kind: 'quality', answer: isMajor ? 'a' : 'b', play: () => playChord(v, 1.4) }
  }
  const endHome = Math.random() < 0.5
  const prog = endHome ? [0, 3, 4, 0] : [0, 5, 3, 4]
  const bars = prog.map((d) => chordVoicing(diatonicChord(root, 'major', d)))
  return { kind: 'cadence', answer: endHome ? 'a' : 'b', play: () => { playLoop({ bpm: 120, bars, layers: { drums: false, bass: true, keys: true, pad: false, melody: false } }) } }
}

export function progressionFeedback(degs: (number | null)[], mode: Mode, label: string): Feedback[] {
  const d = degs.filter((x): x is number => x != null)
  const fb: Feedback[] = []
  if (d.length < degs.length) return [{ level: 'warn', text: `${label}還有 ${degs.length - d.length} 格空著。` }]
  const tonicLike = mode === 'major' ? [0, 5] : [0, 2]
  fb.push(tonicLike.includes(d[0]) ? { level: 'good', text: `${label}從穩定的和弦開始，聽眾馬上知道「家」在哪。` } : { level: 'warn', text: `${label}一開頭就帶點懸著的感覺。`, tip: '這種開場很有戲；想先讓人安心的話，也可以試試從 I 或 vi 起頭。' })
  const last = d[d.length - 1]
  if (last === 4) fb.push({ level: 'good', text: `${label}停在 V：像一個問號，耳朵會想回到開頭，循環起來很順。` })
  else if (last === 0) fb.push({ level: 'good', text: `${label}停在 I：像句號，很適合段落或整首歌的結尾。` })
  else if (last === 3) fb.push({ level: 'good', text: `${label}停在 IV：溫柔、未完待續，回到 I 時很自然。` })
  else fb.push({ level: 'warn', text: `${label}的結尾比較少見，聽起來有點特別。`, tip: '想讓它接回開頭，可以試試停在 V（問號）或 I（句號）。' })
  const uniq = new Set(d).size
  fb.push(uniq >= 3 ? { level: 'good', text: `用了 ${uniq} 種和弦，走起來有起伏。` } : uniq === 2 ? { level: 'warn', text: '現在只有 2 種和弦，聽起來很簡單。', tip: '想多一點變化的話，可以加一個 IV 或 vi 聽聽。' } : { level: 'bad', text: '現在只有一種和弦，像一直停在同一個地方。', tip: '想往前走一步的話，換一格試試別的和弦。' })
  if (!d.includes(4) && !d.includes(3)) fb.push({ level: 'warn', text: '這一圈還沒用到 IV 或 V。', tip: 'IV（離家）和 V（想回家）會讓歌往前走，想要動感的話可以放一個聽聽。' })
  if (d.includes(6)) fb.push({ level: 'warn', text: '這裡用了 vii°（減和弦），聽起來有點懸著。', tip: '聽聽看，這是你想要的感覺嗎？' })
  return fb
}

function HarmonyStep({ p, update, notify, next }: StepProps) {
  const h = p.harmony
  const [target, setTarget] = useState<{ part: 'verse' | 'chorus'; i: number }>({ part: 'verse', i: 0 })
  const [player, setPlayer] = useState<Player | null>(null)
  const [step, setStep] = useState(-1)
  const [quiz, setQuiz] = useState<Q | null>(null)
  const [quizRes, setQuizRes] = useState<'right' | 'wrong' | null>(null)
  const chords = diatonicChords(h.root, h.mode)

  const setKey = (root: number, mode: Mode) => update('harmony', { ...h, root, mode })
  const place = (deg: number) => {
    playChord(chordVoicing(chords[deg]))
    const arr = [...h[target.part]]
    arr[target.i] = deg
    update('harmony', { ...h, [target.part]: arr })
    if (!arr.includes(null)) notify('harmony.progression', target.part)
    const ni = target.i + 1
    if (ni < 4) setTarget({ ...target, i: ni })
  }
  const play = (part: 'verse' | 'chorus') => {
    player?.stop()
    const degs = h[part]
    if (degs.some((d) => d == null)) return
    const bars = degs.map((d) => chordVoicing(chords[d!]))
    const pl = playLoop({ bpm: p.idea.bpm, bars, layers: { drums: true, bass: true, keys: true, pad: false, melody: false }, loop: true, onStep: (s) => setStep(s < 0 ? -1 : Math.floor(s / 8) + (part === 'chorus' ? 4 : 0)) })
    setPlayer(pl)
  }
  const stop = () => { player?.stop(); setPlayer(null) }

  const newQuiz = () => {
    const q = makeQuiz(h.root)
    setQuiz(q)
    setQuizRes(null)
    afterSound(q.play, 50)
  }
  const answer = (a: 'a' | 'b') => {
    if (!quiz || quizRes) return
    const ok = a === quiz.answer
    setQuizRes(ok ? 'right' : 'wrong')
    update('harmony', { ...h, quizRight: h.quizRight + (ok ? 1 : 0), quizTotal: h.quizTotal + 1 })
    notify('harmony.quiz', ok ? 'right' : 'wrong')
  }

  const humHints = p.hum?.chordHints ?? []
  const humSet = new Set(humHints)
  const fb = [...progressionFeedback(h.verse, h.mode, '主歌'), ...progressionFeedback(h.chorus, h.mode, '副歌')]
  const vd = h.verse.join(','), cd = h.chorus.join(',')
  if (!h.verse.includes(null) && !h.chorus.includes(null))
    fb.push(vd !== cd ? { level: 'good', text: '主歌和副歌的和弦不一樣，副歌一來，就像換了個場景。' } : { level: 'warn', text: '主歌和副歌用的是同一組和弦。', tip: '這樣也很好。如果想讓副歌換個感覺，可以試試不同的旋律或樂器。' })
  if (p.hum && (p.hum.keyRoot !== h.root || p.hum.keyMode !== h.mode))
    fb.push({ level: 'warn', text: `你換了調（剛剛哼的是 ${keyName(p.hum.keyRoot, p.hum.keyMode)}）。`, tip: '換調沒問題，之後寫旋律就跟著新的調走，也順便唱唱看音域舒不舒服。' })

  const Slot = ({ part, i }: { part: 'verse' | 'chorus'; i: number }) => {
    const d = h[part][i]
    const active = target.part === part && target.i === i
    const playing = step === i + (part === 'chorus' ? 4 : 0)
    return (
      <button className={`slot ${active ? 'active' : ''} ${playing ? 'playing' : ''}`} onClick={() => { setTarget({ part, i }); if (d != null) playChord(chordVoicing(chords[d])) }}>
        {d != null ? <strong>{chords[d].name}</strong> : <span className="muted">{i + 1}</span>}
      </button>
    )
  }

  const part = target.part
  const full = !h[part].includes(null)
  const bothFull = !h.verse.includes(null) && !h.chorus.includes(null)
  const shortRole = (d: number) => CHORD_ROLE[h.mode][d].split('：')[0].replace(/（.*）/, '')
  const say = !h.verse.some((d) => d != null)
    ? '點一個和弦聽聽，喜歡就留下。湊滿 4 個，就是一圈。'
    : !full ? `再挑 ${h[part].filter((d) => d == null).length} 個。`
    : part === 'verse' && h.chorus.includes(null) ? '主歌這一圈好了。聽聽看，再換副歌。'
    : '一圈好了，循環聽聽看。'
  return (
    <>
      <Coach short={say} />

      <div className="seg seg-quiet" hidden={!h.verse.some(d => d != null) && !h.chorus.some(d => d != null)}>
        <button className={part === 'verse' ? 'on' : ''} onClick={() => { stop(); setTarget({ part: 'verse', i: Math.max(0, h.verse.indexOf(null)) }) }}>主歌</button>
        <button className={part === 'chorus' ? 'on' : ''} onClick={() => { stop(); setTarget({ part: 'chorus', i: Math.max(0, h.chorus.indexOf(null)) }) }}>副歌</button>
      </div>
      <div className="slots">{[0, 1, 2, 3].map((i) => <Slot key={i} part={part} i={i} />)}</div>

      <div className={`chord-grid ${!h.verse.some((d) => d != null) ? 'nudge' : ''}`}>
        {chords.filter((c) => c.quality !== 'dim').map((c) => (
          <button key={c.degree} className={`chord ${c.quality} ${humSet.has(c.name) ? 'hum' : ''}`} data-recommended={c.degree === [0,4,5,3][target.i] || undefined} onClick={() => place(c.degree)}>
            <span className="chord-name">{c.name}</span>
            <span className="chord-role">{shortRole(c.degree)}</span>{c.degree === [0,4,5,3][target.i] && <small className="material-recommendation">先試這個</small>}
          </button>
        ))}
      </div>

      {player ? (
        <DeskActions primary={{ label: '■ 停', onClick: stop }} />
      ) : bothFull && next ? (
        <DeskActions primary={{ label: <>和弦選好了，去{next.label} →</>, onClick: next.go }} secondary={{ label: `▶ 循環聽${part === 'verse' ? '主歌' : '副歌'}`, onClick: () => play(part) }} />
      ) : full ? (
        <DeskActions primary={{ label: `▶ 循環聽${part === 'verse' ? '主歌' : '副歌'}`, onClick: () => play(part) }}
          secondary={part === 'verse' && h.chorus.includes(null) ? { label: '換副歌 →', onClick: () => setTarget({ part: 'chorus', i: 0 }) } : undefined} />
      ) : <DeskActions primary={{ label: `放入推薦和弦 ${chords[[0,4,5,3][target.i]].name}`, onClick: () => place([0,4,5,3][target.i]) }} />}

      <Toolbox>
        <div className="row wrap">
          <select value={h.root} onChange={(e) => setKey(+e.target.value, h.mode)}>
            {NOTE_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
          <div className="seg">
            <button className={h.mode === 'major' ? 'on' : ''} onClick={() => setKey(h.root, 'major')}>大調</button>
            <button className={h.mode === 'minor' ? 'on' : ''} onClick={() => setKey(h.root, 'minor')}>小調</button>
          </div>
          <button className="btn small" onClick={() => place(6)}>{chords[6].name}（緊繃）</button>
        </div>
        {humSet.size > 0 && <p className="muted small">外框淡綠的和弦，是你的哼唱裡最常出現的音組成的。</p>}
        <details className="templates">
          <summary>卡住了？看看常見的走法</summary>
          {TEMPLATES.map((t) => (
            <div key={t.name} className="tpl">
              <div><strong>{t.name}</strong>：{t.degs.map((d) => chords[d].name).join(' → ')}<div className="muted small">{t.note}</div></div>
              <div className="row">
                <button className="btn btn-ghost small" onClick={() => playLoop({ bpm: p.idea.bpm, bars: t.degs.map((d) => chordVoicing(chords[d])), layers: { drums: false, bass: true, keys: true, pad: false, melody: false } })}>▶</button>
                <button className="btn btn-ghost small" onClick={() => { update('harmony', { ...h, [part]: t.degs }); notify('harmony.progression', part) }}>用這個</button>
              </div>
            </div>
          ))}
        </details>
        <FeedbackList items={fb} />
        <details className="templates">
          <summary>耳朵小遊戲（答對 {h.quizRight} / {h.quizTotal}）</summary>
          {!quiz ? (
            <button className="btn small" onClick={newQuiz}>來一題</button>
          ) : (
            <div className={`quiz ${quizRes ?? ''}`}>
              <p>{quiz.kind === 'quality' ? '這個和弦聽起來比較…' : '最後一下比較像…'}</p>
              <div className="row wrap">
                <button className="btn small" onClick={quiz.play}>↻ 再聽</button>
                <button className="btn small" onClick={() => answer('a')}>{quiz.kind === 'quality' ? '明亮' : '句號'}</button>
                <button className="btn small" onClick={() => answer('b')}>{quiz.kind === 'quality' ? '憂傷' : '問號'}</button>
              </div>
              {quizRes && (
                <p className={quizRes === 'right' ? 'ok-text' : 'err-text'}>
                  {quizRes === 'right' ? '聽出來了。' : '差一點，再聽一次就有感覺了。'}
                  {quiz.kind === 'quality' ? (quiz.answer === 'a' ? '中間那個音高一點，聽起來開闊。' : '中間那個音低半音，聽起來有陰影。') : (quiz.answer === 'a' ? '回到家了，像句號。' : '停在想回家的地方，耳朵還在等。')}
                  <button className="link-btn" onClick={newQuiz}>下一題</button>
                </p>
              )}
            </div>
          )}
        </details>
        <Why ready={full} title="這幾個和弦放在一起，聽起來像什麼？" listen={{ label: '聽「想回家 → 到家」', play: () => { playChord(chordVoicing(chords[4]), 1); afterSound(() => playChord(chordVoicing(chords[0]), 1.4), 1000) } }}>
          <p>它們都是從同一組 7 個音堆出來的，說同一種語言。每個和弦有自己的角色：「家」最穩，「想回家」最緊，耳朵聽到它就會等著回家。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const harmonyStep: StepDef = {
  key: 'harmony',
  title: '和聲',
  subtitle: '選調、排和弦、用耳朵確認',
  glyph: '和',
  Component: HarmonyStep,
  requirements: (p) => [
    { label: '主歌 4 個和弦', ok: !p.harmony.verse.includes(null) },
    { label: '副歌 4 個和弦', ok: !p.harmony.chorus.includes(null) },
  ],
}
