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

## UI-07：跳著創作，也知道先補哪一點聲音（R2、R3，UAT-68）

- 從地圖直接去空白混音檯，便箋現在會先說「先留一小句副歌旋律，再來混音」，主按鈕可帶你去旋律檯。
- 總檢討如果還沒有和弦或旋律，先提醒留下一點聲音。只寫評語不會讓任務提早顯示完成；留下聲音後仍可先聽部分草稿，不必把整首做滿。
- 原本自由跳檯、作品前進條件與唯一主按鈕都保留。這是本輪探索找到並直接修正的任務文案缺口。
- 修後混音：[桌面](evidence/A-UI-07-mix-desktop.png)、[手機](evidence/A-UI-07-mix-mobile.png)；總檢討：[桌面](evidence/A-UI-07-review-desktop.png)、[手機](evidence/A-UI-07-review-mobile.png)。修前：[桌面混音](evidence/A-UI-07-before-mix-desktop.png)、[手機總檢討](evidence/A-UI-07-before-review-mobile.png)。
- UAT-68 兩尺寸先紅→綠；與 UAT-16/36/54/67 共10/10，已看手機混音、桌面總檢討截圖。擴為68個旅程、136次完整驗收，部分通過仍不放行。

## 第 6 輪最終驗收

本輪四筆可見改動均獨立本機提交：UI-04 `d1a6620`、UI-05 `f060750`、UI-06 `f8bf964`、UI-07 `f562252`；UAT-16 測試定位修正為 `abc84a0`，未弱化儲存復原斷言。

最終完整 run `2026-11-10T01-02-26-844Z`：**136/136 通過，0 fail／0 blocked，ready_for_user_test=true**。136 個逐案非空截圖皆已核對，沒有拼接多輪通過。build 通過、最終手機 selftest 50/50，六份核可來源與六份 WebP 雜湊均一致。首次132/134的結果與trace保留。

全綠後再從長歌名、深色地圖、自由跳檯、捲動後捕捉、重整後找回自己的三行歌詞做探索，手機／桌面均通過，無新增缺失、無 JS 錯誤與水平溢出。證據：[桌面紙頁](evidence/A-UI-round6-explore-desktop.png)、[手機紙頁](evidence/A-UI-round6-explore-mobile.png)、[桌面地圖](evidence/A-UI-round6-explore-map-desktop.png)、[手機地圖](evidence/A-UI-round6-explore-map-mobile.png)。已看手機紙頁與桌面地圖。

自己啟動的4101已用保留的session控制關閉，4102由E2E自動關閉，兩埠均確認停止。無push、remote修改、部署、tunnel或其他運維process操作。放行範圍為本機Chrome與本機教練；實體手機、Safari、真LLM與主觀音樂品質仍待使用者親自驗收。


## UI-08：和夥伴在工作室裡交換紙箋（第 7 輪，R1–R5、UAT-69）

- 打開任何一位夥伴的聊天，頂部就是核可的木窗工作室與那位樂手，姓名和專長寫在一張小紙片上。沿用既有六張 WebP，不另加大圖。
- 回答不再只蓋「曲／詞／錄」單字章：每則紙箋都有說話者的核可 idle-v2 小像與完整姓名。換人聊時，前一位說的話仍保留自己的名字和人物；等待回覆也顯示正確樂手。
- 對話變長時只捲動中間的紙箋，輸入與「送出」留在下方；送出仍是唯一主動作。從聊天「記一下」回來，未送出的問題和原對話都還在。
- 實際畫面：[桌面](evidence/A-UI-08-chat-desktop.png)、[手機](evidence/A-UI-08-chat-mobile.png)；夜間紙面：[桌面](evidence/A-UI-08-dark-desktop.png)、[手機](evidence/A-UI-08-dark-mobile.png)。改前：[桌面](evidence/A-UI-08-before-desktop.png)、[手機](evidence/A-UI-08-before-mobile.png)。已人工檢視桌面、手機及手機夜間截圖，人物、姓名、紙墨與輸入位置清楚。
- UAT-69 兩尺寸先因缺少說話者姓名失敗，再通過；UAT-02/30/37/53/59/61/62/69 共 **16/16**，build 通過。舊單字章斷言升級成「完整姓名＋核可圖路徑」，角色脈絡、拒絕代寫、等待隔離等原斷言保留。這是部分驗收，ready=false，待本輪完整矩陣。


## UI-09：手機轉橫向，仍能讀完夥伴的話（R1/R2/R3/R5、UAT-70）

- 手機轉橫向或視窗變矮時，房間改成一張較矮的工作室小景，核可樂手和名字仍在；留更多位置給回覆紙箋，捲動能讀到最後。直向與桌面原有的大場景保留。
- 對話區至少留下數行閱讀空間；輸入、送出、隨手記和關閉仍可直接操作。非常矮的畫面也允許整張紙捲動，避免內容被裁掉。
- 修後橫向：[桌面瀏覽器](evidence/A-UI-09-landscape-desktop.png)、[手機瀏覽器](evidence/A-UI-09-landscape-mobile.png)。修前：[桌面](evidence/A-UI-09-before-desktop.png)、[手機](evidence/A-UI-09-before-mobile.png)。已人工看兩尺寸截圖，人物、紙墨、回覆與輸入清楚。
- 這是獨立審查發現的Important缺失，已自己用UAT-70重現：844×390的閱讀內容原為0px；修後兩project皆通過844×390、390×400、390×600，對話內容至少96px，實際送第二題、捕捉後返回。UAT-31/37/62/69/70定向 **10/10**，build通過；再截圖驗證UAT-70為2/2。完整矩陣擴為140次，尚未完成前ready=false。


## 第7輪最終驗收（2026-11-10 09:29）

兩筆可見改動已獨立本機提交：UI-08 `6c56432`、UI-09 `dc26518`；selftest身份及錄音等待修正為 `a3c0022`。最後完整run `2026-11-10T01-21-10-291Z`：**140/140通過，0 fail／0 blocked，ready_for_user_test=true**；逐案140份非空截圖已核對。不是把多輪通過拼成全綠；138次完整通過後發現的橫向缺失，另加UAT-70重現、修復，再完整重跑140次。

最後明確build通過，手機selftest **50/50**。selftest首次44/50、第二次49/50已如實記錄在清單與結果；只更新舊圓章定位與等待實際收音／分析，不改產品或降低要求。六份核可來源與壓縮圖雜湊均相符，審查無未解重大缺失。

全綠後再用自己的句子做深色聊天、捕捉返回、未送出草稿、三行歌詞重整探索，桌面／手機均通過；手機另驗390×600矮畫面。證據：[桌面](evidence/A-UI-round7-explore-desktop.png)、[手機](evidence/A-UI-round7-explore-mobile.png)，已看手機截圖。4101由保留session關閉、4102由E2E關閉，兩埠已確認停止；無push、remote修改、部署或tunnel操作。

## UI-10：手記裡真的有自己的詞與聲音（第8輪，R1/R2/R3、UAT-71）

- 每一檯的工作室便箋下方多了「翻開素材手記」。平常收起，想看時才翻開，不增加主要按鈕。
- 自己留的一句靈感、主副歌和弦、旋律開頭音名和詞句，分別放在赭黃、淡綠、淡藍與橫線紙上。改詞就跟著更新，重整還找得到；空白作品不放入假範例，只有哼唱時先收哼唱種子。
- 畫面：[桌面](evidence/A-UI-10-journal-desktop.png)、[手機](evidence/A-UI-10-journal-mobile.png)；夜間紙面：[桌面](evidence/A-UI-10-dark-desktop.png)、[手機](evidence/A-UI-10-dark-mobile.png)。改前：[桌面](evidence/A-UI-10-before-desktop.png)、[手機](evidence/A-UI-10-before-mobile.png)。已人工看手機素材紙片與桌面夜間，中文與自己的素材清楚。
- UAT-71先因缺少素材手記兩尺寸失敗，再與UAT-24/28/33/65/67/68共 **14/14通過**，自動build通過；保留唯一主動作、自由跳檯、小火花與重整保存。這是部分驗收，ready=false，完整矩陣仍待本輪最後重跑。

## UI-11：想到什麼，先留在水彩本子裡（第8輪，R1/R2/R5、UAT-72）

- 「記一下」現在打開一張有孔洞、墨線頁邊、淡綠水彩與手寫標題的筆記紙。先看到「先把這一點留下來」，不用猜要寫多少。
- 保存按鈕上方會寫「收好後，回到『歌詞』繼續」這類位置提示，九個工作檯都跟著目前位置變化。文字、說、哼、拍與原本的保存方式保留，仍只有一顆主要保存按鈕。
- 翻本子時有清楚的「靈感本子」標題，自己的碎片變成一張張淡彩紙片；更多用法照樣收起。空本子的提示也修正為右上角入口。
- 記下念頭：[桌面](evidence/A-UI-11-capture-desktop.png)、[手機](evidence/A-UI-11-capture-mobile.png)；翻本子：[桌面](evidence/A-UI-11-library-desktop.png)、[手機](evidence/A-UI-11-library-mobile.png)。改前：[桌面](evidence/A-UI-11-before-desktop.png)、[手機](evidence/A-UI-11-before-mobile.png)。已人工檢視手機捕捉、桌面本子，紙墨、返回位置與唯一保存按鈕清楚。
- UAT-72先因缺少紙頁標題兩尺寸失敗，再實作；首輪定向20/22因Chrome環境中斷失敗，保留trace與診斷於failures.md，未放寬斷言。隔離暫時桌面session bus後，用正常指令重跑相關UAT-13/14/15/16/19/31/37/49/60/69/72 **22/22通過**；自動build通過，手機selftest **50/50**。獨立唯讀審查無未解重大或細項；矮視窗與長內容探索通過。完整144次仍待最後重跑，ready=false。

## 第8輪最終驗收

可見改造均獨立本機提交：UI-10 `16594bb`、UI-11 `949650a`。Chrome環境隔離 `63a4a89` 與UAT-49非同步故障注入修正 `0f1247b` 各自獨立；沒有修改產品錄音語意、放寬timeout或減少斷言。

最後完整run `2026-11-10T02-11-21-830Z`：**144/144通過，0 fail／0 blocked，ready_for_user_test=true**，144份非空逐案截圖均已核對。前兩次完整143/144、141/144及trace如實保留，不用部分通過代替完整重跑。UAT-STATUS.json包含R1–R6、新手P0→P2與本輪兩項驗收。

最後明確build通過，手機selftest **50/50**；六份核可來源與public圖雜湊一致，首屏房間＋作曲家仍113,766bytes。獨立唯讀審查沒有Critical/Important/Minor；也驗過只有副歌、只有哼唱、5000字靈感、16000字不斷行詞與320×360矮畫面。

全綠後再用自己寫的長句、三行詞做深色素材手記、390×600捕捉、聊天草稿返回與重整探索，兩尺寸均通過、0JS錯誤、無水平溢出。證據：[桌面手記](evidence/A-UI-round8-explore-desktop.png)、[手機手記](evidence/A-UI-round8-explore-mobile.png)、[桌面捕捉](evidence/A-UI-round8-capture-desktop.png)、[手機矮視窗捕捉](evidence/A-UI-round8-capture-mobile.png)，已人工看手機手記與桌面夜間捕捉。

4101用原session控制關閉、4102由E2E自動關閉，兩埠均確認closed。保持本機分支與工作目錄，無push、remote更動、部署或tunnel操作。放行範圍為本機Chrome；實體手機／Safari、實際麥克風品質與真LLM仍未驗證。

## UI-12：看得見的「好」，自己決定何時收起（第9輪，UAT-73）

- 工作室、聊天和隨手記按背景不會突然關閉；右上「X」與鍵盤Escape可明確離開。
- 保存、拼貼與儲存失敗提示都附「好」按鈕，讀完再收起。提示放在頁首，手機不用往下找；重新打開隨手記也可在紙頁裡按好，沒有被彈窗擋住的按鈕。
- 截圖：[桌面](evidence/A-UI-12-notice-desktop.png)、[手機](evidence/A-UI-12-notice-mobile.png)。已實際檢視兩尺寸，發現初版提示排在頁尾後改到頁首並重截；通知不遮擋輸入或主動作。
- 相關UAT-16/49/60/69/70/72/73共14/14通過；調整位置後UAT-73兩尺寸2/2通過，自動build通過。完整矩陣待本輪結束重跑，ready=false。

## UI-13：按鈕有墨線、手指按得準（第9輪，UAT-74／UAT-38）

- 全站次要動作從純文字外觀改成低彩度墨線按鈕。包含角色切換、工具箱、主副歌切換、旋律格與混音滑桿，點擊區都至少44×44px，按住會變暗並出現內墨線。
- 主動作保留較大的淡水彩按鈕；地圖新增「回到目前工作檯，繼續創作」，本子沒挑紙片時有「記下一點新靈感」，挑紙片後讓位給原有主動作。
- 放大音符格後，格子內可左右捲動，補上說明並可鍵盤進入。手機角色腳邊調回場景底線；聊天的X固定排在右上方。
- 作品儲存失敗改為真正的「重試保存」按鈕，不再要求先改一個字。UAT-38實際恢復儲存、按重試、重整驗證歌曲保留。
- 人工逐頁檢視下列18張與四種彈窗兩尺寸：人物在核可場景、字可讀、九檯恰一主動作、次要層次明確、沒有整頁水平溢出。旋律格內捲動保留完整32格。

| 畫面 | 桌面截圖 | 手機截圖 |
|---|---|---|
| 哼唱 | [桌面](evidence/A-UI-13-page-1-desktop.png) | [手機](evidence/A-UI-13-page-1-mobile.png) |
| 構想 | [桌面](evidence/A-UI-13-page-2-desktop.png) | [手機](evidence/A-UI-13-page-2-mobile.png) |
| 和聲 | [桌面](evidence/A-UI-13-page-3-desktop.png) | [手機](evidence/A-UI-13-page-3-mobile.png) |
| 旋律 | [桌面](evidence/A-UI-13-page-4-desktop.png) | [手機](evidence/A-UI-13-page-4-mobile.png) |
| 歌詞 | [桌面](evidence/A-UI-13-page-5-desktop.png) | [手機](evidence/A-UI-13-page-5-mobile.png) |
| 編曲 | [桌面](evidence/A-UI-13-page-6-desktop.png) | [手機](evidence/A-UI-13-page-6-mobile.png) |
| 錄音準備 | [桌面](evidence/A-UI-13-page-7-desktop.png) | [手機](evidence/A-UI-13-page-7-mobile.png) |
| 混音觀念 | [桌面](evidence/A-UI-13-page-8-desktop.png) | [手機](evidence/A-UI-13-page-8-mobile.png) |
| 總檢討 | [桌面](evidence/A-UI-13-page-9-desktop.png) | [手機](evidence/A-UI-13-page-9-mobile.png) |
| 地圖 | [桌面](evidence/A-UI-13-map-desktop.png) | [手機](evidence/A-UI-13-map-mobile.png) |
| 夥伴聊天 | [桌面](evidence/A-UI-13-chat-desktop.png) | [手機](evidence/A-UI-13-chat-mobile.png) |
| 隨手記 | [桌面](evidence/A-UI-13-capture-desktop.png) | [手機](evidence/A-UI-13-capture-mobile.png) |
| 靈感本子 | [桌面](evidence/A-UI-13-library-desktop.png) | [手機](evidence/A-UI-13-library-mobile.png) |

相關UAT-24/38/70/73/74共10/10通過，加入格子左右捲動說明後UAT-74兩尺寸2/2通過，自動build通過。手機selftest首次49/50（新增「好」被舊多餘按鈕檢查攔下）；補上實際按好確認及消失斷言，不放寬原檢查，重跑51/51。初次記錄保留在A-round9-selftest-initial.txt。最後完整148次仍待重跑，ready=false。

## UI-14：記完靈感，眼前就能按「好」（第9輪，UAT-75）

- 寫歌寫到頁尾時，保存提示會停在固定頁首下面，不用回頭找。按「好」就收起，自己的長詞與工具箱維持原狀。彈窗裡的提示仍在紙頁內，可以直接確認。
- 截圖：[桌面](evidence/A-UI-14-confirm-desktop.png)、[手機](evidence/A-UI-14-confirm-mobile.png)，已實際檢視：提示與確認鈕完整在視窗內，頁首捕捉入口仍可用。
- 這是完整148/148之後的新手長頁探索發現；新增UAT-75雙尺寸紅→綠，與UAT-38/60/69/70/72/73合計14/14通過，沒有放寬視窗幾何、保存或唯一主動作斷言。最後須完整150次重跑。

## 第9輪最終驗收

三項可見改造各自本機提交：UI-12 `f3d2b03`、UI-13 `280def3`、UI-14 `39d60d5`。九個工作檯與地圖、聊天、隨手記、本子均已在桌面和手機逐頁看圖；沒有新增外部字體或圖片負擔。

最後完整run `2026-11-10T02-36-55-295Z`：**150/150通過，0 fail／0 blocked，ready_for_user_test=true**。所有150份同輪截圖與R1–R6、新手P0→P2及新增確認操作皆核對通過。先前148/148與UAT-75紅燈完整保留，沒有合併不同輪pass。

最後build通過、手機selftest **51/51**。全綠後夜間探索：[320×568](evidence/A-round9-explore-320x568.png)、[390×400](evidence/A-round9-explore-390x400.png)、[844×390](evidence/A-round9-explore-844x390.png)，聊天提問、500字靈感保存返回、按好確認均成功；0JS錯誤，無水平溢出。已人工看最窄手機與橫向圖。

驗收範圍是本機Chrome；真機/Safari、真實麥克風品質及真LLM仍未驗。只本機commit，無push、部署或tunnel操作。
