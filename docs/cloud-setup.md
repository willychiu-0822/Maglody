# 雲端設定指南（給非工程背景的你）

這份指南帶你把 Maglody 放上網，讓手機可以直接打開；也可以選擇接上 ChatGPT 或 Google Gemini，讓「大師」變聰明。每一步都會說明**為什麼要做**，以及**這個技能還能用在哪**。

> 先說結論：**Maglody 不接任何 AI 也能完整使用**（內建離線大師）。AI 是加分項目，可以之後再加。

---

## 0. 先選一條路

| 路線 | 你會得到 | 要花的錢 | 難度 | 建議對象 |
|---|---|---|---|---|
| **0　只放網站** | 手機能用、可安裝；大師是離線版 | 0 元 | ★☆☆ | 先體驗、先自己用 |
| **A　＋ OpenAI（ChatGPT API）** | 大師能自由回答問題 | 按用量計費（短旁白很便宜） | ★★☆ | 已有 OpenAI 帳號 |
| **B　＋ Google Gemini（API 金鑰）** | 同上，用 Google 的模型 | 有免費額度，超過按用量 | ★★☆ | 想最快接上 Google 的模型 |
| **C　＋ Google Cloud Vertex AI** | 同上，走公司或正式的 GCP 帳號 | 按用量計費 | ★★★ | 已有 GCP 專案，或之後要正式營運 |

A、B、C 都需要多架一個小小的「後端」。原因是：**AI 金鑰就像信用卡號，絕對不能放在網頁裡**。網頁的內容任何人都看得到，所以金鑰只能放在你自己的後端，由後端代替網頁去問 AI。

---

## 第 1 部分：把網站放上網（每條路線都要做）

### 1-1　準備好程式碼的位置

程式碼在 GitHub：`willychiu-0822/Maglody`，目前最新的內容在 **`feature/music-lab`** 分支。

- **為什麼**：等一下的網站託管服務會直接從 GitHub 讀程式碼，你每次更新，網站就會自動跟著更新。
- **建議**：確認一切正常後，把這個分支合併進 `main`。託管服務預設看 `main`，之後比較不容易選錯。
- **還能用在哪**：任何「放在 GitHub、要自動上線」的作品集或個人網站，都是同一套流程。

### 1-2　用 Netlify 託管（推薦，免費）

1. 到 <https://app.netlify.com/> 用 GitHub 帳號登入。
2. 按 **Add new site → Import an existing project → GitHub**，選 `Maglody`。
3. 設定以下欄位：
   - **Branch to deploy**：`feature/music-lab`（或合併後的 `main`）
   - **Build command**：`npm run build`
   - **Publish directory**：`dist`
4. 按 **Deploy**。大約 1 分鐘後，你會拿到一個 `https://xxxx.netlify.app` 網址。
5. （可選）**Site configuration → Change site name**，把網址改成好記的名字，例如 `maglody.netlify.app`。

- **為什麼一定要 https**：手機瀏覽器只有在 https 網址下才會讓網頁使用麥克風；PWA（加入主畫面）也需要 https。Netlify 會自動幫你處理好。
- **其他選擇**：Cloudflare Pages、Vercel、Firebase Hosting 的操作幾乎一樣，都是填 `npm run build` 和 `dist`。
- **還能用在哪**：任何 React／Vue 前端專案都能這樣部署。

### 1-3　在手機上打開並安裝

| 手機 | 步驟 |
|---|---|
| iPhone | 用 **Safari** 打開網址 → 分享按鈕 → **加入主畫面** |
| Android | 用 **Chrome** 打開網址 → 右上選單 → **安裝應用程式** |

第一次按「開始哼唱」時，手機會詢問麥克風權限，請選「允許」。

- **為什麼要加入主畫面**：可以像 App 一樣全螢幕開啟，沒網路時也能打開（靈感照樣記得進去）。
- **小提醒**：舊版 iPhone 開著靜音鍵時可能聽不到聲音，請先關閉靜音。

✅ **走路線 0 的人，到這裡就完成了。**

---

## 第 2 部分：選一個 AI（擇一即可）

### 路線 A：OpenAI（ChatGPT API）

> ChatGPT Plus 訂閱和 API 是**兩種不同的帳單**；有 Plus 不代表能用 API。

1. 到 <https://platform.openai.com/> 註冊或登入。
2. **Settings → Billing**：綁定付款方式，儲值小額（例如 5 美元）。
3. **Settings → Limits**：設定**每月預算上限**（例如 10 美元）。
   - **為什麼**：預算上限是你的安全網。萬一網址被濫用，花費也不會超過你設定的金額。
4. **API keys → Create new secret key**，取個名字（例如 `maglody`），複製下來，貼到密碼管理器。這串字只會顯示一次。
5. 記下要用的模型名稱：到 **Models** 頁面挑一個便宜、快速的對話模型（例如名稱裡有 `mini` 的型號）。

你會用到的設定：

```
LLM_PROVIDER=openai
OPENAI_API_KEY=（剛剛複製的金鑰）
LLM_MODEL=（模型名稱）
```

接著到第 3 部分架設後端。

### 路線 B：Google Gemini（API 金鑰，最快）

1. 到 <https://aistudio.google.com/> 用 Google 帳號登入。
2. 按 **Get API key → Create API key**，複製下來並妥善保存。
3. 在 AI Studio 的模型清單裡，記下一個 Flash 系列的模型名稱。

```
LLM_PROVIDER=gemini
GEMINI_API_KEY=（剛剛複製的金鑰）
LLM_MODEL=（模型名稱，例如 gemini-2.5-flash）
```

- **為什麼選這條**：只要一把金鑰，不用設定 GCP 專案，最適合先試試看。
- **注意**：免費額度可能被用於改進 Google 的產品。如果在意隱私，請到 AI Studio 開啟付費方案，或改走路線 C。

### 路線 C：Google Cloud Vertex AI（正式用）

1. 到 <https://console.cloud.google.com/> 建立一個**專案**（例如 `maglody`），記下**專案 ID**。
2. **帳單 → 連結帳單帳戶**，然後到 **帳單 → 預算與快訊** 建立預算（例如每月 300 元台幣，達到 50%／90%／100% 時寄信通知你）。
   - **為什麼**：GCP 的預算預設**只會寄信提醒、不會自動停止服務**，所以門檻要設低一點，收到信就去查看。
3. 搜尋 **Vertex AI API** → **啟用**。
4. 到 **Vertex AI → Model Garden** 確認可用的 Gemini 模型名稱與區域（台灣可選 `asia-east1`）。

Vertex 不使用金鑰，而是使用「服務帳戶」證明身分，後端放在 Google 自己的 Cloud Run 上最方便，詳見 3-2。

---

## 第 3 部分：架設後端（大師的腦）

後端是一個很小的程式（`server/` 資料夾，沒有任何外部套件），它的工作是：收下網頁的問題 → 帶著你的金鑰去問 AI → 把安全過濾後的回答交還給網頁。

### 3-1　路線 A、B：用 Render（不用打指令）

1. 到 <https://render.com/> 用 GitHub 登入 → **New → Web Service** → 選 `Maglody`。
2. 填入以下設定：
   - **Branch**：`feature/music-lab`（或 `main`）
   - **Runtime**：Node
   - **Build Command**：`echo skip`（後端不需要建置）
   - **Start Command**：`node server/index.ts`
   - **Instance Type**：Free
3. **Environment** 加入第 2 部分的變數，另外再加：
   ```
   ALLOW_ORIGIN=https://你的網站.netlify.app
   NODE_VERSION=22.18.0
   ```
   - **為什麼要 `ALLOW_ORIGIN`**：只允許你自己的網站呼叫這個後端，別人的網頁無法借用你的額度。
   - **為什麼要指定 Node 版本**：後端直接執行 TypeScript，需要 Node 22.18 以上。
4. 按 **Create**。完成後你會拿到 `https://xxxx.onrender.com`。
5. 測試：用瀏覽器打開 `https://xxxx.onrender.com/api/health`，看到類似 `{"provider":"openai-chat","model":"..."}` 就成功了。

> Render 免費方案閒置一段時間會休眠，第一次叫醒大約要 30–60 秒。這段時間 Maglody 會自動改用離線大師，不會卡住。

### 3-2　路線 C：用 Cloud Run（在瀏覽器裡完成）

1. 在 GCP 主控台右上角按 **啟動 Cloud Shell**（瀏覽器裡的終端機，不需要在電腦安裝任何東西）。
2. 依序貼上以下指令，每次貼一段，把 `你的專案ID`、`模型名稱`、`你的網站` 換掉：

   ```bash
   gcloud config set project 你的專案ID
   git clone -b feature/music-lab https://github.com/willychiu-0822/Maglody.git
   cd Maglody

   # 讓 Cloud Run 的身分可以呼叫 Vertex AI
   PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
   gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
     --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   # 部署後端
   gcloud run deploy maglody-master --source server --region asia-east1 \
     --allow-unauthenticated --max-instances 2 \
     --set-env-vars "LLM_PROVIDER=vertex,GCP_PROJECT=$(gcloud config get-value project),GCP_LOCATION=asia-east1,LLM_MODEL=模型名稱,GCP_USE_METADATA=1,ALLOW_ORIGIN=https://你的網站.netlify.app"
   ```

3. 如果系統詢問是否啟用某些 API，輸入 `y`。完成後會顯示 `Service URL: https://maglody-master-xxxx.a.run.app`。
4. 測試：打開 `Service URL/api/health`。

- **每個設定的用途**：
  - `roles/aiplatform.user`：只給「呼叫 Vertex AI」的權限，不多給。這叫最小權限原則。
  - `GCP_USE_METADATA=1`：讓後端在 Cloud Run 上自動取得服務帳戶的通行證，不需要任何金鑰檔。
  - `--max-instances 2`：限制最多同時開 2 台，避免費用暴衝。
- **還能用在哪**：任何小型 API、LINE Bot、表單後端都能用 `gcloud run deploy --source` 這樣部署。

---

## 第 4 部分：讓網站知道後端在哪

1. 回到 Netlify → 你的網站 → **Site configuration → Environment variables → Add a variable**：
   ```
   VITE_AGENT_URL=https://（你的後端網址）/api/master
   ```
2. **Deploys → Trigger deploy → Deploy site**，重新建置一次。
   - **為什麼要重新建置**：`VITE_` 開頭的設定是在「打包網頁」時寫進去的，改了之後必須重新打包才會生效。
3. 用手機打開網站 → 點底部的大師 → 對話框右上角應該顯示 **「LLM 模式」**（原本是「離線模式」）。問一句「為什麼這和弦？」試試看。

---

## 第 5 部分：上線後的檢查清單

- [ ] 手機用 https 網址打開，能錄哼唱（權限選允許）
- [ ] 加入主畫面後能開啟；關掉網路後還能打開、能記靈感
- [ ] 大師顯示「LLM 模式」，回答是繁體中文，而且沒有替你寫整首歌
- [ ] 已設定預算上限或預算快訊
- [ ] 金鑰只存在 Render／Cloud Run 的環境變數裡，沒有出現在 GitHub 或網頁中
- [ ] `ALLOW_ORIGIN` 是你的網站網址，不是 `*`

## 常見問題

| 狀況 | 可能原因 | 解法 |
|---|---|---|
| 手機按錄音沒反應 | 不是 https，或拒絕過權限 | 確認網址是 https；到瀏覽器的網站設定重新允許麥克風 |
| iPhone 沒有聲音 | 舊版 iOS 的靜音鍵 | 關閉靜音；更新到 iOS 16.4 以上 |
| 大師一直是「離線模式」 | 沒設定 `VITE_AGENT_URL`，或設定後沒重新部署 | 回到第 4 部分 |
| `/api/health` 打不開 | 後端沒啟動 | 看 Render／Cloud Run 的 Logs，通常會寫「缺少環境變數 XXX」 |
| 大師回答很慢才出現 | Render 免費方案在休眠 | 正常現象；需要即時回應可升級方案或改用 Cloud Run |
| Vertex 出現 403 | 服務帳戶沒有權限，或 API 沒啟用 | 重做 3-2 的授權指令；確認已啟用 Vertex AI API |
| 帳單變多 | 網址被別人使用 | 換一把金鑰、調低預算；`ALLOW_ORIGIN` 只能擋瀏覽器，擋不了直接呼叫，所以預算上限是最後一道防線 |

## 目前的限制（誠實說明）

- 後端還沒有「每人每分鐘次數限制」，目前靠預算上限和 Cloud Run 的實例數上限控制成本。
- 以上流程已用本機模擬端點驗證過請求格式；**尚未用真實金鑰實際呼叫 OpenAI、Gemini、Vertex**。第一次接上時，請先看 `/api/health`，再問一句試試。
