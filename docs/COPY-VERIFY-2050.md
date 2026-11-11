# 文案核對（2026-11-11，局部）

混音工具箱的四段聲部說明與兩項任務提示已重寫。主旋律是代替人聲的樂器，原文「清楚聽見每個字」不準確；現在改成舞台上的主角比喻。貝斯和鼓的說明不再把位置寫成固定規則。任務仍沿用原有判定，紅燈必須消失才能通過。

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 混音工具箱，桌面 1280×800 | [修改前](uat/evidence/A-mix-copy-before-desktop.png) | [修改後](uat/evidence/A-mix-copy-after-desktop.png) | 四段說明可讀；「即時回饋」仍偏系統腔，需與錄音頁一起統一。 |
| 混音工具箱，手機 390×844 | [修改前](uat/evidence/A-mix-copy-before-mobile.png) | [修改後](uat/evidence/A-mix-copy-after-mobile.png) | 四段說明可讀；尚未核對播放中和完成任務後的畫面。 |

以上只有混音空白作品、展開工具箱的狀態，並非逐頁完整審核。兩項任務提示沒有出現在這組截圖中，仍需在相關互動狀態下核對。其他頁面、角色動態回覆、所有錯誤及慶祝狀態，以及完整 UAT 都尚未完成。

本輪 `npm run build` 通過；`npx playwright test -c playwright.deploy.config.ts` 在桌面及手機共 4/4 通過，檢查指定 MIME，以及九個工作檯和部分對話的圖片、背景載入。這不是完整 UAT。
