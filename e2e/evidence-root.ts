// 驗收截圖、trace 與狀態檔的落點（審查報告 M-05）。
// 預設全部寫到 test-results/（已被 git 忽略），跑一次測試不會弄髒任何已追蹤的檔案。
// 只有明確帶 UAT_RECORD=1 才寫進 docs/uat/ 並更新 UAT-STATUS.json、UAT-RUNS.json、UAT-RESULTS.md。
export const RECORD = process.env.UAT_RECORD === '1'
export const evidenceRoot = RECORD ? 'docs/uat/evidence' : 'test-results/uat-evidence'
