# 文案盤點（2026-11-10 17:58）

範圍：`src/`、`server/`、`index.html` 含中文字的原始碼行。下面是逐行搜尋清單，保留位置與原文；它是候選清單，包含註解、資料、內部 prompt 與不一定顯示的分支，不能當成已完成的逐字人工審核。動態回覆及使用者輸入需另外實際走流程確認。問題欄為初篩，不代表未標記者已通過。

## 已確認的問題

| 位置 | 原文 | 問題 |
| --- | --- | --- |
| src/agent/mock.ts `fromFeedback` | 你做到了：…我聽到一個可以再試的地方：… | 評語固定模板，像批改作業。 |
| src/agent/mock.ts `learnedFor` | 情緒決定參數… | 技術報告口吻，將創作決定說得太絕對。 |
| src/agent/mock.ts `record` | 錄音唯一不能後悔的事 | 嚇人又武斷。 |
| src/agent/mock.ts `step.complete` | 你完成了第一首歌。下一版會更好。 | 預設作品和評價，忽略玩家可能跳著走。 |
| src/App.tsx storage notice | 請先留在這頁。釋出儲存空間後… | 系統腔，但資料可能未保存的風險與可操作的重試步驟必須保留。 |
| src/components/KnowledgeSpark.tsx | 再深一點 | 各檯火花的展開方式一致，仍需逐一讀取及確認文字。 |

## 搜尋原文與初篩

「待人工判讀」不是通過。多行 JSX、英文介面、透過變數組合的文字與 API 產生的回覆須另外檢查。

| 位置 | 原始碼行（含原文） | 問題初篩 |
| --- | --- | --- |
| index.html:7 | `<meta name="description" content="Maglody：跟著大師，從一段哼唱完成你的第一首歌。手機可直接使用。" />` | 待人工判讀 |
| index.html:15 | `<title>Maglody 新手音樂工作室</title>` | 待人工判讀 |
| server/app.ts:55 | `// 不將供應商原文／憑證／學生內容送回瀏覽器或記錄到 log。` | 待人工判讀 |
| src/App.tsx:32 | `// 工作室：發想 → 成形 → 打磨。每一檯都能隨時進出，沒有關卡。` | 待人工判讀 |
| src/App.tsx:35 | `{ name: '發想', note: '找到一顆歌的種子', keys: ['hum', 'idea'] },` | 待人工判讀 |
| src/App.tsx:36 | `{ name: '成形', note: '讓聲音長出形狀', keys: ['harmony', 'melody', 'lyrics', 'arrange'] },` | 待人工判讀 |
| src/App.tsx:37 | `{ name: '打磨', note: '留下自己的第一版', keys: ['record', 'mix', 'review'] },` | 待人工判讀 |
| src/App.tsx:67 | `? '先留一小句副歌旋律，再來混音'` | 待人工判讀 |
| src/App.tsx:68 | `: step.key === 'review' && !hasWrittenSound ? '先留下一點聲音：挑幾個和弦，或寫幾個音' : null` | 待人工判讀 |
| src/App.tsx:75 | `// 進場不再說開場白：角色登場那一句＋這一檯自己的一句話就夠了` | 待人工判讀 |
| src/App.tsx:79 | `// 這一檯的夥伴最近說的一句話（只取進入這一檯之後的）` | 待人工判讀 |
| src/App.tsx:80 | `// 夥伴的話只停留 14 秒，之後讓位給這一檯當下該做的事` | 待人工判讀 |
| src/App.tsx:96 | `// 前進按鈕只在這一檯「做完」時才出現（由各檯放在主動作的位置）` | 待人工判讀 |
| src/App.tsx:129 | `<button className="desk-name" onClick={() => setMenu(true)} aria-label="打開工作室選單">` | 待人工判讀 |
| src/App.tsx:132 | `<button className={\`sticker ${inspoRec ? 'rec' : ''}\`} onClick={() => setInspoOpen('capture')} aria-label="記一下靈感">` | 待人工判讀 |
| src/App.tsx:133 | `<span className="sticker-label"><span aria-hidden>✎</span> {inspoRec ? '錄音中' : '記一下'}</span>` | 待人工判讀 |
| src/App.tsx:134 | `<small>{inspoRec ? '靈感先留在這裡' : '文字 · 哼唱'}</small>` | 待人工判讀 |
| src/App.tsx:143 | `{storageError && <div className="storage-notice" role="status"><span>這首歌還沒存進瀏覽器，請先留在這頁。釋出儲存空間後，按「重試保存」。</span><button className="btn" onClick={() => setProject({ ...p })}>重試保存</button></div>}` | 系統腔／命令語氣，待確認 |
| src/App.tsx:147 | `<div className="song-trail" aria-label="歌曲手記">` | 待人工判讀 |
| src/App.tsx:148 | `<p className="trail-title">{p.idea.title ? \`《${p.idea.title}》的手記\` : '我們的第一首歌'}</p>` | 待人工判讀 |
| src/App.tsx:149 | `<div className="desk-mission" role="status" aria-label="當下的小任務" data-ready={ready && !missionPrerequisite}>` | 待人工判讀 |
| src/App.tsx:150 | `<span className="mission-kicker">現在的小任務 · {role.name}陪你</span>` | 待人工判讀 |
| src/App.tsx:151 | `<strong>{missionPrerequisite ?? (unfinished ? unfinished.label : nextStep ? \`這一頁準備好了，可以去${nextStep.title}\` : '留下了自己的判斷，這一版由你決定')}</strong>` | 待人工判讀 |
| src/App.tsx:154 | `{ name: '一句靈感', kept: !!p.idea.hook.trim() },` | 待人工判讀 |
| src/App.tsx:155 | `{ name: '和弦', kept: [...p.harmony.verse, ...p.harmony.chorus].some(n => n != null) },` | 待人工判讀 |
| src/App.tsx:156 | `{ name: '旋律', kept: [...p.melody.verse, ...p.melody.chorus].some(n => n != null && n >= 0) },` | 待人工判讀 |
| src/App.tsx:157 | `{ name: '歌詞', kept: p.lyrics.some(s => s.text.trim()) },` | 待人工判讀 |
| src/App.tsx:158 | `].map(item => <li key={item.name} data-kept={item.kept}><span aria-hidden="true">{item.kept ? '✓' : '◦'}</span> {item.name}<span className="sr-only">{item.kept ? '已留下' : '還在醞釀'}</span></li>)}</ul>` | 資訊密度或說教語氣，待確認 |
| src/App.tsx:162 | `<section className="workpage" aria-label={\`${step.title}創作紙頁\`}>` | 待人工判讀 |
| src/App.tsx:163 | `<div className="page-caption"><span>冒險手記 · {phase.name}篇</span><span>第 {cur + 1} 頁</span></div>` | 待人工判讀 |
| src/App.tsx:165 | `<GentleContext.Provider value={phase.name === '發想'}>` | 待人工判讀 |
| src/App.tsx:175 | `<Modal label="工作室" className="menu-sheet" onClose={() => setMenu(false)}>` | 待人工判讀 |
| src/App.tsx:176 | `<div className="row between"><strong className="menu-title">工作室</strong><button className="link-btn modal-capture" onClick={() => setInspoOpen('capture')}>✎ 記一下</button><button className="icon-btn" onClick={() => setMenu(false)} aria-label="關閉">✕</button></div>` | 資訊密度或說教語氣，待確認 |
| src/App.tsx:177 | `<button className="primary-action menu-return" onClick={() => setMenu(false)}>回到{step.title}，繼續創作</button>` | 待人工判讀 |
| src/App.tsx:178 | `<nav className="studio-map" aria-label="創作地圖">` | 待人工判讀 |
| src/App.tsx:179 | `<div className="map-intro"><p>一首歌的探險地圖</p><span>可以跳著走，隨時回來。每一檯，都有人陪你。</span></div>` | 待人工判讀 |
| src/App.tsx:191 | `<span className="map-stop-copy"><span>{STEPS[i].title}</span><small>{companion.name}陪你</small></span>` | 待人工判讀 |
| src/App.tsx:192 | `<span className="map-stop-mark">{i === cur ? '你在這裡' : p.done[i] ? '留過足跡' : '隨時來坐'}</span>` | 待人工判讀 |
| src/App.tsx:202 | `<div className="menu-phase-name">我的歌</div>` | 待人工判讀 |
| src/App.tsx:203 | `{demoAvailable(p) && <button className="menu-desk" onClick={() => { setMenu(false); stopAll(); playDemo(p) }}><span>▶ 聽目前的 Demo</span></button>}` | 待人工判讀 |
| src/App.tsx:204 | `<button className="menu-desk" onClick={() => { setMenu(false); setInspoOpen('library') }}><span>翻翻靈感本子</span><span className="muted small">{inspo.list.length}</span></button>` | 待人工判讀 |
| src/App.tsx:205 | `<button className="menu-desk" onClick={() => { setMenu(false); openChat(role.id) }}><span>跟夥伴聊聊</span></button>` | 待人工判讀 |
| src/App.tsx:207 | `<summary>更多</summary>` | 待人工判讀 |
| src/App.tsx:210 | `<button className="btn small" onClick={() => setProjectDecision({ kind: 'save' })}>存成新的一版</button>` | 待人工判讀 |
| src/App.tsx:215 | `<button className="btn btn-ghost small" aria-label={\`試聽 ${v.name}\`} onClick={() => { stopAll(); playDemo(v.project) }}>▶</button>` | 待人工判讀 |
| src/App.tsx:216 | `<button className="btn btn-ghost small" onClick={() => setProjectDecision({ kind: 'restore', version: v })}>回到這版</button>` | 待人工判讀 |
| src/App.tsx:222 | `<button className="btn btn-ghost small" onClick={() => setProjectDecision({ kind: 'reset' })}>重新開始一首新歌</button>` | 待人工判讀 |
| server/index.ts:1 | `// API 金鑰只留在後端。Node 22.18+：node server/index.ts` | 待人工判讀 |
| server/index.ts:16 | `console.error(\`[master] 無法啟動：${error instanceof Error ? error.message : 'Unknown configuration error'}。請參考 README 的環境變數表。\`)` | 待人工判讀 |
| server/llm/types.ts:1 | `// LLM provider 抽象層：大師 Agent 只依賴這個介面，換供應商只要換一個檔案。` | 待人工判讀 |
| server/llm/types.ts:7 | `/** 要求供應商只回 JSON（各家 API 的 JSON mode） */` | 待人工判讀 |
| server/llm/types.ts:15 | `/** 回傳模型輸出的原始文字（應為 JSON 字串） */` | 待人工判讀 |
| server/llm/types.ts:26 | `if (v == null \|\| v === '') throw new ProviderError(\`缺少環境變數 ${name}\`, 500)` | 待人工判讀 |
| server/llm/openai.ts:3 | `// OpenAI provider：支援 Chat Completions（預設）與 Responses API。` | 待人工判讀 |
| server/llm/openai.ts:4 | `// env：OPENAI_API_KEY（必填）、LLM_MODEL、OPENAI_API_STYLE=chat\|responses、OPENAI_BASE_URL（可接相容端點）` | 待人工判讀 |
| server/llm/openai.ts:44 | `// Responses API：output[] 內的 message → content[] 內 type=output_text` | 待人工判讀 |
| src/lib/midi.ts:1 | `// 匯出標準 MIDI 檔（SMF Type 1），讓作品可以帶進 REAPER 等 DAW 繼續製作。` | 待人工判讀 |
| src/lib/midi.ts:27 | `/** 依編曲結構展開（沒有編曲時用 主歌→副歌） */` | 待人工判讀 |
| src/lib/midi.ts:62 | `return new Uint8Array([...header, ...meta, ...track('主旋律 Melody', melody), ...track('和弦 Chords', harm), ...track('貝斯 Bass', bass)])` | 待人工判讀 |
| src/inspire/recorder.ts:17 | `* 錄一段語音或哼唱（MediaRecorder，手機瀏覽器都支援）。` | 待人工判讀 |
| src/inspire/recorder.ts:18 | `* transcribe=true 時同時用瀏覽器的語音辨識做中文聽寫（Chrome、Safari 有；不支援時只存錄音）。` | 待人工判讀 |
| src/inspire/recorder.ts:19 | `* 錄音中仍可操作頁面其他部分（例如加照片），不會被打斷。` | 待人工判讀 |
| src/inspire/recorder.ts:95 | `setError('無法使用麥克風：請在瀏覽器網址列旁允許「麥克風」，並確認是用 https 或 localhost 開啟；也可以直接寫文字。')` | 待人工判讀 |
| src/main.tsx:12 | `// PWA：正式版註冊 service worker，可「加入主畫面」並離線開啟` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:7 | `hum: { ready: (p.hum?.notes.length ?? 0) >= 3, line: \`剛才的 ${p.hum?.notes.length ?? 0} 個音，已經是一顆旋律種子。\`, detail: '先記住你喜歡的那一小句就好。旋律可以從短句重複，再輕輕改一個結尾長出來；不必一次哼完整首。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:8 | `idea: { ready: !!p.idea.mood, line: '同一句話，換個速度就有不同心情。', detail: \`你選了每分鐘 ${p.idea.bpm} 拍。慢一點讓字句有呼吸，快一點帶來推進感；想比較時，工具箱裡可以調速度。\` },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:9 | `harmony: { ready: p.harmony.verse.some(n=>n!=null)\|\|p.harmony.chorus.some(n=>n!=null), line: '和弦像地板，托住你要唱的那句話。', detail: '先用耳朵挑喜歡的顏色，再聽它接到下一個時的感覺。沒有一定要選的答案；想往下挖，工具箱有你這段和弦的觀察。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:10 | `melody: { ready: noteCount(p.melody.verse)+noteCount(p.melody.chorus)>0, line: '音之間的空白，也是旋律的一部分。', detail: '試著留一格空白，讓自己有地方換氣。重複短句再換結尾，聽眾就更容易跟著哼。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:11 | `lyrics: { ready: p.lyrics.some(s=>s.text.trim()), line: '你寫下的畫面，就是這首歌的聲音。', detail: '先唸一遍，再跟著旋律唱。字太擠時刪掉一個形容詞；一句詞不必第一次就寫好。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:12 | `arrange: { ready: p.arrangement.length>0, line: '留一點空位，副歌進來才會更有感覺。', detail: '把主歌的一件樂器拿掉，再聽副歌進來的差別。工具箱裡可以調每段的長度與配器。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:13 | `record: { ready: p.recording.levelPeakDb != null, line: '音量留一點空間，情緒就能放心唱。', detail: '最大聲的一句也要留在上限之下。若完全沒收到聲音，先檢查麥克風；有聲音後，再調整距離。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:14 | `mix: { ready: p.mix.listened, line: '主旋律站前面，其他聲音一起托住它。', detail: '先把伴奏輕輕拉低，再聽旋律是否清楚。調整一次後，和原本的版本比較，耳朵會更容易分辨。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:15 | `review: { ready: !!p.review.verdict.trim(), line: '你說得出想改哪裡，就已經在製作自己的歌。', detail: '先存一版，再只改一件事。回頭比較兩版，用你最初想傳達的感覺來決定。' },` | 待人工判讀 |
| src/components/KnowledgeSpark.tsx:19 | `return <details className="knowledge-spark"><summary><span className="spark-kicker">小火花</span><span className="spark-line">{spark.line}</span><span className="spark-invite">想知道？<span className="spark-toggle" aria-hidden="true" /></span></summary><div className="spark-body"><p>{spark.detail}</p><details><summary>再深一點</summary><p>打開下方工具箱的「想知道？」可以看原理，並用這首歌的聲音再試一次。</p></details></div></details>` | 資訊密度或說教語氣，待確認 |
| src/steps/Arrangement.tsx:10 | `{ id: 'drums', name: '鼓', w: 3, why: '節奏骨架，加入就像心跳開始' },` | 待人工判讀 |
| src/steps/Arrangement.tsx:11 | `{ id: 'bass', name: '貝斯', w: 2, why: '低頻地基，讓和弦有重量' },` | 待人工判讀 |
| src/steps/Arrangement.tsx:12 | `{ id: 'keys', name: '鋼琴/吉他', w: 2, why: '和弦主體，節奏型決定律動' },` | 待人工判讀 |
| src/steps/Arrangement.tsx:13 | `{ id: 'pad', name: '弦樂鋪底', w: 1.5, why: '長音襯底，增加寬度和情緒' },` | 待人工判讀 |
| src/steps/Arrangement.tsx:14 | `{ id: 'melody', name: '主唱旋律', w: 1.5, why: '歌的主角' },` | 待人工判讀 |
| src/steps/Arrangement.tsx:52 | `if (a.length < 3) return [{ level: 'warn', text: '先排出至少 3 個段落。' }]` | 待人工判讀 |
| src/steps/Arrangement.tsx:55 | `fb.push(ch.length >= 2 ? { level: 'good', text: \`副歌出現 ${ch.length} 次，聽眾會記住它。\` } : { level: 'warn', text: '副歌只出現一次。', tip: '流行歌的副歌通常出現 2–3 次，重複就是記憶。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:56 | `if (a[0].kind === 'intro') fb.push({ level: 'good', text: '有前奏，先讓聽眾進入氣氛。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:57 | `else fb.push({ level: 'warn', text: '沒有前奏，一開始就唱。', tip: '這很有衝擊力，但新手錄音時，1–2 小節前奏能幫歌手抓到速度和音準。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:60 | `fb.push(ce > ve ? { level: 'good', text: '每段副歌的能量都比主歌高，有起伏。' } : { level: 'bad', text: '副歌的編曲沒有比主歌滿。', tip: '主歌少放一兩個樂器（例如先不要鼓），副歌再全部進來，對比就出來了。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:64 | `fb.push(dip ? { level: 'good', text: '中段有能量下降再拉起，最後一次副歌會更有力。' } : { level: 'warn', text: '整首能量一路持平或只往上。', tip: '在最後一次副歌前放一段「收起來」的橋段或間奏，像深呼吸後再衝。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:66 | `fb.push(dur >= 150 && dur <= 270 ? { level: 'good', text: \`全長約 ${fmtTime(dur)}，是流行歌常見長度。\` } : dur < 150 ? { level: 'warn', text: \`全長約 ${fmtTime(dur)}，偏短。\`, tip: '可以加長段落小節數，或多一次副歌。短歌也沒問題，Demo 階段 2 分鐘就很好。' } : { level: 'warn', text: \`全長約 ${fmtTime(dur)}，偏長。\`, tip: '聽眾注意力有限，試著刪掉重複太多的段落。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Arrangement.tsx:68 | `if (sameAll) fb.push({ level: 'bad', text: '所有段落的樂器完全一樣。', tip: '編曲的核心就是「何時加、何時減」。' })` | 待人工判讀 |
| src/steps/Arrangement.tsx:100 | `// 只排「骨架」：前奏 → 主歌 → 副歌 → 主歌 → 副歌 → 尾奏，全部只有鋼琴與主唱；誰要加進來，由你決定` | 待人工判讀 |
| src/steps/Arrangement.tsx:108 | `const say = a.length === 0 ? '先排出段落，再決定每一段誰上場。'` | 待人工判讀 |
| src/steps/Arrangement.tsx:109 | `: !ready ? '點一段，決定誰上場。副歌要比主歌熱鬧。'` | 待人工判讀 |
| src/steps/Arrangement.tsx:110 | `: '能量有起伏了。聽聽看。'` | 待人工判讀 |
| src/steps/Arrangement.tsx:135 | `<DeskActions primary={{ label: '■ 停', onClick: () => { player.stop(); setPlayer(null) } }} />` | 待人工判讀 |
| src/steps/Arrangement.tsx:137 | `<DeskActions primary={{ label: '排一個常見的骨架', onClick: sketch }} />` | 待人工判讀 |
| src/steps/Arrangement.tsx:139 | `<DeskActions primary={{ label: <>編好了，去{next.label} →</>, onClick: next.go }} secondary={cur ? { label: \`▶ 試聽${KIND_ZH[cur.kind]}\`, onClick: () => preview(cur) } : undefined} />` | 待人工判讀 |
| src/steps/Arrangement.tsx:141 | `<DeskActions primary={{ label: \`▶ 試聽${KIND_ZH[cur.kind]}\`, onClick: () => preview(cur) }} />` | 待人工判讀 |
| src/steps/Arrangement.tsx:152 | `<label className="row small">{KIND_ZH[cur.kind]} 小節數` | 待人工判讀 |
| src/steps/Arrangement.tsx:157 | `<button className="btn small" onClick={() => move(a.indexOf(cur), -1)}>往前</button>` | 待人工判讀 |
| src/steps/Arrangement.tsx:158 | `<button className="btn small" onClick={() => move(a.indexOf(cur), 1)}>往後</button>` | 待人工判讀 |
| src/steps/Arrangement.tsx:159 | `<button className="btn small" onClick={() => { update('arrangement', a.filter((s) => s.id !== cur.id)); setSel(null) }}>刪掉</button>` | 待人工判讀 |
| src/steps/Arrangement.tsx:162 | `{a.length > 0 && <p className="muted small">長條越高越熱鬧，越寬越長。全長約 {fmtTime(songSeconds(p))}。</p>}` | 待人工判讀 |
| src/steps/Arrangement.tsx:164 | `<Why ready={a.length >= 3} title="為什麼主歌要少一點樂器？">` | 待人工判讀 |
| src/steps/Arrangement.tsx:165 | `<p>耳朵對「變化」比對「多」敏感。主歌先收著，副歌全員進來，才聽得出爆發。</p>` | 待人工判讀 |
| src/steps/Arrangement.tsx:174 | `title: '編曲',` | 待人工判讀 |
| src/steps/Arrangement.tsx:175 | `subtitle: '決定什麼時候加、什麼時候減',` | 待人工判讀 |
| src/steps/Arrangement.tsx:176 | `glyph: '編',` | 待人工判讀 |
| src/steps/Arrangement.tsx:179 | `{ label: '至少 4 個段落', ok: p.arrangement.length >= 4 },` | 待人工判讀 |
| src/steps/Arrangement.tsx:180 | `{ label: '包含主歌與副歌', ok: p.arrangement.some((s) => s.kind === 'verse') && p.arrangement.some((s) => s.kind === 'chorus') },` | 待人工判讀 |
| src/steps/Arrangement.tsx:181 | `{ label: '各段樂器不完全相同', ok: new Set(p.arrangement.map(energy)).size > 1 },` | 待人工判讀 |
| src/components/SongMaterials.tsx:7 | `const parts = [{ key: 'verse', name: '主歌' }, { key: 'chorus', name: '副歌' }] as const` | 待人工判讀 |
| src/components/SongMaterials.tsx:13 | `return <details className="material-journal" aria-label="素材手記">` | 待人工判讀 |
| src/components/SongMaterials.tsx:14 | `<summary><span>翻開素材手記</span><span className="journal-fold" aria-hidden="true">＋</span></summary>` | 待人工判讀 |
| src/components/SongMaterials.tsx:16 | `{!hasMaterials && <p className="journal-empty">第一筆還在醞釀。你留下的詞和聲音，會慢慢收在這裡。</p>}` | 待人工判讀 |
| src/components/SongMaterials.tsx:17 | `{!!p.idea.hook.trim() && <article className="material-note" data-material="idea" aria-label="一句靈感"><h2>一句靈感</h2><p>{p.idea.hook.slice(0, 120)}{p.idea.hook.length > 120 ? '…' : ''}</p></article>}` | 資訊密度或說教語氣，待確認 |
| src/components/SongMaterials.tsx:18 | `{!!harmonies.length && <article className="material-note" data-material="harmony" aria-label="和弦片段"><h2>和弦的顏色</h2>{harmonies.map(part => <p key={part.key}><small>{part.name}</small><span>{p.harmony[part.key].map(n => n == null ? '＿' : chords[n].name).join(' → ')}</span></p>)}</article>}` | 資訊密度或說教語氣，待確認 |
| src/components/SongMaterials.tsx:19 | `{!!(melodies.length \|\| hum.length) && <article className="material-note" data-material="melody" aria-label="旋律片段"><h2>旋律的腳步</h2>{(melodies.length ? melodies : [{ key: 'hum', name: '哼唱種子', notes: hum }]).map(part => <p key={part.key}><small>{part.name} · 開頭幾個音</small><span>{part.notes.map(noteNameOct).join(' · ')}</span></p>)}</article>}` | 資訊密度或說教語氣，待確認 |
| src/components/SongMaterials.tsx:20 | `{!!lyrics.length && <article className="material-note" data-material="lyrics" aria-label="詞句片段"><h2>留在紙上的詞</h2>{lyrics.map(section => <p key={section.id}>{section.text.trim().slice(0, 100)}{section.text.trim().length > 100 ? '…' : ''}</p>)}</article>}` | 資訊密度或說教語氣，待確認 |
| server/llm/gcp.ts:4 | `//  - vertex：Vertex AI Gemini（GCP 專案 + OAuth 存取權杖）` | 待人工判讀 |
| server/llm/gcp.ts:5 | `//      env：GCP_PROJECT（必填）、GCP_LOCATION（預設 us-central1，可設 global）、LLM_MODEL` | 待人工判讀 |
| server/llm/gcp.ts:6 | `//      權杖順序：GCP_ACCESS_TOKEN → Cloud Run 服務帳戶（GCP_USE_METADATA=1）→ 本機 \`gcloud auth print-access-token\`` | 待人工判讀 |
| server/llm/gcp.ts:7 | `//  - gemini：Gemini Developer API（只需 GEMINI_API_KEY，適合本機開發）` | 待人工判讀 |
| server/llm/gcp.ts:17 | `// gcloud 權杖約 60 分鐘有效，快取 45 分鐘` | 待人工判讀 |
| server/llm/gcp.ts:19 | `// 部署在 Cloud Run 時（部署指令會設 GCP_USE_METADATA=1）：向 GCP metadata server 取得服務帳戶權杖，` | 待人工判讀 |
| server/llm/gcp.ts:20 | `// 這是 Google 官方函式庫在 Cloud Run 上取得憑證的同一種方式，不需要任何金鑰檔。本機開發不會走這條路。` | 待人工判讀 |
| server/llm/gcp.ts:33 | `throw new ProviderError('取得 GCP 存取權杖失敗：本機請先執行 gcloud auth login；Cloud Run 上請設 GCP_USE_METADATA=1 並給服務帳戶「Vertex AI 使用者」角色', 500)` | 系統腔／命令語氣，待確認 |
| server/llm/gcp.ts:65 | `// VERTEX_BASE_URL：走公司代理或本機測試時覆寫` | 待人工判讀 |
| server/llm/index.ts:5 | `/** 後端用的離線 provider：不連網，只驗證整條管線（前端本身另有更完整的 mock 大師） */` | 待人工判讀 |
| server/llm/index.ts:12 | `return JSON.stringify({ text: '先聽聽你的歌。你最想調整哪一段？' })` | 待人工判讀 |
| server/llm/index.ts:17 | `/** 依 LLM_PROVIDER 選擇供應商：openai \| vertex \| gemini \| mock（預設） */` | 待人工判讀 |
| src/lib/capture.ts:1 | `/** 忽略較舊的權限回覆；即使 getUserMedia 無法取消，也立即關掉遲到的 stream。 */` | 待人工判讀 |
| src/steps/Recording.tsx:9 | `{ id: 'room', label: '找安靜的房間，關掉冷氣、風扇', why: '麥克風會收進所有聲音，事後很難去除。' },` | 待人工判讀 |
| src/steps/Recording.tsx:10 | `{ id: 'soft', label: '周圍有軟的東西（衣櫃、棉被、窗簾）', why: '軟物吸收回音，硬牆會讓聲音變「空」。衣櫃前錄音是業餘神技。' },` | 待人工判讀 |
| src/steps/Recording.tsx:11 | `{ id: 'dist', label: '嘴巴離麥克風約一個拳頭（10–15 公分）', why: '太近低頻過重、噴麥；太遠房間回音變多。' },` | 待人工判讀 |
| src/steps/Recording.tsx:12 | `{ id: 'pop', label: '準備防噴罩（或用絲襪套衣架代替）', why: 'ㄅ、ㄆ 的氣流會打到麥克風造成「噗」聲。' },` | 待人工判讀 |
| src/steps/Recording.tsx:13 | `{ id: 'phones', label: '戴耳機聽伴奏和節拍器，不要外放', why: '外放的伴奏會被錄進人聲軌，混音時無法分開。' },` | 待人工判讀 |
| src/steps/Recording.tsx:14 | `{ id: 'takes', label: '每段至少錄 3 次（take），之後挑最好的', why: '專業歌手也錄很多次。多錄幾次，壓力就小了。' },` | 待人工判讀 |
| src/steps/Recording.tsx:15 | `{ id: 'warm', label: '錄前暖嗓 5 分鐘、喝溫水', why: '聲帶是肌肉，暖身後音準和音色都更穩。' },` | 待人工判讀 |
| src/steps/Recording.tsx:16 | `{ id: 'sheet', label: '印出或打開歌詞＋和弦表', why: '專心在情緒上，不要邊錄邊想詞。' },` | 待人工判讀 |
| src/steps/Recording.tsx:39 | `// 音準練習：連續在 ±25 cents 內約 0.6 秒算一次命中` | 待人工判讀 |
| src/steps/Recording.tsx:73 | `fb.push(pk > -3 ? { level: 'bad', text: \`峰值 ${pk} dB，太大聲會破音（削波）。\`, tip: '把麥克風／介面的增益（Gain）調小，或離麥克風遠一點。破音是錄音唯一救不回來的錯誤。' } : pk >= -18 ? { level: 'good', text: \`峰值 ${pk} dB，音量健康，有足夠空間給最大聲的句子。\` } : { level: 'warn', text: \`峰值 ${pk} dB，偏小聲。\`, tip: '增益調大一點或靠近一些。太小聲的錄音放大後雜音也會變大。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Recording.tsx:76 | `fb.push(nChecked >= 6 ? { level: 'good', text: \`準備清單完成 ${nChecked}/${REC_CHECKS.length}。\` } : { level: 'warn', text: \`準備清單完成 ${nChecked}/${REC_CHECKS.length}。\` })` | 待人工判讀 |
| src/steps/Recording.tsx:77 | `if (r.pitchHits) fb.push(r.pitchHits >= 3 ? { level: 'good', text: \`音準練習命中 ${r.pitchHits} 次，聲音準備好了。\` } : { level: 'warn', text: \`音準練習命中 ${r.pitchHits} 次，再多練幾次。\` })` | 待人工判讀 |
| src/steps/Recording.tsx:81 | `<Coach short={mode === 'level' ? '唱你這首歌最大聲的那一句。' : r.levelPeakDb != null ? (r.levelPeakDb <= -60 ? '還沒收到聲音，靠近麥克風再試；也可以先跳過。' : r.levelPeakDb > -3 ? \`最大聲到 ${r.levelPeakDb} dB，太滿了，退後一點再試。\` : \`最大聲 ${r.levelPeakDb} dB，安全。\`) : '錄之前，先確定最大聲時不會破音。'} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Recording.tsx:87 | `<div className="meter-scale small muted"><span>小聲</span><span>剛好</span><span>太滿</span></div>` | 待人工判讀 |
| src/steps/Recording.tsx:94 | `<DeskActions primary={{ label: '■ 唱完了', onClick: endLevel }} />` | 待人工判讀 |
| src/steps/Recording.tsx:96 | `<DeskActions primary={{ label: <>準備好了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '再測一次', onClick: startLevel }} />` | 待人工判讀 |
| src/steps/Recording.tsx:98 | `<DeskActions primary={{ label: mic.pending ? '等麥克風許可…' : '● 測音量', onClick: startLevel, disabled: mic.pending }} secondary={{ label: '沒有麥克風，先跳過', onClick: () => update('recording', { ...r, checks: { ...r.checks, nomic: true } }) }} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Recording.tsx:102 | `<Card title="2. 暖嗓：音準跟唱">` | 待人工判讀 |
| src/steps/Recording.tsx:103 | `<p className="muted small">點一個音，聽完後跟著唱「啊～」，撐住。指針在中間綠區越久越好（停留約 0.6 秒算一次命中）。這些是你旋律裡的最低、中間、最高音。</p>` | 待人工判讀 |
| src/steps/Recording.tsx:110 | `{mode === 'pitch' && <button className="btn btn-danger" onClick={() => { mic.stop(); setMode(null) }}>■ 停止</button>}` | 待人工判讀 |
| src/steps/Recording.tsx:119 | `<span>偏低</span>` | 待人工判讀 |
| src/steps/Recording.tsx:120 | `<span>{cents == null ? '請開始唱…' : \`${cents > 0 ? '+' : ''}${cents} 音分 ${pitchLevel === 'good' ? '準！撐住' : cents > 0 ? '稍微放低' : '稍微抬高'}\`}</span>` | 待人工判讀 |
| src/steps/Recording.tsx:121 | `<span>偏高</span>` | 待人工判讀 |
| src/steps/Recording.tsx:123 | `<p className="small">本次命中：{hits}</p>` | 待人工判讀 |
| src/steps/Recording.tsx:128 | `<Card title="3. 錄音環境清單">` | 待人工判讀 |
| src/steps/Recording.tsx:144 | `<Card title="4. 節拍器（你的歌速度）">` | 待人工判讀 |
| src/steps/Recording.tsx:146 | `{metro == null ? <button className="btn" onClick={() => setMetro(Date.now())}>▶ {p.idea.bpm} BPM</button> : <button className="btn btn-danger" onClick={() => setMetro(null)}>■ 停止</button>}` | 資訊密度或說教語氣，待確認 |
| src/steps/Recording.tsx:147 | `<span className="muted small">錄音時戴耳機聽它，人聲才會跟伴奏對齊。</span>` | 待人工判讀 |
| src/steps/Recording.tsx:151 | `<Card title="即時回饋">` | 待人工判讀 |
| src/steps/Recording.tsx:153 | `<div className="legend small muted"><Light level="good" /> -24～-6 dB 健康 <Light level="warn" /> 太小或接近上限 <Light level="bad" /> -3 dB 以上會破音</div>` | 待人工判讀 |
| src/steps/Recording.tsx:156 | `<Why ready={r.levelPeakDb != null \|\| !!r.checks.nomic} hint="先做音量測試。" title="為什麼峰值要留在 -6 dB 以下？" apply="直播、Podcast、錄 Vlog 旁白都用同樣標準。">` | 待人工判讀 |
| src/steps/Recording.tsx:157 | `<p>數位錄音的上限是 0 dB，超過就會「削波」，波形頂端被切掉，聽起來是刺耳的破音，後製完全救不回。留 6 dB 以上的空間（headroom），就算情緒一激動也不怕。</p>` | 待人工判讀 |
| src/steps/Recording.tsx:159 | `<Why ready={hits > 0 \|\| r.pitchHits > 0} hint="先跟唱一個音。" listen={target != null ? { label: '再聽一次目標音', play: () => playNote(target, 1.2, { type: 'sine', gain: 0.3 }) } : undefined} title="音分（cent）是什麼？" apply="調樂器、用修音軟體、看調音器時都會看到它。">` | 資訊密度或說教語氣，待確認 |
| src/steps/Recording.tsx:160 | `<p>一個半音分成 100 音分。一般人耳對 ±10–25 音分的偏差不太敏感，超過 50 音分（半個半音）就會明顯「走音」。</p>` | 待人工判讀 |
| src/steps/Recording.tsx:169 | `title: '錄音準備',` | 待人工判讀 |
| src/steps/Recording.tsx:170 | `subtitle: '測音量、暖嗓、整理環境',` | 待人工判讀 |
| src/steps/Recording.tsx:171 | `glyph: '錄',` | 待人工判讀 |
| src/steps/Recording.tsx:174 | `{ label: '測過音量且沒有破音（或先跳過）', ok: (p.recording.levelPeakDb != null && p.recording.levelPeakDb > -60 && p.recording.levelPeakDb <= -3) \|\| !!p.recording.checks.nomic },` | 待人工判讀 |
| src/inspire/pull.ts:1 | `// 「拉進創作」：把一則靈感放進目前這一章（或從它開始一首新歌）。` | 待人工判讀 |
| src/inspire/pull.ts:2 | `// 只把學生自己的素材放到他指定的位置，不替他改寫。` | 待人工判讀 |
| src/inspire/pull.ts:12 | `/** 回傳要跳去的章節（可省略＝留在原地） */` | 待人工判讀 |
| src/inspire/pull.ts:41 | `if (x.tags.includes('title')) idea('title', \`設為歌名「${w.slice(0, 12)}」\`)` | 待人工判讀 |
| src/inspire/pull.ts:42 | `idea('vibe', '加進 Vibe 板')` | 待人工判讀 |
| src/inspire/pull.ts:43 | `if (x.tags.includes('image')) idea('image', '設為核心畫面')` | 待人工判讀 |
| src/inspire/pull.ts:44 | `if (x.tags.includes('story')) idea('story', '加進故事')` | 待人工判讀 |
| src/inspire/pull.ts:45 | `idea('hook', '設為記憶點（Hook）')` | 待人工判讀 |
| src/inspire/pull.ts:49 | `label: \`加進歌詞：${KIND_ZH[s.kind]}${p.lyrics.filter((y) => y.kind === s.kind).length > 1 ? \` #${i + 1}\` : ''}\`,` | 待人工判讀 |
| src/inspire/pull.ts:54 | `if (!['idea', 'hum'].includes(step)) idea('vibe', '帶到構想：加進 Vibe 板')` | 待人工判讀 |
| src/inspire/pull.ts:57 | `here.unshift({ label: \`用這段哼唱（${x.hum.notes.length} 音）當旋律種子\`, how: 'hum.seed', apply: (_pp, update) => { humSeed(x, update); return step === 'melody' ? 'melody' : 'hum' } })` | 待人工判讀 |
| src/inspire/pull.ts:61 | `label: '從這則靈感開始一首歌',` | 待人工判讀 |
| src/inspire/pull.ts:72 | `// 先用這則靈感定 vibe（情緒／速度），再去哼唱或排和弦：心裡有這句話，旋律會跟著它的情緒走` | 待人工判讀 |
| src/inspire/pull.ts:80 | `* 拼貼：把多則碎片重組成新的東西。只做「排列與接合」，內容全部來自學生自己的素材。` | 待人工判讀 |
| src/inspire/pull.ts:88 | `label: \`拼成一段新歌詞（${texts.length} 句）\`,` | 待人工判讀 |
| src/inspire/pull.ts:101 | `label: \`把 ${hums.length} 段哼唱接成一條旋律種子\`,` | 待人工判讀 |
| src/inspire/pull.ts:117 | `api.add({ text: '（拼貼的哼唱）', tags: ['melody'], images: [], hum: merged.hum, fromStep: 'hum' })` | 待人工判讀 |
| src/inspire/pull.ts:123 | `label: '合成一則新靈感',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:5 | `/** 在 REAPER 裡接著做：每章對應的實際操作與「為什麼」 */` | 待人工判讀 |
| src/components/ReaperGuide.tsx:8 | `title: '把編曲帶進 REAPER',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:10 | `'按下方「下載 MIDI」，得到含 主旋律／和弦／貝斯 三軌的 .mid 檔。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:11 | `'開 REAPER → 把 .mid 拖進編輯視窗 → 選「Multiple tracks」（每軌一個）。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:12 | `'每軌點 FX → 加 ReaSynth（內建合成器）就能出聲；之後可換成免費的鋼琴、貝斯外掛。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:13 | `'速度會跟著 MIDI 檔設好；在頂端 BPM 欄確認是你的速度。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:15 | `why: '網頁裡的聲音是草稿。DAW 讓你換真實音色、精修每個音，也是錄音和混音的地方——Maglody 負責「學會怎麼做決定」，REAPER 負責「把決定做到好聽」。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:18 | `title: '在 REAPER 錄人聲',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:20 | `'Options → Preferences → Audio → Device：選你的錄音介面或麥克風；手機錄音可先用 Voice Memo 再拖進來。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:21 | `'新增一軌 → 點紅色「錄音預備」(Record Arm) → 輸入選 Mono / Input 1。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:22 | `'打開 Record Monitoring（喇叭圖示）並戴耳機，跟著和弦軌唱。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:23 | `'看軌道音量表：最大聲時停在 -12 到 -6 dB，碰到紅色就把介面增益調小。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:24 | `'按 Ctrl+R 錄音；同一段錄 3 次以上，REAPER 會自動把 take 疊起來，之後在 take 上右鍵選最好的。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:25 | `'Project Settings 設 48 kHz、24 bit：比 16 bit 有更多 headroom。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:27 | `why: '你在 Maglody 練的「峰值不碰紅」「留 headroom」，在 REAPER 裡就是看那條音量表。觀念一樣，只是換了一個工具。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:30 | `title: '在 REAPER 做你剛學的混音',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:32 | `'音量：每軌的推桿（Fader）先把人聲調到最清楚，再把伴奏往下拉。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:33 | `'聲像：推桿上方的 Pan 旋鈕；貝斯、大鼓、人聲放中間，和弦往左或右 20–50%。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:34 | `'低頻切除：在人聲與和弦軌點 FX → ReaEQ → 把第一個頻段改成 High Pass，頻率約 120–180 Hz。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:35 | `'總輸出（Master）的音量表不要碰到 0 dB；不夠大聲時先降各軌，不要推 Master。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:36 | `'A/B 比較：FX 視窗左上的勾勾可以暫時關掉效果器，比較前後差別。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:37 | `'File → Render：輸出 WAV（保存）或 MP3（分享給朋友聽）。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:39 | `why: 'Maglody 的每一個混音滑桿，在 REAPER 都有一模一樣的對應：推桿、Pan、ReaEQ 的 High Pass、Master 表。你已經懂原理，現在只是換成專業工具。',` | 待人工判讀 |
| src/components/ReaperGuide.tsx:57 | `<p className="muted small"><strong>為什麼：</strong>{g.why}</p>` | 待人工判讀 |
| src/components/ReaperGuide.tsx:59 | `<button className="btn" onClick={() => downloadMidi(p)}>下載 MIDI（給 REAPER）</button>` | 待人工判讀 |
| src/components/ReaperGuide.tsx:60 | `<a className="btn btn-ghost" href="https://www.reaper.fm/download.php" target="_blank" rel="noreferrer">下載 REAPER</a>` | 待人工判讀 |
| src/components/MasterPanel.tsx:7 | `producer: ['這首歌像我要的感覺嗎？', '下一步'],` | 待人工判讀 |
| src/components/MasterPanel.tsx:8 | `composer: ['為什麼這和弦？', '換一個更哀傷的走向'],` | 待人工判讀 |
| src/components/MasterPanel.tsx:9 | `lyricist: ['押韻怎麼找？', '幫我寫一句'],` | 待人工判讀 |
| src/components/MasterPanel.tsx:10 | `arranger: ['副歌怎麼更有爆發力？'],` | 待人工判讀 |
| src/components/MasterPanel.tsx:11 | `engineer: ['太高唱不上去', '怎麼帶進 REAPER？'],` | 待人工判讀 |
| src/components/MasterPanel.tsx:27 | `/** 跟工作室夥伴聊天：點誰就跟誰聊，不限目前的工作檯 */` | 待人工判讀 |
| src/components/MasterPanel.tsx:37 | `<Modal label={\`跟${role.name}聊\`} className="chat-sheet" onClose={onClose}>` | 待人工判讀 |
| src/components/MasterPanel.tsx:39 | `<div className="role-switch" role="tablist" aria-label="選擇夥伴">` | 待人工判讀 |
| src/components/MasterPanel.tsx:44 | `<button className="link-btn modal-capture" onClick={onCapture}>✎ 記一下</button>` | 待人工判讀 |
| src/components/MasterPanel.tsx:45 | `<button className="icon-btn" onClick={onClose} aria-label="關閉">✕</button>` | 待人工判讀 |
| src/components/MasterPanel.tsx:49 | `<img data-character-portrait src={\`/studio/roles/${role.id}.webp\`} width="84" height="112" alt={\`${role.name}，工作室夥伴\`} />` | 待人工判讀 |
| src/components/MasterPanel.tsx:50 | `<div className="chat-companion-note"><span>工作室裡，慢慢聊</span><strong>{role.name}</strong><p>{role.focus}</p></div>` | 待人工判讀 |
| src/components/MasterPanel.tsx:54 | `{messages.length === 0 && <p className="muted small">想聊什麼都可以：靈感、卡住的地方、哪一版比較好。</p>}` | 待人工判讀 |
| src/components/MasterPanel.tsx:61 | `{m.role === 'master' && <strong className="msg-speaker">{r?.name ?? '工作室夥伴'}</strong>}` | 待人工判讀 |
| src/components/MasterPanel.tsx:72 | `<button className="link-btn" onClick={() => onAction(s.action!, true)}>就用這個</button>` | 待人工判讀 |
| src/components/MasterPanel.tsx:85 | `{busy && <div className="msg msg-master"><div className="msg-avatar" aria-hidden="true"><img src={\`/studio/roles/${role.id}.webp\`} width="40" height="48" alt="" /></div><div className="msg-body typing"><strong className="msg-speaker">{role.name}</strong>想一下……</div></div>}` | 資訊密度或說教語氣，待確認 |
| src/components/MasterPanel.tsx:92 | `<input aria-label="跟夥伴說的話" value={q} onChange={(e) => setQ(e.target.value)} placeholder={\`跟${role.name}說……\`} />` | 待人工判讀 |
| src/components/MasterPanel.tsx:93 | `<button className="primary-action" disabled={busy \|\| !q.trim()} type="submit">送出</button>` | 待人工判讀 |
| src/lib/media.ts:1 | `// 靈感的媒體（語音、哼唱、照片）存在 IndexedDB：localStorage 太小，也不能放二進位資料。` | 待人工判讀 |
| src/lib/media.ts:41 | `/** 照片縮到長邊 1280px、轉 JPEG，手機原圖動輒 5MB，縮完約 200KB */` | 待人工判讀 |
| src/inspire/recording-session.ts:14 | `/** 可獨立測試的錄音生命週期；React hook 只負責訂閱狀態。 */` | 待人工判讀 |
| src/inspire/recording-session.ts:49 | `// 聽寫不可用時仍保留已開始的錄音。` | 待人工判讀 |
| src/inspire/recording-session.ts:68 | `} catch { /* 錄音仍可用 */ }` | 待人工判讀 |
| src/inspire/recording-session.ts:78 | `try { this.sr?.stop() } catch { /* 聽寫可能已停止 */ }` | 待人工判讀 |
| src/inspire/recording-session.ts:90 | `if (this.sr) { this.sr.onresult = null; this.sr.onerror = null; try { this.sr.stop() } catch { /* 已停止 */ } }` | 待人工判讀 |
| src/inspire/recording-session.ts:94 | `try { if (this.rec.state !== 'inactive') this.rec.stop() } catch { /* 已停止 */ }` | 待人工判讀 |
| src/inspire/recording-session.ts:102 | `this.publish({ recording: null, error: '無法使用麥克風：請在瀏覽器網址列旁允許「麥克風」，並確認是用 https 開啟。' })` | 待人工判讀 |
| src/components/ui.tsx:3 | `/** 發想期：零審查。回饋不出現紅燈，只有「可以試試」 */` | 待人工判讀 |
| src/components/ui.tsx:9 | `const LEVEL_ZH: Record<Level, string> = { good: '很好', warn: '可以更好', bad: '需要調整' }` | 待人工判讀 |
| src/components/ui.tsx:11 | `/** 大師最新一句話（由 App 提供）；有的話取代開場白 */` | 待人工判讀 |
| src/components/ui.tsx:15 | `* 每一檯最上方只有一句話：大師剛說的，或這一檯要做的事。` | 待人工判讀 |
| src/components/ui.tsx:16 | `* children（較長的說明）不再顯示在畫面上，避免一開頭就是一面字牆。` | 待人工判讀 |
| src/components/ui.tsx:22 | `/** 一個畫面只允許：1 個主動作（大、輕柔）＋ 最多 1 個次要動作（文字連結） */` | 待人工判讀 |
| src/components/ui.tsx:35 | `/** 工具箱：進階功能、回饋、原理全部收在這裡，預設關閉 */` | 待人工判讀 |
| src/components/ui.tsx:36 | `export function Toolbox({ children, label = '工具箱' }: { children: ReactNode; label?: string }) {` | 待人工判讀 |
| src/components/ui.tsx:46 | `* 「為什麼」卡片：先做再解釋。` | 待人工判讀 |
| src/components/ui.tsx:47 | `* ready=false 時不顯示；ready 後只出現一行，主動展開才解釋。` | 待人工判讀 |
| src/components/ui.tsx:59 | `// 先做先聽：還沒動手就不出現；動手後只亮一行好奇心的火種，想知道才點開` | 待人工判讀 |
| src/components/ui.tsx:64 | `<span className="why-q">想知道？</span>` | 待人工判讀 |
| src/components/ui.tsx:74 | `<summary>再深一點：還能用在哪</summary>` | 待人工判讀 |
| src/components/ui.tsx:75 | `<strong>還能用在哪：</strong>` | 待人工判讀 |
| src/components/ui.tsx:85 | `export function FeedbackList({ items: raw, empty = '開始動手後，老師會在這裡即時回饋。' }: { items: Feedback[]; empty?: string }) {` | 待人工判讀 |
| src/components/ui.tsx:90 | `// 一次只說兩件事：一件做得好的、一件可以試的；其他想看再展開` | 待人工判讀 |
| src/components/ui.tsx:98 | `{gentle && <li className="fb-gentle small muted">現在是發想期：先不審查，有就好。下面只是可以試試的方向。</li>}` | 待人工判讀 |
| src/components/ui.tsx:108 | `{items.length > shown.length && <li><button className="link-btn" onClick={() => setExtra(n=>n+1)}>還有 {items.length - shown.length} 則觀察（再看一則）</button></li>}` | 待人工判讀 |
| src/lib/audio.ts:1 | `// Web Audio 小合成器：鋼琴感音色、和弦、鼓組與簡易循環播放` | 待人工判讀 |
| src/lib/audio.ts:18 | `/** iOS Safari 16.4+：讓播放不受靜音開關影響；錄音時切成 play-and-record */` | 待人工判讀 |
| src/lib/audio.ts:21 | `if (s) try { s.type = type } catch { /* 不支援時忽略 */ }` | 待人工判讀 |
| src/lib/audio.ts:143 | `// ---------- 混音匯流排 ----------` | 待人工判讀 |
| src/lib/audio.ts:199 | `// ---------- 循環播放器 ----------` | 待人工判讀 |
| src/lib/audio.ts:202 | `bars: number[][] // 每小節和弦的 voicing（midi）` | 待人工判讀 |
| src/lib/audio.ts:203 | `melody?: (number \| null)[] // 每格八分音符` | 待人工判讀 |
| src/lib/audio.ts:226 | `/** 換章節時停止所有正在播放的循環 */` | 待人工判讀 |
| src/steps/Melody.tsx:14 | `/** 依哼唱音域決定格子要顯示哪個八度 */` | 待人工判讀 |
| src/steps/Melody.tsx:24 | `/** 五聲音階要避開的音：大調的 4、7 級；小調的 2、6 級 */` | 待人工判讀 |
| src/steps/Melody.tsx:30 | `/** 找出某格實際在響的音（延長格往前追） */` | 待人工判讀 |
| src/steps/Melody.tsx:50 | `if (notes.length < 4) return [{ level: 'warn', text: '再多放幾個音，老師才能給建議。' }]` | 待人工判讀 |
| src/steps/Melody.tsx:51 | `// 強拍和弦音` | 待人工判讀 |
| src/steps/Melody.tsx:56 | `fb.push(r >= 0.7 ? { level: 'good', text: \`強拍上 ${Math.round(r * 100)}% 是和弦音，旋律和伴奏很「黏」。\` } : r >= 0.45 ? { level: 'warn', text: \`強拍上只有 ${Math.round(r * 100)}% 是和弦音。\`, tip: '紅色格子在強拍上和和弦打架。移到上下相鄰的綠色格，或把它放到弱拍當「經過音」。' } : { level: 'bad', text: '強拍上的音大多不在和弦裡，聽起來會很不穩。', tip: '每小節第 1 格先放和弦音（綠色），再用其他音連接。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:57 | `// 音域` | 待人工判讀 |
| src/steps/Melody.tsx:60 | `fb.push(range <= 12 ? { level: 'good', text: \`音域 ${range} 個半音，在一個八度內，好唱。\` } : { level: 'warn', text: \`音域 ${range} 個半音，超過一個八度。\`, tip: '新手歌手會唱得很辛苦。試著把最高或最低的幾個音往中間收。' })` | 待人工判讀 |
| src/steps/Melody.tsx:63 | `if (hi > p.hum.rangeHigh + 2 \|\| lo < p.hum.rangeLow - 2) fb.push({ level: 'warn', text: \`有音超出你哼唱時的舒適音域（${noteNameOct(p.hum.rangeLow)}–${noteNameOct(p.hum.rangeHigh)}）。\`, tip: '可以留著當挑戰，但錄音前要確認唱得上去。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:65 | `// 大跳` | 待人工判讀 |
| src/steps/Melody.tsx:68 | `fb.push(leaps === 0 ? { level: 'good', text: '沒有超過五度的大跳，旋律走得流暢。' } : leaps <= 2 ? { level: 'good', text: \`有 ${leaps} 次大跳：適量的大跳很有戲劇性。\`, tip: '大跳之後，往反方向「級進」（一步一步走）回來會更自然。' } : { level: 'warn', text: \`大跳 ${leaps} 次，偏多。\`, tip: '大部分的好旋律以級進（相鄰音）為主，大跳是調味料。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:69 | `// 換氣` | 待人工判讀 |
| src/steps/Melody.tsx:71 | `fb.push(restHalves.every(Boolean) ? { level: 'good', text: '每兩小節都有休止，歌手可以換氣。' } : { level: 'warn', text: '有兩小節完全沒留空。', tip: '唱歌要換氣，聽眾也需要「消化」——在句尾留一兩格空白。' })` | 待人工判讀 |
| src/steps/Melody.tsx:72 | `// 結尾` | 待人工判讀 |
| src/steps/Melody.tsx:75 | `if (part === 'chorus') fb.push(tonic ? { level: 'good', text: '副歌結尾落在主音，有「說完了」的完整感。' } : { level: 'warn', text: '副歌結尾沒有回到主音。', tip: \`停在 ${noteNameOct(last.m)} 會有「未完」的感覺。如果想要收尾，試試最後一個音放主音（簡譜 ${jianpu(p.harmony.root + 60, p.harmony.root, p.harmony.mode)}）。\` })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:76 | `// 副歌比主歌高` | 待人工判讀 |
| src/steps/Melody.tsx:80 | `fb.push(cMax > vMax ? { level: 'good', text: '副歌的最高音比主歌高，情緒有往上推。' } : { level: 'warn', text: '副歌沒有比主歌高。', tip: '最常見的副歌技巧：整體往上移 3–5 度，讓情緒爆發。' })` | 待人工判讀 |
| src/steps/Melody.tsx:82 | `// 動機：第 1 小節的節奏型是否在後面重複出現（重複＋變化）` | 待人工判讀 |
| src/steps/Melody.tsx:87 | `fb.push(rep >= 1 && rep <= 2 ? { level: 'good', text: \`第 1 小節的節奏在後面重複了 ${rep} 次：這叫「動機」，重複讓人記住、變化讓人不膩。\` } : rep === 3 ? { level: 'warn', text: '四個小節節奏完全一樣。', tip: '重複很好，但第 4 小節換個節奏（例如拉長最後一個音）當作句尾。' } : { level: 'warn', text: '每小節的節奏都不一樣，聽眾比較難記。', tip: '試試把第 1 小節的節奏照抄到第 2 小節，只改音高——這就是「動機重複」。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:89 | `// 歌詞對位` | 待人工判讀 |
| src/steps/Melody.tsx:95 | `if (syl) fb.push(Math.abs(syl - onsets) <= 3 ? { level: 'good', text: \`${part === 'verse' ? '主歌' : '副歌'}前兩句共 ${syl} 字，旋律有 ${onsets} 個音，一字一音剛好。\` } : { level: 'warn', text: \`前兩句 ${syl} 字，但旋律有 ${onsets} 個音。\`, tip: onsets > syl ? '音比字多：可以把某些音改成「延長」，或一個字唱兩個音（轉音）。' : '字比音多：加音，或刪減歌詞。中文歌通常一字一音。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:100 | `/** 手機直向：一次顯示 2 小節，格子才夠大好點 */` | 待人工判讀 |
| src/steps/Melody.tsx:122 | `// 五聲音階安全區：拿掉 4、7 級（半音關係），新手怎麼排都和諧` | 待人工判讀 |
| src/steps/Melody.tsx:173 | `// 播放時頁面跟著播放頭走` | 待人工判讀 |
| src/steps/Melody.tsx:183 | `<Coach short={empty && p.hum ? '先把你的哼唱倒進格子裡，再一格一格修。' : missingChords ? '先點格子寫旋律；和弦之後再補也可以。' : notes < 4 ? '點格子放音。綠色的最穩。' : '播放，哪裡聽起來怪就改哪裡。'} />` | 待人工判讀 |
| src/steps/Melody.tsx:185 | `<button className={part === 'verse' ? 'on' : ''} onClick={() => { stop(); setPart('verse') }}>主歌</button>` | 待人工判讀 |
| src/steps/Melody.tsx:186 | `<button className={part === 'chorus' ? 'on' : ''} onClick={() => { stop(); setPart('chorus') }}>副歌</button>` | 待人工判讀 |
| src/steps/Melody.tsx:189 | `<div className="seg roll-pager" aria-label="選擇小節">` | 待人工判讀 |
| src/steps/Melody.tsx:192 | `第{b + 1}小節{prog[b] != null ? \` · ${chords[prog[b]!].name}\` : ''}` | 待人工判讀 |
| src/steps/Melody.tsx:197 | `<p className="muted small">左右滑動格子，接著寫後面的音。</p>` | 待人工判讀 |
| src/steps/Melody.tsx:198 | `<div className="roll-scroll" role="region" aria-label="音符格，可以左右捲動" tabIndex={0}>` | 待人工判讀 |
| src/steps/Melody.tsx:225 | `aria-label={\`${noteNameOct(m)} 第${i + 1}格\`}` | 待人工判讀 |
| src/steps/Melody.tsx:235 | `<DeskActions primary={{ label: '■ 停', onClick: stop }} />` | 待人工判讀 |
| src/steps/Melody.tsx:237 | `<DeskActions primary={{ label: '用我的哼唱當草稿', onClick: importHum }} />` | 待人工判讀 |
| src/steps/Melody.tsx:239 | `<DeskActions primary={{ label: <>旋律有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 循環聽', onClick: play }} />` | 待人工判讀 |
| src/steps/Melody.tsx:241 | `<DeskActions primary={{ label: '▶ 循環聽', onClick: play, disabled: notes === 0 }}` | 待人工判讀 |
| src/steps/Melody.tsx:242 | `secondary={part === 'verse' && notes >= 4 && p.melody.chorus.every((m) => m == null) ? { label: '換副歌 →', onClick: () => setPart('chorus') } : undefined} />` | 待人工判讀 |
| src/steps/Melody.tsx:247 | `<button className={\`btn small ${penta ? 'on' : ''}\`} onClick={() => setPenta(!penta)}>{penta ? '只用五聲音階（安全）' : '用完整音階'}</button>` | 待人工判讀 |
| src/steps/Melody.tsx:248 | `<button className={\`btn small ${hold ? 'on' : ''}\`} onClick={() => setHold(!hold)}>{hold ? '點格子＝拉長前一個音' : '拉長模式'}</button>` | 待人工判讀 |
| src/steps/Melody.tsx:249 | `{p.hum && <button className="btn small" onClick={importHum}>重新匯入哼唱</button>}` | 待人工判讀 |
| src/steps/Melody.tsx:250 | `{part === 'chorus' && p.melody.verse.some((x) => x != null) && <button className="btn small" onClick={() => setCells(p.melody.verse.map((m) => (m != null && m >= 0 ? (inScale(m + 4, p.harmony.root, p.harmony.mode) ? m + 4 : m + 3) : m)))}>從主歌複製並升高</button>}` | 資訊密度或說教語氣，待確認 |
| src/steps/Melody.tsx:251 | `<button className="btn small" onClick={() => setCells(new Array(STEPS).fill(null))}>清空</button>` | 待人工判讀 |
| src/steps/Melody.tsx:253 | `{penta && cells.some((m) => m != null && m >= 0 && !rows.includes(m)) && <p className="muted small">有些音不在五聲音階裡，切到「完整音階」才看得到。</p>}` | 待人工判讀 |
| src/steps/Melody.tsx:254 | `<p className="muted small">左邊的數字是簡譜，點一下可以試聽。淡綠底的格子是當下和弦裡的音。</p>` | 待人工判讀 |
| src/steps/Melody.tsx:256 | `<Why ready={notes >= 4} title="為什麼綠色的音特別穩？" listen={{ label: '再聽一次', play }}>` | 待人工判讀 |
| src/steps/Melody.tsx:257 | `<p>綠色是當下和弦裡的音。放在每拍的開頭，旋律和伴奏會融在一起；黃色的音放在中間，會變成兩個綠色之間的過門，讓旋律流動。</p>` | 待人工判讀 |
| src/steps/Melody.tsx:266 | `title: '旋律',` | 待人工判讀 |
| src/steps/Melody.tsx:267 | `subtitle: '把哼唱整理成可以唱的旋律',` | 待人工判讀 |
| src/steps/Melody.tsx:268 | `glyph: '曲',` | 待人工判讀 |
| src/steps/Melody.tsx:271 | `{ label: '主歌有幾個音', ok: p.melody.verse.filter((m) => m != null && m >= 0).length >= 4 },` | 待人工判讀 |
| src/steps/Melody.tsx:272 | `{ label: '副歌有幾個音', ok: p.melody.chorus.filter((m) => m != null && m >= 0).length >= 4 },` | 待人工判讀 |
| src/components/StudioPresence.tsx:7 | `<span className="room-caption" aria-hidden="true">木窗工作室<span>留一點時間，聽見自己。</span></span>` | 待人工判讀 |
| src/components/StudioPresence.tsx:8 | `<button className="presence" onClick={onChat} aria-label={\`跟${role.name}聊\`}>` | 待人工判讀 |
| src/components/StudioPresence.tsx:11 | `<span className="presence-name"><strong>{role.name}</strong><span className="presence-state">{busy ? '正側耳聽你說……' : whisper \|\| role.enter}</span><span className="presence-invite">點夥伴，聊聊這首歌</span></span>` | 資訊密度或說教語氣，待確認 |
| src/components/ProjectDialog.tsx:16 | `const title = decision.kind === 'save' ? '留住這一版' : decision.kind === 'restore' ? '回到這一版' : '翻開新的一頁'` | 待人工判讀 |
| src/components/ProjectDialog.tsx:27 | `<span className="notebook-kicker">改稿手記</span>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:28 | `<button className="link-btn" onClick={onCapture}>✎ 記一下</button>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:29 | `<button className="icon-btn" aria-label="關閉" onClick={onClose}>✕</button>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:31 | `<div className="notebook-cover"><h1>{title}</h1><p>{decision.kind === 'save' ? '先留住現在的聲音，下一筆就能放心試。' : decision.kind === 'restore' ? '再聽一次那時的心情，決定要不要回去。' : '把桌面留給下一個念頭。'}</p></div>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:32 | `<article className="revision-snapshot" aria-label="這次的作品">` | 待人工判讀 |
| src/components/ProjectDialog.tsx:33 | `<small>{decision.kind === 'restore' ? decision.version.name : '現在這首歌'}</small>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:34 | `<strong>{song.idea.title \|\| song.idea.hook \|\| '還沒取名字的歌'}</strong>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:36 | `<span>一句話、和弦、旋律與詞，都在這一頁裡。</span>` | 待人工判讀 |
| src/components/ProjectDialog.tsx:39 | `{saved ? <p className="revision-saved" role="status">存好了：{saved}<span>這首歌留在原處。想改時，還能回到這一版。</span></p> : decision.kind === 'save' ? <label className="field"><span>這一版的說明（選填）</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="例如：副歌多留了一口氣" /></label> : <p className="revision-effect">{decision.kind === 'restore' ? '目前桌上的內容會換成這一版。想保留剛才的修改，可以先取消、存成新的一版。' : '目前桌上的歌與夥伴對話會清空。靈感本子與存好的 Demo 版本會保留；想留下這首歌，可以先取消、存成新的一版。'}</p>}` | 資訊密度或說教語氣，待確認 |
| src/components/ProjectDialog.tsx:40 | `{error && <p className="revision-error" role="status">這版還沒存好。說明與作品都還在，請釋出瀏覽器儲存空間後，按「重試保存」。</p>}` | 待人工判讀 |
| src/components/ProjectDialog.tsx:41 | `<button type="submit" className="primary-action">{saved ? '好，回到工作室' : decision.kind === 'save' ? error ? '重試保存' : '收好這一版' : decision.kind === 'restore' ? \`回到 ${decision.version.name}\` : '開始新的歌'}</button>` | 資訊密度或說教語氣，待確認 |
| src/components/ProjectDialog.tsx:42 | `{!saved && <button type="button" className="link-btn revision-cancel" onClick={onClose}>{decision.kind === 'save' ? '先不存' : decision.kind === 'restore' ? '先不換' : '繼續這首歌'}</button>}` | 待人工判讀 |
| src/lib/request.ts:6 | `/** 逾時涵蓋 response body；不將供應商的錯誤頁或金鑰帶進例外。 */` | 待人工判讀 |
| src/components/PitchCanvas.tsx:15 | `/** 音高軌跡圖：灰線＝原始偵測，色塊＝整理後的音符（綠＝調內、紅＝調外） */` | 待人工判讀 |
| src/components/PitchCanvas.tsx:38 | `// 背景格線：每個半音一條，調內音較明顯` | 待人工判讀 |
| src/components/PitchCanvas.tsx:51 | `// 整理後音符` | 待人工判讀 |
| src/components/PitchCanvas.tsx:59 | `// 原始軌跡` | 待人工判讀 |
| src/lib/pitch.ts:1 | `// 音高偵測：自實作 normalized autocorrelation（McLeod Pitch Method 簡化版）` | 待人工判讀 |
| src/lib/pitch.ts:4 | `/** 回傳頻率（Hz），偵測不到回傳 -1 */` | 待人工判讀 |
| src/lib/pitch.ts:23 | `// 找第一個超過最大峰值 * 0.9 的局部峰` | 待人工判讀 |
| src/lib/pitch.ts:33 | `// 拋物線內插讓頻率更準` | 待人工判讀 |
| src/lib/pitch.ts:59 | `/** 降取樣到約 11 kHz：人聲基頻都在 1 kHz 以下，計算量可少 4~16 倍 */` | 待人工判讀 |
| src/lib/pitch.ts:81 | `// 中位數濾波去除八度跳動與雜點` | 待人工判讀 |
| src/lib/pitch.ts:114 | `// 合併極短的間隔中斷（同一音）` | 待人工判讀 |
| src/lib/pitch.ts:139 | `// 和弦音覆蓋的時間越多越好；主和弦稍微加分（穩定）` | 待人工判讀 |
| src/lib/pitch.ts:154 | `why: \`這段你唱最久的音裡有 ${top.join('、')}，剛好都是 ${best.name} 和弦的組成音（覆蓋 ${Math.round(bestScore * 100)}%）。\`,` | 待人工判讀 |
| src/lib/pitch.ts:165 | `/** 只用音符（不需要原始音訊）重算調性與和弦建議：靈感庫的哼唱拉回創作時使用 */` | 待人工判讀 |
| src/lib/pitch.ts:191 | `/** 產生一段「示範哼唱」讓沒有麥克風的人也能體驗分析流程（帶顫音與滑音的人聲般正弦波） */` | 待人工判讀 |
| src/lib/mic.ts:16 | `* 開麥克風並即時回報音高與音量。` | 待人工判讀 |
| src/lib/mic.ts:17 | `* record=true 時會同時把原始取樣收起來，stop() 回傳完整錄音。` | 待人工判讀 |
| src/lib/mic.ts:70 | `// ScriptProcessor 雖已過時，但在各瀏覽器（含 iOS Safari）最穩定` | 待人工判讀 |
| src/lib/mic.ts:109 | `setState((s) => ({ ...s, pending: false, running: false, error: '無法使用麥克風：請確認瀏覽器已允許麥克風權限，並使用 https 或 localhost 開啟。' }))` | 待人工判讀 |
| src/steps/Hum.tsx:52 | `// 把估計結果帶進和聲章節的預設值（學生之後仍可修改）` | 待人工判讀 |
| src/steps/Hum.tsx:130 | `fb.push(n >= 8 ? { level: 'good', text: \`抓到 ${n} 個音，素材夠用。\` } : n >= 3 ? { level: 'warn', text: \`只抓到 ${n} 個音。\`, tip: '用「嗯～」或「啦～」哼長一點（8 秒以上），每個音都撐住一下。' } : { level: 'bad', text: '幾乎沒偵測到穩定的音。', tip: '靠近麥克風一個拳頭的距離，環境安靜一點，聲音穩住不要用氣音。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:133 | `fb.push(ratio > 0.85 ? { level: 'good', text: \`${Math.round(ratio * 100)}% 的時間都落在 ${keyName(hum.keyRoot, hum.keyMode)} 裡，你的耳朵天生就有調性感。\` } : ratio > 0.65 ? { level: 'warn', text: \`${Math.round(ratio * 100)}% 落在調內。\`, tip: '紅色的音可能是故意的色彩，也可能是唱偏了；播放「整理後的音」聽聽看是不是你要的。' } : { level: 'bad', text: '調性不太明確。', tip: '試著哼一段你很熟的旋律（例如生日快樂歌）先暖耳，再哼自己的。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:135 | `fb.push(range <= 12 && range >= 4 ? { level: 'good', text: \`音域 ${noteNameOct(hum.rangeLow)}–${noteNameOct(hum.rangeHigh)}（${range} 個半音），很好唱。\` } : range > 12 ? { level: 'warn', text: \`音域跨了 ${range} 個半音，超過一個八度。\`, tip: '對新手來說，主歌待在中低音、副歌再往上，會比較好唱也比較有層次。' } : { level: 'warn', text: '音域很窄，旋律可能有點平。', tip: '試著讓某一句往上「衝」一下，製造高點。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:136 | `fb.push(hum.confidence > 0.08 ? { level: 'good', text: '調性判斷信心高。' } : { level: 'warn', text: '有兩個調都很像，判斷信心偏低。', tip: '可以在下方改選第二候選，或到「和聲」章節用耳朵決定。' })` | 待人工判讀 |
| src/steps/Hum.tsx:145 | `<Coach short={mic.running ? '我在聽……哼完按停止。' : hum ? hum.source === 'demo' ? '這是示範旋律。先聽一小段，喜歡就帶著它繼續。' : hum.source === 'file' ? '音檔整理好了，聽聽是不是你要的樣子。' : '聽聽整理後的樣子，喜歡就帶著它繼續。' : '哼一段腦中的旋律給我聽。不用好聽，有就好。'} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:152 | `{busy && <p className="muted small center">{analysisSource === 'demo' ? '在聽示範旋律……' : analysisSource === 'file' ? '在聽這段音檔……' : '在聽你剛剛哼的……'}</p>}` | 待人工判讀 |
| src/steps/Hum.tsx:157 | `<DeskActions primary={{ label: '■ 哼完了', onClick: toggleRec }} />` | 待人工判讀 |
| src/steps/Hum.tsx:159 | `<DeskActions primary={{ label: <>用這段繼續：{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽聽整理後的音', onClick: () => playNotes(true) }} />` | 待人工判讀 |
| src/steps/Hum.tsx:161 | `<DeskActions primary={{ label: mic.pending ? '等麥克風許可…' : busy ? '在聽剛才那段…' : '● 哼一段', onClick: toggleRec, disabled: busy \|\| mic.pending }} secondary={{ label: '沒有麥克風？聽示範', onClick: () => { mic.stop(); demo() } }} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:166 | `{hum && <button className="btn small" disabled={busy \|\| mic.pending} onClick={toggleRec}>● 再哼一次</button>}` | 待人工判讀 |
| src/steps/Hum.tsx:167 | `<button ref={uploadRef} type="button" className="btn small" disabled={busy \|\| mic.pending \|\| mic.running} onClick={() => fileRef.current?.click()}>上傳音檔</button>` | 待人工判讀 |
| src/steps/Hum.tsx:173 | `{ana && <button className="btn small" onClick={playOriginal}>▶ 原始錄音</button>}` | 待人工判讀 |
| src/steps/Hum.tsx:174 | `{hum && <button className="btn small" onClick={() => playNotes(false)}>▶ 只聽旋律</button>}` | 待人工判讀 |
| src/steps/Hum.tsx:176 | `{fileError && <div className="audio-file-notice" role="status" aria-label="音檔提示"><p>這個檔案還讀不出聲音。原本的哼唱留著，請改用 mp3 / wav / m4a，再按「上傳音檔」試一次。</p><button className="btn" onClick={() => { setFileError(false); uploadRef.current?.focus() }}>好</button></div>}` | 資訊密度或說教語氣，待確認 |
| src/steps/Hum.tsx:179 | `<div className="result"><div className="muted small">調</div><div className="result-big">{keyName(hum.keyRoot, hum.keyMode)}</div></div>` | 待人工判讀 |
| src/steps/Hum.tsx:180 | `<div className="result"><div className="muted small">舒服的音域</div><div className="result-big">{noteNameOct(hum.rangeLow)}–{noteNameOct(hum.rangeHigh)}</div></div>` | 待人工判讀 |
| src/steps/Hum.tsx:181 | `<div className="result"><div className="muted small">可能適合的和弦</div><div className="result-big">{[...new Set(hum.chordHints)].slice(0, 4).join(' · ') \|\| '—'}</div></div>` | 待人工判讀 |
| src/steps/Hum.tsx:186 | `<span className="muted">聽起來不像？換一個調：</span>` | 待人工判讀 |
| src/steps/Hum.tsx:198 | `<div key={i} className="hist-col" title={\`${NOTE_NAMES[i]}：${v.toFixed(1)} 秒\`}>` | 待人工判讀 |
| src/steps/Hum.tsx:205 | `<FeedbackList items={fb} empty="哼完之後，這裡會有幾句觀察。" />` | 待人工判讀 |
| src/steps/Hum.tsx:206 | `<Why ready={!!hum} title="我怎麼聽出你的「家」？" listen={{ label: '只聽主音', play: () => hum && playNote(60 + hum.keyRoot, 1.5) }}>` | 待人工判讀 |
| src/steps/Hum.tsx:207 | `<p>我把你每個音「唱了多久」加起來（上面的長條圖）。停留最久、最常回去的音，通常就是這首歌的家，也就是主音。再拿這個分佈去比對 24 個調的典型樣子，最像的那個就是你的調。</p>` | 待人工判讀 |
| src/steps/Hum.tsx:210 | `{ana.chordHints.slice(0, 4).map((h, i) => <li key={i}><strong>{h.start.toFixed(1)}–{h.end.toFixed(1)} 秒 → {h.chord}</strong><div className="muted small">{h.why}</div></li>)}` | 待人工判讀 |
| src/steps/Hum.tsx:214 | `<Why ready={!!hum} title="電腦怎麼知道我唱什麼音？">` | 待人工判讀 |
| src/steps/Hum.tsx:215 | `<p>唱 A 音時，空氣每秒振動 440 次。程式把聲波跟「往後挪一點的自己」比較，重疊最好的位移量就是一次振動的長度，換算成頻率就是音高。</p>` | 待人工判讀 |
| src/steps/Hum.tsx:224 | `title: '哼唱解析',` | 待人工判讀 |
| src/steps/Hum.tsx:225 | `subtitle: '把腦中的旋律變成看得見的音',` | 待人工判讀 |
| src/steps/Hum.tsx:226 | `glyph: '哼',` | 待人工判讀 |
| src/steps/Hum.tsx:229 | `{ label: '完成一段哼唱分析（錄音、上傳或示範皆可）', ok: !!p.hum },` | 待人工判讀 |
| src/steps/Hum.tsx:230 | `{ label: '至少偵測到 3 個音', ok: (p.hum?.notes.length ?? 0) >= 3 },` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:37 | `return url ? <img className="inspo-thumb" src={url} alt="靈感照片" /> : <span className="inspo-thumb ph" />` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:70 | `* 靈感入口：任何一章都能打開，不會離開目前的位置。` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:71 | `* 一則靈感可以同時有 文字 + 語音（自動聽寫）+ 哼唱（自動分析音高）+ 多張照片。` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:99 | `// 快捷鍵：Alt + I 隨時記靈感（桌面）` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:133 | `} catch (e) { setMediaSaveError(true); flash('錄音還沒收好：儲存失敗，聲音還留在這頁，請釋出空間後重試。'); throw e }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:154 | `} catch { flash('這張照片讀不到，換一張試試。') }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:171 | `flash(\`收好了。你還在「${stepTitle}」。\`)` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:172 | `onEvent('inspiration.saved', item.text \|\| '（沒有文字的靈感）')` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:173 | `} catch { flash('本子還沒存好，草稿留在這裡。請釋出瀏覽器空間後再試。') }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:181 | `flash('文字先收好了。錄音仍留在草稿，回來可以重試。')` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:183 | `} catch { flash('文字還沒存好，草稿留在這裡。請釋出空間後重試。') }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:213 | `flash(\`已放進：${opt.label.replace(/^設為\|^加進/, '')}\`)` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:222 | `try { applyPull(x, opt) } catch { flash('使用紀錄還沒存好，歌曲尚未更動。請釋出瀏覽器儲存空間後再試。') }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:234 | `flash('紙片已從本子移除。歌曲與其他紙片留在原處。')` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:250 | `flash(\`拼好了：${option.label}\`)` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:253 | `} catch { flash('拼貼還沒全部存好，先留在這頁，釋出瀏覽器空間後再試。') }` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:258 | `<span className="inspo-big-icon">{rec.recording === kind ? '■' : kind === 'voice' ? '說' : '哼'}</span>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:265 | `{toast && !open && <div className="toast" role="status"><span>{toast}</span><button className="btn notice-ack" onClick={() => setToast(null)}>好</button></div>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:268 | `<Modal label={decision && open === 'library' ? decisionTitle(decision) : '靈感'} className={\`notebook-sheet ${open === 'capture' ? 'capture-notebook' : 'library-notebook'} ${decision && open === 'library' ? 'decision-notebook' : ''}\`} onClose={closeNotebook}>` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:271 | `? <button className="link-btn" onClick={() => setOpen('library')}>翻翻本子（{api.list.length}）</button>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:272 | `: <button className="link-btn" onClick={() => setOpen('capture')}>{decision ? '✎ 記一下' : '← 記新的'}</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:273 | `<button className="icon-btn" onClick={closeNotebook} aria-label="關閉">✕</button>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:276 | `{toast && <div className="toast" role="status"><span>{toast}</span><button className="btn notice-ack" onClick={() => setToast(null)}>好</button></div>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:279 | `<span className="notebook-kicker">{open === 'capture' ? '工作室的隨手記' : '收著，等一首歌長出來'}</span>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:280 | `<h1>{open === 'capture' ? '先把這一點留下來' : decision ? decisionTitle(decision) : '靈感本子'}</h1>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:281 | `<p>{open === 'capture' ? '不用完整，一句話、一段哼唱都好。' : decision ? '先看清楚，決定後再動這一筆。' : '翻開一張小紙片，就能帶回歌裡。'}</p>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:286 | `<textarea aria-label="靈感文字" autoFocus rows={3} value={draft.text} placeholder="幾個字就好……" onChange={(e) => setDraft({ ...draft, text: e.target.value })} />` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:287 | `{rec.recording === 'voice' && rec.live && <div className="inspo-live">聽寫中：{rec.live}</div>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:289 | `{recBtn('voice', '說', '')}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:290 | `{recBtn('hum', '哼', '')}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:292 | `<span className="inspo-big-icon">拍</span>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:293 | `<span className="small">拍照</span>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:297 | `{mediaSaveError && <p className="small muted">錄音儲存失敗，聲音暫留在這頁。可重試收好，或先另存文字。</p>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:298 | `{rec.completed && <p className="small muted" role="status">剛才的錄音還在，按「夾進本子」收好。</p>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:299 | `{rec.pending && <p className="small muted" role="status">等麥克風許可……也可以先寫文字。</p>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:303 | `{draft.voice && <button className="chip" onClick={() => void playAsset(draft.voice!.assetId)}>▶ 語音 {fmt(draft.voice.durationSec)}</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:304 | `{draft.hum?.assetId && <button className="chip" onClick={() => void playAsset(draft.hum!.assetId)}>▶ 原始哼唱</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:305 | `{!!draft.hum?.notes.length && <button className="chip" onClick={() => playHumNotes(draft.hum!)}>▶ 哼唱 {draft.hum.notes.length} 音 · {keyName(draft.hum.keyRoot, draft.hum.keyMode)}</button>}` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:310 | `<summary className="small muted">它也許是……（可不選）</summary>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:317 | `<p className="capture-return" aria-label="記下後的返回位置">收好後，回到「{stepTitle}」繼續。</p>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:318 | `<DeskActions primary={{ label: busy ? '收好中…' : '夾進本子', onClick: () => void save(), disabled: busy \|\| rec.pending \|\| (!hasContent && !rec.recording && !rec.completed && !pendingRecording.current) }} secondary={mediaSaveError && draft.text.trim() ? {label:'先另存文字，錄音留著', onClick:saveTextCopy} : undefined} />` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:325 | `{(collage ? picked.length < 2 : !api.list.some(x => x.id === expanded)) && <div className="library-entry"><DeskActions primary={{ label: '記下一點新靈感', onClick: () => setOpen('capture') }} /></div>}` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:326 | `<button className="link-btn" onClick={() => { setCollage(!collage); setPicked([]) }}>{collage ? '不拼了' : '拼貼：挑幾則拼成新東西'}</button>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:329 | `<strong className="small">拼貼 {picked.length} 則：</strong>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:331 | `{collageChoices.some(o => o.how !== 'collage.new') && <details className="collage-more"><summary>其他拼法</summary>{collageChoices.filter(o => o.how !== 'collage.new').map(o => <button key={o.how} className="link-btn" onClick={() => performCollage(o)}>{o.label}</button>)}</details>}` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:334 | `{api.list.length === 0 && <p className="muted">本子還是空的。隨時按右上角「記一下」，或上方「記新的」，留幾個字就好。</p>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:340 | `{collage && <label className="pick"><input type="checkbox" checked={picked.includes(x.id)} onChange={() => togglePick(x.id)} /> 拿來拼</label>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:342 | `<strong className="inspo-text">{x.text \|\| x.voice?.transcript \|\| '（無文字）'}</strong>` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:343 | `<span className="small muted">{new Date(x.createdAt).toLocaleDateString('zh-TW')} · {x.tags.map((t) => TAG_ZH[t]).join('、') \|\| '未分類'}{x.used.length ? \` · 已用 ${x.used.length} 次\` : ''}</span>` | 資訊密度或說教語氣，待確認 |
| src/inspire/InspirationHub.tsx:348 | `{[x.voice && '語音', x.hum && '哼唱', x.images.length && \`${x.images.length} 張照片\`].filter(Boolean).join('・')}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:352 | `{x.voice && <button className="chip" onClick={() => void playAsset(x.voice!.assetId)}>▶ 語音</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:353 | `{x.hum?.assetId && <button className="chip" onClick={() => void playAsset(x.hum!.assetId)}>▶ 原始哼唱</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:354 | `{x.hum && x.hum.notes.length > 0 && <button className="chip" onClick={() => playHumNotes(x.hum!)}>▶ 哼唱 {x.hum.notes.length} 音</button>}` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:360 | `secondary={moreOpen === x.id ? undefined : { label: '其他用法…', onClick: () => setMoreOpen(x.id) }} />` | 待人工判讀 |
| src/inspire/InspirationHub.tsx:363 | `{x.id !== 'seed-fuzui-qianxing' && <button className="link-btn muted" data-notebook-remove onClick={() => choose({ kind: 'remove', item: x })}>刪除</button>}` | 待人工判讀 |
| src/lib/rhyme.ts:1 | `// 簡化版「十三轍」韻部表：收錄常見的句尾字。查不到的字請學生自己唸唸看。` | 待人工判讀 |
| src/lib/rhyme.ts:3 | `['發花', 'a', '啊媽家花他她下話嗎吧怕達沙拉涯霞牙茶畫掛化華大爸塔擦灑雅價架瓜誇抓髮法刷'],` | 待人工判讀 |
| src/lib/rhyme.ts:4 | `['梭波', 'o / e', '我說過做多火落歌河了錯破坡波磨默墨喝合樂客色個和得熱刻渴窩握活鍋果國惑播托朵躲魔脫奪颯哥車者'],` | 待人工判讀 |
| src/lib/rhyme.ts:5 | `['乜斜', 'ie / üe', '夜月雪謝學別街姐葉鞋些寫斜血結解節滅蝶絕決缺覺約越悅爺野也切貼歇界借蝴'],` | 待人工判讀 |
| src/lib/rhyme.ts:6 | `['一七', 'i / ü', '你裡起地氣已記意期衣米雨去曲語區綠旅序遇聚居句許局劇雞西力離迷比息際戲習奇依一底低題體提李細惜稀系義避祈禮'],` | 待人工判讀 |
| src/lib/rhyme.ts:7 | `['姑蘇', 'u', '路哭苦書樹住處步度福部初出數母無霧舞武故獨讀補圖途土入如主夫父孤鼓古呼湖虎訴束速幕目物'],` | 待人工判讀 |
| src/lib/rhyme.ts:8 | `['懷來', 'ai', '來愛在海開白再帶外待台才彩材改害買賣菜該孩懷拜派排塞災哀戴態蓋快壞'],` | 待人工判讀 |
| src/lib/rhyme.ts:9 | `['灰堆', 'ei / ui', '誰美對會淚飛回為水杯黑給累背悲歸碎醉堆推追吹嘴最味位隨睡貴雷輩配被費微圍灰揮鬼歲退墜'],` | 待人工判讀 |
| src/lib/rhyme.ts:10 | `['遙條', 'ao / iao', '好到跑笑老少早找道掉抱高腦草跳鳥橋要搖島腳遙寶包號毛套刀腰消小照叫料繞擾靠逃燒聊'],` | 待人工判讀 |
| src/lib/rhyme.ts:11 | `['由求', 'ou / iu', '手走有後久留頭口就夠愁秋遊流求守首酒友又舊透柔油救休湊偷樓收漏狗候瘦夠周'],` | 待人工判讀 |
| src/lib/rhyme.ts:12 | `['言前', 'an / ian', '天年邊見間看遠眼面前言片山戀晚伴線甜點變遍現煙岸然完散臉寒南慢半帆轉暖願圓怨船站千難乾單盼'],` | 待人工判讀 |
| src/lib/rhyme.ts:13 | `['人辰', 'en / in / un', '人心身真雲門根深林新尋音陰信近吻魂分聞問溫輪準痕很本恨陳晨春群運印今金親進盡認忍品冰鎮'],` | 待人工判讀 |
| src/lib/rhyme.ts:14 | `['江陽', 'ang', '光方望唱鄉場上長想樣傷亮忘浪狂窗牆涼香航陽像響揚放房糖床江慌黃霜往港創量藏讓強張章忙膀芒'],` | 待人工判讀 |
| src/lib/rhyme.ts:15 | `['中東', 'eng / ing / ong', '夢風中痛空等聲生明情星停名晴輕行冷城燈東紅衝用同懂動種送弄重鐘冬宮從聽定影靜清醒境命平病成能層洞永請經'],` | 待人工判讀 |
| src/lib/rhyme.ts:38 | `// 抽象詞：太多會讓歌詞「說」而不「演」` | 待人工判讀 |
| src/lib/rhyme.ts:39 | `export const ABSTRACT_WORDS = ['愛', '心', '夢', '永遠', '寂寞', '幸福', '未來', '回憶', '孤單', '快樂', '悲傷', '思念', '希望', '感覺', '自由', '勇敢', '溫柔', '痛']` | 待人工判讀 |
| src/lib/rhyme.ts:40 | `// 具體詞：看得見、摸得到的東西` | 待人工判讀 |
| src/lib/rhyme.ts:41 | `export const CONCRETE_HINTS = ['窗', '雨', '街', '燈', '車', '杯', '咖啡', '門', '手', '鞋', '傘', '床', '海', '風', '路', '樹', '牆', '鏡', '信', '照片', '月台', '公車', '捷運', '巷', '貓', '狗', '花', '衣', '書', '桌', '鐘', '星', '雲', '山', '河', '火', '雪', '夜市', '便利商店', '機車', '外套', '耳機', '電話', '訊息']` | 資訊密度或說教語氣，待確認 |
| src/lib/versions.ts:1 | `// Demo 版本：改稿前先存一版，改壞了可以回去（真實創作者的 demo 1、demo 2…）` | 待人工判讀 |
| src/steps/Harmony.tsx:8 | `{ name: '萬用四和弦', degs: [0, 4, 5, 3], note: 'I–V–vi–IV：無數流行歌都用它，穩定又有起伏。' },` | 待人工判讀 |
| src/steps/Harmony.tsx:9 | `{ name: '憂傷開場', degs: [5, 3, 0, 4], note: 'vi–IV–I–V：從憂傷出發，最後停在想回家的 V。' },` | 待人工判讀 |
| src/steps/Harmony.tsx:10 | `{ name: '50 年代', degs: [0, 5, 3, 4], note: 'I–vi–IV–V：復古、甜，像老情歌。' },` | 待人工判讀 |
| src/steps/Harmony.tsx:11 | `{ name: '卡農走法', degs: [0, 4, 5, 2], note: 'I–V–vi–iii：往下走的感覺，常接 IV–I–IV–V。' },` | 待人工判讀 |
| src/steps/Harmony.tsx:32 | `if (d.length < degs.length) return [{ level: 'warn', text: \`${label}還有 ${degs.length - d.length} 格空著。\` }]` | 待人工判讀 |
| src/steps/Harmony.tsx:34 | `fb.push(tonicLike.includes(d[0]) ? { level: 'good', text: \`${label}從穩定的和弦開始，聽眾馬上知道「家」在哪。\` } : { level: 'warn', text: \`${label}從不穩定的和弦開始。\`, tip: '這會帶來懸疑感，很適合導歌；如果是主歌，試試從 I 或 vi 開始。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Harmony.tsx:36 | `if (last === 4) fb.push({ level: 'good', text: \`${label}停在 V：像一個問號，耳朵會想回到開頭，循環起來很順。\` })` | 待人工判讀 |
| src/steps/Harmony.tsx:37 | `else if (last === 0) fb.push({ level: 'good', text: \`${label}停在 I：像句號，很適合段落或整首歌的結尾。\` })` | 待人工判讀 |
| src/steps/Harmony.tsx:38 | `else if (last === 3) fb.push({ level: 'good', text: \`${label}停在 IV：溫柔、未完待續，回到 I 時很自然。\` })` | 待人工判讀 |
| src/steps/Harmony.tsx:39 | `else fb.push({ level: 'warn', text: \`${label}結尾的和弦較少見。\`, tip: '結尾停在 V（問號）或 I（句號）最好接下一輪。' })` | 待人工判讀 |
| src/steps/Harmony.tsx:41 | `fb.push(uniq >= 3 ? { level: 'good', text: \`用了 ${uniq} 種和弦，有變化。\` } : uniq === 2 ? { level: 'warn', text: '只有 2 種和弦，可能有點單調。', tip: '加一個 IV 或 vi 試試。' } : { level: 'bad', text: '只有一種和弦，聽不出走向。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Harmony.tsx:42 | `if (!d.includes(4) && !d.includes(3)) fb.push({ level: 'warn', text: '沒有 IV 或 V。', tip: 'IV（離家）和 V（想回家）是推動歌曲前進的引擎。' })` | 待人工判讀 |
| src/steps/Harmony.tsx:43 | `if (d.includes(6)) fb.push({ level: 'warn', text: '用了 vii°（減和弦），很緊張。', tip: '它通常只出現一瞬間，確認這是你想要的效果。' })` | 待人工判讀 |
| src/steps/Harmony.tsx:92 | `const fb = [...progressionFeedback(h.verse, h.mode, '主歌'), ...progressionFeedback(h.chorus, h.mode, '副歌')]` | 待人工判讀 |
| src/steps/Harmony.tsx:95 | `fb.push(vd !== cd ? { level: 'good', text: '主歌和副歌的和弦不同，副歌出現時會有「換場景」的感覺。' } : { level: 'warn', text: '主歌和副歌和弦一模一樣。', tip: '這可以，但副歌就要靠旋律變高、編曲變滿來拉開差距。或試著讓副歌從 IV 開始。' })` | 待人工判讀 |
| src/steps/Harmony.tsx:97 | `fb.push({ level: 'warn', text: \`你換了調（哼唱是 ${keyName(p.hum.keyRoot, p.hum.keyMode)}）。\`, tip: '換調沒問題，但之後寫旋律要用新調來寫，記得唱唱看音域是否舒服。' })` | 待人工判讀 |
| src/steps/Harmony.tsx:115 | `? '點一個和弦聽聽，喜歡就留下。湊滿 4 個，就是一圈。'` | 待人工判讀 |
| src/steps/Harmony.tsx:116 | `: !full ? \`再挑 ${h[part].filter((d) => d == null).length} 個。\`` | 待人工判讀 |
| src/steps/Harmony.tsx:117 | `: part === 'verse' && h.chorus.includes(null) ? '主歌這一圈好了。聽聽看，再換副歌。'` | 待人工判讀 |
| src/steps/Harmony.tsx:118 | `: '一圈好了，循環聽聽看。'` | 待人工判讀 |
| src/steps/Harmony.tsx:124 | `<button className={part === 'verse' ? 'on' : ''} onClick={() => { stop(); setTarget({ part: 'verse', i: Math.max(0, h.verse.indexOf(null)) }) }}>主歌</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:125 | `<button className={part === 'chorus' ? 'on' : ''} onClick={() => { stop(); setTarget({ part: 'chorus', i: Math.max(0, h.chorus.indexOf(null)) }) }}>副歌</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:133 | `<span className="chord-role">{shortRole(c.degree)}</span>{c.degree === [0,4,5,3][target.i] && <small className="material-recommendation">先試這個</small>}` | 待人工判讀 |
| src/steps/Harmony.tsx:139 | `<DeskActions primary={{ label: '■ 停', onClick: stop }} />` | 待人工判讀 |
| src/steps/Harmony.tsx:141 | `<DeskActions primary={{ label: <>地板鋪好了，去{next.label} →</>, onClick: next.go }} secondary={{ label: \`▶ 循環聽${part === 'verse' ? '主歌' : '副歌'}\`, onClick: () => play(part) }} />` | 待人工判讀 |
| src/steps/Harmony.tsx:143 | `<DeskActions primary={{ label: \`▶ 循環聽${part === 'verse' ? '主歌' : '副歌'}\`, onClick: () => play(part) }}` | 待人工判讀 |
| src/steps/Harmony.tsx:144 | `secondary={part === 'verse' && h.chorus.includes(null) ? { label: '換副歌 →', onClick: () => setTarget({ part: 'chorus', i: 0 }) } : undefined} />` | 待人工判讀 |
| src/steps/Harmony.tsx:145 | `) : <DeskActions primary={{ label: \`放入推薦和弦 ${chords[[0,4,5,3][target.i]].name}\`, onClick: () => place([0,4,5,3][target.i]) }} />}` | 待人工判讀 |
| src/steps/Harmony.tsx:153 | `<button className={h.mode === 'major' ? 'on' : ''} onClick={() => setKey(h.root, 'major')}>大調</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:154 | `<button className={h.mode === 'minor' ? 'on' : ''} onClick={() => setKey(h.root, 'minor')}>小調</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:156 | `<button className="btn small" onClick={() => place(6)}>{chords[6].name}（緊繃）</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:158 | `{humSet.size > 0 && <p className="muted small">外框淡綠的和弦，是你的哼唱裡最常出現的音組成的。</p>}` | 待人工判讀 |
| src/steps/Harmony.tsx:160 | `<summary>卡住了？看看常見的走法</summary>` | 待人工判讀 |
| src/steps/Harmony.tsx:166 | `<button className="btn btn-ghost small" onClick={() => { update('harmony', { ...h, [part]: t.degs }); notify('harmony.progression', part) }}>用這個</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:173 | `<summary>耳朵小遊戲（答對 {h.quizRight} / {h.quizTotal}）</summary>` | 待人工判讀 |
| src/steps/Harmony.tsx:175 | `<button className="btn small" onClick={newQuiz}>來一題</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:178 | `<p>{quiz.kind === 'quality' ? '這個和弦聽起來比較…' : '最後一下比較像…'}</p>` | 待人工判讀 |
| src/steps/Harmony.tsx:180 | `<button className="btn small" onClick={quiz.play}>↻ 再聽</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:181 | `<button className="btn small" onClick={() => answer('a')}>{quiz.kind === 'quality' ? '明亮' : '句號'}</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:182 | `<button className="btn small" onClick={() => answer('b')}>{quiz.kind === 'quality' ? '憂傷' : '問號'}</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:186 | `{quizRes === 'right' ? '對。' : '不是喔。'}` | 待人工判讀 |
| src/steps/Harmony.tsx:187 | `{quiz.kind === 'quality' ? (quiz.answer === 'a' ? '中間那個音高一點，聽起來開闊。' : '中間那個音低半音，聽起來有陰影。') : (quiz.answer === 'a' ? '回到家了，像句號。' : '停在想回家的地方，耳朵還在等。')}` | 待人工判讀 |
| src/steps/Harmony.tsx:188 | `<button className="link-btn" onClick={newQuiz}>下一題</button>` | 待人工判讀 |
| src/steps/Harmony.tsx:194 | `<Why ready={full} title="為什麼這幾個和弦放在一起都好聽？" listen={{ label: '聽「想回家 → 到家」', play: () => { playChord(chordVoicing(chords[4]), 1); afterSound(() => playChord(chordVoicing(chords[0]), 1.4), 1000) } }}>` | 資訊密度或說教語氣，待確認 |
| src/steps/Harmony.tsx:195 | `<p>它們都是從同一組 7 個音堆出來的，說同一種語言。每個和弦有自己的角色：「家」最穩，「想回家」最緊，耳朵聽到它就會等著回家。</p>` | 待人工判讀 |
| src/steps/Harmony.tsx:204 | `title: '和聲',` | 待人工判讀 |
| src/steps/Harmony.tsx:205 | `subtitle: '選調、排和弦、用耳朵確認',` | 待人工判讀 |
| src/steps/Harmony.tsx:206 | `glyph: '和',` | 待人工判讀 |
| src/steps/Harmony.tsx:209 | `{ label: '主歌 4 個和弦', ok: !p.harmony.verse.includes(null) },` | 待人工判讀 |
| src/steps/Harmony.tsx:210 | `{ label: '副歌 4 個和弦', ok: !p.harmony.chorus.includes(null) },` | 待人工判讀 |
| src/inspire/store.ts:1 | `// 靈感庫：獨立於「目前這首歌」的專案資料，重新開始一首歌也不會遺失。` | 待人工判讀 |
| src/inspire/store.ts:9 | `/** 這則靈感「可能是什麼」：可以多選，之後決定要拉進哪一步 */` | 待人工判讀 |
| src/inspire/store.ts:13 | `title: '歌名', vibe: '情緒／vibe', lyric: '一句詞', image: '畫面', story: '故事', melody: '旋律',` | 待人工判讀 |
| src/inspire/store.ts:16 | `/** 一則靈感可同時掛：文字、語音（含聽寫）、哼唱（含音高分析）、多張照片 */` | 待人工判讀 |
| src/inspire/store.ts:33 | `/** 使用者第一則真實靈感，作為靈感庫的 seed */` | 待人工判讀 |
| src/inspire/store.ts:37 | `text: '負罪前行',` | 待人工判讀 |
| src/inspire/store.ts:38 | `note: '主題／情緒 vibe，可能當歌名或核心意象。',` | 待人工判讀 |
| src/inspire/store.ts:96 | `try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 空間不足時忽略 */ }` | 待人工判讀 |
| src/steps/Review.tsx:16 | `{ id: 'story', q: '歌詞有讓我看見畫面嗎？', source: (p) => p.lyrics.flatMap((s) => analyzeSection(s, p.idea.hook).fb) },` | 待人工判讀 |
| src/steps/Review.tsx:17 | `{ id: 'hook', q: '副歌那句會卡在腦中嗎？', source: (p) => p.lyrics.filter((s) => s.kind === 'chorus').flatMap((s) => analyzeSection(s, p.idea.hook).fb.slice(-2)) },` | 待人工判讀 |
| src/steps/Review.tsx:18 | `{ id: 'harmony', q: '和弦有支撐住情緒嗎？', source: (p) => [...progressionFeedback(p.harmony.verse, p.harmony.mode, '主歌'), ...progressionFeedback(p.harmony.chorus, p.harmony.mode, '副歌')] },` | 待人工判讀 |
| src/steps/Review.tsx:19 | `{ id: 'melody', q: '旋律好唱又好記嗎？', source: (p) => [...melodyFeedback(p, 'verse'), ...melodyFeedback(p, 'chorus')] },` | 待人工判讀 |
| src/steps/Review.tsx:20 | `{ id: 'arc', q: '整首歌有起伏、有高潮嗎？', source: arrangementFeedback },` | 待人工判讀 |
| src/steps/Review.tsx:21 | `{ id: 'mix', q: '每個聲音都聽得清楚嗎？', source: (p) => mixFeedback(p, null) },` | 待人工判讀 |
| src/steps/Review.tsx:22 | `{ id: 'me', q: '這首歌像「我」嗎？我想再聽一次嗎？', source: () => [] },` | 待人工判讀 |
| src/steps/Review.tsx:26 | `{ id: 'sing', label: '跟著伴奏從頭到尾大聲唱一遍', why: '紙上寫得再好，唱出來才知道哪個字卡、哪裡換不了氣。' },` | 待人工判讀 |
| src/steps/Review.tsx:27 | `{ id: 'tone', label: '檢查倒字：每個字的聲調跟旋律走向不衝突', why: '中文是聲調語言，倒字會讓聽眾聽錯詞。' },` | 待人工判讀 |
| src/steps/Review.tsx:28 | `{ id: 'sleep', label: '隔一天再聽一次', why: '剛寫完時大腦會自動美化。新鮮的耳朵最誠實。' },` | 待人工判讀 |
| src/steps/Review.tsx:29 | `{ id: 'friend', label: '給一個朋友聽，只問「哪一句你記得？」', why: '對方記得的，就是你真正的 Hook。' },` | 待人工判讀 |
| src/steps/Review.tsx:30 | `{ id: 'demo', label: '用手機錄下一版 Demo', why: '有錄音才有作品，也才能比較下一版有沒有更好。' },` | 待人工判讀 |
| src/steps/Review.tsx:31 | `{ id: 'three', label: '寫下下一版要改的 3 件事', why: '好歌是改出來的，不是一次寫出來的。' },` | 待人工判讀 |
| src/steps/Review.tsx:45 | `\`《${p.idea.title \|\| '未命名'}》\`,` | 待人工判讀 |
| src/steps/Review.tsx:46 | `\`調：${keyName(p.harmony.root, p.harmony.mode)}　速度：${p.idea.bpm} BPM\`,` | 待人工判讀 |
| src/steps/Review.tsx:47 | `\`記憶點：${p.idea.hook}\`,` | 待人工判讀 |
| src/steps/Review.tsx:49 | `\`主歌和弦：\| ${prog(p.harmony.verse)} \|\`,` | 待人工判讀 |
| src/steps/Review.tsx:50 | `\`副歌和弦：\| ${prog(p.harmony.chorus)} \|\`,` | 待人工判讀 |
| src/steps/Review.tsx:52 | `\`結構：${p.arrangement.map((s) => \`${KIND_ZH[s.kind]}(${s.bars})\`).join(' → ')}\`,` | 待人工判讀 |
| src/steps/Review.tsx:55 | `'— 我的評語 —',` | 待人工判讀 |
| src/steps/Review.tsx:74 | `{label:'主歌和弦', step:'harmony', ok:!p.harmony.verse.includes(null)},` | 待人工判讀 |
| src/steps/Review.tsx:75 | `{label:'副歌和弦', step:'harmony', ok:!p.harmony.chorus.includes(null)},` | 待人工判讀 |
| src/steps/Review.tsx:76 | `{label:'主歌旋律', step:'melody', ok:p.melody.verse.some(n=>n!=null&&n>=0)},` | 待人工判讀 |
| src/steps/Review.tsx:77 | `{label:'副歌旋律', step:'melody', ok:p.melody.chorus.some(n=>n!=null&&n>=0)},` | 待人工判讀 |
| src/steps/Review.tsx:78 | `{label:'主歌歌詞', step:'lyrics', ok:p.lyrics.some(s=>s.kind==='verse'&&s.text.trim())},` | 待人工判讀 |
| src/steps/Review.tsx:79 | `{label:'副歌歌詞', step:'lyrics', ok:p.lyrics.some(s=>s.kind==='chorus'&&s.text.trim())},` | 待人工判讀 |
| src/steps/Review.tsx:95 | `<Coach short={!hasScore ? '歌還是一張空白紙。先挑幾個和弦，或去旋律檯寫幾個音。' : playing >= 0 ? \`正在播：${KIND_ZH[p.arrangement[playing]?.kind ?? (playing === 0 ? 'verse' : 'chorus')]}\` : r.verdict.trim() ? '寫下來了。這是你的歌。' : '從頭聽一次。這次換你當老師：哪一句你最想再聽？'} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Review.tsx:98 | `{missing.length > 0 && <p className="demo-missing small muted">草稿還缺：{missing.map(item=>item.label).join('、')}。{hasScore ? '可以先聽已有的部分。' : '先留下一點聲音。'}</p>}` | 待人工判讀 |
| src/steps/Review.tsx:100 | `<textarea aria-label="我對這首歌的想法" className="one-line" rows={3} value={r.verdict} placeholder="這首歌好嗎？最喜歡哪裡？下一版想改什麼？" onChange={(e) => update('review', { ...r, verdict: e.target.value })} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Review.tsx:103 | `<DeskActions primary={{label:'先去挑幾個和弦',onClick:()=>goTo?.('harmony')}} />` | 待人工判讀 |
| src/steps/Review.tsx:105 | `<DeskActions primary={{ label: '■ 停', onClick: stopSong }} />` | 待人工判讀 |
| src/steps/Review.tsx:107 | `<DeskActions primary={{ label: '▶ 從頭聽我的歌', onClick: playSong }} secondary={missing.length ? { label: \`去補${missing[0].label} →\`, onClick: () => goTo?.(missing[0].step) } : { label: '下載 MIDI，帶進 REAPER', onClick: () => downloadMidi(p) }} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Review.tsx:111 | `<Card title="自我評量（1 = 還不行，5 = 我很滿意）">` | 待人工判讀 |
| src/steps/Review.tsx:120 | `{lvl && <span className="row small muted"><Light level={lvl} />老師觀察</span>}` | 待人工判讀 |
| src/steps/Review.tsx:124 | `<button key={v} className={\`star ${(r.ratings[d.id] ?? 0) >= v ? 'on' : ''}\`} onClick={() => rate(d.id, v)} aria-label={\`${v} 分\`}>{v}</button>` | 待人工判讀 |
| src/steps/Review.tsx:133 | `<Card title="完成前的最後檢查">` | 待人工判讀 |
| src/steps/Review.tsx:146 | `<Card title="匯出">` | 待人工判讀 |
| src/steps/Review.tsx:148 | `<button className="btn" onClick={() => exportText(p)}>下載歌詞＋和弦表（.txt）</button>` | 待人工判讀 |
| src/steps/Review.tsx:149 | `<button className="btn" disabled={!hasScore} onClick={() => downloadMidi(p)}>下載 MIDI（帶進 REAPER）</button>` | 待人工判讀 |
| src/steps/Review.tsx:150 | `<button className="btn btn-ghost" onClick={() => download('music-lab-project.json', JSON.stringify(p, null, 2), 'application/json')}>備份專案（.json）</button>` | 待人工判讀 |
| src/steps/Review.tsx:154 | `<Why title="為什麼要自己評分，而不是讓電腦評分？" apply="任何創作、報告、作品集，都需要先建立自己的判斷標準。">` | 待人工判讀 |
| src/steps/Review.tsx:155 | `<p>電腦只能檢查「規則」：有沒有押韻、強拍是不是和弦音。但一首歌會不會打動人，取決於它有沒有說出你真正想說的話。規則是起點，不是終點——很多名曲故意打破規則。</p>` | 待人工判讀 |
| src/steps/Review.tsx:156 | `<p>學會評價自己的作品，才是從學生變成創作者的那一步。</p>` | 待人工判讀 |
| src/steps/Review.tsx:165 | `title: '總檢討',` | 待人工判讀 |
| src/steps/Review.tsx:166 | `subtitle: '由你判斷這首歌好不好',` | 待人工判讀 |
| src/steps/Review.tsx:167 | `glyph: '成',` | 待人工判讀 |
| src/steps/Review.tsx:170 | `{ label: '寫下你自己的判斷', ok: p.review.verdict.trim().length >= 4 },` | 待人工判讀 |
| src/lib/theory.ts:1 | `// 樂理核心：音名、音階、和弦、調性估計` | 待人工判讀 |
| src/lib/theory.ts:12 | `export const MODE_ZH: Record<Mode, string> = { major: '大調', minor: '小調' }` | 待人工判讀 |
| src/lib/theory.ts:57 | `/** 和弦的三個音（以 C3~C4 區間為主的鋼琴按法） */` | 待人工判讀 |
| src/lib/theory.ts:65 | `/** 每個級數在流行歌裡的「角色」，用白話解釋 */` | 待人工判讀 |
| src/lib/theory.ts:68 | `'家：最穩定，聽起來「到了」',` | 待人工判讀 |
| src/lib/theory.ts:69 | `'準備出發：常接 V，柔和的過渡',` | 待人工判讀 |
| src/lib/theory.ts:70 | `'朦朧：介於家與憂傷之間，少用但有味道',` | 待人工判讀 |
| src/lib/theory.ts:71 | `'離家：溫暖、敞開，像走出門看天空',` | 待人工判讀 |
| src/lib/theory.ts:72 | `'想回家：張力最大，耳朵會期待回到 I',` | 待人工判讀 |
| src/lib/theory.ts:73 | `'憂傷的家：同樣穩定，但帶一點眼淚',` | 待人工判讀 |
| src/lib/theory.ts:74 | `'緊繃：很不穩定，通常一閃而過',` | 待人工判讀 |
| src/lib/theory.ts:77 | `'家（小調）：穩定但帶點陰影',` | 待人工判讀 |
| src/lib/theory.ts:78 | `'緊繃：不穩定，常接 v 或 i',` | 待人工判讀 |
| src/lib/theory.ts:79 | `'光：小調裡的大三和弦，像雲縫透光',` | 待人工判讀 |
| src/lib/theory.ts:80 | `'沉思：往下沉的感覺',` | 待人工判讀 |
| src/lib/theory.ts:81 | `'想回家：小調裡較含蓄的張力',` | 待人工判讀 |
| src/lib/theory.ts:82 | `'溫柔的遠方：讓憂傷變得寬廣',` | 待人工判讀 |
| src/lib/theory.ts:83 | `'推進：常帶著歌往前走回 i 或 III',` | 待人工判讀 |
| src/lib/theory.ts:87 | `// Krumhansl–Schmuckler 調性輪廓` | 待人工判讀 |
| src/lib/theory.ts:105 | `/** 以「每個音唱了多久」的直方圖，跟 24 個調的輪廓比對 */` | 待人工判讀 |
| src/lib/theory.ts:120 | `/** 把任意音對到調內最近的音 */` | 待人工判讀 |
| src/lib/theory.ts:130 | `/** 以 tonic 為基準列出音階音（step 可為負） */` | 待人工判讀 |
| src/lib/theory.ts:138 | `/** 簡譜數字（小調以關係大調為 1，即小調主音唱 6） */` | 待人工判讀 |
| src/steps/types.ts:4 | `/** notify：把學生剛做的事告訴大師 Agent（先做後懂的旁白由此觸發） */` | 待人工判讀 |
| src/steps/types.ts:6 | `/** next：這一檯的條件達成後，前往下一檯（由 App 提供；未達成時為 null） */` | 待人工判讀 |
| src/steps/Lyrics.tsx:8 | `export const KIND_ZH: Record<SectionKind, string> = { intro: '前奏', verse: '主歌', pre: '導歌', chorus: '副歌', bridge: '橋段', inter: '間奏', outro: '尾奏' }` | 待人工判讀 |
| src/steps/Lyrics.tsx:21 | `// 1. 字數對稱` | 待人工判讀 |
| src/steps/Lyrics.tsx:26 | `fb.push(symR >= 0.75 ? { level: 'good', text: '上下句字數接近，旋律可以重複使用，好唱好記。' } : symR >= 0.5 ? { level: 'warn', text: '有些上下句字數差很多。', tip: '同一段裡第 1、2 句字數接近（相差 2 字以內），旋律才能「對稱」。' } : { level: 'bad', text: '句子長短不一，旋律會很難套。', tip: '先數字數，讓成對的句子長度接近。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Lyrics.tsx:27 | `// 2. 押韻` | 待人工判讀 |
| src/steps/Lyrics.tsx:34 | `fb.push(rr >= target ? { level: 'good', text: \`${top}/${ls.length} 句押同一個韻，聽起來有「收」的感覺。\` } : known.length < ls.length / 2 ? { level: 'warn', text: '有幾個句尾字不在老師的韻表裡。', tip: '大聲唸句尾字，聽韻母（a、ang、i…）是不是一樣。' } : { level: 'warn', text: '押韻偏少。', tip: s.kind === 'chorus' ? '副歌最好每句或隔句押韻，讓人一聽就記住。' : '主歌可以隔句押韻，不用每句都押。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Lyrics.tsx:35 | `// 3. 具體 vs 抽象` | 待人工判讀 |
| src/steps/Lyrics.tsx:38 | `if (s.kind === 'verse') fb.push(con >= abs ? { level: 'good', text: '主歌有畫面，負責「演」故事。' } : { level: 'warn', text: \`主歌抽象詞較多（${abs}）。\`, tip: '主歌負責交代場景和細節，情緒的結論留給副歌。' })` | 待人工判讀 |
| src/steps/Lyrics.tsx:39 | `// 4. 副歌包含 hook` | 待人工判讀 |
| src/steps/Lyrics.tsx:43 | `fb.push(has ? { level: 'good', text: '副歌包含你的記憶點。' } : { level: 'bad', text: '副歌裡找不到記憶點那一句。', tip: \`把「${hook \|\| '你的 Hook'}」放進副歌第一句或最後一句（或兩者）。\` })` | 待人工判讀 |
| src/steps/Lyrics.tsx:45 | `// 5. 句長` | 待人工判讀 |
| src/steps/Lyrics.tsx:47 | `if (long) fb.push({ level: 'warn', text: \`${long} 句超過 14 個字。\`, tip: '太長的句子唱的時候換不了氣，試著從中間切成兩句。' })` | 待人工判讀 |
| src/steps/Lyrics.tsx:71 | `const say = missingHook ? \`副歌再放進「${p.idea.hook}」，就能繼續。\` : !cur ? '' : !cur.text.trim()` | 待人工判讀 |
| src/steps/Lyrics.tsx:72 | `? cur.kind === 'chorus' ? \`副歌。把「${p.idea.hook \|\| '你那句話'}」放進來。${target ? \`大約 ${target} 個字。\` : ''}\` : \`${KIND_ZH[cur.kind]}。先寫你看到的畫面。${target ? \`大約 ${target} 個字。\` : ''}\`` | 待人工判讀 |
| src/steps/Lyrics.tsx:73 | `: '寫下來就好，之後還能改。'` | 待人工判讀 |
| src/steps/Lyrics.tsx:87 | `className="lyric-input" aria-label={\`${KIND_ZH[cur.kind]}歌詞\`}` | 待人工判讀 |
| src/steps/Lyrics.tsx:90 | `placeholder="一行一句……"` | 待人工判讀 |
| src/steps/Lyrics.tsx:111 | `<DeskActions primary={{ label: <>詞有了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 聽詞配旋律', onClick: () => speakLyrics(p, cur?.id) }} />` | 待人工判讀 |
| src/steps/Lyrics.tsx:113 | `<DeskActions primary={{ label: '▶ 聽詞配旋律', onClick: () => speakLyrics(p, cur?.id) }}` | 待人工判讀 |
| src/steps/Lyrics.tsx:114 | `secondary={cur.kind === 'verse' && !secs.some((s) => s.kind === 'chorus' && s.text.trim()) ? { label: '換副歌 →', onClick: () => setCurId(secs.find((s) => s.kind === 'chorus')?.id ?? null) } : undefined} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Lyrics.tsx:115 | `) : <DeskActions primary={{ label: cur?.text.trim() ? '繼續寫下一句' : '先寫眼前的一個畫面', onClick: () => { if (!cur) add('verse'); else document.querySelector<HTMLTextAreaElement>('.lyric-input')?.focus() } }} />}` | 資訊密度或說教語氣，待確認 |
| src/steps/Lyrics.tsx:123 | `<button className="btn small" onClick={() => move(ci, -1)}>往前</button>` | 待人工判讀 |
| src/steps/Lyrics.tsx:124 | `<button className="btn small" onClick={() => move(ci, 1)}>往後</button>` | 待人工判讀 |
| src/steps/Lyrics.tsx:125 | `{secs.length > 1 && <button className="btn small" onClick={() => { remove(cur.id); setCurId(null) }}>刪掉這段</button>}` | 待人工判讀 |
| src/steps/Lyrics.tsx:131 | `{a && <FeedbackList items={a.fb} empty="寫兩句以上，這裡會有幾句觀察。" />}` | 待人工判讀 |
| src/steps/Lyrics.tsx:133 | `<summary>找押韻的字</summary>` | 待人工判讀 |
| src/steps/Lyrics.tsx:144 | `<Why ready={secs.some((s) => lines(s.text).length >= 2)} title="右邊的數字和顏色是什麼？">` | 待人工判讀 |
| src/steps/Lyrics.tsx:145 | `<p>數字是字數，旁邊的色塊是句尾的韻。上下兩句字數差不多，旋律才能重複；同一個顏色代表押韻，聽起來會有回音。唱一遍時，注意有沒有字被旋律唱歪了，這叫「倒字」。</p>` | 待人工判讀 |
| src/steps/Lyrics.tsx:154 | `title: '歌詞',` | 待人工判讀 |
| src/steps/Lyrics.tsx:155 | `subtitle: '主歌演故事，副歌說結論',` | 待人工判讀 |
| src/steps/Lyrics.tsx:156 | `glyph: '詞',` | 待人工判讀 |
| src/steps/Lyrics.tsx:159 | `{ label: '至少一段主歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'verse' && lines(s.text).length >= 2) },` | 待人工判讀 |
| src/steps/Lyrics.tsx:160 | `{ label: '至少一段副歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'chorus' && lines(s.text).length >= 2) },` | 待人工判讀 |
| src/steps/Lyrics.tsx:161 | `{ label: '副歌包含記憶點', ok: !cleanLine(p.idea.hook) \|\| p.lyrics.some((s) => s.kind === 'chorus' && !!cleanLine(p.idea.hook) && cleanLine(s.text).includes(cleanLine(p.idea.hook))) },` | 待人工判讀 |
| src/steps/Mix.tsx:9 | `{ id: 'melody', name: '主旋律（代替人聲）', role: '主角，要清楚聽見每個字' },` | 待人工判讀 |
| src/steps/Mix.tsx:10 | `{ id: 'chords', name: '和弦（鋼琴＋鋪底）', role: '舞台布景，撐住但不搶戲' },` | 待人工判讀 |
| src/steps/Mix.tsx:11 | `{ id: 'bass', name: '貝斯', role: '地基，放中間' },` | 待人工判讀 |
| src/steps/Mix.tsx:12 | `{ id: 'drums', name: '鼓', role: '心跳，底鼓和小鼓放中間' },` | 待人工判讀 |
| src/steps/Mix.tsx:20 | `fb.push(!t.melody.mute && t.melody.vol > 0 && t.melody.vol >= loudest * 0.9 ? { level: 'good', text: '主旋律夠突出，聽眾能跟著唱。' } : { level: 'bad', text: '主旋律被伴奏蓋過了。', tip: '流行歌混音第一原則：人聲（主旋律）最清楚。把伴奏拉低，而不是一直把人聲拉高。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Mix.tsx:21 | `fb.push(Math.abs(t.bass.pan) <= 0.15 ? { level: 'good', text: '貝斯在正中間，低頻穩。' } : { level: 'bad', text: '貝斯偏到一邊了。', tip: '低頻沒有方向感，偏一邊只會讓一個喇叭特別累、耳機聽起來歪。放中間。' })` | 待人工判讀 |
| src/steps/Mix.tsx:22 | `fb.push(Math.abs(t.melody.pan) <= 0.15 ? { level: 'good', text: '主旋律在中間，像歌手站在舞台中央。' } : { level: 'warn', text: '主旋律偏離中間。', tip: '主唱幾乎永遠放中間。' })` | 待人工判讀 |
| src/steps/Mix.tsx:23 | `fb.push(Math.abs(t.chords.pan) >= 0.2 ? { level: 'good', text: '和弦稍微偏一側，為主旋律讓出中間的空間。' } : { level: 'warn', text: '所有東西都擠在中間。', tip: '把和弦往左或右推一點（20–50%），聲音會變寬，主旋律也更清楚。' })` | 待人工判讀 |
| src/steps/Mix.tsx:24 | `fb.push(t.chords.hp && t.melody.hp ? { level: 'good', text: '和弦與主旋律都切掉了不需要的低頻，貝斯更乾淨。' } : { level: 'warn', text: '還有軌道沒有切低頻。', tip: '打開「低頻切除」：鋼琴和人聲的超低頻沒什麼用，卻會和貝斯混成一團（混濁）。' })` | 待人工判讀 |
| src/steps/Mix.tsx:25 | `if (t.bass.hp) fb.push({ level: 'warn', text: '貝斯也開了低頻切除。', tip: '貝斯的低頻是它的工作，通常只切 40Hz 以下的極低頻（這裡已經做了），影響不大，但注意聽聽是否變薄。' })` | 待人工判讀 |
| src/steps/Mix.tsx:26 | `if (peakDb != null) fb.push(peakDb > -1 ? { level: 'bad', text: \`總輸出峰值 ${peakDb.toFixed(0)} dB，接近破音。\`, tip: '每軌都往下拉一點，而不是把總音量推到底。' } : { level: 'good', text: \`總輸出峰值 ${peakDb.toFixed(0)} dB，有餘裕。\` })` | 資訊密度或說教語氣，待確認 |
| src/steps/Mix.tsx:88 | `<Coach short={!hasMelody ? '先留下幾個副歌的音，回來就能聽到自己的混音。' : !p.mix.listened ? '按播放，聽聽每個聲音在哪。' : '把主旋律推到最清楚，其他往後站。'} />` | 待人工判讀 |
| src/steps/Mix.tsx:100 | `<DeskActions primary={{label: '先寫一小句旋律', onClick: () => goTo?.('melody')}} />` | 待人工判讀 |
| src/steps/Mix.tsx:102 | `<DeskActions primary={{ label: '■ 停', onClick: stop }} secondary={{ label: bypass ? '回到我的混音' : '聽聽沒混之前', onClick: () => { setBypass(!bypass); if (!bypass) notify('mix.ab', '') } }} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Mix.tsx:104 | `<DeskActions primary={{ label: <>聽清楚了，去{next.label} →</>, onClick: next.go }} secondary={{ label: '▶ 再聽一次', onClick: play }} />` | 待人工判讀 |
| src/steps/Mix.tsx:106 | `<DeskActions primary={{ label: '▶ 播放副歌', onClick: play }} />` | 待人工判讀 |
| src/steps/Mix.tsx:111 | `<div className="row between small"><span>總輸出</span><span>{player ? \`${level.toFixed(0)} dB\` : '—'}</span></div>` | 待人工判讀 |
| src/steps/Mix.tsx:124 | `<span>音量 {Math.round(s.vol * 100)}%</span>` | 待人工判讀 |
| src/steps/Mix.tsx:128 | `<span>左右 {s.pan === 0 ? '中' : s.pan < 0 ? \`左 ${Math.round(-s.pan * 100)}%\` : \`右 ${Math.round(s.pan * 100)}%\`}</span>` | 待人工判讀 |
| src/steps/Mix.tsx:132 | `<button className={\`chip ${s.hp ? 'on' : ''}\`} onClick={() => setT(tr.id, { hp: !s.hp })}>低頻切除</button>` | 待人工判讀 |
| src/steps/Mix.tsx:133 | `<button className={\`chip ${s.mute ? 'on' : ''}\`} onClick={() => setT(tr.id, { mute: !s.mute })}>靜音</button>` | 待人工判讀 |
| src/steps/Mix.tsx:140 | `<Card title="即時回饋">` | 待人工判讀 |
| src/steps/Mix.tsx:144 | `<Why ready={p.mix.listened} hint="先按播放。" title="為什麼主旋律最重要？" apply="Podcast 對話、影片旁白配樂，都要讓「說話」最清楚。">` | 待人工判讀 |
| src/steps/Mix.tsx:145 | `<p>聽眾哼的是主旋律、記的是歌詞。伴奏再好聽，蓋過人聲就失敗了。專業混音師常先把人聲調好，再把其他東西「放到它周圍」。</p>` | 待人工判讀 |
| src/steps/Mix.tsx:147 | `<Why ready={p.mix.listened} title="左右聲像（Pan）的邏輯" apply="戴耳機聽喜歡的歌：鼓、吉他、和聲各在哪個位置？">` | 待人工判讀 |
| src/steps/Mix.tsx:148 | `<p>想像一個舞台：主唱、貝斯、大鼓站中間；吉他、鋼琴、和聲分站左右。把不同樂器放在不同位置，就算音量一樣，也能聽得更清楚。</p>` | 待人工判讀 |
| src/steps/Mix.tsx:150 | `<Why ready={tracks.chords.hp \|\| tracks.melody.hp} hint="先在任一軌打開「低頻切除」聽聽差別。" title="為什麼要切低頻？" apply="手機錄影的風切聲、冷氣低鳴，也都用 High-pass 濾掉。">` | 待人工判讀 |
| src/steps/Mix.tsx:151 | `<p>每個樂器都會產生一點點低頻，疊起來就變成「悶、糊」。只讓貝斯和大鼓負責低頻，其他軌切掉 150Hz 以下，整體就會清楚很多。這叫「頻率分工」。</p>` | 待人工判讀 |
| src/steps/Mix.tsx:153 | `<Why ready={p.mix.listened} title="為什麼要 A/B 比較？" apply="修照片、改文章時，也要常常和原稿比較。">` | 待人工判讀 |
| src/steps/Mix.tsx:154 | `<p>耳朵會很快「習慣」聲音，調久了就不知道自己變好還是變差。回到原始狀態聽一下，是混音師最常用的校準方法。</p>` | 待人工判讀 |
| src/steps/Mix.tsx:163 | `title: '混音觀念',` | 待人工判讀 |
| src/steps/Mix.tsx:164 | `subtitle: '讓每個聲音都有位置',` | 待人工判讀 |
| src/steps/Mix.tsx:165 | `glyph: '混',` | 待人工判讀 |
| src/steps/Mix.tsx:168 | `{ label: '播放並聆聽混音', ok: p.mix.listened && p.melody.chorus.some(m => m != null && m >= 0) },` | 待人工判讀 |
| src/steps/Mix.tsx:169 | `{ label: '回饋中沒有紅燈', ok: !mixFeedback(p, null).some((f) => f.level === 'bad') },` | 待人工判讀 |
| src/steps/results.ts:1 | `// 每章「可聽見的成果」：完成一小步就能聽到自己的歌長出來，而不是只有勾勾。` | 待人工判讀 |
| src/steps/results.ts:42 | `/** 目前為止的 Demo：有什麼放什麼（和弦、旋律或哼唱、已排的段落），讓「完整爛草稿」隨時聽得到 */` | 待人工判讀 |
| src/steps/results.ts:60 | `hum: { label: '你的哼唱＋主音', available: (p) => !!p.hum, play: playHum },` | 待人工判讀 |
| src/steps/results.ts:61 | `idea: { label: '你的情緒與速度', available: (p) => !!p.idea.mood, play: playVibe },` | 待人工判讀 |
| src/steps/results.ts:62 | `harmony: { label: '主歌＋副歌和弦', available: (p) => [...p.harmony.verse, ...p.harmony.chorus].some((d) => d != null), play: playProgressions },` | 待人工判讀 |
| src/steps/results.ts:63 | `melody: { label: '旋律＋和弦（主歌→副歌）', available: (p) => [...p.melody.verse, ...p.melody.chorus].some((m) => m != null && m >= 0), play: playVerseChorus },` | 待人工判讀 |
| src/steps/results.ts:64 | `lyrics: { label: '副歌：旋律配上你的詞', available: (p) => p.lyrics.some((s) => s.text.trim()), play: speakLyrics },` | 待人工判讀 |
| src/steps/results.ts:65 | `arrange: { label: '完整編曲', available: (p) => p.arrangement.length > 0, play: playSong },` | 待人工判讀 |
| src/steps/results.ts:66 | `record: { label: '錄音用的伴奏', available: (p) => p.arrangement.length > 0, play: playSong },` | 待人工判讀 |
| src/steps/results.ts:67 | `mix: { label: '副歌循環', available: () => true, play: playVerseChorus },` | 待人工判讀 |
| src/steps/results.ts:68 | `review: { label: '完整編曲', available: (p) => p.arrangement.length > 0, play: playSong },` | 待人工判讀 |
| src/agent/mock.ts:1 | `// 離線版大師：規則式旁白。沒有設定 LLM 端點時使用，也是 LLM 失敗時的備援。` | 待人工判讀 |
| src/agent/mock.ts:2 | `// 原則與 LLM 版相同：引用學生剛做的具體內容 → 命名理論 → 說為什麼好聽 → 給下一步，不代寫。` | 待人工判讀 |
| src/agent/mock.ts:17 | `/** 從回饋清單組成「先肯定具體的好、再給一個下一步」的旁白 */` | 待人工判讀 |
| src/agent/mock.ts:22 | `text: [good ? \`你做到了：${good.text}\` : '', fix ? \`我聽到一個可以再試的地方：${fix.text}\` : ''].filter(Boolean).join(' ') \|\| '我聽到了，繼續往下走。',` | 待人工判讀 |
| src/agent/mock.ts:33 | `const STEP_ZH: Record<string, string> = { hum: '哼唱解析', idea: '構想', harmony: '和聲', melody: '旋律', lyrics: '歌詞', arrange: '編曲', record: '錄音準備', mix: '混音', review: '總檢討' }` | 待人工判讀 |
| src/agent/mock.ts:35 | `/** 每章完成時「你學到了什麼」：引用學生自己的作品 */` | 待人工判讀 |
| src/agent/mock.ts:39 | `case 'hum': return p.hum ? \`你停留最久的音 ${NOTE_NAMES[p.hum.keyRoot]} 就是「主音」——整首歌的家；一段旋律常用的 7 個音，就構成「${keyName(p.hum.keyRoot, p.hum.keyMode)}」。\` : '主音與調性。'` | 待人工判讀 |
| src/agent/mock.ts:40 | `case 'idea': { const m = MOODS.find((x) => x.id === p.idea.mood); return \`情緒決定參數：你選的「${m?.name ?? '—'}」對應${m?.mode === 'minor' ? '小調' : '大調'}與 ${p.idea.bpm} BPM；Hook「${p.idea.hook}」會是副歌的錨點。\` }` | 資訊密度或說教語氣，待確認 |
| src/agent/mock.ts:41 | `case 'harmony': { const last = p.harmony.chorus[3]; return \`級數讓和弦有「角色」：你的副歌 ${progName(p, p.harmony.chorus)} 最後停在 ${last != null ? \`${c[last].name}（${c[last].roman}）\` : '?'}——${last === 4 ? '屬和弦製造「想回家」的張力，這叫半終止。' : last === 0 ? '回到主和弦，像句號，這叫正格終止。' : '它決定了循環時的「推進感」。'}\` }` | 資訊密度或說教語氣，待確認 |
| src/agent/mock.ts:42 | `case 'melody': return '強拍放和弦音、弱拍放經過音，旋律就會和伴奏黏在一起；副歌拉高，情緒就往上推。'` | 待人工判讀 |
| src/agent/mock.ts:43 | `case 'lyrics': return '主歌用畫面「演」、副歌用 Hook「說」；句尾同韻、上下句字數對稱，旋律才能重複、聽眾才記得住。'` | 待人工判讀 |
| src/agent/mock.ts:44 | `case 'arrange': return '編曲是能量設計：你讓不同段落的樂器數量不同，副歌才會比主歌「大」。'` | 待人工判讀 |
| src/agent/mock.ts:45 | `case 'record': return '留 headroom（峰值 -6 dB 以下）是錄音唯一不能後悔的事；音準以「音分」衡量，±25 以內耳朵就覺得準。'` | 待人工判讀 |
| src/agent/mock.ts:46 | `case 'mix': return '混音是讓每個聲音有位置：主唱最清楚、低頻放中間、非低音樂器切低頻，這叫頻率與空間分工。'` | 待人工判讀 |
| src/agent/mock.ts:47 | `case 'review': return '你建立了自己的判斷標準——規則是起點，你的耳朵才是最後的裁判。'` | 待人工判讀 |
| src/agent/mock.ts:58 | `hum: '先哼給我聽。不用在意好不好聽，我要聽的是你腦中「本來就有」的旋律。',` | 待人工判讀 |
| src/agent/mock.ts:59 | `idea: p.hum ? \`你的哼唱在 ${keyName(p.hum.keyRoot, p.hum.keyMode)}。現在決定它要說什麼情緒——選完我會用你的調放給你聽。\` : '先決定這首歌的情緒和速度。',` | 待人工判讀 |
| src/agent/mock.ts:60 | `harmony: \`依你的「${MOODS.find((m) => m.id === p.idea.mood)?.name ?? '情緒'}」和哼唱，我把調設好了。點和弦聽聽它們的個性，排完 4 格我會告訴你這個走向在做什麼。\`,` | 待人工判讀 |
| src/agent/mock.ts:61 | `melody: \`和弦地板鋪好了（副歌 ${progName(p, p.harmony.chorus)}）。把哼唱匯入當草稿，按播放，聽聽哪幾格跟和弦打架。\`,` | 待人工判讀 |
| src/agent/mock.ts:62 | `lyrics: \`旋律有了，現在讓字「住進」音符裡。副歌旋律有 ${p.melody.chorus.filter((m) => m != null && m >= 0).length} 個音，前兩句大約就是這麼多字。\`,` | 待人工判讀 |
| src/agent/mock.ts:63 | `arrange: '詞曲都在了。現在當導演：哪一段要安靜、哪一段要全員到齊？',` | 待人工判讀 |
| src/agent/mock.ts:64 | `record: '作品準備要錄成 Demo 了。先測音量、暖嗓，這兩件事做對，錄音就成功一半。',` | 待人工判讀 |
| src/agent/mock.ts:65 | `mix: '我故意把混音弄亂了：主旋律太小。播放，用耳朵把它們放回該在的位置。',` | 待人工判讀 |
| src/agent/mock.ts:66 | `review: '從頭聽一次你的歌。這次我不回饋規則，換你當老師。',` | 待人工判讀 |
| src/agent/mock.ts:68 | `return { text: bridge[step] ?? '', next: prev ? \`（上一檯：${STEP_ZH[prev]}，隨時可以回去改）\` : undefined }` | 待人工判讀 |
| src/agent/mock.ts:71 | `if (!p.hum) return { text: '我沒有聽清楚，再哼一次？' }` | 待人工判讀 |
| src/agent/mock.ts:74 | `text: \`${h.source === 'demo' ? '示範裡有' : h.source === 'file' ? '音檔裡有' : '你哼了'} ${h.notes.length} 個音，停留最久、最常回去的是 ${NOTE_NAMES[h.keyRoot]}。耳朵會把這種「一直回去的音」當成家。\`,` | 待人工判讀 |
| src/agent/mock.ts:75 | `learned: \`這叫「主音」，以它為中心的 7 個音就是 ${keyName(h.keyRoot, h.keyMode)}。\`,` | 待人工判讀 |
| src/agent/mock.ts:76 | `next: \`按「加上主音襯底」聽聽看：你的旋律每次碰到 ${NOTE_NAMES[h.keyRoot]} 都會特別穩。\`,` | 待人工判讀 |
| src/agent/mock.ts:77 | `suggestions: [{ label: '前往構想', action: { type: 'goStep', step: 'idea' } }],` | 待人工判讀 |
| src/agent/mock.ts:85 | `text: \`「${m.name}」——${m.why}${clash ? \` 不過你的哼唱是${p.hum!.keyMode === 'major' ? '大' : '小'}調，反差也可以很動人，聽聽兩種版本再決定。\` : ''}\`,` | 待人工判讀 |
| src/agent/mock.ts:86 | `learned: '大調（大三度）聽起來明亮、小調（小三度）帶陰影；速度越接近心跳越放鬆、越接近跑步越激動。',` | 待人工判讀 |
| src/agent/mock.ts:87 | `next: '寫下核心畫面：閉上眼睛，這首歌發生在哪裡？',` | 待人工判讀 |
| src/agent/mock.ts:92 | `const fb = progressionFeedback(p.harmony[part], p.harmony.mode, part === 'verse' ? '主歌' : '副歌')` | 待人工判讀 |
| src/agent/mock.ts:97 | `text: \`你排了 ${progName(p, p.harmony[part])}。最後一個和弦是「${roleLast}」，所以循環時${last === 4 ? '耳朵會一直被拉回開頭——這就是流行歌讓人想再聽一輪的引擎' : last === 0 ? '每一輪都有句號，聽起來穩定、完整' : '會有一種懸著的感覺'}。\`,` | 待人工判讀 |
| src/agent/mock.ts:98 | `learned: last === 4 ? '停在 V 叫「半終止」：張力沒解決，像問號。' : last === 0 ? '回到 I 叫「終止」：像句號。' : '和弦的功能（主、下屬、屬）決定它聽起來是穩定還是想移動。',` | 待人工判讀 |
| src/agent/mock.ts:99 | `next: (pick(fb, 'bad') ?? pick(fb, 'warn'))?.tip ?? (part === 'verse' ? '接著排副歌，試試從 IV 或 vi 開始，聽「換場景」的感覺。' : '按循環播放，跟著哼一哼，看哪個版本你比較想唱。'),` | 待人工判讀 |
| src/agent/mock.ts:104 | `? { text: '答對了，而且你是用耳朵答的，不是背的。', learned: '這種「聽 → 命名」的連結，就是樂理變成直覺的過程。' }` | 待人工判讀 |
| src/agent/mock.ts:105 | `: { text: '沒關係，這一題的差別很細。再聽一次，注意和弦中間那個音：高一點是明亮、低半音是陰影。', learned: '大三度 = 4 個半音，小三度 = 3 個半音，只差一點點，情緒卻差很多。' }` | 待人工判讀 |
| src/agent/mock.ts:108 | `return fromFeedback(melodyFeedback(p, part), '強拍上的和弦音讓旋律「站得穩」，弱拍上的經過音讓旋律「走得動」。', '每小節第 1 格先放綠色的和弦音，再用相鄰的音連起來。')` | 待人工判讀 |
| src/agent/mock.ts:113 | `const r = fromFeedback(analyzeSection(sec, p.idea.hook).fb, sec.kind === 'chorus' ? '副歌的工作是「說結論」並重複 Hook。' : '主歌的工作是「演」：給聽眾一個看得見的畫面。', '大聲唸一遍，聽句尾的韻母是不是同一個。')` | 待人工判讀 |
| src/agent/mock.ts:118 | `return fromFeedback(arrangementFeedback(p), '能量曲線：樂器越多越「大」，但只有在對比之下，大才聽得出來。', '試聽主歌和副歌各一次，比較哪一段比較「滿」。')` | 待人工判讀 |
| src/agent/mock.ts:122 | `? { text: \`峰值 ${pk} dB，碰到紅區了——那就是破音。\`, learned: '數位錄音超過 0 dB 會被「削波」，這是後製救不回來的。', next: '把增益調小或退後半個拳頭，再測一次。' }` | 待人工判讀 |
| src/agent/mock.ts:123 | `: { text: \`峰值 ${pk} dB，${pk >= -18 ? '在健康區間，最激動的句子也不會破。' : '偏小聲，雜音會被一起放大。'}\`, learned: 'headroom：在最大聲和 0 dB 之間留的安全空間。', next: pk >= -18 ? '接著暖嗓，跟著你旋律裡的最高音唱唱看。' : '把增益調大一點再測。' }` | 待人工判讀 |
| src/agent/mock.ts:126 | `return { text: \`你剛在 ±25 音分內撐住了 ${detail}。\`, learned: '一個半音 = 100 音分；±25 內大多數人聽不出偏差。', next: '換你旋律最高的那個音試試——錄音前要確定它唱得穩。' }` | 待人工判讀 |
| src/agent/mock.ts:129 | `return fromFeedback(mixFeedback(p, null), '混音先求「聽得清楚」，再求好聽：主唱優先，低頻放中間。', '按 A/B 比較，聽聽你的混音和原始狀態差在哪。')` | 待人工判讀 |
| src/agent/mock.ts:131 | `return { text: '剛剛那個「突然變糊」的瞬間，就是沒有分工的聲音。', learned: 'A/B 比較是混音師校準耳朵的方法，因為耳朵很快就會習慣。' }` | 待人工判讀 |
| src/agent/mock.ts:133 | `return { text: \`你剛從頭聽完了《${p.idea.title \|\| '你的歌'}》。它是從一段 ${p.hum?.notes.length ?? 0} 個音的哼唱長出來的。\`, next: '先別看規則，問自己：哪一句你最想再聽一次？那就是這首歌的心臟。' }` | 待人工判讀 |
| src/agent/mock.ts:138 | `const heavy = /罪\|痛\|淚\|夜\|失\|傷\|孤\|冷\|黑\|碎\|離\|負\|沉\|灰/.test(t)` | 待人工判讀 |
| src/agent/mock.ts:139 | `const bright = /光\|笑\|陽\|晴\|飛\|甜\|暖\|春\|跳\|愛/.test(t)` | 待人工判讀 |
| src/agent/mock.ts:140 | `const feel = heavy ? '有重量，像壓著東西往前走——這種張力很適合小調、中慢速（約 70–85 BPM），讓每一步都踩得到' : bright ? '很明亮，適合大調、中快速，讓它往上飄' : '情緒還很開放，等你在構想裡選一個方向'` | 待人工判讀 |
| src/agent/mock.ts:141 | `if (kind === 'inspiration.saved') return { text: \`記下了${t ? \`「${t}」\` : ''}。不急著用它，先回到你剛剛在做的事。\`, learned: '靈感先存、不打斷流程：創作者常用「靈感本」累積素材，再挑選。', next: t ? \`這幾個字${feel}。\` : undefined }` | 資訊密度或說教語氣，待確認 |
| src/agent/mock.ts:143 | `text: \`用「${t}」開一首歌。${t ? \`這幾個字${feel}。\` : ''}我已經把它放進歌名／Vibe 板。\`,` | 待人工判讀 |
| src/agent/mock.ts:144 | `learned: '從一個核心意象出發，後面每個選擇都能問自己：「這像不像它？」',` | 待人工判讀 |
| src/agent/mock.ts:145 | `next: heavy ? '在情緒裡試試「憂傷失落」或「熱血衝刺」，兩種都聽，選一個更像它的；接著去哼唱，心裡默念這幾個字。' : '先選一個情緒，再去哼唱或排和弦。',` | 待人工判讀 |
| src/agent/mock.ts:146 | `suggestions: [{ label: '去哼唱', action: { type: 'goStep', step: 'hum' } }, { label: '去排和弦', action: { type: 'goStep', step: 'harmony' } }],` | 待人工判讀 |
| src/agent/mock.ts:148 | `return { text: \`把「${t \|\| '這則靈感'}」放進來了。它是你的素材，可以改、可以拆。\`, next: '唸一遍或哼一遍，聽它和這一章的其他東西搭不搭。' }` | 待人工判讀 |
| src/agent/mock.ts:153 | `return { text: learnedFor(step, p), next: nxt ? \`下一檯「${STEP_ZH[nxt]}」會直接用到你剛做的東西。\` : '你完成了第一首歌。下一版會更好。', suggestions: [{ label: '▶ 聽聽目前的成果', action: { type: 'playResult' } }] }` | 待人工判讀 |
| src/agent/mock.ts:156 | `return { text: '我聽到了。' }` | 待人工判讀 |
| src/agent/mock.ts:162 | `const part: 'verse' \| 'chorus' = /主歌/.test(q) ? 'verse' : 'chorus'` | 待人工判讀 |
| src/agent/mock.ts:163 | `if (/(幫我\|替我\|直接).*(寫\|作\|完成)\|代寫\|寫一首/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:165 | `text: '這首歌要是你的，所以我不替你寫完。但我可以陪你一句一句寫。',` | 待人工判讀 |
| src/agent/mock.ts:166 | `next: step === 'lyrics' ? \`先回答我：「${p.idea.image \|\| '你的核心畫面'}」裡，有哪一個東西是只有你會注意到的？把它寫成第一句。\` : '告訴我你卡在哪一格、哪一句，我給你兩三個方向讓你試聽選。',` | 待人工判讀 |
| src/agent/mock.ts:169 | `if (/(哀傷\|悲傷\|難過\|憂傷\|sad\|更暗\|心碎)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:171 | `? [['從 vi 出發（憂傷的家）', [5, 3, 0, 4]], ['往下沉：vi–iii–IV–I', [5, 2, 3, 0]], ['停在 vi 不回家', [0, 4, 3, 5]]]` | 待人工判讀 |
| src/agent/mock.ts:172 | `: [['i–VI–III–VII（史詩憂傷）', [0, 5, 2, 6]], ['i–iv–i–v（低迴）', [0, 3, 0, 4]], ['VI–VII–i–i（一路沉到底）', [5, 6, 0, 0]]]` | 待人工判讀 |
| src/agent/mock.ts:174 | `text: \`更哀傷的方向通常是：多用小和弦、少回到大三的主和弦、結尾不給句號。我給你三個走向，${part === 'verse' ? '套在主歌' : '套在副歌'}試聽，選你心裡那個。\`,` | 待人工判讀 |
| src/agent/mock.ts:175 | `learned: '小三和弦（中間音低半音）是「陰影」的來源。',` | 待人工判讀 |
| src/agent/mock.ts:177 | `next: p.harmony.mode === 'major' ? '也可以把調性改成小調，整首都會變暗。' : undefined,` | 待人工判讀 |
| src/agent/mock.ts:180 | `if (/(開心\|明亮\|快樂\|輕快\|happy\|溫暖)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:181 | `const opts: [string, number[]][] = [['I–IV–V–I（最陽光）', [0, 3, 4, 0]], ['IV–V–iii–vi（日系推進）', [3, 4, 2, 5]], ['I–V–IV–V（不斷往前）', [0, 4, 3, 4]]]` | 待人工判讀 |
| src/agent/mock.ts:183 | `text: '更明亮：多用大三和弦（I、IV、V），讓 IV 和 V 輪流推進。三個方向給你試聽：',` | 待人工判讀 |
| src/agent/mock.ts:184 | `learned: 'I、IV、V 是調內三個大三和弦，也是流行歌的骨幹。',` | 待人工判讀 |
| src/agent/mock.ts:188 | `if (/為什麼.*和弦\|這和弦\|這個和弦\|和弦.*為什麼/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:190 | `if (!d.length) return { text: '你還沒排和弦。先點每個和弦聽聽，選一個「聽起來像家」的放第一格。' }` | 待人工判讀 |
| src/agent/mock.ts:193 | `learned: '每個和弦的角色來自它和主音的距離：I 穩定、IV 離開、V 想回來。',` | 待人工判讀 |
| src/agent/mock.ts:194 | `next: '把其中一格換成相鄰角色的和弦，聽聽情緒怎麼變。',` | 待人工判讀 |
| src/agent/mock.ts:197 | `if (/(押韻\|韻腳\|韻\|rhyme)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:201 | `? { text: \`你的 Hook 結尾「${ch}」屬於「${r.group}」轍（${r.sound}）。同韻的字有：${RHYME_GROUPS[r.idx].sample}。挑一個跟你的畫面有關的，放在另一句的句尾。\`, learned: '十三轍：中文歌只要韻母相近就算押韻。' }` | 待人工判讀 |
| src/agent/mock.ts:202 | `: { text: \`「${ch \|\| '你的句尾字'}」不在我的韻表裡。大聲唸出來，聽它的韻母（a、ang、ing…），再到韻腳小抄找同組的字。\` }` | 待人工判讀 |
| src/agent/mock.ts:204 | `if (/(旋律\|怎麼寫曲\|音符)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:205 | `return fromFeedback(melodyFeedback(p, part), '動機：一個 2–4 個音的小樂句，重複一次、再變化一次，就是好記的旋律。', '先寫第 1 小節，第 2 小節照抄，第 3 小節只改最後兩個音。')` | 待人工判讀 |
| src/agent/mock.ts:207 | `if (/(爆發力\|更熱鬧\|更滿)/.test(q)) return { text: '先把主歌的鼓拿掉，再讓鼓在副歌進來。到編曲檯點段落，再點「鼓」，逐次試聽差別。', suggestions: [{label:'去編曲試試',action:{type:'goStep',step:'arrange'}}] }` | 待人工判讀 |
| src/agent/mock.ts:208 | `if (/(REAPER\|帶進\|匯出)/i.test(q)) return { text: '先在總檢討下載 MIDI，再拖進 REAPER。MIDI 是音符，需要在 REAPER 選樂器才會發聲；工作室選單的「更多」有操作小抄。', suggestions: [{label:'去總檢討',action:{type:'goStep',step:'review'}}] }` | 資訊密度或說教語氣，待確認 |
| src/agent/mock.ts:209 | `if (/(下一步\|接下來\|然後呢\|卡住)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:212 | `if (/(太高\|唱不上去\|音域)/.test(q)) {` | 待人工判讀 |
| src/agent/mock.ts:215 | `return { text: hi != null ? \`你旋律最高是 ${noteNameOct(hi)}${p.hum ? \`，哼唱時最舒服的上限是 ${noteNameOct(p.hum.rangeHigh)}\` : ''}。\` : '還沒有旋律。', next: '改和聲的調性設定不會搬動已寫的旋律。請到旋律格把最高那一句往下點幾格，再跟唱確認音域。', learned: '移調（換 Key）不會改變旋律的形狀，只改變高低。' }` | 資訊密度或說教語氣，待確認 |
| src/agent/mock.ts:217 | `return { text: '先只改一件事，再聽聽差別。', next: '告訴我想改哪一句、哪一段，我陪你試。' }` | 待人工判讀 |
| src/agent/mock.ts:228 | `const song = hook ? \`「${hook}」\` : '這首還沒命名的歌'` | 待人工判讀 |
| src/agent/mock.ts:229 | `const mood = ({warm:'溫暖療癒',happy:'開心雀躍',sad:'憂傷失落',miss:'思念懷舊',fire:'熱血衝刺',dream:'夢幻漂浮'} as Record<string,string>)[p.idea.mood] \|\| '還在找感覺'` | 待人工判讀 |
| src/agent/mock.ts:231 | `作曲家: \`${song}的副歌${progression ? \`用了 ${progression}\` : '還沒排和弦'}，旋律有 ${p.melody.chorus.filter(n=>n!=null&&n>=0).length} 個起音。先哼最後兩個音，聽它是否想回到開頭。\`,` | 待人工判讀 |
| src/agent/mock.ts:232 | `作詞人: \`${song}${lyric ? \`裡的「${lyric}」已經有畫面\` : '可以先從眼前的一件物品寫起'}。先挑一個你看得到的細節，唸給自己聽。\`,` | 待人工判讀 |
| src/agent/mock.ts:233 | `錄音師: \`${song}現在是 ${p.idea.bpm} BPM，${p.arrangement.length ? \`排了 ${p.arrangement.length} 個段落\` : '還沒排段落'}。先用副歌最響的一句測音量，保留不破音的空間。\`,` | 待人工判讀 |
| src/agent/mock.ts:234 | `編曲: \`${song}想要「${mood}」，目前有 ${p.arrangement.length} 個段落。先讓主歌少一件樂器，再聽副歌進來。\`,` | 待人工判讀 |
| src/agent/mock.ts:235 | `製作人: \`${song}選了「${mood}」、${p.idea.bpm} BPM。先聽副歌，問自己這句話有沒有留下來。\`,` | 待人工判讀 |
| src/agent/mock.ts:237 | `const observation = context[input.persona?.name \|\| '製作人'] \|\| context.製作人` | 待人工判讀 |
| src/agent/mock.ts:239 | `return /不替你寫完/.test(reply.text) ? {...reply, next: observation} : {...reply, text: \`${observation} ${reply.text}\`}` | 待人工判讀 |
| src/components/SongSheet.tsx:7 | `/** 一路長出來的作品面板：讓學生隨時看見「我的歌」做到哪 */` | 待人工判讀 |
| src/components/SongSheet.tsx:15 | `<div className="sheet-title">{p.idea.title \|\| '（未命名的歌）'}</div>` | 待人工判讀 |
| src/components/SongSheet.tsx:17 | `<dt>種子</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:18 | `<dd>{p.hum ? \`${p.hum.notes.length} 個音的哼唱 · ${keyName(p.hum.keyRoot, p.hum.keyMode)}\` : '—'}</dd>` | 待人工判讀 |
| src/components/SongSheet.tsx:19 | `<dt>情緒</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:21 | `<dt>畫面</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:23 | `<dt>記憶點</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:25 | `<dt>歌詞</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:26 | `<dd>{p.lyrics.filter((s) => s.text.trim()).map((s) => \`${KIND_ZH[s.kind]} ${lyricLines(s.text).length} 句\`).join('、') \|\| '—'}</dd>` | 待人工判讀 |
| src/components/SongSheet.tsx:27 | `<dt>調</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:29 | `<dt>主歌和弦</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:31 | `<dt>副歌和弦</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:33 | `<dt>旋律</dt>` | 待人工判讀 |
| src/components/SongSheet.tsx:34 | `<dd>{mel(p.melody.verse) \|\| mel(p.melody.chorus) ? \`主歌 ${mel(p.melody.verse)} 音 · 副歌 ${mel(p.melody.chorus)} 音\` : '—'}</dd>` | 待人工判讀 |
| src/components/SongSheet.tsx:35 | `<dt>結構</dt>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:7 | `export const decisionTitle = (decision: NotebookDecision) => decision.kind === 'start' ? '把這則靈感帶進歌裡' : '移除這張紙片'` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:17 | `<article className="revision-snapshot" aria-label="選中的靈感">` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:18 | `<small>從本子裡挑出的紙片</small>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:19 | `<p className="decision-words" tabIndex={0}>{item.text \|\| item.voice?.transcript \|\| '沒有文字的靈感'}</p>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:20 | `<span>{[item.voice && '語音', item.hum && '哼唱', item.images.length > 0 && \`${item.images.length} 張照片\`].filter(Boolean).join(' · ') \|\| '一則文字靈感'}</span>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:23 | `<p>帶進這首歌：</p><p className="decision-song-title" tabIndex={0}>《{project.idea.title \|\| '還沒取名字的歌'}》</p>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:25 | `{(item.text \|\| item.voice?.transcript) && <li>{item.tags.includes('title') ? '歌名與記憶點會換成這句話。' : '記憶點會換成這句話，歌名留在原處。'}這句話也會加進 Vibe。</li>}` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:26 | `{item.tags.includes('image') && !project.idea.image && <li>這句話會成為核心畫面。</li>}` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:27 | `{item.hum && <li>這段哼唱會換掉目前的哼唱種子與調性；格子裡已寫的旋律仍保留。</li>}` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:28 | `<li>已有的歌詞、和弦格與編曲會保留；採用後回到構想檯。</li>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:30 | `</div> : <p className="revision-effect">這張紙片會從本子移除，無法復原。已帶進歌曲的內容，以及其他拼貼紙片共用的錄音與照片，會繼續留著。</p>}` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:31 | `{error && <p className="revision-error" role="status">{decision.kind === 'remove' ? '還沒移除，紙片仍在本子裡。請釋出瀏覽器儲存空間後，按「重試移除」。' : '使用紀錄還沒存好，歌曲尚未更動。請釋出瀏覽器儲存空間後，按「重試採用」。'}</p>}` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:32 | `<button className="primary-action" onClick={onConfirm}>{decision.kind === 'start' ? error ? '重試採用' : '帶進這首歌' : error ? '重試移除' : '確定移除這張紙片'}</button>` | 待人工判讀 |
| src/inspire/NotebookDecision.tsx:33 | `<button ref={cancelRef} className="link-btn revision-cancel" onClick={onCancel}>{decision.kind === 'start' ? '先不帶入' : '留在本子裡'}</button>` | 待人工判讀 |
| src/agent/types.ts:19 | `/** 說話的角色（RoleId）；學生訊息則是學生想問的對象 */` | 待人工判讀 |
| src/steps/Ideation.tsx:8 | `{ id: 'happy', name: '開心雀躍', mode: 'major', bpm: [110, 130], why: '大調 + 快速度：明亮的和弦配上像心跳加速的節奏。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:9 | `{ id: 'warm', name: '溫暖療癒', mode: 'major', bpm: [75, 95], why: '大調 + 中慢速度：像走路的速度，讓人放鬆。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:10 | `{ id: 'sad', name: '憂傷失落', mode: 'minor', bpm: [60, 80], why: '小調 + 慢速度：小三度讓和弦帶陰影，慢速度給情緒呼吸空間。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:11 | `{ id: 'miss', name: '思念懷舊', mode: 'major', bpm: [65, 85], why: '大調但多用 vi（憂傷的家），甜中帶酸。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:12 | `{ id: 'fire', name: '熱血衝刺', mode: 'minor', bpm: [130, 160], why: '小調 + 快速度：緊張感與能量並存，常見於動漫歌、搖滾。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:13 | `{ id: 'dream', name: '夢幻漂浮', mode: 'major', bpm: [70, 90], why: '大調 + 長音鋪底，留白多，像飄在空中。' },` | 待人工判讀 |
| src/steps/Ideation.tsx:35 | `fb.push({ level: 'warn', text: \`你選了「${mood.name}」，但哼唱偏${humMode === 'major' ? '大' : '小'}調。\`, tip: '這不是錯！「用開心的旋律唱悲傷的詞」反差很動人。只要你是刻意的就好。' })` | 待人工判讀 |
| src/steps/Ideation.tsx:36 | `else if (mood) fb.push({ level: 'good', text: \`情緒「${mood.name}」和你的哼唱調性一致。\` })` | 待人工判讀 |
| src/steps/Ideation.tsx:42 | `if (story.length < 15) fb.push({ level: 'bad', text: '故事太短，還看不見畫面。', tip: '試著回答：誰？在哪裡？發生什麼事？之後怎麼了？' })` | 待人工判讀 |
| src/steps/Ideation.tsx:43 | `else if (abs > con + 1) fb.push({ level: 'warn', text: \`抽象詞（${abs} 個）比具體畫面多。\`, tip: '「我很想你」→「你的外套還掛在門後」。讓聽眾自己感受，不要直接說破。' })` | 待人工判讀 |
| src/steps/Ideation.tsx:44 | `else fb.push({ level: 'good', text: '故事有具體的人事物，聽眾容易代入。' })` | 待人工判讀 |
| src/steps/Ideation.tsx:46 | `if (idea.image) fb.push(cleanLine(idea.image).length >= 6 ? { level: 'good', text: '有一個核心畫面，等一下寫歌詞時可以一直回來看它。' } : { level: 'warn', text: '核心畫面再具體一點。', tip: '加上顏色、天氣、時間或物品。' })` | 待人工判讀 |
| src/steps/Ideation.tsx:49 | `fb.push(n >= 4 && n <= 12 ? { level: 'good', text: \`記憶點 ${n} 個字，長度剛好，好記又好唱。\` } : n < 4 ? { level: 'warn', text: '記憶點有點短。', tip: '4–12 個字最好：一口氣唱得完，又能說出一件事。' } : { level: 'warn', text: \`記憶點 ${n} 個字，偏長。\`, tip: '副歌最重要的那句要能一口氣唱完，試著刪掉形容詞。' })` | 資訊密度或說教語氣，待確認 |
| src/steps/Ideation.tsx:52 | `fb.push({ level: 'good', text: '歌名出現在記憶點裡，聽眾聽完就知道歌名。' })` | 待人工判讀 |
| src/steps/Ideation.tsx:64 | `<Coach short={!idea.mood ? '這首歌想帶著什麼感覺？點一個，聽聽看。' : !idea.hook.trim() ? '如果整首歌只能留一句話，會是哪一句？' : \`「${idea.hook}」，好。\`} />` | 待人工判讀 |
| src/steps/Ideation.tsx:68 | `<button key={m.id} className={\`mood ${idea.mood === m.id ? 'on' : ''}\`} aria-label={m.name} data-recommended={m.id === 'warm' \|\| undefined} aria-pressed={idea.mood === m.id} onClick={() => pickMood(m)}>{m.name}{m.id === 'warm' && <small className="material-recommendation">先試這個</small>}</button>` | 資訊密度或說教語氣，待確認 |
| src/steps/Ideation.tsx:73 | `<input aria-label="這首歌的一句話" className="one-line" value={idea.hook} placeholder="一句話就好……" onChange={(e) => update('idea', { ...idea, hook: e.target.value, title: idea.title && idea.title !== idea.hook ? idea.title : e.target.value })} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Ideation.tsx:77 | `<DeskActions primary={{ label: <>帶著這句話，去{next.label} →</>, onClick: next.go }} secondary={mood ? { label: '▶ 再聽一次這個感覺', onClick: () => preview(p.harmony.mode, idea.bpm) } : undefined} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Ideation.tsx:79 | `<DeskActions primary={{ label: '寫下這首歌的一句話', onClick: () => document.querySelector<HTMLInputElement>('.one-line')?.focus() }} secondary={{ label: '▶ 再聽一次這個感覺', onClick: () => preview(p.harmony.mode, idea.bpm) }} />` | 資訊密度或說教語氣，待確認 |
| src/steps/Ideation.tsx:80 | `) : <DeskActions primary={{ label: '先聽推薦的溫暖療癒', onClick: () => pickMood(MOODS[1]) }} />}` | 待人工判讀 |
| src/steps/Ideation.tsx:82 | `<Toolbox label="多寫一點（選填）">` | 待人工判讀 |
| src/steps/Ideation.tsx:83 | `<label className="field"><span>歌名（不填就用上面那句）</span><input value={idea.title} onChange={(e) => set('title', e.target.value)} /></label>` | 待人工判讀 |
| src/steps/Ideation.tsx:84 | `<label className="field"><span>Vibe：聽起來像什麼？（場景、聲音、參考的歌）</span><input value={idea.vibe} placeholder="深夜騎車、街燈、帶點雨聲" onChange={(e) => set('vibe', e.target.value)} /></label>` | 待人工判讀 |
| src/steps/Ideation.tsx:85 | `<label className="field"><span>閉上眼睛看到的畫面</span><input value={idea.image} onChange={(e) => set('image', e.target.value)} /></label>` | 待人工判讀 |
| src/steps/Ideation.tsx:86 | `<label className="field"><span>故事：誰、在哪、發生什麼</span><textarea rows={3} value={idea.story} onChange={(e) => set('story', e.target.value)} /></label>` | 待人工判讀 |
| src/steps/Ideation.tsx:88 | `<span>速度：<strong>{idea.bpm}</strong> BPM</span>` | 待人工判讀 |
| src/steps/Ideation.tsx:91 | `{mood && <button className="btn small" onClick={() => preview(p.harmony.mode === 'major' ? 'minor' : 'major', idea.bpm)}>▶ 對照：換成{mood.mode === 'major' ? '小' : '大'}調</button>}` | 待人工判讀 |
| src/steps/Ideation.tsx:92 | `{p.hum && <p className="muted small">你的哼唱在 {keyName(p.hum.keyRoot, p.hum.keyMode)}。</p>}` | 待人工判讀 |
| src/steps/Ideation.tsx:93 | `<FeedbackList items={fb} empty="寫一點之後，這裡會有幾句觀察。" />` | 待人工判讀 |
| src/steps/Ideation.tsx:94 | `<Why ready={!!idea.mood} title="為什麼情緒會改變和弦和速度？">` | 待人工判讀 |
| src/steps/Ideation.tsx:95 | `<p>{mood?.why} 速度越接近休息時的心跳（60–80），聽起來越放鬆；越接近跑步，越激動。</p>` | 待人工判讀 |
| src/steps/Ideation.tsx:97 | `<Why ready={!!idea.hook} title="什麼是 Hook？">` | 待人工判讀 |
| src/steps/Ideation.tsx:98 | `<p>聽一次就卡在腦中的那句話。流行歌通常把它放進副歌，重複 2–4 次。</p>` | 待人工判讀 |
| src/steps/Ideation.tsx:107 | `title: '構想',` | 待人工判讀 |
| src/steps/Ideation.tsx:108 | `subtitle: '決定這首歌要說什麼',` | 待人工判讀 |
| src/steps/Ideation.tsx:109 | `glyph: '想',` | 待人工判讀 |
| src/steps/Ideation.tsx:112 | `{ label: '選一個情緒', ok: !!p.idea.mood },` | 待人工判讀 |
| src/steps/Ideation.tsx:113 | `{ label: '留下一句話', ok: !!p.idea.hook.trim() },` | 待人工判讀 |
| src/agent/context.ts:5 | `/** 把專案壓成一段精簡文字，給 LLM 或 mock 當「學生的歌目前狀態」 */` | 待人工判讀 |
| src/agent/context.ts:11 | `if (p.hum) lines.push(\`哼唱：${p.hum.notes.length} 音，估計 ${keyName(p.hum.keyRoot, p.hum.keyMode)}，音域 ${noteNameOct(p.hum.rangeLow)}–${noteNameOct(p.hum.rangeHigh)}，建議和弦 ${[...new Set(p.hum.chordHints)].join('、')}\`)` | 資訊密度或說教語氣，待確認 |
| src/agent/context.ts:12 | `lines.push(\`情緒：${p.idea.mood \|\| '未選'}；速度 ${p.idea.bpm} BPM；vibe：${p.idea.vibe \|\| '—'}\`)` | 待人工判讀 |
| src/agent/context.ts:13 | `if (p.idea.story) lines.push(\`故事：${p.idea.story}\`)` | 待人工判讀 |
| src/agent/context.ts:14 | `if (p.idea.image) lines.push(\`核心畫面：${p.idea.image}\`)` | 待人工判讀 |
| src/agent/context.ts:15 | `if (p.idea.title \|\| p.idea.hook) lines.push(\`歌名：${p.idea.title \|\| '—'}；Hook：${p.idea.hook \|\| '—'}\`)` | 待人工判讀 |
| src/agent/context.ts:16 | `lines.push(\`調：${keyName(p.harmony.root, p.harmony.mode)}；主歌和弦 ${prog(p.harmony.verse)}；副歌和弦 ${prog(p.harmony.chorus)}\`)` | 待人工判讀 |
| src/agent/context.ts:17 | `if (p.melody.verse.some((m) => m != null)) lines.push(\`主歌旋律（每格半拍，.=休止，-=延長）：${mel(p.melody.verse)}\`)` | 待人工判讀 |
| src/agent/context.ts:18 | `if (p.melody.chorus.some((m) => m != null)) lines.push(\`副歌旋律：${mel(p.melody.chorus)}\`)` | 待人工判讀 |
| src/agent/context.ts:20 | `if (p.arrangement.length) lines.push(\`結構：${p.arrangement.map((s) => \`${KIND_ZH[s.kind]}${s.bars}小節[${Object.entries(s.layers).filter(([, v]) => v).map(([k]) => k).join(',')}]\`).join(' → ')}\`)` | 資訊密度或說教語氣，待確認 |
| src/agent/context.ts:21 | `lines.push(\`已完成章節：${p.done.map((d, i) => (d ? i + 1 : null)).filter(Boolean).join('、') \|\| '無'}\`)` | 待人工判讀 |
| src/agent/reply.ts:9 | `/** 同一個信任邊界用於後端模型輸出與前端 HTTP 回覆。 */` | 待人工判讀 |
| src/agent/useMaster.ts:9 | `* 大師 Agent 的對話狀態。` | 待人工判讀 |
| src/agent/useMaster.ts:10 | `* notify：學生做了一件事 → 大師旁白（同一種事件 1.2 秒內只觸發一次，避免洗版）。` | 待人工判讀 |
| src/agent/useMaster.ts:11 | `* ask：學生提問。` | 待人工判讀 |
| src/agent/useMaster.ts:34 | `// 等一個 tick，讓剛剛的 state 更新寫進專案後再讀` | 待人工判讀 |
| src/agent/useMaster.ts:45 | `// 編輯型事件（打字、拖拉）等使用者停手再說話` | 待人工判讀 |
| src/agent/roles.ts:1 | `// 工作室裡的五位夥伴。每一檯會有一位悄悄走過來；任何時候都能點誰就跟誰聊。` | 待人工判讀 |
| src/agent/roles.ts:7 | `producer: { id: 'producer', name: '製作人', glyph: '製', enter: '製作人端著咖啡坐過來。', focus: '整首歌的方向、vibe、段落起伏、什麼時候算完成', voice: '沉穩、看大局，常問「這像不像你要的感覺？」' },` | 待人工判讀 |
| src/agent/roles.ts:8 | `composer: { id: 'composer', name: '作曲家', glyph: '曲', enter: '作曲家在琴邊坐下。', focus: '哼唱、調性、和弦、旋律線條', voice: '溫和、愛哼歌，用聲音說話多於用術語' },` | 待人工判讀 |
| src/agent/roles.ts:9 | `lyricist: { id: 'lyricist', name: '作詞人', glyph: '詞', enter: '作詞人翻開筆記本。', focus: '一句話、畫面、押韻、字和旋律咬不咬得合', voice: '安靜、細膩，愛問「你那時候看到了什麼？」' },` | 待人工判讀 |
| src/agent/roles.ts:10 | `arranger: { id: 'arranger', name: '編曲', glyph: '編', enter: '編曲把耳機掛在脖子上走進來。', focus: '段落、樂器什麼時候進來、能量起伏', voice: '俐落、愛比較兩個版本給你聽' },` | 待人工判讀 |
| src/agent/roles.ts:11 | `engineer: { id: 'engineer', name: '錄音師', glyph: '錄', enter: '錄音師調了調麥克風架。', focus: '錄音音量、音準暖身、混音平衡、帶進 REAPER', voice: '務實、講步驟，一次只說一件事' },` | 待人工判讀 |
| src/agent/client.ts:9 | `/** 離線時讓五位夥伴有自己的口吻（只加開場與收尾，不改變「不代寫」的內容） */` | 待人工判讀 |
| src/agent/client.ts:11 | `製作人: { open: ['退一步看整首：', '先問一個大方向的問題——', '以製作人的耳朵聽，'], close: '這像不像你一開始想要的感覺？', idle: '我比較在意整首歌往哪裡走。你現在最不確定的是哪一段？' },` | 待人工判讀 |
| src/agent/client.ts:12 | `作曲家: { open: ['（輕輕哼了兩句）', '我在琴上試了一下，', '用耳朵聽聽看：'], close: '先哼哼看，耳朵會告訴你。', idle: '要不要先哼給我聽？聲音比文字更好討論。' },` | 待人工判讀 |
| src/agent/client.ts:13 | `作詞人: { open: ['（翻開筆記本）', '我想先問你一個畫面：', '慢慢來，'], close: '那時候你看到了什麼？', idle: '說說那個當下吧，哪怕只有一個顏色、一個聲音。' },` | 待人工判讀 |
| src/agent/client.ts:14 | `編曲: { open: ['先想像兩種配器的差別：', '從編曲的角度，', '直接說重點：'], close: '可以在編曲檯逐次試聽，比較你喜歡哪一種。', idle: '告訴我哪一段想要更熱鬧、哪一段想要收，我們來比比看。' },` | 待人工判讀 |
| src/agent/client.ts:15 | `錄音師: { open: ['一步一步來。', '先確認一件事：', '技術上很簡單：'], close: '一次只改一個地方。', idle: '錄音、音量、混音、帶進 REAPER，卡在哪一步？' },` | 待人工判讀 |
| src/agent/client.ts:20 | `// 拒絕代寫的句子保持乾淨，不加口吻前綴` | 待人工判讀 |
| src/agent/client.ts:21 | `if (/不替你寫完\|我不替你寫/.test(reply.text)) return reply` | 待人工判讀 |
| src/agent/client.ts:22 | `const generic = /離線模式只會回答/.test(reply.text)` | 待人工判讀 |
| src/agent/client.ts:29 | `* 大師 Agent 的呼叫入口。` | 待人工判讀 |
| src/agent/client.ts:30 | `* - 預設：離線 mock（規則式，零成本、零延遲）。` | 待人工判讀 |
| src/agent/client.ts:31 | `* - 設定 VITE_AGENT_URL（例如 http://localhost:8787/api/master）後改走後端（server/index.ts），由後端依 LLM_PROVIDER 選 OpenAI／Vertex AI／Gemini。` | 待人工判讀 |
| src/agent/client.ts:32 | `*   API 金鑰只放在後端，前端永遠拿不到。` | 待人工判讀 |
| src/agent/client.ts:33 | `* - LLM 失敗時自動退回 mock，學習流程不中斷。` | 待人工判讀 |
| src/agent/client.ts:49 | `if (!endpoint \|\| input.question && /(幫我\|替我\|直接).*(寫\|作\|完成)\|代寫\|寫一首/.test(input.question)) return { reply: flavor(mockReply(p, input), input.persona, input.question), source: 'mock' }` | 資訊密度或說教語氣，待確認 |
| src/agent/client.ts:58 | `if (data && typeof data === 'object' && ('offline' in data && data.offline \|\| /後端 mock\|LLM_PROVIDER\|接上真正的 LLM/.test(JSON.stringify(data)))) throw new Error('Use studio coach')` | 待人工判讀 |
| src/agent/client.ts:63 | `console.warn('[master] LLM 失敗，改用離線模式')` | 待人工判讀 |
| src/agent/prompts.ts:1 | `// 大師 Agent 的 prompt 模板。docs/agent-prompts.md 有同一份內容與設計說明，修改時請兩邊同步。` | 待人工判讀 |
| src/agent/prompts.ts:3 | `export const MASTER_SYSTEM_PROMPT = \`你是「Maglody 工作室」裡的一位專業夥伴（製作人、作曲家、作詞人、編曲或錄音師，依 user turn 指定的角色說話），正在一對一陪一位完全沒學過樂理（頂多知道音階）的創作者，把對方的靈感、哼唱、詞句東拼西湊成一首屬於他的歌。工作室不是關卡：對方可以隨時跳到任何一檯、隨時記靈感；發想期（哼唱、構想）你不審查，只鼓勵與給方向；成形期幫忙組結構；打磨期才有標準地挑剔。全程使用繁體中文（台灣用語）。` | 資訊密度或說教語氣，待確認 |
| src/agent/prompts.ts:5 | `## 你的角色` | 待人工判讀 |
| src/agent/prompts.ts:6 | `- 你是教練，不是代筆。這首歌屬於學生：你絕不寫出完整的歌詞段落、完整旋律或整首歌。` | 待人工判讀 |
| src/agent/prompts.ts:7 | `- 你可以：解釋學生「剛剛做的事」為什麼好聽或不好聽、具體命名用到的理論、提出 2–3 個可以試聽比較的選項、問引導問題、指出下一步。` | 待人工判讀 |
| src/agent/prompts.ts:8 | `- 學生要求「幫我寫」時，溫和拒絕代寫，改為給對方 1 個具體問題與 2–3 個方向，讓對方自己寫。可以提供單字層級的素材（例如同韻腳的字），但不提供整句歌詞。` | 待人工判讀 |
| src/agent/prompts.ts:9 | `- 和弦走向的選項可以給（那是材料，不是作品），但要說明每個選項的情緒差異，並讓學生試聽後自己選。` | 待人工判讀 |
| src/agent/prompts.ts:11 | `## 說話方式（先做後懂）` | 待人工判讀 |
| src/agent/prompts.ts:12 | `1. 先回應學生剛做的事，引用具體數據（例如「你副歌第 1 小節停在 G」「你哼了 14 個音、停最久的是 C」）。` | 待人工判讀 |
| src/agent/prompts.ts:13 | `2. 用一句話命名對方剛用到的理論（例如「這叫『終止式』」「這叫『級進』」）。` | 待人工判讀 |
| src/agent/prompts.ts:14 | `3. 說明為什麼聽起來是這樣（連結到聽覺感受，不要先上課）。` | 待人工判讀 |
| src/agent/prompts.ts:15 | `4. 給一個具體下一步或一個可以試聽的實驗。` | 待人工判讀 |
| src/agent/prompts.ts:16 | `- 鼓勵但不空泛：不說「很棒！」而不說棒在哪裡。` | 待人工判讀 |
| src/agent/prompts.ts:17 | `- 旁白要短：text 最多 3 句、120 字以內；learned 一句；next 一句。` | 待人工判讀 |
| src/agent/prompts.ts:18 | `- 不確定時就說不確定，請學生用耳朵判斷。` | 待人工判讀 |
| src/agent/prompts.ts:20 | `## 輸出格式` | 待人工判讀 |
| src/agent/prompts.ts:21 | `只輸出 JSON：{"text": 旁白, "learned": 學到的概念（可省略）, "next": 下一步建議（可省略）, "suggestions": [{"label": 按鈕文字, "action": 動作（可省略）}]}` | 待人工判讀 |
| src/agent/prompts.ts:22 | `action 只能是：` | 待人工判讀 |
| src/agent/prompts.ts:23 | `- {"type":"tryProgression","part":"verse"\|"chorus","degs":[0-6 的四個級數]}（0=I … 6=vii°，依目前調性）` | 待人工判讀 |
| src/agent/prompts.ts:25 | `- {"type":"playResult"}（播放目前這一檯的聲音）` | 待人工判讀 |
| src/agent/prompts.ts:26 | `suggestions 最多 3 個。\`` | 待人工判讀 |
| src/agent/prompts.ts:29 | `hum: '哼唱解析：學生剛錄或上傳一段哼唱。重點概念：主音（家）、調性、音域、和弦組成音覆蓋。引導學生接受或用耳朵修正調性判斷。',` | 待人工判讀 |
| src/agent/prompts.ts:30 | `idea: '構想／Vibe：選情緒、速度、參考 vibe、一句話故事、核心畫面、Hook。重點概念：大小調與速度對情緒的影響、具體勝過抽象、Hook 是什麼。不要替學生寫 Hook，可以問「你最想對誰說哪句話？」。',` | 待人工判讀 |
| src/agent/prompts.ts:31 | `harmony: '和聲：在調內 7 個和弦中排主歌與副歌各 4 小節。重點概念：級數、主/下屬/屬功能、終止式（V→I）、大三與小三和弦的情緒。可給 2–3 個走向讓學生試聽比較。',` | 待人工判讀 |
| src/agent/prompts.ts:32 | `melody: '旋律：在格子裡寫主歌與副歌旋律（每格半拍）。重點概念：強拍和弦音、經過音、級進與大跳、動機重複與變化、五聲音階安全區、副歌升高、換氣休止。',` | 待人工判讀 |
| src/agent/prompts.ts:33 | `lyrics: '歌詞：依旋律的音數填詞。重點概念：主歌演故事副歌下結論、字數對稱、十三轍押韻、一字一音、倒字（字調與旋律走向衝突）。只給字詞素材與問題，不給整句。',` | 待人工判讀 |
| src/agent/prompts.ts:34 | `arrange: '編曲：排段落、決定每段樂器。重點概念：能量曲線、減法編曲、副歌比主歌滿、最後副歌前的收。',` | 待人工判讀 |
| src/agent/prompts.ts:35 | `record: '錄音準備：音量測試、音準跟唱、環境清單。重點概念：峰值與 headroom、削波、音分。',` | 待人工判讀 |
| src/agent/prompts.ts:36 | `mix: '混音觀念：音量、聲像、低頻切除、A/B 比較。重點概念：人聲最清楚、低頻放中間、頻率分工。',` | 待人工判讀 |
| src/agent/prompts.ts:37 | `review: '總檢討：學生自評。你只提供觀察，不打總分；鼓勵學生寫下下一版要改的三件事。',` | 待人工判讀 |
| src/agent/prompts.ts:42 | `/** 這次由哪位工作室夥伴回答 */` | 待人工判讀 |
| src/agent/prompts.ts:49 | `/** 組成送給 LLM 的 user 訊息（system prompt 固定，利於 prompt caching） */` | 待人工判讀 |
| src/agent/prompts.ts:52 | `persona ? \`<你這次扮演>${persona.name}。專長：${persona.focus}。說話風格：${persona.voice}。可以聊任何跟這首歌有關的事，不限目前的工作檯；超出專長就說「這個問問製作人／作曲家…」。</你這次扮演>\` : '',` | 待人工判讀 |
| src/agent/prompts.ts:53 | `\`<目前工作檯>${STEP_GUIDES[step] ?? step}</目前工作檯>\`,` | 待人工判讀 |
| src/agent/prompts.ts:54 | `\`<學生的歌（目前狀態）>\n${songContext}\n</學生的歌（目前狀態）>\`,` | 待人工判讀 |
| src/agent/prompts.ts:55 | `event ? \`<學生剛剛做的事 kind="${event.kind}">${event.detail}</學生剛剛做的事>\` : '',` | 待人工判讀 |
| src/agent/prompts.ts:56 | `question ? \`<學生的提問>${question}</學生的提問>\` : '<任務>請針對「學生剛剛做的事」給一段先做後懂的短旁白。</任務>',` | 待人工判讀 |
