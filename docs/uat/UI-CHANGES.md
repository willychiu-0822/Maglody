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

## UI-03：隨時記住靈感，知識像一張可翻開的小紙片（R2、R5、R6）

- 固定在頁首的「記一下」便條補上「文字 · 哼唱」，新手不用先點開猜用途；打開選單或聊天時仍能記，保存後回到原工作。
- 動手後才出現「小火花」淡綠紙片，先看一句短觀察；想知道才按紙片展開。右下角的加／減號表明可開合，深入說明仍另外收起。
- 情緒材料的推薦小字加大，仍只凸顯一個大主動作。
- 小火花收合：[桌面](evidence/A-UI-03-desktop.png)、[手機](evidence/A-UI-03-mobile.png)；展開：[桌面](evidence/A-UI-03-open-desktop.png)、[手機](evidence/A-UI-03-open-mobile.png)；記下念頭：[桌面](evidence/A-UI-03-capture-desktop.png)、[手機](evidence/A-UI-03-capture-mobile.png)。
- 驗證：UAT-13/32/33/37/56/58 兩尺寸 12/12，包含九檯捕捉、聊天與選單裡捕捉、保存返回原處、知識預設收合、額外觀察一次一則。

## 最終驗收

完整 run `2026-11-10T00-35-47-150Z`：65 個旅程 × 兩尺寸，**130/130 通過**，0 fail／0 blocked；130 份非空案例截圖已逐一核對。build 通過、手機 selftest 50/50。R1–R6 與新手 P0→P2 均通過本機 Chrome 範圍，UAT-STATUS.json 已設 ready_for_user_test=true。

全綠後再次以自己的長歌名／三行歌詞探索深色模式、開工具箱、捲動後記靈感與返回原稿：兩尺寸均通過，無新缺失、無水平溢出或 JS 錯誤。證據：[桌面](evidence/A-UI-explore-dark-desktop.png)、[手機](evidence/A-UI-explore-dark-mobile.png)。實體手機、Safari 與真 LLM 不在本次本機驗證範圍。

## UI-04：打開工作室，就知道可以去哪裡找夥伴（第 6 輪，R1–R4）

- 原本一長串工作檯改成「一首歌的探險地圖」：發想是淡赭色、成形是淡綠色、打磨是淡藍色。桌面三欄並排，手機改成一區一區往下看。
- 每個工作檯都有核可樂手的縮圖與陪伴者名字；現在的地方蓋上「你在這裡」。其他檯都能直接去，不用解鎖或按順序過關。
- 自己寫的詞會留著，從地圖記靈感後也會回到地圖；Demo 版本等工具仍放在「更多」裡。
- 實際畫面：[桌面](evidence/A-UI-04-map-desktop.png)、[手機](evidence/A-UI-04-map-mobile.png)。手機地圖可往下捲動，查看打磨區與我的歌。
- 驗證：新增 UAT-66 兩尺寸先失敗（缺少地圖）再通過；UAT-01/24/31/37/66 共 10/10。人工檢視兩張截圖，角色、中文、當前位置皆清楚。這是部分重跑，ready=false，待本輪完整矩陣。

## UI-05：每次只陪你做一件小事（第 6 輪，R2、R3、R5、R6）

- 工作室場景下方多了一張用紙膠帶貼著的任務便箋。夥伴會把此刻最先需要的素材寫下來，譬如「選一個情緒」→「留下一句話」，不用猜下一步。
- 素材齊了，便箋改用淡綠墨字提示可以去下一檯；如果刪掉句子，就回到缺項。想跳檯仍可自由跳，來到歌詞檯就是作詞人陪你。
- 下方四張小材料紙片記住已留下的靈感、和弦、旋律、詞。便箋沒有新增按鈕，唯一的大按鈕與隨手記入口照常可用，小火花仍先收起。
- 首頁：[桌面](evidence/A-UI-05-desktop.png)、[手機](evidence/A-UI-05-mobile.png)；完成構想後：[桌面](evidence/A-UI-05-ready-desktop.png)、[手機](evidence/A-UI-05-ready-mobile.png)。
- 驗證：UAT-67 兩尺寸先失敗再通過；與 UAT-24/33/56/58/65 共 12/12。調整手機小字、截圖位置後，UAT-65/66/67 再驗 6/6。已人工看兩尺寸首頁與構想便箋，文字與人物清楚；完整放行以本輪完整矩陣為準。

## UI-06：淡彩保留，定位和完成提示更好讀（R1、UAT-66/67）

獨立審查發現「你在這裡」、當前夥伴小字和任務完成提示的文字偏淡。已用實際瀏覽器量測重現 3.12／3.83／3.36:1，再加深小字：地圖當前文字淺色 10.14:1、深色 9.33:1；任務完成文字淺色 6.19:1、深色 8.14:1（相對紙底），皆高於 4.5:1。水彩底與墨線保留，操作不變。

- 地圖：[桌面](evidence/A-UI-06-light-map-desktop.png)、[手機](evidence/A-UI-06-light-map-mobile.png)。
- 完成任務：[桌面](evidence/A-UI-06-light-ready-desktop.png)、[手機](evidence/A-UI-06-light-ready-mobile.png)。
- 夜間紙面：[桌面](evidence/A-UI-06-dark-ready-desktop.png)、[手機](evidence/A-UI-06-dark-ready-mobile.png)。

已看手機地圖、桌面夜間紙面截圖；獨立 reviewer 已確認唯一 Important 項解決，沒有其他重大發現。實體裝置與真 LLM 尚待使用者測試。

UI-06 相關 UAT-48/66/67 兩尺寸 6/6 通過，build 通過。部分重跑仍 ready=false，接續本輪完整 134 次驗收。
