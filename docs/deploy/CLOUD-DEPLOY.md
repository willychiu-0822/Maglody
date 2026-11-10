# 穩定的 HTTPS 預覽網址

這份文件讓 Maglody 有**一個不會換、也不會回 HTTP 530 的 https 網址**，取代會斷線的 cloudflared quick tunnel。

預設是離線 mock 大師。**現在不需要任何 AI 金鑰。** 帳號要由你自己登入、自己綁；這份程式沒有代你建立雲端服務。

價格是 2026-11 對照各家公開定價頁整理的，之後可能改。部署前請再看一眼方案頁。

## 這個程式實際怎麼跑

- 網頁是 Vite。`npm run build` 產生 `dist/`（含 PWA 需要的檔案）。
- 大師 API 是 `server/index.ts`（Node 22.18 以上，直接跑 TypeScript）。`LLM_PROVIDER` 預設 `mock`，不連外網、不讀金鑰。
- 瀏覽器裡還有一套更完整的離線 mock。沒有設定 `VITE_AGENT_URL` 時，網頁根本不呼叫 API，創作流程照樣走完。
- `npm start` 是 production：同一個行程同時提供首頁和 `/api/health`、`/api/master`。這就是雲端要跑的指令。
- `npm run server` 仍是只開 API 的本機模式，給 `npm run dev` 用，不會去送 `dist/`。
- 麥克風是瀏覽器的 `getUserMedia`。它只要求 **https**（或 localhost），錄音留在這台手機，不經過伺服器。
- 目前沒有 WebSocket。聲音是瀏覽器裡的 Web Audio，作品存在這台瀏覽器的 localStorage／IndexedDB。伺服器沒有資料庫；免費方案休眠或重開，不會清掉歌曲。

## 三個方案

| | Render（建議） | Vercel | Fly.io |
|---|---|---|---|
| 業餘費用 | Hobby 工作區每月 0 元。Web Service 可選 Free：512 MB、15 分鐘沒人連就休眠，下次打開約 1 分鐘。每月 750 個免費執行小時（睡著不算）。不想休眠可改約每月 7 美元的最小付費 instance。 | Hobby 每月 0 元。靜態網頁不休眠。函式有免費額度（約 100 萬次呼叫、有限的 CPU／記憶體時間）。 | 沒有長期免費額度。最小機器一直開著約每 30 天 2.19 美元（256 MB）到 3.69 美元（512 MB）。新帳號只有 7 天、1 美元試用。 |
| 長駐程式 | 有。一個 Node 行程同時送網頁和 API，跟本機 `npm start` 相同。免費方案會休眠，**網址不變**。 | 沒有長駐行程。網頁是靜態檔，API 是短命函式（Hobby 單次最長 300 秒）。 | 有。可一直開著，也可閒置關機。 |
| WebSocket | 支援。Maglody 目前用不到。 | 不適合拿來當長連線 WebSocket 伺服器。Maglody 目前用不到。 | 支援。Maglody 目前用不到。 |
| 麥克風 | 自動 https，瀏覽器可問麥克風權限。 | 同樣自動 https。 | 同樣自動 https（`*.fly.dev`）。 |
| 穩定網址 | `https://<名稱>.onrender.com` | `https://<名稱>.vercel.app` | `https://<名稱>.fly.dev` |
| 和現有程式 | 直接跑已驗證的 `npm start`。後台填環境變數即可。 | 要另寫一套 serverless 進入點，和現在的 `server/index.ts` 不是同一條路，這次沒有加。 | 要改 Docker 映像把網頁一起打包，並用 flyctl。現有 `server/Dockerfile` 只有 API。 |

### 為什麼選 Render

你要的是一個固定的 https 網址，而且大師在沒有金鑰時就要能用。Render 的免費 Web Service 用同一個 Node 行程做這件事，部署指令和本機 production 一樣，出問題時比較對得起來。

代價是閒置 15 分鐘後會睡，下一個人打開要等約一分鐘（這段時間看到的是 Render 的等待頁，不是 530）。預覽可以接受。若你常把連結丟給別人、不能等，把同一台服務的 instance 改成每月 7 美元那檔，就不會睡。

Hobby 工作區的公開定價含少量對外流量（寫的是 5 GB）。用完而且沒有付款方式時，免費服務會被暫停到下個週期，不會因為這份設定自動扣款。

不選 Vercel：它也很便宜，而且網頁不休眠，但現在的 API 是長駐的 Node 伺服器。硬拆成函式是另一套程式，這次無法在沒有帳號的情況下驗證。

不選 Fly.io：它適合一直開著的小伺服器，可是試用結束後就要付費，還需要安裝指令列工具。

不沿用舊文件裡的「Netlify 放網頁、Render 另開一台 API」：那是兩個網址，CORS 和重建步驟更多。舊步驟在 [../cloud-setup.md](../cloud-setup.md)，分支名稱已過時。

## 你必須提供的名稱

### 現在就要有（沒有密鑰）

- **GitHub 帳號**，而且看得到 `willychiu-0822/Maglody`
- **Render 帳號**（用上面的 GitHub 登入即可，選 Hobby）

### 現在不要填

這些留空。一填又沒有真值，服務會起不來：

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `GCP_PROJECT`
- `GCP_ACCESS_TOKEN`
- `GCP_LOCATION`
- `GCP_USE_METADATA`
- `OPENAI_BASE_URL`
- `OPENAI_API_STYLE`
- `VITE_AGENT_URL`
- `ALLOW_ORIGIN`
- `PUBLIC_URL`
- `NODE_ENV`（不要設。理由見下面的常見問題）

### 主機自己會給，你不用發明

- `PORT`
- `RENDER_EXTERNAL_URL`

### 以後要換成真正的大師，再擇一組

只加在 Render 的 Environment，不要寫進 git，也不要貼到聊天室。改完必須重新部署，因為 `VITE_` 是打包時寫進網頁的。

共通，三條都要：

- `LLM_PROVIDER`
- `LLM_MODEL`
- `VITE_AGENT_URL`（值是 `https://<你的服務>.onrender.com/api/master`）

再加其中一組：

- OpenAI：`OPENAI_API_KEY`。可選 `OPENAI_API_STYLE`、`OPENAI_BASE_URL`
- Gemini：`GEMINI_API_KEY`

Vertex（`GCP_PROJECT`、`GCP_LOCATION`、`GCP_ACCESS_TOKEN` 或 `GCP_USE_METADATA`）不要放在這台 Render 上。它要的是 GCP 服務帳戶，舊文件的 Cloud Run 路線才對得上。

只有在你另外綁了自訂網域時才加：

- `ALLOW_ORIGIN` 或 `PUBLIC_URL`（內容是 `https://你的網域`，沒有路徑、沒有結尾斜線）

`onrender.com` 那個網址會自動放進允許清單，預覽階段不用填。

## 部署步驟

部署的分支必須含有專案根目錄的 `render.yaml`。寫這份文件時，設定在 `cursor/maglody-cloud-deploy-ready`，審查目標是 `codex/maglody-preview-20261110-0725`。

**不要選 `main`**，除非你確認 `main` 上已經有 `render.yaml`。也不要選 Docker。`server/Dockerfile` 只有 API，沒有網頁。

1. 打開 <https://dashboard.render.com/>，用 GitHub 登入。若問方案，選 **Hobby**（每月 0 元）。
2. **New → Blueprint**。
3. 選 repo `willychiu-0822/Maglody`，分支選**含有 `render.yaml` 的那個分支**。地區可以選新加坡（Singapore），離台灣較近；不選也沒關係，網址一樣不會變。
4. 名稱可以維持 `maglody`。按 Apply 之後，Render 會讀 `render.yaml`：
   - Runtime：Node
   - Build Command：`npm run build`
   - Start Command：`npm start`
   - Health Check Path：`/api/health`
   - Instance：Free
   - 環境變數：`NODE_VERSION=22.18.0`、`LLM_PROVIDER=mock`
5. 不要再加金鑰。按套用，等第一次部署變成 Live。建置大約幾分鐘。
6. 在服務頁複製 `https://….onrender.com`。這就是之後固定使用的網址。
7. 用瀏覽器打開它。第一次若剛睡醒，會先看到 Render 的等待頁，約一分鐘後才是工作室。
8. 同一網址後面加上 `/api/health`。應看到：

   ```json
   {"provider":"mock","model":"mock"}
   ```

9. 手機用 Safari（iPhone）或 Chrome（Android）打開**同一個 https 網址**。按開始哼唱時，允許麥克風。

若 Blueprint 沒有出現，改用手動建立，欄位必須與上面相同：

1. **New → Web Service**，連同一個 repo 和分支。
2. Runtime 選 **Node**，不要選 Docker。
3. Build Command 填 `npm run build`，Start Command 填 `npm start`。
4. Instance Type 選 **Free**。
5. Health Check Path 填 `/api/health`。
6. Environment 只加 `NODE_VERSION`＝`22.18.0`、`LLM_PROVIDER`＝`mock`。

## 本機先確認（不需要帳號）

```bash
npm ci
npm run build
npm start
```

另開一個終端：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/
curl -s http://127.0.0.1:8787/api/health
```

預期分別是 `200`，以及 `{"provider":"mock","model":"mock"}`。埠被佔用時，用 `PORT=8799 npm start`，curl 改打 8799。

既有檢查不要改設定再跑：

```bash
npm run build
npm run selftest:unit
npm run test:logic
npm run preview -- --host 127.0.0.1 --port 4101 --strictPort   # 另開終端
npm run selftest
```

`npm run selftest` 打的是 4101 的 Vite preview，不是 8787。測完把 preview 關掉。

## 常見問題

| 狀況 | 原因 | 做法 |
|---|---|---|
| 網址回 530，或每次網址都不一樣 | 還在用 cloudflared | 改開 `https://….onrender.com` |
| 打開先看到 Render 的等待頁 | 免費方案睡了 | 等約一分鐘。不能等就改付費 instance |
| 建置說找不到 `tsc` 或 `vite` | 環境變數設了 `NODE_ENV=production`，npm 沒裝開發依賴 | 刪掉這個變數後重新部署。production 由 `npm start` 自己設 |
| 首頁 503，寫著 dist is missing | 沒有先建置 | Build Command 必須是 `npm run build` |
| `/api/health` 不是 mock | `LLM_PROVIDER` 被改掉了 | 改回 `mock`，或補上對應金鑰後再部署 |
| 大師仍顯示離線 | 這是預設 | 零金鑰時就該離線。要真模型再補上一節的變數並重新部署 |
| 手機按錄音沒有權限視窗 | 不是 https，或先前按過拒絕 | 確認網址是 https；到瀏覽器的網站設定改成允許 |
| 服務起不來，日誌寫缺少環境變數 | 選了 openai／gemini／vertex 但金鑰是空的 | 先改回 `LLM_PROVIDER=mock` |

## 上線後你自己核對

- [ ] 網址是 `https://….onrender.com`，重新整理幾次，網址沒有換
- [ ] `/api/health` 是 `provider: mock`
- [ ] 手機用這個 https 網址能打開，麥克風權限問得出來
- [ ] GitHub 上沒有 `.env`，Render 的 Environment 裡沒有真的金鑰（現階段）
- [ ] 沒有把 `ALLOW_ORIGIN` 設成 `*`
