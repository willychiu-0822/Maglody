# 文案核對（2026-11-11 00:35，未完成）

本輪只改了哼唱任務和兩個儲存失敗提示；不能代表全站改寫完成。前一輪九頁前後截圖及尚未審閱的項目見 [COPY-VERIFY-1758](COPY-VERIFY-1758.md)，原文候選清單見 [COPY-AUDIT](COPY-AUDIT.md)。

| 畫面 | 改前 | 改後 | 核對 |
| --- | --- | --- | --- |
| 哼唱首頁，桌面 | [前一輪畫面](uat/evidence/copy-1758/before/desktop-1.png) | [本輪畫面](uat/evidence/A-UI-05-desktop.png) | 任務由「完成一段哼唱分析」改為「先留一段聲音」；仍需逐圖人工審視整頁。 |
| 哼唱首頁，手機 | [前一輪畫面](uat/evidence/copy-1758/before/mobile-1.png) | [本輪畫面](uat/evidence/A-UI-05-mobile.png) | 同上。 |
| 版本存檔失敗 | 未留本輪改前圖 | [桌面](uat/evidence/A-UI-15-retry-desktop.png)／[手機](uat/evidence/A-UI-15-retry-mobile.png) | 保留未存好、騰出空間與重試的訊息；按鈕統一為「再存一次」。 |

部署版 `npm run build` 通過；`npx playwright test -c playwright.deploy.config.ts` 在桌面、手機各走九個工作檯，檢查頁面圖片及 CSS 背景載入，2/2 通過。UAT-38、UAT-67、UAT-77 在兩種尺寸共 6/6 通過；這是定向測試，不是完整 UAT。

剩餘：逐頁及互動狀態的文案人工審核、改寫與真正前後截圖；包含動態角色回覆、錯誤、知識火花及彈窗。原始候選清單還沒有逐項標註問題。其他畫面仍需驗證主按鈕、44px 點擊區與明確關閉操作；完整 UAT 和 selftest 本輪未跑。不可設為 ready。
