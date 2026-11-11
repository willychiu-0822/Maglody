# 第 18 輪：部署素材檢查

2026-11-11 13:19（台北）。目前工作目錄已有大量暫存與未提交變更；本紀錄只描述這次實際執行的檢查，不能代表完整驗收。

- `npm run build`：通過。
- `npx playwright test -c playwright.deploy.config.ts`：桌面 1280×800、手機 390×844 各通過；從 `deploy-serve` 開啟九個工作檯，檢查頁面的圖片及 CSS 背景能否載入。
- 此測試未遍歷所有彈窗、錯誤及互動狀態；也沒有逐頁拍攝或人工審核本輪文案，不能當成文案全面驗收。
- 工作目錄中的部署伺服器已列出 webp、jpg、jpeg、gif、mp3、wav、webm、woff2 MIME 類型；這些檔案目前尚未納入乾淨提交。
- 未重跑完整 UAT 或 selftest，`ready_for_user_test` 維持 false。
