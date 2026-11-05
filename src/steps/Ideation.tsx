import { Coach, DeskActions, FeedbackList, Toolbox, Why, type Feedback } from '../components/ui'
import { playChord, ac, click } from '../lib/audio'
import { ABSTRACT_WORDS, CONCRETE_HINTS, cleanLine, countHits } from '../lib/rhyme'
import { chordVoicing, diatonicChord, keyName } from '../lib/theory'
import type { StepDef, StepProps } from './types'

export const MOODS = [
  { id: 'happy', name: '開心雀躍', mode: 'major', bpm: [110, 130], why: '大調 + 快速度：明亮的和弦配上像心跳加速的節奏。' },
  { id: 'warm', name: '溫暖療癒', mode: 'major', bpm: [75, 95], why: '大調 + 中慢速度：像走路的速度，讓人放鬆。' },
  { id: 'sad', name: '憂傷失落', mode: 'minor', bpm: [60, 80], why: '小調 + 慢速度：小三度讓和弦帶陰影，慢速度給情緒呼吸空間。' },
  { id: 'miss', name: '思念懷舊', mode: 'major', bpm: [65, 85], why: '大調但多用 vi（憂傷的家），甜中帶酸。' },
  { id: 'fire', name: '熱血衝刺', mode: 'minor', bpm: [130, 160], why: '小調 + 快速度：緊張感與能量並存，常見於動漫歌、搖滾。' },
  { id: 'dream', name: '夢幻漂浮', mode: 'major', bpm: [70, 90], why: '大調 + 長音鋪底，留白多，像飄在空中。' },
] as const

function IdeationStep({ p, update, notify, next }: StepProps) {
  const idea = p.idea
  const set = (k: keyof typeof idea, v: string | number) => update('idea', { ...idea, [k]: v })
  const mood = MOODS.find((m) => m.id === idea.mood)

  const preview = (mode: 'major' | 'minor', bpm: number) => {
    const root = p.hum?.keyRoot ?? 0
    const c = ac()
    const beat = 60 / bpm
    for (let i = 0; i < 8; i++) click(c.currentTime + 0.05 + i * beat, i % 4 === 0)
    playChord(chordVoicing(diatonicChord(root, mode, 0)), beat * 4)
    setTimeout(() => playChord(chordVoicing(diatonicChord(root, mode, mode === 'major' ? 3 : 5)), beat * 4), beat * 4000)
  }

  const fb: Feedback[] = []
  if (idea.mood) {
    const humMode = p.hum?.keyMode
    if (mood && humMode && mood.mode !== humMode)
      fb.push({ level: 'warn', text: `你選了「${mood.name}」，但哼唱偏${humMode === 'major' ? '大' : '小'}調。`, tip: '這不是錯！「用開心的旋律唱悲傷的詞」反差很動人。只要你是刻意的就好。' })
    else if (mood) fb.push({ level: 'good', text: `情緒「${mood.name}」和你的哼唱調性一致。` })
  }
  const story = cleanLine(idea.story)
  if (idea.story) {
    const abs = countHits(idea.story, ABSTRACT_WORDS)
    const con = countHits(idea.story + idea.image, CONCRETE_HINTS)
    if (story.length < 15) fb.push({ level: 'bad', text: '故事太短，還看不見畫面。', tip: '試著回答：誰？在哪裡？發生什麼事？之後怎麼了？' })
    else if (abs > con + 1) fb.push({ level: 'warn', text: `抽象詞（${abs} 個）比具體畫面多。`, tip: '「我很想你」→「你的外套還掛在門後」。讓聽眾自己感受，不要直接說破。' })
    else fb.push({ level: 'good', text: '故事有具體的人事物，聽眾容易代入。' })
  }
  if (idea.image) fb.push(cleanLine(idea.image).length >= 6 ? { level: 'good', text: '有一個核心畫面，等一下寫歌詞時可以一直回來看它。' } : { level: 'warn', text: '核心畫面再具體一點。', tip: '加上顏色、天氣、時間或物品。' })
  if (idea.hook) {
    const n = cleanLine(idea.hook).length
    fb.push(n >= 4 && n <= 12 ? { level: 'good', text: `記憶點 ${n} 個字，長度剛好，好記又好唱。` } : n < 4 ? { level: 'warn', text: '記憶點有點短。', tip: '4–12 個字最好：一口氣唱得完，又能說出一件事。' } : { level: 'warn', text: `記憶點 ${n} 個字，偏長。`, tip: '副歌最重要的那句要能一口氣唱完，試著刪掉形容詞。' })
  }
  if (idea.title && idea.hook && (idea.hook.includes(idea.title) || idea.title.includes(cleanLine(idea.hook).slice(0, 2))))
    fb.push({ level: 'good', text: '歌名出現在記憶點裡，聽眾聽完就知道歌名。' })

  const pickMood = (m: (typeof MOODS)[number]) => {
    const bpm = Math.round((m.bpm[0] + m.bpm[1]) / 2)
    update('idea', { ...idea, mood: m.id, bpm })
    if (!p.hum) update('harmony', (h) => ({ ...h, mode: m.mode }))
    notify('idea.mood', m.id)
    preview(p.hum?.keyMode ?? m.mode, bpm)
  }
  const ready = !!idea.mood && !!idea.hook.trim()
  return (
    <>
      <Coach short={!idea.mood ? '這首歌想帶著什麼感覺？點一個，聽聽看。' : !idea.hook.trim() ? '如果整首歌只能留一句話，會是哪一句？' : `「${idea.hook}」，好。`} />

      <div className={`mood-grid${!idea.mood ? " awaiting-touch" : ""}`}>
        {MOODS.map((m) => (
          <button key={m.id} className={`mood ${idea.mood === m.id ? 'on' : ''}`} onClick={() => pickMood(m)}>{m.name}</button>
        ))}
      </div>

      {idea.mood && (
        <input className="one-line" value={idea.hook} placeholder="一句話就好……" onChange={(e) => update('idea', { ...idea, hook: e.target.value, title: idea.title && idea.title !== idea.hook ? idea.title : e.target.value })} />
      )}

      {ready && next ? (
        <DeskActions primary={{ label: <>帶著這句話，去{next.label} →</>, onClick: next.go }} secondary={mood ? { label: '▶ 再聽一次這個感覺', onClick: () => preview(mood.mode, idea.bpm) } : undefined} />
      ) : mood ? (
        <DeskActions secondary={{ label: '▶ 再聽一次這個感覺', onClick: () => preview(mood.mode, idea.bpm) }} />
      ) : null}

      <Toolbox label="多寫一點（選填）">
        <label className="field"><span>歌名（不填就用上面那句）</span><input value={idea.title} onChange={(e) => set('title', e.target.value)} /></label>
        <label className="field"><span>Vibe：聽起來像什麼？（場景、聲音、參考的歌）</span><input value={idea.vibe} placeholder="深夜騎車、街燈、帶點雨聲" onChange={(e) => set('vibe', e.target.value)} /></label>
        <label className="field"><span>閉上眼睛看到的畫面</span><input value={idea.image} onChange={(e) => set('image', e.target.value)} /></label>
        <label className="field"><span>故事：誰、在哪、發生什麼</span><textarea rows={3} value={idea.story} onChange={(e) => set('story', e.target.value)} /></label>
        <label className="field">
          <span>速度：<strong>{idea.bpm}</strong> BPM</span>
          <input type="range" min={55} max={170} value={idea.bpm} onChange={(e) => set('bpm', +e.target.value)} />
        </label>
        {mood && <button className="btn small" onClick={() => preview(mood.mode === 'major' ? 'minor' : 'major', idea.bpm)}>▶ 對照：換成{mood.mode === 'major' ? '小' : '大'}調</button>}
        {p.hum && <p className="muted small">你的哼唱在 {keyName(p.hum.keyRoot, p.hum.keyMode)}。</p>}
        <FeedbackList items={fb} empty="寫一點之後，這裡會有幾句觀察。" />
        <Why ready={!!idea.mood} title="為什麼情緒會改變和弦和速度？">
          <p>{mood?.why} 速度越接近休息時的心跳（60–80），聽起來越放鬆；越接近跑步，越激動。</p>
        </Why>
        <Why ready={!!idea.hook} title="什麼是 Hook？">
          <p>聽一次就卡在腦中的那句話。流行歌通常把它放進副歌，重複 2–4 次。</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const ideationStep: StepDef = {
  key: 'idea',
  title: '構想',
  subtitle: '決定這首歌要說什麼',
  glyph: '想',
  Component: IdeationStep,
  requirements: (p) => [
    { label: '選一個情緒', ok: !!p.idea.mood },
    { label: '留下一句話', ok: !!p.idea.hook.trim() },
  ],
}
