# 第 35 輪部署素材檢查（2026-11-11 18:15 台北）

- `npm run build`：通過。
- `npx playwright test -c playwright.deploy.config.ts`：桌面與手機共 4 項通過。
- 從 deploy-serve 提供正式建置，檢查八種指定副檔名的 MIME 與 nosniff，以及九個工作檯、選單、夥伴對話和靈感介面的圖片及套用背景。
- 這不是完整 UAT，也未涵蓋所有互動後的狀態。全站文案人工審核及逐頁前後圖仍未完成；`ready_for_user_test` 維持 false。
- 工作樹已有 9,629 筆暫存刪除、41 筆同時含暫存及未暫存修改；本輪未合併或提交，避免把既有狀態一起改動。
