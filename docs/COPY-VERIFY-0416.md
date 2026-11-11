# 文案與部署檢查（2026-11-11 04:16，未完成）

本次重新執行 `npm run build`，通過；`node --test scripts/tests/deploy-mime.test.mjs` 1/1 通過；`npx playwright test -c playwright.deploy.config.ts` 在 1280×800 桌面及 390×844 手機各 1/1 通過。部署版測試走過九個工作檯，檢查當時 DOM 內的圖片與 CSS 背景；它不代表所有彈窗、互動狀態及延後出現的素材都已檢查。

九個工作檯既有的前後截圖及尚未人工審閱的項目見 [COPY-VERIFY-1758](COPY-VERIFY-1758.md)。本次沒有新增逐頁前後截圖，也沒有宣稱已逐張審閱；[COPY-VERIFY-0414](COPY-VERIFY-0414.md) 所列的互動台詞、錯誤與模型回覆仍待核對。[COPY-AUDIT](COPY-AUDIT.md) 的搜尋候選仍需逐行人工判讀，全站重寫尚未完成。

本次未重跑完整 UAT，不能據此判定可以開放使用者測試。
