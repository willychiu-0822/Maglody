# 文案核對（2026-11-11 06:20，未完成）

本輪只調整哼唱結果的音域標籤：「舒服的音域」改為「這段的音域」，不再把偵測到的音高範圍當成玩家的舒適音域。

| 畫面 | 改前 | 改後 | 核對 |
| --- | --- | --- | --- |
| 哼唱結果，桌面 1280×800 | [改前](uat/evidence/copy-hum-round/before-desktop.png) | [改後](uat/evidence/copy-range-0620/desktop.png) | 已查看；標籤在畫面下緣，音高數值被裁切，需重新取圖。 |
| 哼唱結果，手機 390×844 | [改前](uat/evidence/copy-hum-round/before-mobile.png) | [改後](uat/evidence/copy-range-0620/mobile.png) | 已查看；標籤和音高可讀。 |

其餘八個工作檯、各種對話、錯誤與彈窗狀態仍需逐一改寫、截圖及人工審閱；目前不能宣稱全站文案完成。舊的九頁初始畫面對照與未審項目見 [COPY-VERIFY-1758](COPY-VERIFY-1758.md)。

本輪 `npm run build` 通過；部署伺服器九個工作檯的圖片與背景載入測試桌面、手機各通過；UAT-55 拒麥後示範流程桌面、手機各通過。這不是完整 UAT，不能據此設為可交付使用者測試。
