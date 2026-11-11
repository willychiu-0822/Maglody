# 文案核對（2026-11-11 23:34，局部）

主歌與副歌使用相同和弦時，回饋從「這可以，但副歌就要靠旋律變高、編曲變滿來拉開差距。或試著讓副歌從 IV 開始。」改成「這樣也很好。如果想讓副歌換個感覺，可以試試不同的旋律或樂器。」保留選擇空間，不把副歌的寫法說成規則。

| 畫面 | 修改前 | 修改後 | 自評 |
| --- | --- | --- | --- |
| 和聲回饋，桌面 1280×800 | [前](uat/evidence/A-copy57-harmony-before-desktop.png) | [後](uat/evidence/A-copy57-harmony-after-desktop.png) | 可讀，建議不再強迫改變副歌。 |
| 和聲回饋，手機 390×844 | [前](uat/evidence/A-copy57-harmony-before-mobile.png) | [後](uat/evidence/A-copy57-harmony-after-mobile.png) | 換行正常，整句可見。 |

本次以部署伺服器走完主歌、副歌相同和弦的流程，展開回饋並核對兩種尺寸；`npm run build` 通過，`SELFTEST_URL=http://127.0.0.1:4109/ npm run selftest` 53/53 通過。部署資產測試在修改前通過 4/4；本次變更只涉及文字。

仍待處理：同頁「只有一種和弦，聽不出走向」和「沒有 IV 或 V」仍可能過於評判或艱澀；其他頁面、動態回覆、錯誤和慶祝狀態尚未全面核對。這是局部驗證，不代表全站文案重寫或完整 UAT 已完成。
