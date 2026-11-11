# 第 22 輪：既有成果檢查

2026-11-11 13:35（台北）。本輪檢查的是工作樹中既有的未提交內容，不代表它們已經過完整驗收。

- `npm run build`：通過。
- `npx playwright test -c playwright.deploy.config.ts`：桌面 1280×800、手機 390×844 共 4 項通過，包含八種 MIME 類型、九個工作檯的圖片與 CSS 背景，以及選單、夥伴對話與靈感介面。未遍歷每個互動或錯誤狀態。
- `npm run selftest`：在 4101 啟動 preview 後通過 53 項；檢查結束已關閉本輪啟動的服務。直接執行時因 preview 尚未啟動而連線失敗。
- 尚未完成全站文案逐條人工審核、各互動狀態的前後截圖與完整 UAT。原本 `ready_for_user_test` 維持 false。
- 依 `LOCAL-TEST.md` 使用 `scripts/git-local.sh` 可見實際分支為 `codex/maglody-voice-1113`，工作樹已有多項未提交修改。普通 Git 使用舊索引，顯示的數千項暫存刪除不能作為實際工作狀態。
