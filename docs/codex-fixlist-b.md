# 任務 B：工程品質與穩定性

只修改工程邏輯與測試，不調整故事書／RPG 版面與既有角色文案。所有 commit 僅在本機。

## 基準（2026-11-09）

已讀 README.md、docs/architecture.md、docs/agent-prompts.md；`npm run build`、`npx --no-install tsc -b --noEmit` 通過。`npm run selftest` 失敗：未安裝 playwright（也未宣告此依賴）。網路不可用，不下載套件。

嚴重度：高＝可能崩潰、丟失資料或持續佔用資源；中＝錯誤行為、資源累積或驗證缺口。

## 第一輪

| 編號 | 嚴重度 | 位置 | 現象 | 修法 | 狀態 |
|---|---|---|---|---|---|
| B-01 | 高 | package.json、scripts/mobile-selftest.cjs | selftest 依賴不存在的 playwright；斷言失敗也不回傳失敗碼 | 使用已安裝 TypeScript + Node test runner 執行離線測試；保留獨立手機測試並修正退出碼 | 已修；build + selftest 通過 |
| B-02 | 高 | server/index.ts、src/agent/client.ts | null／畸形 messages 可產生 500；壞 JSON 誤回 502；串流讀取在 catch 外；前端只驗 action 名稱，非法和弦／步驟可進入 UI | 嚴格驗證請求，限制 bytes／欄位長度；統一 JSON 錯誤，區分 400/413/502；共享回覆淨化器 | 已修；build + selftest 6/6 |
| B-03 | 高 | server/llm/*、src/agent/client.ts | 前後端與 GCP 憑證請求沒有逾時；模型回錯格式／空內容時可能空白回覆；OpenAI 使用 any | 請求逾時與取消；結構驗證、移除 any；設定錯誤明確回報、前端降級離線角色 | 已修；build + selftest 10/10 |
| B-04 | 高 | src/lib/mic.ts、src/inspire/recorder.ts | 權限未回來就卸載仍開麥克風；重複開始／停止競態；maxSec 只停畫面、繼續收音；SpeechRecognition 與音訊節點未釋放 | 啟動世代與互斥、完整 cleanup、到期真正停止、停止 Promise 可重複呼叫 | 已修；build + selftest 14/14 |
| B-05 | 高 | src/lib/audio.ts、src/steps/results.ts | 循環的 source／timer 陣列無限增加；自然結束仍留 active；鼓無法立即停止；延遲 Demo 換頁後復活 | 完成時移除 source／timer；統一停止音源與延遲播放；dispose 全部 bus | 待修 |
| B-06 | 高 | src/inspire/InspirationHub.tsx、src/lib/media.ts | 錄音中按儲存讀到舊 draft；IndexedDB 失敗使 busy 卡住與 Promise 未處理；交易成功尚未 commit 就回報；DB／bitmap／blob URL 洩漏 | 儲存使用最新附件、錯誤 finally；等待交易完成並關 DB；媒體資源 cleanup | 待修 |
| B-07 | 中 | src/agent/useMaster.ts | debounce key 包含 detail，打字每次仍送出；timer 無 cleanup；重疊請求提早清 busy、歷史跨角色混雜 | 按事件去抖、卸載取消、計算 pending、依角色保留歷史、限制暫存 | 待修 |
| B-08 | 中 | src/lib/store.ts、src/lib/versions.ts、src/inspire/store.ts | localStorage 合法 JSON 但形狀錯誤可使啟動崩潰；版本儲存回傳名稱依賴 React updater 同步執行，StrictMode 重複副作用 | 載入時驗證／修補資料；版本名稱在 updater 外計算；移除 updater 中刪媒體副作用 | 待修 |
| B-09 | 中 | public/sw.js、src/main.tsx | SW 刪同源其他應用 cache、把 HTML 當缺失 JS、cache 寫入／註冊拒絕未處理；離線 shell 未預存 build assets | cache 限定命名空間、只對導覽回 HTML、預存 build 資產、管理 waitUntil／錯誤 | 待修 |

## 驗證原則

每項修正通過 build + selftest 後獨立 commit：`fix(B-編號): 說明`。測試不連外，供應商以 fetch stub 驗證，涵蓋五個離線角色與錯誤降級。手機瀏覽器測試保留獨立指令；此環境缺 playwright／實體裝置，不能宣稱手機 E2E 通過。前端 TypeScript strict 已啟用；原 tsconfig 不含 server/，後端以離線整合測試補足驗證。

第二輪盤點與最終驗證會在修正後追加。
