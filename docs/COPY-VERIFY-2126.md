# 文案核對（2026-11-11 21:26，局部）

版本還原頁的摘要是在預覽舊版；將「一起看看這首歌現在的樣子。」改為「一起看看這一版的樣子。」避免誤認目前桌上的內容。存版和新歌頁保留原句。

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 還原版本，桌面 1280×800 | [前](uat/evidence/A-copy55-restore-before-desktop.png) | [後](uat/evidence/A-copy55-restore-after-desktop.png) | 摘要對象清楚；按鈕可見。 |
| 還原版本，手機 390×844 | [前](uat/evidence/A-copy55-restore-before-mobile.png) | [後](uat/evidence/A-copy55-restore-after-mobile.png) | 文字與兩個選擇可見。 |

用 Chrome 實際存版並開啟還原對話框，兩種尺寸均確認摘要文字；修改前的斷言如預期失敗，修改後兩種尺寸通過。`npm run build` 通過。這不等於完整 UAT，也不是全站逐頁核對。畫面上「再聽一次那時的心情」可能暗示能播放，仍需檢視；其他動態回覆、錯誤及慶祝狀態尚待全面審閱。
