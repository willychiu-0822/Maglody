import { useState } from 'react'
import { Card, Coach, FeedbackList, Why, type Feedback } from '../components/ui'
import { playChord, playLoop, type Player } from '../lib/audio'
import { CHORD_ROLE, chordVoicing, diatonicChord, diatonicChords, keyName, NOTE_NAMES, pc, type Mode } from '../lib/theory'
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
  fb.push(tonicLike.includes(d[0]) ? { level: 'good', text: `${label}從穩定的和弦開始，聽眾馬上知道「家」在哪。` } : { level: 'warn', text: `${label}從不穩定的和弦開始。`, tip: '這會帶來懸疑感，很適合導歌；如果是主歌，試試從 I 或 vi 開始。' })
  const last = d[d.length - 1]
  if (last === 4) fb.push({ level: 'good', text: `${label}停在 V：像一個問號，耳朵會想回到開頭，循環起來很順。` })
  else if (last === 0) fb.push({ level: 'good', text: `${label}停在 I：像句號，很適合段落或整首歌的結尾。` })
  else if (last === 3) fb.push({ level: 'good', text: `${label}停在 IV：溫柔、未完待續，回到 I 時很自然。` })
  else fb.push({ level: 'warn', text: `${label}結尾的和弦較少見。`, tip: '結尾停在 V（問號）或 I（句號）最好接下一輪。' })
  const uniq = new Set(d).size
  fb.push(uniq >= 3 ? { level: 'good', text: `用了 ${uniq} 種和弦，有變化。` } : uniq === 2 ? { level: 'warn', text: '只有 2 種和弦，可能有點單調。', tip: '加一個 IV 或 vi 試試。' } : { level: 'bad', text: '只有一種和弦，聽不出走向。' })
  if (!d.includes(4) && !d.includes(3)) fb.push({ level: 'warn', text: '沒有 IV 或 V。', tip: 'IV（離家）和 V（想回家）是推動歌曲前進的引擎。' })
  if (d.includes(6)) fb.push({ level: 'warn', text: '用了 vii°（減和弦），很緊張。', tip: '它通常只出現一瞬間，確認這是你想要的效果。' })
  return fb
}

function HarmonyStep({ p, update, notify }: StepProps) {
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
    else if (target.part === 'verse') setTarget({ part: 'chorus', i: 0 })
  }
  const play = (part: 'verse' | 'chorus') => {
    player?.stop()
    const degs = h[part]
    if (degs.some((d) => d == null)) return
    const bars = degs.map((d) => chordVoicing(chords[d!]))
    const pl = playLoop({ bpm: p.idea.bpm, bars, layers: { drums: true, bass: true, keys: true, pad: false, melody: false }, onStep: (s) => setStep(s < 0 ? -1 : Math.floor(s / 8) + (part === 'chorus' ? 4 : 0)) })
    setPlayer(pl)
  }
  const stop = () => { player?.stop(); setPlayer(null) }

  const newQuiz = () => {
    const q = makeQuiz(h.root)
    setQuiz(q)
    setQuizRes(null)
    setTimeout(q.play, 50)
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
    fb.push(vd !== cd ? { level: 'good', text: '主歌和副歌的和弦不同，副歌出現時會有「換場景」的感覺。' } : { level: 'warn', text: '主歌和副歌和弦一模一樣。', tip: '這可以，但副歌就要靠旋律變高、編曲變滿來拉開差距。或試著讓副歌從 IV 開始。' })
  if (p.hum && (p.hum.keyRoot !== h.root || p.hum.keyMode !== h.mode))
    fb.push({ level: 'warn', text: `你換了調（哼唱是 ${keyName(p.hum.keyRoot, p.hum.keyMode)}）。`, tip: '換調沒問題，但之後寫旋律要用新調來寫，記得唱唱看音域是否舒服。' })

  const Slot = ({ part, i }: { part: 'verse' | 'chorus'; i: number }) => {
    const d = h[part][i]
    const active = target.part === part && target.i === i
    const playing = step === i + (part === 'chorus' ? 4 : 0)
    return (
      <button className={`slot ${active ? 'active' : ''} ${playing ? 'playing' : ''}`} onClick={() => { setTarget({ part, i }); if (d != null) playChord(chordVoicing(chords[d])) }}>
        {d != null ? <><strong>{chords[d].name}</strong><span className="small muted">{chords[d].roman}</span></> : <span className="muted">第{i + 1}小節</span>}
      </button>
    )
  }

  return (
    <>
      <Coach short={'點點看這些和弦，挑 4 個你喜歡的，排成一圈。'}>
        和弦是旋律腳下的地板。每個調都有 7 個「保證不會錯」的和弦，它們各有個性：有的像家、有的像出門、有的想回家。
        {p.hum && <> 我已經依你的哼唱把調設成 <strong>{keyName(p.hum.keyRoot, p.hum.keyMode)}</strong>，你也可以換。</>}
        先點每個和弦聽聽它的個性，再選 4 個排成主歌、4 個排成副歌。
      </Coach>

      <Card title="調性">
        <div className="row wrap">
          <select value={h.root} onChange={(e) => setKey(+e.target.value, h.mode)}>
            {NOTE_NAMES.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
          <div className="seg">
            <button className={h.mode === 'major' ? 'on' : ''} onClick={() => setKey(h.root, 'major')}>大調</button>
            <button className={h.mode === 'minor' ? 'on' : ''} onClick={() => setKey(h.root, 'minor')}>小調</button>
          </div>
        </div>
      </Card>

      <Card title="調內和弦（點擊試聽並放入選取的格子）">
        <div className="chord-grid">
          {chords.map((c) => (
            <button key={c.degree} className={`chord ${c.quality} ${humSet.has(c.name) ? 'hum' : ''}`} onClick={() => place(c.degree)}>
              <span className="chord-name">{c.name}</span>
              <span className="chord-roman">{c.roman}</span>
              <span className="chord-role">{CHORD_ROLE[h.mode][c.degree]}</span>
              {humSet.has(c.name) && <span className="badge">哼唱建議</span>}
            </button>
          ))}
        </div>
      </Card>

      <Card title="你的和弦進行">
        <div className="prog-label">主歌</div>
        <div className="slots">{[0, 1, 2, 3].map((i) => <Slot key={i} part="verse" i={i} />)}</div>
        <div className="row"><button className="btn" onClick={() => play('verse')}>▶ 循環主歌</button></div>
        <div className="prog-label">副歌</div>
        <div className="slots">{[0, 1, 2, 3].map((i) => <Slot key={i} part="chorus" i={i} />)}</div>
        <div className="row wrap">
          <button className="btn" onClick={() => play('chorus')}>▶ 循環副歌</button>
          {player && <button className="btn btn-danger" onClick={stop}>■ 停止</button>}
        </div>
        <details className="templates">
          <summary>卡住了？看看經典走法（參考用，選了之後請自己改改看）</summary>
          {TEMPLATES.map((t) => (
            <div key={t.name} className="tpl">
              <div><strong>{t.name}</strong>：{t.degs.map((d) => chords[d].name).join(' → ')}<div className="muted small">{t.note}</div></div>
              <div className="row">
                <button className="btn btn-ghost small" onClick={() => playLoop({ bpm: p.idea.bpm, bars: t.degs.map((d) => chordVoicing(chords[d])), layers: { drums: false, bass: true, keys: true, pad: false, melody: false } })}>▶</button>
                <button className="btn btn-ghost small" onClick={() => { update('harmony', { ...h, [target.part]: t.degs }); notify('harmony.progression', target.part) }}>放到{target.part === 'verse' ? '主歌' : '副歌'}</button>
              </div>
            </div>
          ))}
        </details>
      </Card>

      <Card title="即時回饋">
        <FeedbackList items={fb} />
      </Card>

      <Card title="耳朵練習：用聽的分辨">
        <p className="muted small">理論要變成直覺，只能靠耳朵。答對 {h.quizRight} / {h.quizTotal}</p>
        {!quiz ? (
          <button className="btn btn-primary" onClick={newQuiz}>開始一題</button>
        ) : (
          <div className={`quiz ${quizRes ?? ''}`}>
            <p>{quiz.kind === 'quality' ? '這個和弦聽起來比較…' : '這段和弦最後一下，比較像…'}</p>
            <div className="row wrap">
              <button className="btn" onClick={quiz.play}>↻ 再聽一次</button>
              <button className="btn" onClick={() => answer('a')}>{quiz.kind === 'quality' ? '明亮（大三和弦）' : '句號（回到 I）'}</button>
              <button className="btn" onClick={() => answer('b')}>{quiz.kind === 'quality' ? '憂傷（小三和弦）' : '問號（停在 V）'}</button>
            </div>
            {quizRes && (
              <p className={quizRes === 'right' ? 'ok-text' : 'err-text'}>
                {quizRes === 'right' ? '答對！' : '不對喔，'}
                {quiz.kind === 'quality'
                  ? quiz.answer === 'a' ? '大三和弦的中間音比較高（大三度），聽起來開闊。' : '小三和弦的中間音低半音（小三度），聽起來有陰影。'
                  : quiz.answer === 'a' ? '最後回到 I，緊張感完全解除，像句號。' : '最後停在 V，張力沒有解決，耳朵還在等。'}
                <button className="btn btn-ghost small" onClick={newQuiz}>下一題</button>
              </p>
            )}
          </div>
        )}
      </Card>

      <Why ready={h.verse.some((d) => d != null)} hint="先點幾個和弦、放進主歌格子。" title="為什麼調內和弦「保證不會錯」？" apply="在 KTV 自彈自唱、即興伴奏、看吉他譜時，先找出調內的 7 個和弦就能應付大部分歌曲。">
        <p>調內和弦都是從同一個音階的 7 個音堆出來的（每隔一個音取一個：1-3-5、2-4-6…），所以彼此「說同一種語言」，放在一起一定協調。</p>
        <p>大寫羅馬數字（I、IV、V）是大三和弦，小寫（ii、iii、vi）是小三和弦。用級數而不用音名，換調時進行不變。</p>
      </Why>
      <Why ready={!h.verse.includes(null) || !h.chorus.includes(null)} hint="排滿 4 格，聽聽結尾停在哪裡。" listen={{ label: '聽 V → I（想回家→到家）', play: () => { playChord(chordVoicing(chords[4]), 1); setTimeout(() => playChord(chordVoicing(chords[0]), 1.4), 1000) } }} title="為什麼 V 會「想回家」？" apply="電影配樂用 V 製造懸念；歌曲結尾用 V→I 給人完結感。">
        <p>V 和弦裡有一個音（第 7 級音，Si）距離主音只差半音，耳朵會強烈期待它往上「解決」到 Do。這種「緊張→解決」就是音樂推動力的來源。</p>
      </Why>
      <Why ready={!!p.hum} hint="先完成哼唱解析。" title="和弦跟我的哼唱有什麼關係？" apply="幫現成旋律配和弦（例如幫朋友的歌配吉他）就是這個方法。">
        <p>旋律在某一刻唱的音，如果剛好是當下和弦的組成音，就會很和諧。標著「哼唱建議」的和弦，是你哼唱裡出現最多的組成音所對應的和弦。</p>
        <p>你哼唱的主音是 {p.hum ? NOTE_NAMES[pc(p.hum.keyRoot)] : '—'}。</p>
      </Why>
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
    { label: '耳朵練習至少答 4 題', ok: p.harmony.quizTotal >= 4 },
  ],
}
