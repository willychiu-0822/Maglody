# 文案核對（2026-11-11 20:29，未完成）

哼唱示範展開工具箱及兩則知識說明後，和弦提示原本對示範說「你唱」，且偏好分數造成 105% 覆蓋率。現在用不假設來源的說法，顯示實際覆蓋比例；和弦選擇規則不變。位置及原文見 [文案盤點](COPY-AUDIT.md)。

| 畫面 | 修改前 | 修改後 | 人工核對 |
| --- | --- | --- | --- |
| 示範後的知識說明，桌面 1280×800 | [桌面](uat/evidence/copy-2029/hum-knowledge-desktop.png) | [桌面](uat/evidence/copy-2029/hum-knowledge-after-desktop.png) | 已檢視；顯示比例不再超過 100%。 |
| 示範後的知識說明，手機 390×844 | [手機](uat/evidence/copy-2029/hum-knowledge-mobile.png) | [手機](uat/evidence/copy-2029/hum-knowledge-after-mobile.png) | 已檢視；說明可讀。修改前長頁截圖中固定頁首位於中段，修改後已在拍攝前捲回頁首。 |

`node --import ./scripts/test-loader.mjs --test scripts/tests/pitch-copy.test.mjs` 先重現 105%，修正後通過；`npm run build` 通過；`npx playwright test -c playwright.deploy.config.ts` 桌面及手機共 4/4 通過，涵蓋指定 MIME 與九個工作檯及部分彈窗素材。

仍有示範被稱為「唱了多久」及「原始錄音」的文案；全站候選字串、互動狀態、各頁前後截圖和完整 UAT 尚未完成。此輪僅是局部驗證，`ready_for_user_test` 維持 false。
