# Session B 接續紀錄

2026-11-10 00:00 台北時間，第 1 輪結束。

- 起始合併 A：f4c7153，當時兩分支相同，merge 回報 Already up to date。保留起始未提交修正為 b42f3d8。
- 已有 27 個 UAT 案例，Chrome 桌面／手機完整矩陣 54 次：50 pass、4 fail、0 blocked。失敗只出現在 UAT-24、UAT-25 的兩 viewport；詳見 failures.md，交 session A。
- 已修功能：麥克風拒絕後可跳過、錄音中保存不漏附件、媒體寫入錯誤復原、專案／靈感／版本破損資料、Demo 版本命名、換檯取消全部聲音與延遲播放、首次離線重開與其他 cache 保護、損壞語音 metadata 白屏。每個功能修復獨立本機 commit。
- 探索式測試新增 UAT-26／27；獨立唯讀審查再補 UAT-20 metadata 重現與 UAT-14 真播放斷言。修復都看過紅燈→綠燈；沒有放寬 R2/R4 來通過。
- 最終完整 run：2026-11-09T15-58-20-631Z。54 份每案例截圖都存在，另有主流程每檯、R2 每檯、R4 每角色截圖和失敗 traces。前幾輪證據 fixture 缺口已如實記錄在各輪 results.json；最終輪修復且完整。
- npm run selftest：14/14 通過。npm run build：通過，包含 offline build assets；既有動態／靜態共同 import 的 chunk 警告仍在，未影響 build。
- 最後驗證 localhost:4111 無 listener，沒有留下自己啟動的伺服器。沒有 push、remote 修改、部署、tunnel 或真 API 金鑰。
- 本環境原 linked worktree index 唯讀，使用 scripts/git-local.sh；普通 git status 會讀到舊 index。詳見 LOCAL-TEST.md，請勿因此 reset 或刪檔。

下一輪：先看本文件、git log、以 scripts/git-local.sh status 查看正確狀態，執行 scripts/git-local.sh merge --no-edit codex/burn-a；保留雙方功能解衝突。A 修好後重跑 UAT-24／25、人工確認人物參考與 R1/R3/R6 視覺，再跑完整 npm run test:e2e。OPEN 視覺缺失未結之前不得 ready_for_user_test=true。前輪 B-07 去抖／併發指示保留為後續探索驗證項，不可把本輪通過案例擴大宣稱為所有工程問題已修完。
