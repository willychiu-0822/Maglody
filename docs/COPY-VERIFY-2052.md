# 文案核對（2026-11-11 20:52，局部）

錄音準備與混音觀念的工具箱把「即時回饋」統一改為「一起看看」，讓標題更像夥伴邀請一起看結果。

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 錄音準備，桌面 1280×800 | [前](uat/evidence/A-feedback-record-desktop-before.png) | [後](uat/evidence/A-feedback-record-desktop-after.png) | 標題較自然；數值圖例仍需在實際測量後檢視。 |
| 錄音準備，手機 390×844 | [前](uat/evidence/A-feedback-record-mobile-before.png) | [後](uat/evidence/A-feedback-record-mobile-after.png) | 標題與卡片可讀；未涵蓋所有互動狀態。 |
| 混音觀念，桌面 1280×800 | [前](uat/evidence/A-feedback-mix-desktop-before.png) | [後](uat/evidence/A-feedback-mix-desktop-after.png) | 標題與錄音頁一致；播放後的回饋還需核對。 |
| 混音觀念，手機 390×844 | [前](uat/evidence/A-feedback-mix-mobile-before.png) | [後](uat/evidence/A-feedback-mix-mobile-after.png) | 標題可讀；未涵蓋所有互動狀態。 |

本次只有空白作品的兩個工具箱畫面，並非全站逐頁審核。角色動態回覆、錯誤與慶祝等狀態仍需審閱；全站重寫及完整 UAT 尚未完成。

`npm run build` 通過；以本機預覽執行 `npm run selftest` 共 53/53 通過；`npx playwright test -c playwright.deploy.config.ts` 在桌面與手機共 4/4 通過，涵蓋指定 MIME 與九個工作檯、部分對話的圖片和背景。這些結果不等於完整 UAT。

工作區已有大量暫存刪除和未提交成果，為避免混入或覆蓋既有工作，本次未合併、提交或推送；`codex/burn-b` 已是目前 HEAD 的祖先。工作區外的狀態檔無法寫入。
