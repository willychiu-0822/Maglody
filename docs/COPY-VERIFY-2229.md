# 文案核對（2026-11-11 22:29，局部）

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 還原版本，桌面 1280×800 | [前](uat/evidence/A-copy55-restore-after-desktop.png) | [後](uat/evidence/A-copy56-restore-desktop.png) | 不再暗示此頁可播放，確認與取消按鈕清楚。 |
| 還原版本，手機 390×844 | [前](uat/evidence/A-copy55-restore-after-mobile.png) | [後](uat/evidence/A-copy56-restore-mobile.png) | 文字與確認、取消按鈕均可見。 |

開場從「再聽一次那時的心情，決定要不要回去。」改成「翻翻那時留下的樣子，再決定要不要回去。」因為這個確認頁沒有播放功能。

`npm run build` 通過；以 deploy-serve 跑 UAT-76 的桌面與手機流程並斷言新文案，2/2 通過；部署資產測試 4/4 通過。此輪只檢視還原頁，並非全站逐頁核對；動態回覆、錯誤與慶祝狀態及文案盤點中的候選字串仍待審閱。部署資產測試覆蓋九個工作檯及部分對話，沒有涵蓋每個互動狀態。完整 UAT 未重跑，不能據此判定可交付使用者測試。
