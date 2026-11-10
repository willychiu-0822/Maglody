# 任務 A：完全新手自測與修正

日期：2026-11-09。分支：`codex/burn-a`。只在本機 commit，未連網、未 push、未修改 remote。

最新進度：第 4 輪 2026-11-10 08:26，R1～R6、新手 P0～P2 與新增探索均通過；完整 128/128、ready=true。已修新歌對話隔離 UAT-63，新增文字起步 UAT-64；以文末與 [UAT-STATUS.json](uat/UAT-STATUS.json) 為準。以下較早環境限制保留作歷史記錄。

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
| R2 | 九檯含空白狀態各恰有一個主要動作；情緒/和弦各有一個推薦材料；次要控制降階、進階預設收起；modal 背景不可操作 | UAT-24/31/56；九檯巡覽、推薦情緒/和弦、鍵盤驗證 | 本機 Chrome 已驗 |
| R3 | 各檯有一位全身夥伴在對應工作室角落，待機有細微呼吸；點人物可聊、切換五位均有回應；減少動畫時停止 | StudioPresence、角色狀態與離線對話，A-R3 | 本機 Chrome 已驗 |
| R4 | 五位人物使用核可 idle-v2，依錄音室樂手的穿著、髮型、配件區分；與 character-design-brief.md 一致，不以字形當人物；兩尺寸可見、首屏素材小於 150KB | public/studio/roles/*.webp、studio-assets.json；UAT-25/29/57、五位截圖與人工檢視 | 本機 Chrome 已驗 |
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

## 第 2 輪：新手回饋優先驗收（2026-11-10）

已合併 B；原 worktree metadata 唯讀，以 `scripts/git-local.sh` 在本目錄保存 HEAD/index，沿用原 shared refs/objects，沒有改 remote。前輪已存在的整批修改以 baseline commit 保存；這一輪新增修復按項提交。B 未 commit 的指定交接檔與其最終分支一致，無需另複製。

| 編號 | 優先 | 可驗收標準 | 對應案例 |
|---|---|---|---|
| A-N01 | P0 | 無金鑰、API 失敗、後端 mock 都引用當前歌曲；作曲家/作詞人/錄音師建議各異；沒有工程設定字；不代寫整首 | UAT-53 |
| A-N02 | P1 | 主副歌和弦、詞、旋律齊全可從頭播；缺素材指明並一鍵前往；無編曲可用兩段草稿 | UAT-54 |
| A-N03 | P1 | 拒麥後示範實際有聲且可繼續；載入與回饋區分示範、音檔與本人錄音 | UAT-55 |
| A-N04 / R2 | P1 | 九檯空白/進行/完成恰一主動作；一個推薦情緒與和弦；進階控制收起；文字自己寫 | UAT-24、56 |
| A-N05 / R4 | P1 | 五角色必用 idle-v2 核可圖，服裝髮型配件與 brief 一致；聊天亦有可辨人物 | UAT-25、29、57 |
| A-N06 / R1、R3 | P2 | 核可 room 底圖、紙墨可讀，手機桌面不溢出；人物待機/回應；首屏圖像合計小於 150KB | UAT-28、30、57 |
| A-N07 / R6 | P2 | 動手後一行火花；想讀才展開；額外觀察一次一則 | UAT-33、58 |
| R5 | P1 | 全九檯與對話/選單都可捕捉文字/哼唱並返回；重整後聲音仍在 | UAT-13～17、32、34～52 |

完整矩陣通過後，再追加新手探索案例與重跑；以最新 UAT-STATUS.json 為準。


### 第 2 輪修復證據

- 已實際檢視五張核可原畫、A-approved-room-mobile.png、A-approved-chat-desktop.png。外觀、紙墨可讀性與場景一致。A-R2-recommend-mobile.png 顯示唯一下一步與推薦情緒。
- UAT-24/25、29、53、55～58 定向雙尺寸已通過；UAT-54 的播放與跨主副歌也通過，但缺項測試重整後回哼唱，補明確導航再驗；沒有弱化缺項斷言。
- 合併回歸發現 UAT-16 與 UAT-49 對儲存失敗的既有期待不同：新增「先另存文字，錄音留著」，文字保存與錄音重試都保留。已補案例檢查保留草稿。
- 開發期間並行測試曾共用 test-results 造成 trace ENOENT；已按 run id 隔離 outputDir。該次 97/104 不是交付通過依據，原結果保留。完整穩定版本矩陣重新執行。
- build、selftest 50/50、unit 14/14、logic 10/10 已通過；最終結果由完整 E2E 更新。


### 116/116 全綠後的新手探索

- UAT-59：向作曲家提問後不等回覆，立刻去歌詞檯。延遲到達的作曲家回覆只留聊天歷史，作詞人維持自己的登場與陪伴。手機/桌面通過。
- UAT-60：錄音存不下，先另存文字，釋出空間後回草稿收好。驗證兩份成果、原文字、非空 IndexedDB Blob 均保留。手機/桌面通過。
- 後端 mock 補單元案例：回傳本機教練委派標記，不呼叫會吐設定文案的 mock provider；unit 15/15。
- 探索未發現新增功能缺失；新增為正式回歸案例，待 60 旅程 × 2 viewport 最終完整重跑。部分重跑即使全綠仍 ready=false。


## 第 2 輪最終交付（2026-11-10 00:24 台北）

R1～R6 與新手 P0→P2 全部通過本機雙尺寸驗收。B 已合併，兩個 OPEN 缺失已關閉；核可 idle-v2 和 room base 必用素材已取代自畫角色與房間，來源雜湊六份均核對成功。未使用 v1-rejected。

- 完整 E2E：60 旅程 × 2 viewport = **120/120 PASS**，ready_for_user_test=true；包含全綠後新增的 UAT-59/60。
- build PASS；selftest 50/50；unit 15/15；logic 10/10；git diff --check PASS。
- 當輪 120 個案例截圖連結逐一驗證存在，狀態檔逐項列出 R1～R6 與七條新手回饋皆 pass。
- 已人工檢視手機作詞人、首頁、推薦情緒，桌面聊天與深色紙面；文字可讀、人物與核可設計一致。
- R1～R6 各有獨立 feat commit；P0、Demo、示範、儲存復原與 UAT 修復含對應 UAT 編號提交。前輪既存修改以 baseline 保存，不冒稱重切成前輪各項 commit。
- 本機 metadata 使用 scripts/git-local.sh；原唯讀 index 未修改。未 push、未改 remote、未部署、未開 tunnel。
- 4101／4102 皆已關閉；實機／真 LLM／主觀可聽品質不在本次本機 Chrome 驗證範圍。

## 第 3 輪：長時間創作探索（2026-11-10）

開始以 `scripts/git-local.sh merge --no-edit codex/burn-b` 確認已合併，正確 index 為乾淨。讀取新手回饋後沿用第 2 輪 P0→P2 的驗收，不重做既有素材。六份核可來源與 public WebP 雜湊再次全部相符。

| 編號 | 需求 | 可驗收標準 | 驗證 |
|---|---|---|---|
| A-N08 | R3 | 連續 22 次提問讓聊天紀錄輪替後，換歌詞檯向作詞人再問一題；聊天與場景都顯示新回覆，維持 responding 狀態 | UAT-61，手機與桌面 |
| A-N09 | R3 | 作曲家等待回覆時，只有作曲家顯示思考／聆聽；換作詞人可自行提問，去歌詞檯維持作詞人待機；回答仍歸原提問者 | UAT-62，手機與桌面 |
| A-N10 | R5、錄音 | 哼唱開始後刻意停止動畫畫格，25 秒仍自動結束所有麥克風 track，保存至少 24 秒聲音；晚到權限仍會釋放 | UAT-52、43，手機與桌面 |

首次完整重跑 118/120：UAT-15、56 桌面逾時；兩份 trace 同時有約 572 秒事件空窗，其餘 118 次通過。保留原始失敗與 traces，疑似環境暫停，不增加 timeout、不改斷言，最終須重新完整跑。探索已用實際 UI 重現 A-N08，修復與結果接續記錄。

A-N08：UAT-61 手機／桌面均已紅→綠，並與 UAT-59 延遲回覆隔離一起 4/4 通過。使用入檯時的訊息 ID 集合辨別新回覆，聊天輪替不再使場景失去反應；仍保留 14 秒淡出與按檯／角色篩選。證據：A-UAT61-before-desktop.png、A-UAT61-after-desktop.png、A-UAT61-after-mobile.png。

A-N09：UAT-62 兩尺寸紅→綠；以 request ID、角色、工作檯追蹤等待狀態，finally 逐筆清除。擴充實際並行提問（作曲家未回覆時，作詞人可先回），與 UAT-23/59/61 共 8/8 通過。另一次定向執行有兩案同時約 7 分鐘逾時，保留原 traces；未改 timeout，之後同樣 8 案完整重跑通過。A-UAT62-before-desktop.png、A-UAT62-after-desktop.png、A-UAT62-after-mobile.png 顯示前後差異。

A-N10：完整重跑中 UAT-52 反覆失敗，進一步確認產品的到時停止依賴 requestAnimationFrame 與 AudioContext 時間。新增「錄音開始後停止畫格」的故障注入，兩尺寸穩定紅燈；修為獨立 setTimeout 加原音訊時間檢查，stop 統一清 timer，世代與 stream 檢查防止舊 timer 影響新錄音。原 32 秒關 track／至少 24 秒保存斷言不變。UAT-52/43/29 合計 6/6 通過；核可人物載入改為等待完整載入，未降低圖像驗收條件。軟體繪圖實驗無改善，已撤回，使用原 Chrome 設定。

### 第 3 輪交付狀態（不是 UAT-ready）

- 新手 P0→P2、核可五角色與房間素材沿用；本輪來源與壓縮雜湊六份再次核對。人工檢視桌面首頁、手機作詞人、A-UAT61/62-after-mobile 與 A-UAT52-after-mobile，文字可讀、核可造型一致。
- 新修復：3edcc13（UAT-61 長對話）、d193412（UAT-62 角色等待）、dd2fd4a（UAT-52 畫格停止仍收麥）；98db208 修 UAT-29 非同步載入判定。每項有獨立 commit，紅→綠證據保留。
- 最後完整 run `2026-11-09T22-07-25-143Z`：**120/124 pass，4 fail，ready=false**。失敗 UAT-03/mobile、12/desktop、39/desktop、62/mobile 均為互動／截圖逾時；trace 細節與下輪條件見 failures.md 的 OPEN 項。
- build pass；修後 selftest 50/50、unit 15/15、logic 10/10；124 個非空案例截圖逐一驗證存在。沒有用多輪通過拼出全綠。
- 自己啟動的 4101／4102 已關閉。無 push、remote 修改、部署或 tunnel；依禁止更動 deploy 目錄的規則，公開網址只在本目錄 DEPLOY-STATUS-HANDOFF.md 留運維交接。


## 第 4 輪探索（2026-11-10）

- 起始透過 scripts/git-local.sh merge codex/burn-b：Already up to date。現有產品索引乾淨，核可六份原素材與六份 WebP 雜湊全部符合。
- 第一輪完整 122/124：UAT-14/40 mobile 同時約 221.5 秒無事件；保留證據、不增加 timeout、不更改播放/操作斷言。前輪四個失敗均通過，但不以跨輪結果拼全綠。
- A-N11 / UAT-63 驗收：重新開始新歌後無舊對話、未送出文字及錯誤等待狀態；晚到舊回覆不能進新歷史或場景；可正常問新問題。兩尺寸先紅→綠；與 UAT-22/59/61/62 合計 10/10。證據 A-UAT63-before/after-{desktop,mobile}.png。
- 修法：歌曲世代辨別非同步回覆；新歌清除 debounce timer、舊歷史與 pending，聊天視窗隨世代重新建立。靈感本子仍保留，版本還原案例持續通過。

第 4 輪完整 `2026-11-10T00-11-06-427Z` 126/126 通過，逐案截圖皆非空。全綠後從文字起步做探索，UAT-64 手機/桌面各通過，新增到正式矩陣再完整重跑；本案例沒有發現新增缺失。

證據檢視發現：完整頁截圖會把 sticky 頁首留在拍攝前的捲動位置，讓圖片中的頁首像移到半頁。修正共用截圖 fixture，拍攝前先回頂端；產品不需改動，測試斷言保持不變，再完整重跑。

### 第 4 輪最終交付

- 最後完整 run `2026-11-10T00-22-16-291Z`：128/128、0 fail、0 blocked、ready=true。前一完整 128/128 也保留；修正截圖捲動位置後完整再跑，未拼接多輪 pass。R1–R6 與 P0→P2 均由最後完整矩陣通過。
- build pass、selftest 50/50、unit 15/15、音訊/邏輯 10/10。128 個非空案例截圖皆存在；人工檢視首頁、手機新歌對話、桌面錄音師與手機文字起步 Demo。
- UAT-63 產品修復 53e7714；UAT-64 探索 da1f697；截圖 fixture fb2e831。無新產品缺失；4101/4102 已關閉。
- 僅本機提交；沒有 push、remote 修改、部署或 tunnel 操作。依禁止更動其他目錄的規則，運維網址留在 docs/uat/DEPLOY-STATUS-HANDOFF.md。真機/Safari/真 LLM 仍未驗證。

## 第 5 輪：07:24 可見 UI 優先（2026-11-10）

以使用者能直接看出差異為優先；既有 P0→P2 功能與核可素材沿用，先做 UI、定向 E2E，最後才完整矩陣。B 分支已以 scripts/git-local.sh merge --no-edit codex/burn-b 確認 Already up to date。沒有變更其他目錄、deploy 或 tunnel。

| 需求 | 本輪可見驗收標準 | 交付 |
|---|---|---|
| R1 | 九檯與三種視窗共用紙底、淡墨、淡彩；標題有可離線的實際手寫字體；手機桌面可讀 | UI-01 |
| R2 | 每檯只有一個主要動作，推薦材料與其他材料有層次，工具箱收合；加新視覺不增加 CTA | UI-01、沿用 UAT-24/56 |
| R3 | 房間成為主要場景、角色清楚在其中；顯示目前的小任務與歌曲累積的素材，不卡關 | UI-02 |
| R4 | 場景及聊天都使用核可 idle-v2；所有角色可辨，房間使用核可 room base，不增加首屏圖像負擔 | UI-02、UAT-29/57 |
| R5 | 頁首固定便條入口，明確告知可以記字或哼唱；選單/聊天亦可進入，保存返回原處 | UI-03、UAT-13/37 |
| R6 | 操作後才有一張短小火花紙片，先一句話，點開再看解釋，收合狀態清楚 | UI-03、UAT-33/58 |

UI-01 已完成，證據與新手說明在 docs/uat/UI-CHANGES.md；獨立 feat(UI-01) 提交。後續按可見改動逐項記錄。

UI-02 已完成：桌面場景／紙頁並排、手機上下排列，五角色保留核可圖，歌曲手記以真實素材呈現進度。UAT-24/25/29/30/57 10/10；新增 UAT-65 2/2。已看桌面與手機實際截圖，修掉混色造成的人物透出背景與手機招牌擋髮型，保持原畫可辨識。獨立 feat(UI-02) 提交。

UI-03 已完成：常駐便條明示文字／哼唱；火花改為有紙膠帶的短卡與明確開合符號，操作後才出現。UAT-13/32/33/37/56/58 兩尺寸 12/12，手機／桌面收合、展開、捕捉截圖皆已檢視。三筆可見改動完成後才做完整回歸；部分重跑期間 ready=false。

### 第 5 輪驗收結果

三個可見改造依序本機提交：6f28983 UI-01、e9befef UI-02、16d3f0b UI-03。完整 run 2026-11-10T00-35-47-150Z 一次 130/130 通過，沒有拼接多輪 pass；130 份非空截圖皆已核對，ready=true。build pass、selftest 50/50；六份核可來源與六份 WebP 雜湊均一致。全綠後長歌名／深色模式／捲動捕捉探索兩尺寸通過，沒有新增缺失；證據與新手說明在 UI-CHANGES.md。

本輪清理限制：4102 自動關閉；4101 手動 preview 仍執行。啟動時未保留工具 session ID，無法定向停止；已如實記於 UAT-STATUS.json，沒有以廣域 kill 影響其他程序。僅本機 commit，沒有 push、remote 修改、部署或 tunnel 操作。

## 第 6 輪：創作地圖與夥伴的小任務

使用者已授權直接逐項改造；以既有 React/CSS、核可 WebP 與本地字體延伸，不新增套件或素材。已使用 brainstorming、writing-plans、executing-plans、test-driven-development 與 verification-before-completion 工作流程；本輪計畫接在指定清單，不另要求設計批准。起始正確本機 index 乾淨，B merge 為 Already up to date。

- [x] UI-04 / R1、R2、R3、R4：工作室選單成為紙本創作地圖，三個淡彩區域與九個可自由拜訪的工作檯，使用核可角色縮圖。只一處標示「你在這裡」，其餘不爭主次；維持原有所有導航、版本、捕捉及鍵盤操作。UAT-66 驗收：可從地圖直接去歌詞，寫字後重開／重整仍正確標示現在的檯；九檯皆可使用，手機無溢出。桌面手機截圖 A-UI-04-*。
- [x] UI-05 / R2、R3、R5、R6：場景旁新增一張簡短任務便箋，顯示目前角色陪你做的事與第一個尚缺素材；素材齊全才溫和提示可以前往下一檯，並提醒隨時可回來。沒有新增行動按鈕或強制順序。UAT-67 驗收：構想選情緒、填自己的句子時任務即時變化，換歌詞時換成作詞人的任務；重整保留，不受一主動作／捕捉／知識收合影響。桌面手機截圖 A-UI-05-*。
- [x] 每項先紅→綠測試、實看兩尺寸截圖、更新 UI-CHANGES.md 並 feat(UI-xx) 本機提交；最後 build、selftest 與完整 E2E。部分通過 ready=false，完整全綠後才 true。完成後做新手探索，關閉自己啟動的 server。

選擇在原選單呈現地圖，避免佔用每檯工作區或新增常駐導航。任務使用現有 requirements，確保缺項提示與前進條件一致；核可素材不重畫，角色縮圖只在選單打開時載入。

UI-04：UAT-66 桌面／手機紅→綠，與 UAT-01/24/31/37 共 10/10。已看兩尺寸實際截圖，地圖自由跳檯、原詞保存、嵌套捕捉與鍵盤焦點維持。新增素材請求僅在打開選單時發生。

UI-05：UAT-67 兩尺寸紅→綠，UAT-24/33/56/58/65/67 共 12/12；補強手機小字與截圖捲動位置後 UAT-65/66/67 共 6/6。已看手機首頁、手機構想完成、桌面構想完成。任務只列第一缺項，清空文字即恢復；沒有額外 CTA，核可圖檔不變。

UI-06 / R1、UAT-66/67：獨立唯讀 reviewer 找到小字對比不足；Chrome 重現 3.12/3.83/3.36:1，加深當前地圖小字與任務完成文字後，手機／桌面、light／dark 全部超過4.5:1（地圖10.14/9.33、任務6.19/8.14）。已看實際截圖，reviewer 複查唯一 Important 已解決、無其他重大項。沒有新增布局與互動。

首次完整134次為132/134，兩個UAT-16因新的具名任務status與既有toast的廣泛定位衝突，非儲存復原失效。已讀trace並限定toast斷言，原錯誤文字與完整復原檢查不變；與UAT-49/60/67共8/8。保留完整失敗證據，等待最終完整重跑。

UI-07 / R2、R3、UAT-68：自由跳到空白混音時，任務叫播放、主按鈕卻叫寫旋律；空白總檢討只寫評語就顯示完成。兩尺寸實際操作已重現並存 A-UI-07-before-*。驗收：混音先提示副歌旋律，空白總檢討即使有評語仍提示先留聲音；主按鈕可直達素材檯。留下和弦後才顯示可聽草稿的任務完成狀態。保持自由跳檯和唯一 CTA，不改既有作品前進條件。

UI-07：UAT-68兩尺寸紅→綠，與UAT-16/36/54/67共10/10；已檢視手機混音、桌面總檢討。獨立 reviewer 複查前置與實際播放條件一致、原ready/next不變、測試不弱化，沒有新的Critical/Important。此項獨立feat(UI-07)提交後做最終136次完整矩陣。

### 第 6 輪最終交付

- UI-04/05/06/07各自feat提交，UAT-16定位修正獨立fix提交，所有截圖及新手說明在UI-CHANGES.md。
- 完整run2026-11-10T01-02-26-844Z一次136/136、0fail、0blocked；R1–R6、新手P0→P2及新增地圖／任務／自由跳檯全部pass，ready=true。首次132/134保留，不拼多輪結果。
- build pass，最終selftest50/50；136張非空案例證據與核可12份雜湊核對；獨立審查無未結Critical/Important。
- 全綠後長歌名／深色地圖／自由跳檯／捲動捕捉／重整原詞兩尺寸探索pass，無新缺失，已看截圖。
- 自啟4101與4102均停止；未push、改remote、動deploy或tunnel。保留目前分支與worktree；本機metadata仍透過scripts/git-local.sh。真機／Safari／真LLM待使用者驗收。
