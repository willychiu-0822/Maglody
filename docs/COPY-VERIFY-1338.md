# 文案核對（2026-11-11 13:38，部分完成）

本批調整九個工作檯的知識火花，將判定聽感或給玩家評語的句子改成可試的提議；展開入口改叫「多看看」。哼唱火花同時適用示範和自己的錄音，不再把示範說成玩家唱的。

| 畫面 | 桌面 1280×800 | 手機 390×844 | 自評及剩餘問題 |
| --- | --- | --- | --- |
| 哼唱示範，火花展開 | [改前](uat/evidence/copy-spark-1338/before/desktop.png)／[改後](uat/evidence/copy-spark-1338/after/desktop.png) | [改前](uat/evidence/copy-spark-1338/before/mobile.png)／[改後](uat/evidence/copy-spark-1338/after/mobile.png) | 雙尺寸已人工查看，火花沒有截斷；角色回饋仍在手機截斷，需另查展開後的閱讀體驗。 |

其餘八個工作檯的火花雖已改寫，尚未逐一觸發、截圖及人工審閱；這不是全站前後對照。彈窗、錯誤、慶祝、真實模型輸出與其他互動狀態仍需完整盤點。不能因此宣稱文案重寫或 UAT 已完成。

本輪 build 通過；deploy-serve 的 MIME 與九個工作檯圖片、背景檢查兩種尺寸共 4/4 通過；UAT-33、UAT-58 雙尺寸共 4/4 通過。這些定向結果不能取代完整 UAT。

另以 4101 的本機 preview 執行 `npm run selftest`，53/53 通過。
