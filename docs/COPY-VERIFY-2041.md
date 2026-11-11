# 文案核對（2026-11-11 20:41，局部）

空白歌曲的錄音暖嗓原本把預設音稱作「你旋律裡的最低、中間、最高音」。現在依旋律、哼唱音域或預設音分別說明；空白歌曲顯示「先拿這幾個音暖暖嗓」。

| 畫面 | 修改前 | 修改後 | 核對 |
| --- | --- | --- | --- |
| 錄音準備工具箱，桌面 1280×800 | [修改前](uat/evidence/copy-recording-desktop-before.png) | [修改後](uat/evidence/copy-recording-desktop-after.png) | 已檢視修改後畫面。 |
| 錄音準備工具箱，手機 390×844 | [修改前](uat/evidence/copy-recording-mobile-before.png) | [修改後](uat/evidence/copy-recording-mobile-after.png) | 已檢視修改後畫面；修改前截圖未捲到完整文案，不能作完整視覺比較。 |

`npm run build` 通過；部署伺服器素材測試雙尺寸 4/4 通過；空白歌曲文案測試雙尺寸 2/2 通過。其他來源狀態仍需人工截圖檢查，全站文案、逐頁前後截圖及完整 UAT 仍未完成，不能視為已放行。

`npm run selftest` 初次因 4101 沒有啟動而連線失敗；啟動本機預覽後重跑，53/53 通過。測試後已關閉本輪啟動的預覽伺服器。
