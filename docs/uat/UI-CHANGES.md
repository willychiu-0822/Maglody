# 看得到的工作室改造

2026-11-10，第 5 輪。以下截圖來自本機 Chrome：桌面 1280×800、手機 390×844。每筆都可直接打開圖片對照；沒有更動公開網址或 tunnel。

## UI-01：每一檯都像寫在同一本創作手記裡（R1、R2）

- 原本細窄的表單改成有紙邊、細墨線與淡彩的創作紙頁，九個工作檯共用；聊天、工作室選單、靈感本子也使用同一組紙色。
- 標題與主動作換成真正隨程式附上的「芫荽」手寫字；離線也能看見，不必自行裝字體。文字仍清楚，唯一的大按鈕保留。
- 情緒材料帶有不同的柔和水彩色，推薦項目仍只有一個。
- 首頁：[桌面](evidence/A-UI-01-desktop.png)、[手機](evidence/A-UI-01-mobile.png)；歌詞紙頁：[桌面](evidence/A-UI-01-detail-desktop.png)、[手機](evidence/A-UI-01-detail-mobile.png)。改前：[桌面](evidence/A-UI-before-desktop.png)、[手機](evidence/A-UI-before-mobile.png)。改前圖使用同一版 DOM 配前一個 commit 的樣式，停用進場動畫後拍攝。
- 驗證：build 通過；UAT-24/28/31 兩尺寸 6/6，包含九檯唯一主動作、版面寬度與鍵盤操作。完整放行以最新 UAT-STATUS.json 為準。

字體來源：Google Fonts 的 [Iansui](https://github.com/google/fonts/tree/main/ofl/iansui)，SIL OFL 授權隨附於 public/fonts/Iansui-OFL.txt。內附約 357KB 的介面文字 WOFF2 子集，font-display:swap，不阻擋操作；自訂歌詞超出子集時使用系統中文字體。Vite 產生版本化檔名並納入既有離線預存。

## UI-02：夥伴真的坐在工作室裡，歌也會慢慢長出來（R2、R3、R4）

- 房間從窄窄一條放大為工作室場景。桌面一邊看見樂手、一邊在手記創作；手機先看見夥伴，再接到紙頁。
- 使用 Willy 核可的五位 idle-v2 原畫與工作室底圖，人物不再小到像頭像。仍可直接點人物聊天，待機／聆聽／回應保留，偏好減少動畫時會靜止。
- 場景下方的「歌的手記」會顯示自己已留下的一句靈感、和弦、旋律與歌詞；可自由跳檯，不必過關。紙頁顯示目前的發想／成形／打磨篇與頁次，沒有新增行動按鈕。
- 首頁：[桌面](evidence/A-UI-02-desktop.png)、[手機](evidence/A-UI-02-mobile.png)；作詞人陪伴：[桌面](evidence/A-UI-02-detail-desktop.png)、[手機](evidence/A-UI-02-detail-mobile.png)。
- 驗證：UAT-24/25/29/30/57 兩尺寸 10/10；新增 UAT-65 兩尺寸 2/2，實際輸入自己的句子與歌詞，跳檯、重整後手記仍保留。核可首屏圖片仍共 113,766 bytes，小於 150KB，未增加圖檔請求。
