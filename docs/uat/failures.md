# UAT 缺失與 A / B 交接

最新交付：第 5 輪，run `2026-11-10T00-35-47-150Z`；65 旅程 × 2 尺寸 **130/130 通過**，無 OPEN 項，ready_for_user_test=true。全站可見改造與雙尺寸對照見 [UI-CHANGES.md](UI-CHANGES.md)。下列失敗輪次保留作追溯。

## 完整執行逾時 — 第 3/4 輪追蹤

狀態：CLOSED；負責：session A；分類：驗收執行。第 4 輪完整 run `2026-11-10T00-11-06-427Z` 取得 126/126 一次通過，126 份非空截圖已核對；未增加 timeout、略過案例或合併跨輪 pass。工具持續收取輸出時此輪沒有事件空窗；不據此宣稱已找到底層停頓原因。全綠後另新增 UAT-64，仍須完整重跑擴充後矩陣。

第 4 輪第一次完整 run `2026-11-09T23-25-26-107Z`：122/124；本次 UAT-14/40 mobile 同時出現約 221.5 秒 trace 空窗，其他案例包含前輪四個失敗均通過，仍不能放行。舊結果和本次 traces 均保留，後於上述完整 run 一次通過。

第 3 輪完整 run：`2026-11-09T22-07-25-143Z`（台北 2026-11-10 06:28）。62 旅程 × 2 尺寸，120 pass／4 fail／0 blocked，ready=false。所有 124 個案例都有非空截圖。

| 案例 | 尺寸 | 本輪失敗 | trace 觀察 |
|---|---|---|---|
| UAT-12 | desktop | 已定位評語欄，fill 逾時 | 與 UAT-39 同時約 165.5 秒無事件 |
| UAT-39 | desktop | 已定位錄音準備選單，click 逾時 | 同上 |
| UAT-03 | mobile | 主流程截圖逾時（字型已載入） | 約 12.5 秒事件空窗 |
| UAT-62 | mobile | 角色等待切換的中途截圖逾時（字型已載入） | 約 12.4 秒事件空窗；該例尚未完成，不宣稱通過 |

證據在 [完整 results.json](evidence/2026-11-09T22-07-25-143Z/results.json)、[UAT-12 trace](evidence/2026-11-09T22-07-25-143Z/desktop/UAT-12-trace.zip)、[UAT-39 trace](evidence/2026-11-09T22-07-25-143Z/desktop/UAT-39-trace.zip)、[UAT-03 trace](evidence/2026-11-09T22-07-25-143Z/mobile/UAT-03-trace.zip)、[UAT-62 trace](evidence/2026-11-09T22-07-25-143Z/mobile/UAT-62-trace.zip)。

本輪多次完整重跑仍有不同案例的同時停頓；單 worker 和 Chrome 軟體繪圖亦未取得全綠，軟體繪圖設定已撤回。未增加 timeout、跳過案例或合併多輪 pass。此現象與執行環境停頓一致，但尚不能單憑 trace 排除其他原因。第 4 輪以同一設定完整重跑通過後關閉本項；保留所有原失敗，沒有只定向補過四案便設 ready=true。

## 第 4 輪探索修復

### UAT-63 — 新歌仍沿用舊對話與等待狀態

狀態：CLOSED；負責：session A；需求：R3、P0、A-N11。

重新開始同一檯的新歌，仍顯示「正側耳聽你說」，舊聊天和未送出問題保留；晚到的舊回覆也會進入新歌。UAT-63 雙尺寸先紅燈，再以歌曲世代隔離非同步回覆、清理通知 timer/歷史/等待狀態，並重建聊天輸入。保留靈感本子與 Demo 版本的原行為。UAT-22/59/61/62/63 雙尺寸 10/10 通過。

證據：[修前手機](evidence/A-UAT63-before-mobile.png)、[修後手機](evidence/A-UAT63-after-mobile.png)、[修後桌面](evidence/A-UAT63-after-desktop.png)。定向通過不代表完整矩陣放行。

## 第 3 輪探索修復

### UAT-52 — 畫面不更新時忘記收麥

狀態：CLOSED；負責：session A；需求：R5、錄音自動停止。

原上限只在動畫畫格比較 AudioContext 時間；畫面不繪圖時不會檢查，麥克風可能持續開啟。刻意停止頁面 requestAnimationFrame 後兩尺寸穩定失敗，再改為獨立 timer 與原音訊時間雙重檢查，停止時清除 timer 並保護舊錄音世代。UAT-52/43/29 兩尺寸合計 6/6 通過：所有 track 結束，至少 24 秒音訊實際保存；未加長 timeout。證據為當輪 UAT-52 與 A-UAT52-after-*.png。

### UAT-61 — 長對話輪替後場景失去回應

狀態：CLOSED；負責：session A；需求：R3。

連續 22 次提問後換歌詞檯，第 23 答雖在聊天裡，場景仍停在作詞人登場句。原因是用陣列長度標記入檯，但聊天會刪掉舊訊息。改用入檯時的訊息 ID 集合，仍依檯位、角色與 14 秒期限顯示。雙尺寸先紅→綠，並與延遲回覆案例 UAT-59 一起通過。

證據：[修前桌面](evidence/A-UAT61-before-desktop.png)、[修後手機](evidence/A-UAT61-after-mobile.png)、[修後桌面](evidence/A-UAT61-after-desktop.png)。修復 commit：3edcc13。

### UAT-62 — 作詞人誤用作曲家的等待狀態

狀態：CLOSED；負責：session A；需求：R3。

作曲家尚未回覆時，切作詞人也會顯示思考中並停用送出；換到歌詞檯亦顯示作詞人側耳聽。改為按 request ID、工作檯、角色追蹤等待狀態，完成時逐筆清除。測試明確扣住第一個 API 回覆，讓作詞人先回答，再釋放作曲家；正確等待身份與兩份歷史均通過手機／桌面驗證。

證據：[修前桌面](evidence/A-UAT62-before-desktop.png)、[修後手機](evidence/A-UAT62-after-mobile.png)、[修後桌面](evidence/A-UAT62-after-desktop.png)。修復 commit：d193412。

Session B，本機 Chrome；桌面 1280×800、手機 390×844。所有功能修復由 B 執行，視覺缺失由 A 處理。此文件的 OPEN 項目未解決前，ready_for_user_test 必須為 false。截圖均為實際瀏覽器，不是 mockup。

## UAT-24 — R2 空白工作檯缺少主要動作

狀態：CLOSED；負責：session A（codex/burn-a）；分類：UI。

第 2 輪：UAT-24 雙尺寸通過。空白構想可聽推薦情緒、和聲可放入推薦和弦、歌詞有聚焦空白稿紙的主要入口；後續 UAT-56 驗證自己寫詞。

現象：構想、和聲、歌詞在尚未填寫時，可見 `.primary-action` 數量皆為 0；其餘六檯是 1。兩種 viewport 都重現。現有情緒／和弦／文字輸入可以操作，主流程能完成，但初學者首屏缺少單一明確主要動作。

期望：依產品 R2「每畫面一個主要動作」，空白首屏也恰有一個明確的主要動作，既有自由創作與素材點選功能保留。測試維持 `count === 1`，不能改成 `<= 1` 來通過。

證據（2026-11-10 00:00 這輪）：[桌面構想](evidence/2026-11-09T15-58-20-631Z/desktop/UAT-24-構想.png)、[桌面和聲](evidence/2026-11-09T15-58-20-631Z/desktop/UAT-24-和聲.png)、[桌面歌詞](evidence/2026-11-09T15-58-20-631Z/desktop/UAT-24-歌詞.png)；同一 run 的 mobile 目錄有手機各檯截圖。

驗證：`npm run test:e2e -- --grep UAT-24`，桌面及手機都應通過，再執行完整矩陣。

## UAT-25 — R4 五角色缺少人物外觀

狀態：CLOSED；負責：session A（codex/burn-a）；分類：UI／視覺資產。

第 2 輪：UAT-25、29、57 雙尺寸通過；使用 Willy 核可的 idle-v2 與 room base。已人工核對五張原畫、手機首屏與桌面聊天截圖，外觀對照 docs/design.md、character-design-brief.md；未使用 v1-rejected。

現象：五位角色目前只顯示「製／曲／詞／編／錄」的圓形文字字形，沒有可見的人物外觀。R3 的按檯對應夥伴、五角色切換與回覆已可操作，但尚無法驗收「依真實音樂人外觀」或確認故事書 RPG 人物感。

期望：五角色有可辨識且可見的人物外觀，並由 A 記錄真實音樂人參考的對應關係，以供產品負責人確認相似度。DOM 只證明圖像存在，不能單獨宣稱真人相似度通過。

證據：[桌面五角色之一](evidence/2026-11-09T15-58-20-631Z/desktop/UAT-25-role-1.png)；同目錄有 role-1 到 role-5，mobile 亦同。[手機既有角色對話](evidence/2026-11-09T15-36-03-007Z/mobile/UAT-02.png)。

驗證：`npm run test:e2e -- --grep UAT-25`；人物外觀截圖仍須人工核對參考。

## 已修復功能缺失

| UAT | 原始現象 | 修復與驗證 | 本機 commit |
|---|---|---|---|
| UAT-10 | 拒絕麥克風後停在「唱完」狀態，隱藏跳過入口 | start 回傳成功狀態，失敗回復可重試／跳過；兩 viewport 通過 | 74da76a |
| UAT-15 | 錄音中直接保存僅保存文字，漏語音附件 | 等停止與媒體保存後使用最新 draft，防止重複保存；兩 viewport 通過 | 8b4ed93 |
| UAT-16 | 媒體寫入失敗產生未處理 rejection，操作卡住 | 顯示儲存錯誤、finally 解鎖、文字保留；DB 交易 commit 後才成功並關閉連線；兩 viewport 通過 | 191c563 |
| UAT-20 | 合法 JSON 但錯誤形狀造成白屏 | 欄位級修復 project、靈感、版本資料；兩 viewport 通過 | 6fc5fb4 |
| UAT-20 追加 | 語音 transcript 被損壞成物件時，打開本子仍白屏 | 審查後補重現，逐欄清理語音／哼唱 metadata；兩 viewport 紅→綠，另驗真語音與哼唱播放 | b018073 |
| UAT-22 | 成功提示顯示「存好了：」缺版本名 | 名稱與快照在 React updater 外計算，版本序號不因保留 20 版而重複；兩 viewport 通過 | 3cd09ac |
| UAT-26 | 離開混音檯仍有 48 個鼓音排程，情緒預聽換頁後會復活 | 追蹤所有音源與延遲工作、換檯取消、不把手動停止當自然完成；兩 viewport 通過 | f983bb1 |
| UAT-27 | 首次進入後立即離線重開白屏；SW 刪除同源其他應用快取 | build 預存 JS/CSS，限定快取命名空間；僅對公開 build 資產忽略 Vary 差異；兩 viewport 紅→綠 | 0f1f905 |

紅燈截圖與首次結果保存在 evidence/2026-11-09T15-36-03-007Z/；UAT-26 紅燈在 evidence/2026-11-09T15-42-14-452Z/。首輪的 UAT-08（前置未設 hook）、UAT-13/24/25（哼唱完整名稱 selector）、UAT-14（檔案 selector 未限定捕捉區）、桌面 UAT-21（將通知也計成回答）屬測試器問題，已修正前置／定位／回覆判定，不改產品驗收標準。

## 截圖人工檢視

已實際檢視手機構想、桌面聊天與主流程畫面：暖紙背景、墨色字、低飽和淡彩按鈕與紙條入口符合 R1 的紙墨方向；人物插畫與真實音樂人參考缺席，R4 不能通過。R6 的 Why 卡片預設收起、主動展開收合測試通過；主流程切換時偶有前一檯較長旁白留在夥伴區，請 A 一併評估是否仍符合「知識先小火花」。

程式碼審查：已完成獨立唯讀審查，審查者指出的媒體 metadata 白屏問題已補 E2E 重現並修復；指出的 UAT-14 播放成功斷言缺口也已補齊。

證據產生器曾因跨 spec 的 hook 範圍而漏存部分案例截圖；已改為每案例自動 fixture，最終交付另逐一核對 54 份案例截圖。舊輪次的缺失保留在各自 results.json notes，不用別輪截圖冒充。

## 第 4 輪全綠後探索 — UAT-64

狀態：CLOSED；無新增產品缺失。從自己寫的文字靈感開始，完全不開麥克風、不匯入示範，手動排主副歌和弦與旋律、寫詞，到總檢討實際播放。兩尺寸通過，記錄真音源 start 且 getUserMedia 次數為零；文字保留且無 JS 錯誤。已納入正式矩陣，證據 A-UAT64-{desktop,mobile}.png。

## 第 6 輪回歸 — UAT-16

狀態：CLOSED；測試定位修正。完整 run 2026-11-10T00-54-32-030Z 為132/134：新任務便箋與原本的儲存 toast 都有 status 語意，舊 getByRole('status') 不再唯一。trace 顯示真實儲存錯誤提示確實出現。將斷言限定到 .toast[role="status"]，保留原錯誤文字、按鈕解鎖、另存文字、原錄音草稿與本子內容的全部檢查。UAT-16/49/60/67 兩尺寸8/8通過；仍須完整矩陣才放行，沒有拼接多輪 pass。

## 第 6 輪自由跳檯探索 — UAT-68

狀態：CLOSED；R2/R3。空白混音任務要求播放但主按鈕先去旋律；空白總檢討只填評語，任務就顯示完成。依各檯實際可播放條件優先提示缺聲音，不改既有前進條件。UAT-68桌面/手機紅→綠，與UAT-16/36/54/67共10/10；圖見UI-CHANGES.md的UI-07。最後放行仍須完整136次全數通過。


## UAT-70 — 橫向／矮畫面看不到夥伴回覆

狀態：CLOSED；負責：session A；需求：R1/R2/R3/R5。

UI-08獨立審查以實際dist重現：844×390開聊天並提問，master-list clientHeight=16px，恰被上下padding占滿；輸入與關閉仍可操作但讀不到回覆。固定人物區與其他列耗盡高度，minmax(0,1fr)令對話列歸零，而外層overflow:hidden。標準138/138完整驗收通過仍不放行此新缺失；補UAT-70與矮畫面精簡場景。

修復：600px以下高改64px核可人物小景，對話列保留至少96px實際內容高度，極矮時可捲動紙頁。UAT-70兩project先RED（0px）→GREEN，另驗844×390／390×400／390×600；連同UAT-31/37/62/69共10/10。已人工查看兩張橫向截圖。未降低測試門檻或增加timeout，完整140次仍待重跑。

## 第8輪 — Chrome受runner暫時桌面服務中斷影響（UAT-15/72）

狀態：CLOSED；測試瀏覽器環境隔離，不改產品邏輯、斷言、timeout、重試次數。

首次22次定向為20/22：桌面UAT15/72等待click穩定時超時，trace中兩worker同時從約25秒跳到135秒，連45秒測試時限都延後。單獨重跑4次又有2次瀏覽器退出，Chrome stderr明確為FATAL D-Bus connection was disconnected；runner有繼承session bus。未據此誤修錄音或放寬測試。

用DBUS_SESSION_BUS_ADDRESS=disabled:單一變因重跑原UAT15/72，4/4通過；再在playwright.config.ts的Chrome launchOptions.env隔離暫時session bus，正常npm run test:e2e定向22/22通過（54.4秒）。Chrome仍使用系統channel，原假麥克風及WebAudio實播不變。失敗run與trace完整保留：2026-11-10T01-35-30-142Z、2026-11-10T01-38-38-227Z。整體放行仍等完整矩陣。

## 第8輪完整回歸 — UAT-49故障注入的非同步時序

狀態：CLOSED；測試器修正，沒有產品修改。

首次完整144次為143/144；桌面UAT49在等待哼唱錄音狀態時失敗。trace顯示重試媒體保存還在await IDB open時，測試只檢查「目前無錄音」便立刻解除failMedia；先前的點擊因此成功重試並開始哼唱，下一次點擊將它停掉。螢幕已有0秒語音與原始哼唱附件，符合兩次點擊重疊而非啟動失敗。

測試現在先等哼唱按鈕恢復enabled，並確認仍顯示「還沒收好」，才解除故障及重新按哼唱。所有原斷言保留：實際錄音中、保存兩個不同asset、全部stream ended、返回與截圖。UAT15/16/49/60/72兩尺寸10/10通過（30.4秒），未加固定等待或提高timeout；最終仍須重新跑完整144次。失敗run 2026-11-10T01-45-13-361Z及trace保留。
