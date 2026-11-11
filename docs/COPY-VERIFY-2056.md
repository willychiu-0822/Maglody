# 文案核對（2026-11-11 20:56，局部）

靈感本子在採用或移除時遇到瀏覽器空間不足，改用夥伴提醒的口吻；仍交代歌曲或紙片沒有改動，並指出重試方式。

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 採用失敗，桌面 1280×800 | [前](uat/evidence/A-copy52-adopt-retry-before-desktop.png) | [後](uat/evidence/A-copy52-adopt-retry-after-desktop.png) | 語氣較自然，重試按鈕可見；「這次使用」仍略抽象。 |
| 採用失敗，手機 390×844 | [前](uat/evidence/A-copy52-adopt-retry-before-mobile.png) | [後](uat/evidence/A-copy52-adopt-retry-after-mobile.png) | 提示可讀；取消按鈕在畫面下方，需捲動查看。 |
| 移除失敗，桌面 1280×800 | [前](uat/evidence/A-copy52-remove-retry-before-desktop.png) | [後](uat/evidence/A-copy52-remove-retry-after-desktop.png) | 保留紙片仍在的資訊，重試按鈕可見。 |
| 移除失敗，手機 390×844 | [前](uat/evidence/A-copy52-remove-retry-before-mobile.png) | [後](uat/evidence/A-copy52-remove-retry-after-mobile.png) | 提示和重試按鈕可讀。 |

修改前後各執行 UAT-79／80，手機及桌面均通過（各 4/4）；測試確認儲存失敗時原資料保留，恢復儲存後可重試。本次不是全站逐頁核對：直接採用失敗提示、動態回覆、其他錯誤及慶祝狀態仍待檢視。完整 UAT 尚未完成。

同一份建置也通過 `npm run selftest`（53/53），以及部署伺服器素材測試（手機及桌面共 4/4）；後者涵蓋九個工作檯與部分對話，並非所有互動狀態。Playwright 啟動時的 build 通過。
