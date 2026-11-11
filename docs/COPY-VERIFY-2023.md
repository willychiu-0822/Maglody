# 文案與部署素材核對（2026-11-11 20:23，未完成）

哼唱頁的兩則知識說明已改寫：調性改為可用耳朵比較的猜測，音高說明移除「A 音都是 440 Hz」的錯誤。原文及問題記在 [文案盤點](COPY-AUDIT.md)。這兩則需在播放示範後展開；本輪未拍前後圖，也未逐頁人工審閱，不能視為文案驗收完成。既有九個工作檯的前後初始畫面與限制見 [COPY-VERIFY-1758.md](COPY-VERIFY-1758.md)。

`npm run build` 通過。`npx playwright test -c playwright.deploy.config.ts` 以 deploy-serve 測試桌面 1280×800、手機 390×844，MIME 與圖片背景檢查共 4/4 通過；範圍包含九個工作檯、工作室選單、夥伴對話及靈感介面，並非所有互動狀態。

剩餘：全站字串逐行盤點、逐頁含互動狀態前後截圖及人工審閱、完整 UAT 與新手探索測試。完整 UAT 未重跑，ready_for_user_test 維持 false。
