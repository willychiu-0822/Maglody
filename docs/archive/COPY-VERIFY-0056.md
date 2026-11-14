# 文案與部署檢查（2026-11-11 00:56，未完成）

本次確認沿用既有文案盤點和聲音卡；未逐條人工判讀，也沒有新增逐頁前後截圖。九個工作檯的既有空白畫面對照與其限制見 [COPY-VERIFY-1758](COPY-VERIFY-1758.md)；後續修改及未驗證範圍見 [COPY-VERIFY-0035](COPY-VERIFY-0035.md)、[COPY-VERIFY-0038](COPY-VERIFY-0038.md)。這些畫面不能代表互動後的角色回覆、錯誤、慶祝、彈窗或知識火花都已審過。

本次重新執行 `npm run build` 通過；`node --test scripts/tests/deploy-mime.test.mjs` 1/1 通過；`npx playwright test -c playwright.deploy.config.ts` 2/2 通過，在桌面 1280×800 和手機 390×844 各走九個工作檯，檢查頁面 img 與 CSS 背景圖片可載入。部署伺服器由 Playwright 啟動並關閉。這些檢查不代表文案或完整 UAT 通過。

剩餘：人工審核並改寫所有實際顯示的字串與動態回覆；逐頁及互動狀態拍攝手機與桌面前後圖並人工檢視；檢查彈窗按鈕、44px 點擊區和主動作；重跑完整 UAT。真實線上模型回覆尚未驗證。`ready_for_user_test` 保持 false。
