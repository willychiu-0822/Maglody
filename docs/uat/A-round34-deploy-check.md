# 第 34 輪部署素材檢查（2026-11-11 18:13 台北）

- `npm run build`：通過。
- `npx playwright test -c playwright.deploy.config.ts`：4 項通過，桌面 1280×800、手機 390×844 各執行 MIME 檢查與素材檢查。
- 使用 `scripts/deploy-serve.mjs` 提供正式建置；測試檢查八種素材的 Content-Type 和 nosniff，並檢查九個工作檯、工作室選單、夥伴對話和靈感介面中圖片及目前套用的背景圖是否載入。
- 此結果不涵蓋所有互動後才出現的畫面，也不能取代完整 UAT、逐頁前後截圖與文案人工審核。整體 `ready_for_user_test` 保持 false。
