# 任務 A：完全新手自測與修正

日期：2026-11-09。分支：`codex/burn-a`。只在本機 commit，未連網、未 push、未修改 remote。

## 方法與限制

已讀 README.md、docs/ux-review.md、docs/design.md、docs/pedagogy.md、docs/creator-workflow.md。逐檔檢查 src 全部畫面、共用元件、錄音／播放／儲存／mock；以首次進入、不懂樂理、自由跳檯、空白資料、權限失敗、手機窄幅與鍵盤操作推演。

**不能把原始碼推演當成真實手機走測。** 本環境 `node_modules` 有 build 依賴，但沒有 Playwright；網路不可用且不可改 repo 外環境。啟動 Vite preview 也被沙箱拒絕。因此瀏覽器互動、真機音訊、實際版面尚未驗證，不能宣稱已做到「全部測試通過、找不到問題」。補充檢查以已安裝的 esbuild／React 與 Node 在記憶體內打包執行，未新增依賴或測試檔；僅代表測得的邏輯／靜態渲染範圍。

## 初始指令記錄

- `npm run build`：exit 0；唯一警告：`src/steps/results.ts` 同時被 Lyrics 動態匯入、App 靜態匯入，無法切分 chunk。
- `npm run selftest`：exit 1；`Cannot find module 'playwright'`，require stack 為 scripts/mobile-selftest.cjs；Node v24.22.1。尚未進入任何一項手機斷言。
- `npm run preview -- --host 127.0.0.1 --port 4173`：exit 1；`listen EPERM: operation not permitted 127.0.0.1:4173`。

## 第一輪清單

位置為發現時的行號；修正後可能移動。狀態「程式已修」不代表受環境阻擋的手機驗證已完成。後續每項修正必須重新執行 build 與 selftest，再追加個別結果。當前第一份清單無法 commit，因此尚未開始修正。

| 編號 | 嚴重度 | 位置（檔案:行） | 現象 | 新手會怎樣 | 修法 | 狀態 |
|---|---|---|---|---|---|---|
| A-01 | P1 | src/inspire/InspirationHub.tsx:94,134；src/inspire/recorder.ts:35；src/lib/media.ts:14 | 錄音中直接存檔使用 await 前的 draft，可能漏錄音；媒體寫入失敗卡在 busy；請求權限時可重複錄；離開後權限回來仍開麥 | 以為靈感已存，實際聲音遺失或麥克風留著 | 傳回錄音後的新草稿再存、序列化媒體操作、錯誤可重試，清理晚到 stream／聽寫；IDB 等交易完成 | 待修 |
| A-02 | P1 | src/lib/store.ts:84；src/lib/versions.ts:12；src/inspire/store.ts:61 | 三種文字儲存失敗全吞掉；Demo 名稱在 state updater 內才決定，回傳可能空白 | 重整後作品消失，卻曾看到「存好了」 | 同步確認持久化、明確保留未存資料與提示；Demo 名稱在更新前決定 | 待修 |
| A-12 | P1 | src/inspire/pull.ts:129；src/inspire/store.ts:73 | 拼貼沿用原靈感的照片／錄音 assetId，刪原靈感就直接刪除 blob，沒有檢查其他引用 | 拼好的靈感聲音或照片消失 | 刪除媒體前檢查剩餘靈感／草稿引用，或替拼貼複製媒體 | 待修 |
| A-03 | P1 | src/lib/audio.ts:228,260,270；src/steps/Review.tsx:85；src/steps/results.ts:53 | stop 呼叫完成 callback，Review 會接播下一段；鼓沒收進停止清單；Demo 用未追蹤的 timeout 接播且忽略小節數、只播前四段；和聲的「循環」實際只播一輪且不回復主動作 | 換檯仍響、按停仍接著播、聽到的長度與編曲不同 | 區分自然完成／取消、停止所有音源與排程、完整按編曲長度播放，總檢討卸載清理；和聲正確循環與完成回饋 | 待修 |
| A-04 | P1 | src/steps/Lyrics.tsx:66,71,111,158 | 主歌達兩行會自動換副歌；沒有構想／漏記憶點時沒說為何不能前進；加段落不切換到新段 | 打字被打斷、以為詞不見，寫完還卡住 | 固定使用者選的段落、新段落立即開啟、依缺項提示；詞先可寫完後繼續 | 待修 |
| A-05 | P1 | src/lib/mic.ts:42,81；src/steps/Hum.tsx:29；src/steps/Recording.tsx:53 | 25 秒只停更新，不停麥克風；權限失敗仍顯示唱完；分析中可再錄；靜音 -100 dB 被算測試完成 | 誤以為在錄、無限占用麥、沒聲音也顯示安全 | pending 狀態、取消晚到 stream、上限停止並交給分析、失敗回到可重試動作、靜音不可算成功 | 待修 |
| A-06 | P2 | src/App.tsx:144；src/components/MasterPanel.tsx:37；src/inspire/InspirationHub.tsx:171；src/steps/Ideation.tsx:71 | dialog 無焦點限制／Escape／回復焦點；欄位與角色只有字形／placeholder；狀態只靠顏色 | 鍵盤走到被遮住畫面，讀屏不知輸入什麼或選了誰 | 共用 modal 焦點管理、完整欄位名稱與按下狀態、清楚焦點框 | 待修 |
| A-07 | P2 | src/steps/Melody.tsx:187,241；src/steps/Mix.tsx:99；src/steps/Review.tsx:104 | 自由跳旋律卻要求先回和聲、播放 disabled；空白混音可假裝聽過主旋律；總檢討空白可下載無聲 MIDI | 被隱性前置條件卡住，或把無聲檔當作品 | 無和聲仍可試聽自己的旋律、指示可執行；空白頁提供明確路徑與正確的播放／匯出可用性 | 待修 |
| A-08 | P2 | src/agent/client.ts:12；src/agent/mock.ts:90,255；src/agent/useMaster.ts:29 | mock 說放了兩版卻沒有；快捷題沒專門答案；建議只換調就能降低旋律但不會移動音符；fetch 無期限、並行 busy 會過早結束 | 等不到回答、找不存在按鈕、照做仍唱不上去 | 誠實角色語氣、回答現有快捷題、調性只稱估計結果、正確移音說明、逾時退 mock 與計數 busy | 待修 |
| A-09 | P2 | src/styles.css:151,267,733；src/steps/Arrangement.tsx:113 | 新增多段落或多歌詞分頁會超出手機；長字串無斷行；reduced-motion 只停 nudge | 控件被擠出畫面、左右拖整頁；減少動畫偏好未生效 | 容器內捲動／換行、最小寬度管理、全面尊重減少動畫 | 待修 |
| A-10 | P2 | scripts/mobile-selftest.cjs:170 | 斷言 FAIL 只列印，程序仍 exit 0；啟動失敗未保證清理瀏覽器 | CI／維護者以為已過，新手 bug 被放行 | 失敗非零退出、try/finally 清理；保留缺依賴的失敗，不假造 PASS | 待修 |
| A-13 | P2 | src/steps/Ideation.tsx:56,58,76 | 有哼唱時選情緒沿用哼唱調式，按「再聽一次」卻改成情緒調式，和聲仍維持舊調式 | 同一個感覺前後聽起來不同，不知道後面會用哪個 | 明確選定並統一情緒試聽／重播／和聲用的調式，保留有意的反差選項 | 待修 |
| A-14 | P2 | src/steps/Mix.tsx:18,20,78,98 | 主旋律靜音仍回饋「夠突出」且准前進；A/B 停止後保留 bypass，重播仍是未混音卻沒先提示 | 拉推桿沒反應，沒聽到主旋律也以為混好了 | 回饋檢查實際啟用聲道；重播預設自己的混音或持續明示比較狀態 | 待修 |
| A-15 | P2 | src/lib/midi.ts:51 | 延長音匯出只追到本小節末，網頁播放可跨小節，MIDI 卻截斷 | 帶進 REAPER 後旋律節奏變了，以為寫錯 | 依整段旋律追蹤延長，並限制在編曲段落結束處，加入跨小節匯出回歸驗證 | 待修 |
| A-11 | P3 | src/steps/Lyrics.tsx:12；src/steps/results.ts:38 | 無效動態分割警告；主歌頁按聽詞卻固定唸副歌 | 聽到別段，以為自己操作錯 | 消除重複匯入策略，抽出共用歌詞試聽，使用目前選取的段落 | 待修 |

## 修正驗證記錄

尚無修正。第一份清單的 `git add docs/codex-fixlist-a.md && git commit ...` 已失敗：

```text
fatal: Unable to create '/workspace/Maglody/.git/worktrees/wt-a/index.lock': Read-only file system
```

`mount` 確認 `/workspace/Maglody/.git/worktrees/wt-a` 為 `ro`。共同 git 目錄的其他部分可寫，但不能替代 worktree 自己的唯讀 index／HEAD metadata。未建立替代 Git 目錄、未繞過掛載限制、未改 branch／remote。為遵守「先 commit 清單」與「每修一項獨立 commit」，保留原產品程式碼。

## 第二輪

尚未進行：第一輪修正及其必要的 build＋手機 selftest 驗證均未完成。下列補充檢查仍屬第一輪問題確認，不冒稱修後第二輪。

## 第一輪補充證據

以下直接執行目前 src，以記憶體打包／React renderToStaticMarkup／模擬 AudioContext 與計時器驗證。沒有瀏覽器、CSS 排版或真實聲音，故不能推論觸控、可聽品質與手機無溢出。

- 九檯空白狀態全部可靜態渲染；可見主動作計數 0–1。構想、和聲、歌詞為 0；旋律與總檢討主動作 disabled。此計數不含瀏覽器可見性判定，也不涵蓋展開工具箱與對話框。
- A-04：專案主歌填入「雨落在門前\n燈亮在窗邊」，副歌留空，渲染實際顯示空白副歌，大字變成「副歌。把『你那句話』放進來」。兩段各有兩行、但 Hook 為空時，requirements 唯一未過的是「副歌包含記憶點」。
- A-05：`recording.levelPeakDb = -100`，錄音檯 requirements 全部通過。靜音音訊分析得到 0 音、C 大調 score=0；這是無法估計，不能當成肯定的調性回饋。
- 正常示範哼唱分析：14 音、G 大調 score 約 0.836、音域 MIDI 62–74。
- A-03：含鼓的單小節播放排程共 28 個音源；`stopAll()` 後 12 個鼓音源沒有被取消，且觸發 `onStep(-1)`。Review 以同一訊號接播下一段。
- A-03：6 個各 8 小節的段落，Demo 只排程 4 段，間隔約 10.667 秒（90 BPM 下僅 4 小節，預期 8 小節約 21.333 秒）。`stopAll()` 後仍留著 4 個接播 timeout。
- A-08：在構想檯向五位角色問「下一步」，全部回離線 mock，角色前綴不同；編曲回答「我放兩個版本給你比：先決定這首歌的情緒和速度」，沒有提供任何版本。現有快捷題「副歌怎麼更有爆發力？」「怎麼帶進 REAPER？」落入通用回答；「幫我寫一句」有拒絕代寫。
- A-12：執行 collage.new，產出的照片 assetId 與原靈感完全相同。刪除路徑則無條件 deleteBlob，沒有引用檢查。
- A-14：主旋律 vol=1.2、mute=true、listened=true 時，mix requirements 仍全部通過，第一則回饋為「主旋律夠突出，聽眾能跟著唱」。
- A-15：第 8 格起音，延長至第 11 格；解析 buildMidi 輸出得到音長 230 ticks（僅一格減 10），正確跨格音長應為 950 ticks（四格減 10）。

## 續作條件與交付狀態

- 已完成：指定文件閱讀、build／selftest 執行及錯誤記錄、九檯與周邊流程的原始碼檢查、以上本機重現；清單共 15 項（P1：6、P2：8、P3：1；未發現 P0）。
- 未完成：清單初始 commit、A-01～A-15 修正／逐項驗證／commit、手機逐畫面互動與第二輪修後自測。
- 需修復環境：worktree metadata 可寫；離線環境提供 Playwright 與對應瀏覽器；允許本機 loopback 預覽埠。真機測試仍需實體裝置。
- 本次 commit 列表：空。`git status --short` 僅有 `?? docs/codex-fixlist-a.md`；沒有產品原始碼變更。未 push、未改 remote、未修改 repo 外檔案。


## 2026-11-09 23:29 接續：R1–R6 驗收與實作計畫

本輪環境已更新：Chrome `/usr/bin/google-chrome`、Playwright 可用，4101 preview 可啟動；先前環境限制是歷史記錄。沿用 React/CSS 與既有工作檯，不另做 app、不部署、不 push。A 負責產品及 A-* 視覺/回歸驗證；B 負責完整 UAT 計畫、旅程 E2E 與彙總報告，讀取其 failures.md 後逐筆修正。

| 需求 | 可驗收標準 | 實作與驗證 | 狀態 |
|---|---|---|---|
| R1 | 390×844、1280×800 均有可見紙纖維、水彩暈染、墨線與低彩度；明暗模式文字可讀、無水平溢出 | styles.css 紙面與場景，A-R1 截圖 | 本機 Chrome 已驗 |
| R2 | 九檯、選單、捕捉與聊天每個活動畫面最多一個主要動作；背景在 modal 開啟時不可操作；進階預設收起 | 共用 modal、主動作層級；九檯巡覽與鍵盤驗證 | 本機 Chrome 已驗 |
| R3 | 各檯有一位全身夥伴在對應工作室角落，待機有細微呼吸；點人物可聊、切換五位均有回應；減少動畫時停止 | StudioPresence、角色狀態與離線對話，A-R3 | 本機 Chrome 已驗 |
| R4 | 五位人物以真實錄音室樂手的日常穿著、髮型、配件區分，public 角色圖與文件逐項一致；沒有以字形當人物 | public/characters SVG 與 docs/design.md，五位截圖 | 本機 Chrome 已驗 |
| R5 | 九檯與所有 modal 都能低干擾開啟捕捉，文字/哼唱可保存；原工作草稿和檯位不變，重整後可取回；權限拒絕可改文字 | 捕捉入口、錄音序列與儲存；A-R5 | 本機 Chrome 已驗 |
| R6 | 動手前無術語說明；動手後一行火花在工具箱外可發現，預設收起；主動展開才有原理，再深入另收起 | KnowledgeSpark、Why；A-R6 | 本機 Chrome 已驗 |

執行順序：先修 A-10 測試實際退出碼/Chrome/4101；依 R1→R4→R3→R2→R5→R6 各自 commit，必要回歸獨立 fix(A-xx) commit；每項 build/selftest 與對應 screenshot。完成後從空白自由跳檯、拒絕權限、鍵盤與長內容探索，將新問題補進清單。既有 A-01～15 逐項重現，未驗證者不宣稱修復。

Review focus：錄音保存不能只測文字；modal 巢狀焦點；角色圖可讀性；無資料跳檯；長段落不溢出；reduced-motion；實體手機及真 LLM 不在本機 Chrome 證據範圍。

## 本輪實作紀錄（驗收結果以 docs/uat/UAT-RESULTS.md 最新一次為準）

- R1：紙纖維 SVG、淡彩暈染、墨線、夜晚紙面；A-R1 / UAT-21 截圖。
- R2：原單一主動作設計延續；原生 modal＋Tab 封閉循環＋Escape＋焦點復原；聊天只凸顯送出；UAT-04。
- R3：一位人物置於琴/窗/工作桌場景，呼吸待機、側耳聆聽、回應泡泡；UAT-03。
- R4：五位原創錄音室音樂人 SVG 與 docs/design.md 對照；UAT-02。
- R5：九檯、聊天與選單均可隨手記；錄音中存檔讀取完成後的新草稿；UAT-05/07/10/11/12/15/16。
- R6：工具箱外的小火花引用當前作品；主動展開才有原理/深入；UAT-06。

| 舊項目 | 實作與可重跑證據 | 本輪狀態 |
|---|---|---|
| A-01 | 草稿 ref 同步更新、媒體先交易完成、pending 禁重入、失敗保留錄音等待重試；UAT-07 | 正常保存/故障重試/提早停止/原聲回播皆已驗 |
| A-02 | 專案未存告知；靈感/版本同步確認後才說成功；版本名在更新前決定；UAT-11/14 | 已實作 |
| A-03 | 自然完成與取消分離、鼓/單音追蹤、延遲播放可取消；完整依段落小節播放；和聲真循環；test:logic、UAT-13 | 已實作 |
| A-04 | 不自動換段；新增段立即開啟；缺 Hook 提示、未先構想可先寫完詞；UAT-08、test:logic | 已實作 |
| A-05 | 請權限 pending、晚到 stream 取消、25 秒自動停錄分析、拒絕回可重試、靜音不能過；UAT-12/16、test:logic | 已實作，實機仍需驗 |
| A-06 | modal 鍵盤與焦點、角色名、輸入標籤/情緒選取狀態；UAT-04/10 | 已實作 |
| A-07 | 無和弦可先寫/聽旋律；空白混音/總檢討直接提供素材入口，不匯出無聲作品；UAT-09 | 已實作 |
| A-08 | 離線不聲稱放了兩版、快捷題具體回答、正確說明換調不會搬音符、12 秒逾時 mock、並行請求計數；UAT-03、test:logic | 已實作，真 LLM 未驗 |
| A-09 | 長分頁/能量條容器內捲動、全域長文字斷行、全部動畫尊重偏好；UAT-17/21 | 已實作 |
| A-10 | 系統 Chrome、4101、FAIL 非零退出、finally 關 browser；selftest 50/50 | 已驗 |
| A-11 | 抽出 lyricsAudio 共用，不再動態匯入 results；使用當前段落；build 無此警告、UAT-18 | 已實作 |
| A-12 | 刪媒體前比對剩餘靈感引用；UAT-15 | 已實作 |
| A-13 | 初聽/重播/和聲共用模式與 root；對照模式明確；UAT-19 | 已實作 |
| A-14 | 回饋納入 mute/實際音量、再播重設 bypass；UAT-20、test:logic | 已實作 |
| A-15 | MIDI 延音跨小節追蹤、限制段落邊界；test:logic 950/230 ticks | 已驗 |

### 本機 commit 阻擋

本輪實際嘗試 `git add docs/codex-fixlist-a.md && git commit ...` 仍得到：`Unable to create /workspace/Maglody/.git/worktrees/wt-a/index.lock: Read-only file system`。因此沒有任何成功 commit，不宣稱符合「每項獨立 commit」。所有變更留在目前目錄，未建立替代 Git 目錄或改 remote。待環境修復可按下列切分提交：feat(R1) 紙墨、feat(R4) 角色圖與說明、feat(R3) 在場人物、feat(R2) modal/動作、feat(R5) 捕捉、feat(R6) 火花；fix(A-01 UAT-07)、fix(A-02 UAT-11 UAT-14)、fix(A-03 UAT-13)、fix(A-04 UAT-08)、fix(A-05 UAT-12 UAT-16)、fix(A-07 UAT-09)、fix(A-08 UAT-03)、fix(A-09 UAT-17 UAT-21)、fix(A-10)、fix(A-11 UAT-18)、fix(A-12 UAT-15)、fix(A-13 UAT-19)、fix(A-14 UAT-20)、fix(A-15)。

### 唯讀程式審查與修復

依 requesting-code-review 技能交由獨立 reviewer 檢查。本輪無 Critical；四個 Important 均納入同一修復輪並加測試：

1. 媒體滿額後換錄音種類會把舊聲音當新聲音，甚至漏停麥。先收妥 pending，才准開始另一種錄音。UAT-22 先 RED（voice 不見）再 GREEN，保存後檢查全部 track ended。
2. 零音符哼唱雖有 Blob 卻不能播放。草稿/本子新增「原始哼唱」，保留合成音符比較。UAT-23 先 RED（無控制），再 GREEN。
3. 本子原聲/哼唱原始取樣沒登記停止。HTMLAudio 註冊播放生命週期、BufferSource 納入音源追蹤、延遲讀 Blob 加 generation 取消。UAT-23 檢查 HTMLAudio paused 與 BufferSource stop。
4. 裝置提早結束會漏掉 onstop 的成果，後續存檔永遠等。保留 completed 錄音，即使 stop 先發生也能取回。UAT-24 先 RED（視窗不關），再 GREEN。

探索另外發現拼貼完成後仍在選取模式；已完成拼貼就退出模式，UAT-15 從失敗路徑回歸。照片 assertion 改為等待實際 img 解碼後檢查 naturalWidth，避免把 placeholder span 當失敗；仍檢查刪原稿與重整後真正可讀圖片。

無 deferred minors。維持明確範圍：真機/真 LLM 尚未驗；未做部署；無法 commit 的環境限制仍存在。


### 首輪全綠後的新手探索

2026-11-09 23:58：24 個使用者旅程 × 兩種尺寸 = 48/48 PASS；build 通過、selftest 50/50、test:logic 10/10。已親自看手機作詞人、桌面深色紙面、各角色與火花展開截圖。

從「新手錄著錄著忘記停止」追加 UAT-25：不用加速/偽造時間，真等 25 秒上限，檢查 MediaStreamTrack ended 與分析保存。最終結果依 UAT-RESULTS.md。

Ruling：保留既有九檯、每檯一位人物，以原創樂手的工作穿著與手繪 SVG 完成 R4；未改為名人肖像或外部圖像服務。真機/真 LLM 仍需另驗，此處只宣告本機 Chrome 可供使用者開始測試。


## 本輪最終交付（2026-11-10 00:02 台北）

- R1–R6：本機手機/桌面 Chrome 已驗，截圖皆在 docs/uat/evidence；角色圖與文件一致。
- `npm run build`：PASS，無舊版動態匯入 chunk 警告。
- `npm run selftest`：50/50 PASS；錄音、創作九檯、靈感多媒體、角色、拼貼皆涵蓋。
- `npm run test:logic`：10/10 PASS，正式碼的停止/段落/靜音/MIDI 等回歸。
- `npm run test:e2e`：25 個旅程 × 2 viewport = 50/50 PASS；含初次全綠後追加的忘記停錄案例。
- 最新機器狀態：UAT-STATUS.json ready_for_user_test=true；限本機 Chrome/mock 範圍。
- 報告的 66 個截圖連結全部對應存在檔案；git diff --check 通過。
- 已停止本輪啟動的 4101 preview；E2E 的 4102 preview 自動關閉。
- 本輪多次 git add 仍因 worktree metadata 唯讀失敗；0 個成功 commit。所有修改留在目前 worktree，未 push、未改 remote、未部署/開 tunnel。
- 最後重讀 codex/burn-b:docs/uat/failures.md 仍不存在，未宣稱 B 已完成獨立驗收。
- 真機/真 LLM/主觀音樂品質尚未驗證；完整 HTTPS 部署依使用者安排留待下一階段。
