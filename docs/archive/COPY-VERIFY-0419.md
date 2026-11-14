# 文案與部署檢查（2026-11-11 04:19，未完成）

本次在現有工作樹重新執行 `npm run build`，通過。`node --test scripts/tests/deploy-mime.test.mjs` 通過 1 項，檢查 webp、jpg、jpeg、gif、mp3、wav、webm、woff2 的 Content-Type 與 nosniff。`npx playwright test -c playwright.deploy.config.ts` 通過桌面 1280×800、手機 390×844 各 1 項，使用 deploy-serve 走過九個工作檯，檢查當時 DOM 內的圖片及 CSS 背景。

本次未修改文案，也沒有拍攝新的前後截圖。既有的九頁初始畫面前後圖及人工審閱進度見 [COPY-VERIFY-1758](COPY-VERIFY-1758.md)；互動後的台詞、彈窗、錯誤、慶祝、延遲素材與線上模型輸出仍待逐一核對。搜尋候選仍須人工判讀；不能宣稱全站重寫完成。

部署測試不能替代完整 UAT。本次未重跑完整 UAT，`ready_for_user_test` 維持 false。
