# 架構

```
┌──────────────────── 瀏覽器（手機優先 PWA） ─────────────────────┐
│ React 19 + Vite + TS                                            │
│                                                                 │
│  App（旅程、章節切換、本章成果、完成條件）                       │
│   ├─ steps/*        9 個章節：練習 UI + 回饋規則 + 完成條件       │
│   ├─ steps/results  每章「可聽成果」                             │
│   ├─ MasterPanel    大師旁白條／對話（底部操作帶）               │
│   ├─ inspire/*      靈感庫：記下（多模態）、翻本子、拉進創作     │
│   └─ ReaperGuide    REAPER 操作步驟 + MIDI 下載                  │
│                                                                 │
│  lib/theory   音名、音階、調內和弦、Krumhansl 調性估計           │
│  lib/pitch    自相關音高偵測、音符切分、和弦建議                 │
│  lib/audio    Web Audio 合成器、鼓組、循環播放器、混音匯流排      │
│  lib/mic      麥克風即時音高/音量（ScriptProcessor，相容 iOS）    │
│  lib/midi     SMF Type 1 匯出（給 DAW）                          │
│  lib/media    IndexedDB 存語音、哼唱、照片                       │
│                                                                 │
│  agent/useMaster ─▶ agent/client ─┬─▶ agent/mock（離線、備援）    │
│                                   └─▶ POST VITE_AGENT_URL        │
└───────────────────────────────────────────────┬─────────────────┘
                                                │ { system, messages }
┌──────────────── 後端 server/（Node 22，TS） ──▼─────────────────┐
│  index.ts   CORS、輸入檢查、輸出淨化（只留合法 action）           │
│  llm/index.ts   依 LLM_PROVIDER 選擇 provider                    │
│   ├─ llm/openai.ts   Chat Completions／Responses（JSON mode）    │
│   ├─ llm/gcp.ts      Vertex AI Gemini（OAuth）／Gemini API（key） │
│   └─ mock            管線測試用                                  │
│  金鑰只存在後端環境變數                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 大師 Agent 資料流

1. 學生在某一章做了一件事，例如排完 4 個和弦，步驟元件就呼叫 `notify(kind, detail)`。
2. `useMaster` 做去抖動（打字類事件等停手 1.5 秒，同一事件 1.2 秒內只觸發一次），再呼叫 `askMaster`。
3. `askMaster` 用 `agent/context.ts` 把整首歌壓成一段文字（調、和弦、旋律、歌詞、結構），再組成 `buildUserTurn`。
4. 沒有 `VITE_AGENT_URL` 時走 `mock.ts`；有的話 POST 到後端。後端失敗時自動退回 mock，學習流程不會中斷。
5. 回覆格式固定為 `{ text, learned?, next?, suggestions[] }`。`suggestions[].action` 只允許三種：`tryProgression`（試聽；學生按「選這個」才寫入作品）、`goStep`、`playResult`。

事件種類：`step.enter`、`step.complete`、`hum.analyzed`、`idea.mood`、`harmony.progression`、`harmony.quiz`、`melody.play`、`lyrics.edit`、`arrange.change|preview`、`record.level|pitch`、`mix.play|change|ab`、`review.play`、`inspiration.saved|used|start`。

## LLM provider 抽象層

```ts
interface LlmProvider {
  name: string
  model: string
  complete(req: { system: string; messages: ChatTurn[]; json: true }): Promise<string>
}
```

Vertex 的權杖取得順序：`GCP_ACCESS_TOKEN` → Cloud Run 服務帳戶（`GCP_USE_METADATA=1`）→ 本機 `gcloud`。`server/Dockerfile` 可直接 `gcloud run deploy --source server` 部署：映像裡只有 `server/`，所以前後端共用的程式（`reply.ts`、`request.ts`、`prompts.ts`、`personas.ts`、`limits.ts`、`rate-limit.ts`）放在 `server/shared/`，前端從那裡匯入，後端不匯入 `src/`。`npm run test:deploy` 照 Dockerfile 的複製範圍啟動後端並打 `/api/health`。後端只收資料（步驟、夥伴代號、歌曲摘要、提問、歷史），system prompt 與夥伴設定在後端組，並有每來源每分鐘、全服務每日的限流。測試或公司代理可用 `OPENAI_BASE_URL`、`GEMINI_BASE_URL`、`VERTEX_BASE_URL` 覆寫端點。

新增供應商只要實作這個介面，並加進 `server/llm/index.ts` 的 switch。後端不信任模型輸出：`sanitize()` 會截斷長度、過濾未知 action、檢查和弦級數範圍。環境變數見 README。

## 資料模型

### 目前這首歌（`localStorage: maglody-project-v2`）

`Project = { unlocked, done[9], hum, idea{mood, vibe, theme, image, story, title, hook, bpm}, lyrics[], harmony{root, mode, verse[4], chorus[4], quiz}, melody{verse[32], chorus[32]}, arrangement[], recording, mix, review }`

旋律格每格是半拍：`number`＝MIDI 音、`-1`＝延長、`null`＝休止。

### 靈感庫（`localStorage: maglody-inspirations-v1`，媒體在 IndexedDB `maglody-media`）

```ts
interface Inspiration {
  id, createdAt, text, note?,
  tags: ('title'|'vibe'|'lyric'|'image'|'story'|'melody')[]   // 可多選
  voice?: { assetId, durationSec, transcript? }               // 語音＋聽寫
  hum?:   { assetId?, notes[], durationSec, keyRoot, keyMode, rangeLow, rangeHigh }
  images: { assetId, w, h }[]                                 // 可多張
  fromStep, used: { step, how, at }[]
}
```

同一則靈感可以同時掛文字、語音、哼唱與照片，彼此不互斥。靈感庫和目前這首歌分開存放，「重新開始一首新歌」不會刪掉靈感。首次開啟時會放入 seed「負罪前行」。

「拉進創作」（`inspire/pull.ts`）只把學生自己的素材放到他指定的位置，例如歌名、Vibe、某一段歌詞或旋律種子，不會改寫內容。「從這則開始」若目前的歌已有進度，會先詢問。

## 手機與 PWA

- `public/manifest.webmanifest` 與 `public/sw.js`（網路優先、離線讀快取、不快取 `/api/`）。
- iOS：`navigator.audioSession.type` 播放時設為 `playback`（不受靜音鍵影響），錄音時設為 `play-and-record`。
- 錄音：章節練習用 ScriptProcessor（相容性最好）；靈感用 MediaRecorder，並以 Web Speech API 做 zh-TW 聽寫（不支援時只存錄音）。
- 照片在前端縮到長邊 1280px 的 JPEG，再存進 IndexedDB。
- 手機版旋律格一次顯示 1 小節，每格約 36×38px；底部操作帶依序是「▶ 成果｜大師｜記一下」。
- `npm run dev:mobile` 以自簽 https 在區網開放，供手機測試麥克風。
