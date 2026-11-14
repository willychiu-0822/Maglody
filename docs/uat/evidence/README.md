# 驗收截圖與 trace

這個資料夾只放在自己的電腦上，**不進 git**（`.gitignore` 已排除，只留這份說明）。

- 原本這裡有 9,838 個檔（約 5.6 GiB：9,585 張 PNG、144 個 trace zip），讓 repo 大到 2 GiB 以上。2026-11-15 起停止追蹤（審查報告 M-05）；歷史紀錄裡仍然查得到。
- 跑 `UAT_RECORD=1 npm run test:e2e` 才會把截圖與 trace 寫到這裡，並更新 `docs/uat/` 底下的狀態檔。不帶旗標跑，一切寫到 `test-results/`，不動任何已追蹤的檔案。
- 報告真的要引用的圖，挑少數代表，壓成 WebP 放在報告旁邊（例如 `docs/audit-20261114/`）。
