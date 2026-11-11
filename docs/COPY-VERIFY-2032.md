# 文案核對（2026-11-11 20:32，局部）

示範、音檔和麥克風錄音的播放按鈕依來源命名；兩則音高說明不再假設玩家唱過。原文與問題見 [文案盤點](COPY-AUDIT.md)。

| 畫面 | 修改前 | 修改後 | 核對 |
| --- | --- | --- | --- |
| 哼唱示範與知識說明，桌面 1280×800 | [桌面](uat/evidence/copy-2029/hum-knowledge-after-desktop.png) | [桌面](uat/evidence/copy-2032/hum-desktop.png) | 已檢視；按鈕顯示「再聽示範」。長頁截圖的固定頁首位於中段，並非實際捲動時的位置。 |
| 哼唱示範與知識說明，手機 390×844 | [手機](uat/evidence/copy-2029/hum-knowledge-after-mobile.png) | [手機](uat/evidence/copy-2032/hum-mobile.png) | 已檢視；說明可讀，固定頁首在長頁截圖中遮住一部分內容。 |

UAT-50 桌面及手機共 2/2 通過；`playwright.deploy.config.ts` 共 4/4 通過，檢查指定 MIME 與九個工作檯及部分彈窗素材。測試開始時的 build 成功。上傳音檔及麥克風來源的新按鈕文案尚未個別截圖；其他頁面及互動狀態尚未完成前後核對，全站文案、完整 UAT 和 ready 狀態均未完成。
