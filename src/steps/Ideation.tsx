import { Card, Coach, FeedbackList, Why, type Feedback } from '../components/ui'
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

function IdeationStep({ p, update, notify }: StepProps) {
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

  return (
    <>
      <Coach short={'這首歌想帶著什麼感覺？先點一個情緒聽聽看。'}>
        有了旋律的種子，現在決定這首歌要「說什麼」。寫歌最常見的失敗不是技術，而是不知道自己要說什麼。
        我們用一句話的故事、一個畫面、一句記憶點，替整首歌定好方向。
      </Coach>

      <Card title="1. 這首歌的情緒">
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood ${idea.mood === m.id ? 'on' : ''}`}
              onClick={() => {
                update('idea', { ...idea, mood: m.id, bpm: Math.round((m.bpm[0] + m.bpm[1]) / 2) })
                // 情緒影響調性：沒有哼唱時以情緒決定大小調；有哼唱則保留哼唱的調，由學生在和聲章節決定
                if (!p.hum) update('harmony', (h) => ({ ...h, mode: m.mode }))
                notify('idea.mood', m.id)
                preview(p.hum?.keyMode ?? m.mode, Math.round((m.bpm[0] + m.bpm[1]) / 2))
              }}
            >
              <strong>{m.name}</strong>
              <span className="small muted">{m.mode === 'major' ? '大調' : '小調'} · {m.bpm[0]}–{m.bpm[1]} BPM</span>
            </button>
          ))}
        </div>
        {mood && (
          <div className="explain">
            <p>{mood.why}</p>
            <div className="row wrap">
              <button className="btn" onClick={() => preview(mood.mode, idea.bpm)}>▶ 聽聽這個感覺</button>
              <button className="btn btn-ghost" onClick={() => preview(mood.mode === 'major' ? 'minor' : 'major', idea.bpm)}>▶ 對照：換成{mood.mode === 'major' ? '小' : '大'}調</button>
            </div>
          </div>
        )}
        <label className="field">
          <span>速度（BPM，每分鐘幾拍）：<strong>{idea.bpm}</strong></span>
          <input type="range" min={55} max={170} value={idea.bpm} onChange={(e) => set('bpm', +e.target.value)} />
        </label>
        <button className="btn btn-ghost small" onClick={() => { const c = ac(); const b = 60 / idea.bpm; for (let i = 0; i < 8; i++) click(c.currentTime + 0.05 + i * b, i % 4 === 0) }}>▶ 聽 8 拍節拍器</button>
        {p.hum && <p className="muted small">你的哼唱在 {keyName(p.hum.keyRoot, p.hum.keyMode)}。</p>}
      </Card>

      <Card title="2. Vibe 板：這首歌「聽起來像」什麼？">
        <label className="field">
          <span>參考的歌、場景、聲音、顏色（隨意寫，像在跟朋友形容）</span>
          <input value={idea.vibe} placeholder="例如：深夜騎車、街燈、像老 City Pop、帶點雨聲" onChange={(e) => set('vibe', e.target.value)} />
        </label>
        <p className="muted small">Vibe 不用專業術語。之後每一檯，大師都會回來對照它：「這個和弦像不像你說的深夜？」</p>
      </Card>

      <Card title="3. 一句話的故事">
        <label className="field">
          <span>主題（關於什麼？）</span>
          <input value={idea.theme} placeholder="例如：搬離住了十年的家" onChange={(e) => set('theme', e.target.value)} />
        </label>
        <label className="field">
          <span>故事（誰、在哪、發生什麼、然後呢？）</span>
          <textarea rows={3} value={idea.story} placeholder="用你自己的經驗寫，越具體越好" onChange={(e) => set('story', e.target.value)} />
        </label>
        <label className="field">
          <span>核心畫面（閉上眼睛會看到什麼？）</span>
          <input value={idea.image} placeholder="一個看得見的場景" onChange={(e) => set('image', e.target.value)} />
        </label>
      </Card>

      <Card title="4. 歌名與記憶點（Hook）">
        <label className="field">
          <span>暫定歌名</span>
          <input value={idea.title} onChange={(e) => set('title', e.target.value)} />
        </label>
        <label className="field">
          <span>記憶點：副歌裡最想讓人跟著唱的一句</span>
          <input value={idea.hook} onChange={(e) => set('hook', e.target.value)} />
        </label>
      </Card>

      <Card title="即時回饋">
        <FeedbackList items={fb} />
      </Card>

      <Why ready={!!idea.mood} hint="先點一個情緒，聽聽它。" listen={{ label: '再聽一次你選的情緒', play: () => mood && preview(mood.mode, idea.bpm) }} title="為什麼要先決定情緒和速度？" apply="做簡報配樂、剪影片挑音樂、幫活動選歌，都是先定情緒再找速度。">
        <p>情緒決定了後面所有選擇：大調或小調、和弦怎麼走、編曲要熱鬧還是留白。先定方向，後面每一步都有判斷標準，不會越寫越歪。</p>
        <p>BPM 是速度。人走路約 100 BPM、休息心跳約 60–80。慢歌靠近心跳，快歌靠近跑步。</p>
      </Why>
      <Why ready={cleanLine(idea.story).length >= 8} hint="先寫幾句故事。" title="為什麼要具體，不要抽象？" apply="寫文案、說故事、寫履歷自傳都一樣：細節讓人相信。">
        <p>「我好寂寞」每個人都寫過；「便利商店的微波爐，只熱一個便當」才會讓人起雞皮疙瘩。具體畫面讓聽眾用自己的記憶填滿情緒，這叫 show, don't tell。</p>
      </Why>
      <Why ready={!!idea.hook} hint="先寫下你的記憶點。" title="什麼是 Hook？" apply="廣告標語、品牌口號、演講金句都是 Hook 的概念。">
        <p>Hook 是聽完一次就卡在腦中的那句話。流行歌通常把歌名放進 Hook，並在副歌重複 2–4 次。</p>
      </Why>
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
    { label: '選擇情緒', ok: !!p.idea.mood },
    { label: '寫下故事（15 字以上）', ok: cleanLine(p.idea.story).length >= 15 },
    { label: '寫下核心畫面', ok: !!p.idea.image.trim() },
    { label: '暫定歌名與記憶點', ok: !!p.idea.title.trim() && !!p.idea.hook.trim() },
  ],
}
