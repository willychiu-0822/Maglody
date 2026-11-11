# 部署資產驗證（2026-11-11 13:48，台北）

- `npm run build`：通過。
- `npx playwright test -c playwright.deploy.config.ts`：4/4 通過；使用 `scripts/deploy-serve.mjs`，在桌面 1280×800 與手機 390×844 檢查九個工作檯、工作室選單、夥伴對話、記靈感及靈感本子的圖片和背景。
- 測試另逐一確認 webp、jpg、jpeg、gif、mp3、wav、webm、woff2 的 MIME 類型與 `nosniff`。
- 這是部署資產的定向測試，並非完整 UAT，也不能證明所有動態狀態與文案都已核對。現有文案盤點和角色聲音卡仍須完成逐頁及互動狀態的審核。

2026-11-11 本輪重跑：`npm run build` 通過；部署資產 E2E 以桌面及手機各跑兩項，4/4 通過。覆蓋上述工作檯和面板的當前可見圖片與背景，並非所有互動狀態的完整覆蓋。

2026-11-11 20:59 台北複驗：`npm run build` 通過；`npx playwright test -c playwright.deploy.config.ts` 4/4 通過（桌面與手機各兩項）。九個工作檯及部分面板的現有圖片與背景正常；這不代表所有互動狀態或完整 UAT 均已通過。
