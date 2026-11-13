// 離線版大師：規則式旁白。沒有設定 LLM 端點時使用，也是 LLM 失敗時的備援。
// 原則與 LLM 版相同：引用學生剛做的具體內容 → 命名理論 → 說為什麼好聽 → 給下一步，不代寫。
import type { Feedback } from '../components/ui'
import type { Project } from '../lib/store'
import { CHORD_ROLE, diatonicChords, keyName, NOTE_NAMES, noteNameOct } from '../lib/theory'
import { RHYME_GROUPS, lastChar, rhymeOf } from '../lib/rhyme'
import { progressionFeedback } from '../steps/Harmony'
import { melodyFeedback } from '../steps/Melody'
import { analyzeSection, KIND_ZH } from '../steps/Lyrics'
import { arrangementFeedback } from '../steps/Arrangement'
import { mixFeedback } from '../steps/Mix'
import { MOODS } from '../steps/Ideation'
import type { AgentReply, AgentSuggestion } from './types'

const pick = (fb: Feedback[], lvl: Feedback['level']) => fb.find((f) => f.level === lvl)

/** 從回饋清單組成「先肯定具體的好、再給一個下一步」的旁白 */
function fromFeedback(fb: Feedback[], learned: string, fallbackNext: string, extra?: AgentSuggestion[]): AgentReply {
  const good = pick(fb, 'good')
  const fix = pick(fb, 'bad') ?? pick(fb, 'warn')
  return {
    text: [good?.text, fix ? `另外聽聽這裡：${fix.text}` : ''].filter(Boolean).join(' ') || '嗯，我聽到了。再往下試試看。',
    learned,
    next: fix?.tip ?? fallbackNext,
    suggestions: extra,
  }
}

const chordsOf = (p: Project) => diatonicChords(p.harmony.root, p.harmony.mode)
const progName = (p: Project, d: (number | null)[]) => d.map((x) => (x == null ? '?' : chordsOf(p)[x].name)).join('–')

export const STEP_ORDER = ['hum', 'idea', 'harmony', 'melody', 'lyrics', 'arrange', 'record', 'mix', 'review']
const STEP_ZH: Record<string, string> = { hum: '哼唱解析', idea: '構想', harmony: '和聲', melody: '旋律', lyrics: '歌詞', arrange: '編曲', record: '錄音準備', mix: '混音', review: '總檢討' }

/** 每章完成時「你學到了什麼」：引用學生自己的作品 */
export function learnedFor(step: string, p: Project): string {
  const c = chordsOf(p)
  switch (step) {
    case 'hum': return p.hum ? `你停留最久的音 ${NOTE_NAMES[p.hum.keyRoot]} 就是「主音」——整首歌的家；一段旋律常用的 7 個音，就構成「${keyName(p.hum.keyRoot, p.hum.keyMode)}」。` : '主音與調性。'
    case 'idea': { const m = MOODS.find((x) => x.id === p.idea.mood); return `「${m?.name ?? '這個心情'}」配上${m?.mode === 'minor' ? '小調' : '大調'}和 ${p.idea.bpm} BPM，是個可以試聽的起點。${p.idea.hook ? `「${p.idea.hook}」也先留在這裡。` : ''}` }
    case 'harmony': { const last = p.harmony.chorus[3]; return `級數讓和弦有「角色」：你的副歌 ${progName(p, p.harmony.chorus)} 最後停在 ${last != null ? `${c[last].name}（${c[last].roman}）` : '?'}——${last === 4 ? '屬和弦製造「想回家」的張力，這叫半終止。' : last === 0 ? '回到主和弦，像句號，這叫正格終止。' : '它決定了循環時的「推進感」。'}` }
    case 'melody': return '想讓旋律靠近伴奏，可以試著在強拍放和弦裡的音。副歌唱高一點，也會有不一樣的感覺。'
    case 'lyrics': return '主歌可以留一個畫面，副歌再回到你最想說的話。唸唸看，哪句最像你？'
    case 'arrange': return '試著讓主歌少一件樂器，再聽副歌進來的感覺。'
    case 'record': return '錄音時留點音量空間，唱到大聲的地方也比較不容易破音。音準可以用「音分」當參考，再用耳朵聽聽。'
    case 'mix': return '混音時，先聽聽最想讓人注意的聲音，再慢慢調整其他聲音的位置。'
    case 'review': return '你慢慢有了自己的判斷——建議只是起點，最後還是你的耳朵說了算。'
    default: return ''
  }
}

function eventReply(p: Project, step: string, kind: string, detail: string): AgentReply {
  switch (kind) {
    case 'step.enter': {
      const i = STEP_ORDER.indexOf(step)
      const prev = STEP_ORDER[i - 1]
      const bridge: Record<string, string> = {
        hum: '先哼給我聽。不用在意好不好聽，我要聽的是你腦中「本來就有」的旋律。',
        idea: p.hum ? `你的哼唱在 ${keyName(p.hum.keyRoot, p.hum.keyMode)}。現在決定它要說什麼情緒——選完我會用你的調放給你聽。` : '先決定這首歌的情緒和速度。',
        harmony: `依你的「${MOODS.find((m) => m.id === p.idea.mood)?.name ?? '情緒'}」和哼唱，我把調設好了。點和弦聽聽它們的個性，排完 4 格我會告訴你這個走向在做什麼。`,
        melody: `和弦選好了（副歌 ${progName(p, p.harmony.chorus)}）。把哼唱拿來當草稿，聽聽旋律和和弦搭不搭。`,
        lyrics: `旋律有了，現在讓字「住進」音符裡。副歌旋律有 ${p.melody.chorus.filter((m) => m != null && m >= 0).length} 個音，前兩句大約就是這麼多字。`,
        arrange: '詞曲都在了。現在當導演：哪一段要安靜、哪一段要全員到齊？',
        record: '準備錄一版了。先暖暖嗓，再試一下音量，我陪你聽。',
        mix: '我故意把混音弄亂了：主旋律太小。播放，用耳朵把它們放回該在的位置。',
        review: '來，從頭聽聽這一版。哪一段讓你想再多聽一次？',
      }
      return { text: bridge[step] ?? '', next: prev ? `（上一檯：${STEP_ZH[prev]}，隨時可以回去改）` : undefined }
    }
    case 'hum.analyzed': {
      if (!p.hum) return { text: '我沒有聽清楚，再哼一次？' }
      const h = p.hum
      return {
        text: `${h.source === 'demo' ? '示範裡有' : h.source === 'file' ? '音檔裡有' : '你哼了'} ${h.notes.length} 個音，停留最久、最常回去的是 ${NOTE_NAMES[h.keyRoot]}。耳朵會把這種「一直回去的音」當成家。`,
        learned: `這叫「主音」，以它為中心的 7 個音就是 ${keyName(h.keyRoot, h.keyMode)}。`,
        next: `按「加上主音襯底」聽聽看：你的旋律每次碰到 ${NOTE_NAMES[h.keyRoot]} 都會特別穩。`,
        suggestions: [{ label: '前往構想', action: { type: 'goStep', step: 'idea' } }],
      }
    }
    case 'idea.mood': {
      const m = MOODS.find((x) => x.id === p.idea.mood)
      if (!m) return { text: '' }
      const clash = p.hum && p.hum.keyMode !== m.mode
      return {
        text: `「${m.name}」——${m.why}${clash ? ` 不過你的哼唱是${p.hum!.keyMode === 'major' ? '大' : '小'}調，反差也可以很動人，聽聽兩種版本再決定。` : ''}`,
        learned: '大調（大三度）聽起來明亮、小調（小三度）帶陰影；速度越接近心跳越放鬆、越接近跑步越激動。',
        next: '寫下核心畫面：閉上眼睛，這首歌發生在哪裡？',
      }
    }
    case 'harmony.progression': {
      const part = detail === 'chorus' ? 'chorus' : 'verse'
      const fb = progressionFeedback(p.harmony[part], p.harmony.mode, part === 'verse' ? '主歌' : '副歌')
      const d = p.harmony[part].filter((x): x is number => x != null)
      const last = d[d.length - 1]
      const roleLast = last != null ? CHORD_ROLE[p.harmony.mode][last].split('：')[0] : ''
      return {
        text: `你排了 ${progName(p, p.harmony[part])}。最後一個和弦是「${roleLast}」，所以循環時${last === 4 ? '耳朵會一直被拉回開頭——這就是流行歌讓人想再聽一輪的引擎' : last === 0 ? '每一輪都有句號，聽起來穩定、完整' : '會有一種懸著的感覺'}。`,
        learned: last === 4 ? '停在 V 叫「半終止」：張力沒解決，像問號。' : last === 0 ? '回到 I 叫「終止」：像句號。' : '和弦的功能（主、下屬、屬）決定它聽起來是穩定還是想移動。',
        next: (pick(fb, 'bad') ?? pick(fb, 'warn'))?.tip ?? (part === 'verse' ? '接著排副歌，試試從 IV 或 vi 開始，聽「換場景」的感覺。' : '按循環播放，跟著哼一哼，看哪個版本你比較想唱。'),
      }
    }
    case 'harmony.quiz':
      return detail === 'right'
        ? { text: '答對了，而且你是用耳朵答的，不是背的。', learned: '這種「聽 → 命名」的連結，就是樂理變成直覺的過程。' }
        : { text: '沒關係，這一題的差別很細。再聽一次，注意和弦中間那個音：高一點是明亮、低半音是陰影。', learned: '大三度 = 4 個半音，小三度 = 3 個半音，只差一點點，情緒卻差很多。' }
    case 'melody.play': {
      const part = detail === 'verse' ? 'verse' : 'chorus'
      return fromFeedback(melodyFeedback(p, part), '強拍上的和弦音讓旋律「站得穩」，弱拍上的經過音讓旋律「走得動」。', '每小節第 1 格先放綠色的和弦音，再用相鄰的音連起來。')
    }
    case 'lyrics.edit': {
      const sec = p.lyrics.find((s) => s.kind === detail) ?? p.lyrics[0]
      if (!sec) return { text: '' }
      const r = fromFeedback(analyzeSection(sec, p.idea.hook).fb, sec.kind === 'chorus' ? '副歌可以是整首歌的「結論」，Hook 在這裡回來最有感覺。' : '主歌可以先「演」出來：給聽的人一個看得見的畫面。', '大聲唸一遍，聽句尾的韻母是不是同一個。')
      return { ...r, text: `（${KIND_ZH[sec.kind]}）${r.text}` }
    }
    case 'arrange.change':
    case 'arrange.preview':
      return fromFeedback(arrangementFeedback(p), '樂器越多聽起來越「大」，但要有對比，大才聽得出來。', '試聽主歌和副歌各一次，比較哪一段比較「滿」。')
    case 'record.level': {
      const pk = p.recording.levelPeakDb
      return pk == null ? { text: '' } : pk > -3
        ? { text: `峰值 ${pk} dB，這一下快碰到紅區了，再大聲一點就會破音。`, learned: '數位錄音一過 0 dB 就會「削波」，事後很難補回來，所以我們先把音量留點空間。', next: '把增益調小一點，或退後半個拳頭，我們再測一次。' }
        : { text: `峰值 ${pk} dB，${pk >= -18 ? '音量剛好，最激動的那句應該也撐得住。' : '聲音有點小，雜音之後也會被一起放大。'}`, learned: '這段留白叫 headroom：最大聲的地方和 0 dB 之間留一點空間。', next: pk >= -18 ? '接著暖嗓，跟著你旋律裡的最高音唱唱看。' : '把增益調大一點再測。' }
    }
    case 'record.pitch':
      return { text: `你剛在 ±25 音分內撐住了 ${detail}。`, learned: '一個半音 = 100 音分；±25 內大多數人聽不出偏差。', next: '換你旋律最高的那個音試試——錄音前要確定它唱得穩。' }
    case 'mix.play':
    case 'mix.change':
      return fromFeedback(mixFeedback(p, null), '混音可以先求「聽得清楚」：先聽最想讓人注意的聲音，低頻通常放中間會比較穩。', '按 A/B 比較，聽聽你的混音和原始狀態差在哪。')
    case 'mix.ab':
      return { text: '來回聽兩個版本，有沒有哪一邊比較清楚、比較舒服？', learned: 'A/B 來回比較是混音師常用的小技巧，因為耳朵很快就會習慣。' }
    case 'review.play':
      return { text: `你剛從頭聽完了《${p.idea.title || '你的歌'}》。它是從一段 ${p.hum?.notes.length ?? 0} 個音的哼唱長出來的。`, next: '先不看建議，問問自己：哪一句你最想再聽一次？那可能就是這首歌的心臟。' }
    case 'inspiration.saved':
    case 'inspiration.used':
    case 'inspiration.start': {
      const t = detail.trim()
      const heavy = /罪|痛|淚|夜|失|傷|孤|冷|黑|碎|離|負|沉|灰/.test(t)
      const bright = /光|笑|陽|晴|飛|甜|暖|春|跳|愛/.test(t)
      const feel = heavy ? '有重量，像壓著東西往前走——這種張力很適合小調、中慢速（約 70–85 BPM），讓每一步都踩得到' : bright ? '很明亮，適合大調、中快速，讓它往上飄' : '情緒還很開放，等你在構想裡選一個方向'
      if (kind === 'inspiration.saved') return { text: `記下了${t ? `「${t}」` : ''}。不急著用它，先回到你剛剛在做的事。`, learned: '先記下來、不打斷手上的事，之後再回來挑，很多創作者都這樣累積素材。', next: t ? `這幾個字${feel}。` : undefined }
      if (kind === 'inspiration.start') return {
        text: `用「${t}」開一首歌。${t ? `這幾個字${feel}。` : ''}我已經把它放進歌名／Vibe 板。`,
        learned: '從一個核心意象出發，後面每個選擇都能問自己：「這像不像它？」',
        next: heavy ? '在情緒裡試試「憂傷失落」或「熱血衝刺」，兩種都聽，選一個更像它的；接著去哼唱，心裡默念這幾個字。' : '先選一個情緒，再去哼唱或排和弦。',
        suggestions: [{ label: '去哼唱', action: { type: 'goStep', step: 'hum' } }, { label: '去排和弦', action: { type: 'goStep', step: 'harmony' } }],
      }
      return { text: `把「${t || '這則靈感'}」放進來了。它是你的素材，可以改、可以拆。`, next: '唸一遍或哼一遍，聽它和這一章的其他東西搭不搭。' }
    }
    case 'step.complete': {
      const i = STEP_ORDER.indexOf(step)
      const nxt = STEP_ORDER[i + 1]
      return { text: learnedFor(step, p), next: nxt ? `想繼續的話，去「${STEP_ZH[nxt]}」坐坐。` : '先聽聽這一版，想改的地方隨時都能回來。', suggestions: [{ label: '▶ 聽聽目前的成果', action: { type: 'playResult' } }] }
    }
    default:
      return { text: '我聽到了。' }
  }
}

function questionReply(p: Project, step: string, q: string): AgentReply {
  const c = chordsOf(p)
  const part: 'verse' | 'chorus' = /主歌/.test(q) ? 'verse' : 'chorus'
  if (/(幫我|替我|直接).*(寫|作|完成)|代寫|寫一首/.test(q)) {
    return {
      text: '這首歌要是你的，所以我不替你寫完。但我可以陪你一句一句寫。',
      next: step === 'lyrics' ? `先回答我：「${p.idea.image || '你的核心畫面'}」裡，有哪一個東西是只有你會注意到的？把它寫成第一句。` : '告訴我你卡在哪一格、哪一句，我給你兩三個方向讓你試聽選。',
    }
  }
  if (/(哀傷|悲傷|難過|憂傷|sad|更暗|心碎)/.test(q)) {
    const opts: [string, number[]][] = p.harmony.mode === 'major'
      ? [['從 vi 出發（憂傷的家）', [5, 3, 0, 4]], ['往下沉：vi–iii–IV–I', [5, 2, 3, 0]], ['停在 vi 不回家', [0, 4, 3, 5]]]
      : [['i–VI–III–VII（史詩憂傷）', [0, 5, 2, 6]], ['i–iv–i–v（低迴）', [0, 3, 0, 4]], ['VI–VII–i–i（一路沉到底）', [5, 6, 0, 0]]]
    return {
      text: `更哀傷的方向通常是：多用小和弦、少回到大三的主和弦、結尾不給句號。我給你三個走向，${part === 'verse' ? '套在主歌' : '套在副歌'}試聽，選你心裡那個。`,
      learned: '小三和弦（中間音低半音）是「陰影」的來源。',
      suggestions: opts.map(([label, degs]) => ({ label: `${label}：${degs.map((d) => c[d].name).join('–')}`, action: { type: 'tryProgression' as const, part, degs } })),
      next: p.harmony.mode === 'major' ? '也可以把調性改成小調，整首都會變暗。' : undefined,
    }
  }
  if (/(開心|明亮|快樂|輕快|happy|溫暖)/.test(q)) {
    const opts: [string, number[]][] = [['I–IV–V–I（最陽光）', [0, 3, 4, 0]], ['IV–V–iii–vi（日系推進）', [3, 4, 2, 5]], ['I–V–IV–V（不斷往前）', [0, 4, 3, 4]]]
    return {
      text: '更明亮：多用大三和弦（I、IV、V），讓 IV 和 V 輪流推進。三個方向給你試聽：',
      learned: 'I、IV、V 是調內三個大三和弦，也是流行歌的骨幹。',
      suggestions: opts.map(([label, degs]) => ({ label: `${label}：${degs.map((d) => c[d].name).join('–')}`, action: { type: 'tryProgression' as const, part, degs } })),
    }
  }
  if (/為什麼.*和弦|這和弦|這個和弦|和弦.*為什麼/.test(q)) {
    const d = p.harmony[part].filter((x): x is number => x != null)
    if (!d.length) return { text: '你還沒排和弦。先點每個和弦聽聽，選一個「聽起來像家」的放第一格。' }
    return {
      text: d.map((x) => `${c[x].name}（${c[x].roman}）＝${CHORD_ROLE[p.harmony.mode][x]}`).slice(0, 4).join('；'),
      learned: '每個和弦的角色來自它和主音的距離：I 穩定、IV 離開、V 想回來。',
      next: '把其中一格換成相鄰角色的和弦，聽聽情緒怎麼變。',
    }
  }
  if (/(押韻|韻腳|韻|rhyme)/.test(q)) {
    const ch = lastChar(p.idea.hook)
    const r = rhymeOf(ch)
    return r
      ? { text: `你的 Hook 結尾「${ch}」屬於「${r.group}」轍（${r.sound}）。同韻的字有：${RHYME_GROUPS[r.idx].sample}。挑一個跟你的畫面有關的，放在另一句的句尾。`, learned: '十三轍：中文歌只要韻母相近就算押韻。' }
      : { text: `「${ch || '你的句尾字'}」不在我的韻表裡。大聲唸出來，聽它的韻母（a、ang、ing…），再到韻腳小抄找同組的字。` }
  }
  if (/(旋律|怎麼寫曲|音符)/.test(q)) {
    return fromFeedback(melodyFeedback(p, part), '動機：一個 2–4 個音的小樂句，重複一次、再變化一次，就是好記的旋律。', '先寫第 1 小節，第 2 小節照抄，第 3 小節只改最後兩個音。')
  }
  if (/(爆發力|更熱鬧|更滿)/.test(q)) return { text: '先把主歌的鼓拿掉，再讓鼓在副歌進來。到編曲檯點段落，再點「鼓」，逐次試聽差別。', suggestions: [{label:'去編曲試試',action:{type:'goStep',step:'arrange'}}] }
  if (/(REAPER|帶進|匯出)/i.test(q)) return { text: '先在總檢討下載 MIDI，再拖進 REAPER。MIDI 是音符，需要在 REAPER 選樂器才會發聲；工作室選單的「更多」有操作小抄。', suggestions: [{label:'去總檢討',action:{type:'goStep',step:'review'}}] }
  if (/(下一步|接下來|然後呢|卡住)/.test(q)) {
    return eventReply(p, step, 'step.enter', '')
  }
  if (/(太高|唱不上去|音域)/.test(q)) {
    const notes = [...p.melody.chorus, ...p.melody.verse].filter((m): m is number => m != null && m >= 0)
    const hi = notes.length ? Math.max(...notes) : null
    return { text: hi != null ? `旋律最高到 ${noteNameOct(hi)}${p.hum ? `，剛才哼的最高音是 ${noteNameOct(p.hum.rangeHigh)}` : ''}。` : '旋律還沒寫下來。', next: '改和聲的調性不會搬動已寫的旋律。可以回旋律格，把最高那句往下點幾格，再唱唱看。', learned: '移調（換 Key）會改變音的高低，旋律的形狀還在。' }
  }
  return { text: '先只改一件事，再聽聽差別。', next: '告訴我想改哪一句、哪一段，我陪你試。' }

}

export function mockReply(p: Project, input: { step: string; event?: { kind: string; detail: string }; question?: string; persona?: { name: string } }): AgentReply {
  if (input.question) {
    const reply = questionReply(p, input.step, input.question)
    const chords = chordsOf(p)
    const progression = p.harmony.chorus.filter((d): d is number => d != null).map(d => chords[d].name).join('–')
    const lyric = p.lyrics.find(s => s.text.trim())?.text.split('\n')[0]
    const hook = p.idea.hook.trim() || p.idea.title.trim()
    const song = hook ? `「${hook}」` : '這首還沒命名的歌'
    const mood = ({warm:'溫暖療癒',happy:'開心雀躍',sad:'憂傷失落',miss:'思念懷舊',fire:'熱血衝刺',dream:'夢幻漂浮'} as Record<string,string>)[p.idea.mood] || '還在找感覺'
    const context: Record<string,string> = {
      作曲家: `${song}的副歌${progression ? `用了 ${progression}` : '還沒排和弦'}，旋律有 ${p.melody.chorus.filter(n=>n!=null&&n>=0).length} 個起音。先哼最後兩個音，聽它是否想回到開頭。`,
      作詞人: `${song}${lyric ? `裡的「${lyric}」已經有畫面` : '可以先從眼前的一件物品寫起'}。先挑一個你看得到的細節，唸給自己聽。`,
      錄音師: `${song}現在是 ${p.idea.bpm} BPM，${p.arrangement.length ? `排了 ${p.arrangement.length} 個段落` : '還沒排段落'}。先用副歌最響的一句測音量，保留不破音的空間。`,
      編曲: `${song}想要「${mood}」，目前有 ${p.arrangement.length} 個段落。先讓主歌少一件樂器，再聽副歌進來。`,
      製作人: `${song}選了「${mood}」、${p.idea.bpm} BPM。先聽副歌，問自己這句話有沒有留下來。`,
    }
    const observation = context[input.persona?.name || '製作人'] || context.製作人
    // A refusal stays first; role-specific guidance still refers to the student's work.
    return /不替你寫完/.test(reply.text) ? {...reply, next: observation} : {...reply, text: `${observation} ${reply.text}`}
  }
  if (input.event) return eventReply(p, input.step, input.event.kind, input.event.detail)
  return { text: '' }
}

