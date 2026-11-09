# 本機親自試用

不需要金鑰或雲端。開發模式預設使用離線 mock 角色，資料存在此瀏覽器。

```bash
npm install
npm run dev -- --host localhost --port 4101 --strictPort
```

瀏覽器打開 http://localhost:4101，完成後在終端機按 Ctrl+C 關閉。若 4101 正在使用，可明確指定 4103–4109；4102 留給 E2E，不可自動漂移到其他埠號。建議先開新的瀏覽器設定檔，保護自己的既有歌曲。

新手手動旅程：按「沒有麥克風？聽示範」→構想選情緒留一句話→和聲各排主副歌→旋律各匯入哼唱→主副歌詞各寫兩句（副歌包含構想那句）→排骨架、讓副歌加鼓與貝斯→錄音可測音量或先跳過→混音播放、把主旋律調清楚→總檢討寫評語、下載 MIDI。任一檯右上角可記靈感，點夥伴可切五角色。手機可用瀏覽器裝置工具設 390×844。

## 自動驗收

```bash
npm run test:e2e
```

E2E 自行 build、啟動 production preview 4102、使用系統 Chrome，執行後關閉它啟動的 server。請先關閉佔用 4102 的手動 server。E2E 不會下載瀏覽器；錄音用 Chrome 假裝置，API 用 mock。新結果在 UAT-RESULTS.md / UAT-STATUS.json，每輪證據在 evidence/。

另跑舊手機 selftest：先 `npm run build`，在另一終端啟動 `npm run preview -- --host 127.0.0.1 --port 4101 --strictPort`，再執行 `npm run selftest`，結束關閉該 preview。

## 本機 Git 環境

本沙箱把原 linked worktree 的 HEAD/index 目錄掛成唯讀，普通 `git merge` / `git commit` 會失敗。A/B 各自在其目前目錄 `.uat-git`（被忽略）保留可寫的 HEAD/index，共用原專案 objects/refs，不更動 remote；本機 commits 仍更新各自的 codex/burn-a 或 codex/burn-b 分支。

Session A 請用 `./scripts/git-local.sh status`、`./scripts/git-local.sh merge --no-edit codex/burn-b`、`./scripts/git-local.sh add <files>`、`./scripts/git-local.sh commit ...`。普通 `git status` 會讀到舊的唯讀 index，出現假的 staged 刪除／修改，不能據此 reset 或刪除檔案。一般可寫環境不需要這個暫存 index；不要把 `.uat-git/` 提交。

## 限制與放行

R2/R4 原視覺缺失已關閉，核可圖的對照與證據見 failures.md、../design.md；當前可否試用仍以最新 UAT-STATUS.json 的完整矩陣結果為準。Chrome 手機寬度不等於實體 iPhone/Safari 驗證；真人錄音、真 API 回覆品質需另行驗證。此次沒有部署或 tunnel。
