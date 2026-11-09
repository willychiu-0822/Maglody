# Maglody 新手音樂工作室

Repo：<https://github.com/willychiu-0822/Maglody>

一間放在手機裡的**創作工作室**：把靈感、哼唱、詞句東拼西湊成你自己的歌，旁邊有一位大師陪著你，邊做邊懂。

**發想**（哼唱、構想／Vibe）→ **成形**（和聲、旋律、歌詞、編曲）→ **打磨**（錄音準備、混音、總檢討）

- 不是關卡：任何一檯都能隨時進出、跳著做；可以從哼唱、一句詞、和弦迴圈或舊靈感開始。
- 拼貼：從靈感本子勾幾則碎片，拼成一段歌詞、接成一條旋律，或合成新靈感。
- 先做、先聽，再輕輕點一句「為什麼」；想深入才展開，不灌輸。
- 底部 ▶ 隨時聽目前為止的 Demo；改稿前存成 Demo v1、v2，可以回到舊版。
- 大師只當教練，不會替你寫好整首歌。
- 靈感隨時可以記：文字、語音（自動聽寫）、哼唱、照片可以放在同一則裡，之後一鍵拉回創作。

## 目前驗證範圍

本輪已補紙墨場景、五位工作室夥伴、隨時捕捉與漸進知識提示，並修正錄音保存、播放停止、歌詞編輯、版本還原與 MIDI 延音等流程。

- 本機 Chrome 的手機 390×844／桌面 1280×800 驗收：[UAT 計畫](docs/uat/UAT-PLAN.md)、[最新結果與截圖](docs/uat/UAT-RESULTS.md)、[機器狀態](docs/uat/UAT-STATUS.json)。
- `npm run build`、`npm run selftest`、`npm run test:logic` 是補充檢查；範圍與修正記錄見 [Session A 清單](docs/codex-fixlist-a.md)。
- 尚未驗證：實體手機、iOS Safari 的麥克風/靜音鍵/聽寫/PWA 安裝，以及真實 OpenAI/Gemini/Vertex 金鑰。預設使用離線 mock，測試不需要金鑰。
- 本輪沒有部署或 tunnel；Git worktree metadata 唯讀，無法完成本機 commit。這不代表已做完 session B 的獨立 UAT 審核。

本機完整驗收（自動 build，在 4102 啟動 preview，跑完關閉）：

```sh
npm run test:e2e
```

舊手機 selftest 需另開 `npm run preview -- --host 127.0.0.1 --port 4101 --strictPort`；跑 `npm run selftest` 後，請關閉該 preview。

## 📱 手機可直接使用

Maglody 以手機直向為主要設計。主流程在手機上可以從頭走到尾，也可以安裝成 PWA（加入主畫面，可離線開啟）。

| 平台 | 建議瀏覽器 | 備註 |
|---|---|---|
| iPhone／iPad | Safari（iOS 16.4 以上） | 分享 → 加入主畫面。請允許麥克風。舊版 iOS 需關閉靜音開關才聽得到聲音。 |
| Android | Chrome | 選單 → 安裝應用程式。 |
| 桌面 | Chrome、Edge、Safari | Firefox 可用，但不支援語音聽寫（語音仍會錄下來）。 |

麥克風只能在 **https** 或 `localhost` 下使用。

## 快速開始

```bash
npm install
npm run dev          # http://localhost:5173（桌面瀏覽器）
npm run dev:mobile   # 自簽 https + 區網開放，用手機開 https://<電腦IP>:5173（第一次要接受憑證警告）
npm run build        # 產生 dist/，部署到任何靜態主機（需 https）即可在手機使用
```

## 大師 Agent（可切換 LLM）

預設是**離線 mock 大師**：用規則產生旁白，不需要網路和金鑰，也是 LLM 失敗時的備援。

要接真正的 LLM，請啟動後端代理。API 金鑰只放在後端，瀏覽器拿不到：

```bash
# 1) 選一個 provider 啟動後端（Node 22.18+，直接執行 TypeScript）
LLM_PROVIDER=openai OPENAI_API_KEY=sk-... LLM_MODEL=gpt-4o-mini npm run server
# 2) 前端指向後端
VITE_AGENT_URL=http://localhost:8787/api/master npm run dev
```

| 環境變數 | 用途 | 預設 |
|---|---|---|
| `LLM_PROVIDER` | `openai`｜`vertex`｜`gemini`｜`mock` | `mock` |
| `LLM_MODEL` | 模型名稱，例如 `gpt-4o-mini`、`gemini-2.5-flash`（請填你帳號可用的型號） | 依 provider |
| `OPENAI_API_KEY` | OpenAI 金鑰（`openai` 必填） | — |
| `OPENAI_API_STYLE` | `chat`（Chat Completions）或 `responses`（Responses API） | `chat` |
| `OPENAI_BASE_URL` | 相容 OpenAI 的端點 | `https://api.openai.com/v1` |
| `GCP_PROJECT` | GCP 專案 ID（`vertex` 必填） | — |
| `GCP_LOCATION` | Vertex 區域，例如 `us-central1`、`asia-east1`、`global` | `us-central1` |
| `GCP_ACCESS_TOKEN` | OAuth 存取權杖；未設定時自動執行 `gcloud auth print-access-token`（需先 `gcloud auth login` 並啟用 Vertex AI API） | — |
| `GCP_USE_METADATA` | 部署在 Cloud Run 時設為 `1`，改用服務帳戶自動取得權杖（不需要金鑰檔） | — |
| `GEMINI_API_KEY` | Gemini Developer API 金鑰（`gemini` 必填，適合本機開發） | — |
| `PORT` | 後端埠號 | `8787` |
| `ALLOW_ORIGIN` | 允許呼叫後端的前端網址（CORS），多個請用逗號分隔 | `http://localhost:5173` |
| `VITE_AGENT_URL` | **前端**：後端網址；不設定就用離線 mock | — |

健康檢查：`curl localhost:8787/api/health`。**一步一步的雲端設定（OpenAI、Gemini、Vertex、Netlify／Render／Cloud Run 部署）見 [docs/cloud-setup.md](docs/cloud-setup.md)，給非工程背景的人也能照做。**Prompt 模板見 [docs/agent-prompts.md](docs/agent-prompts.md)。

## 帶進 DAW：預設教學用 REAPER

Web 版負責「學會做決定」，DAW 負責「把決定做到好聽」。編曲、錄音、混音章節都附有 REAPER 操作步驟，可以下載 **MIDI**（主旋律／和弦／貝斯三軌，含速度）直接拖進 REAPER。

REAPER 選擇原因：輕量、跨平台、可完整試用 60 天。試用期結束後，官方要求購買授權（個人與小型用途有折扣授權），但軟體不會被鎖住。下載：<https://www.reaper.fm/>

## 資料存在哪裡

全部存在你自己的瀏覽器裡，不會上傳：

- 目前這首歌：`localStorage`
- 靈感庫的文字：`localStorage`；語音、哼唱、照片：IndexedDB
- 接上 LLM 時，只會把歌的文字摘要（不含錄音和照片）送給後端

## 文件

- [docs/creator-workflow.md](docs/creator-workflow.md)：真實創作者的做歌流程與 Maglody 的對齊
- [docs/pedagogy.md](docs/pedagogy.md)：研究結論與教學設計（工作室、火種式學習、可聽成果）
- [docs/architecture.md](docs/architecture.md)：前後端架構、LLM provider 抽象層、資料模型
- [docs/agent-prompts.md](docs/agent-prompts.md)：大師 Agent 的 prompt 模板
- [docs/design.md](docs/design.md)：視覺語言（紙、墨、淡彩）與禁止清單
- [docs/cloud-setup.md](docs/cloud-setup.md)：雲端與部署設定（非工程新手版）
- [docs/ux-review.md](docs/ux-review.md)：新手手機路徑自測紀錄與修正狀態

## 技術

Vite、React 19、TypeScript。音高偵測自行實作 normalized autocorrelation（McLeod 簡化版）；所有聲音都由 Web Audio 即時合成，不需要外部音源檔。
