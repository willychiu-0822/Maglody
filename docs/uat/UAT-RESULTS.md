# Maglody UAT 執行結果

台北時間：2026-11-13 19:01；run：matrix-1113-evening。

164 次執行：PASS 160／FAIL 4／BLOCKED 0。ready_for_user_test=false。

Chrome；desktop 1280x800/mobile 390x844；run=matrix-1113-evening；完整矩陣；Web Audio 實際播放、麥克風假裝置、LLM 本機教練，實機/API 未驗證。各次歷史見 [evidence](evidence/)，功能修復與視覺交接見 [failures.md](failures.md)。每次執行有獨立 results.json，不覆蓋舊證據。

## 執行歷史與判讀（2026-11-13，誠實記錄）

- run1 `2026-11-13T06-38-44-476Z`：完整矩陣 166/166 一次全綠（原斷言、原期限未改；依 UAT-RUNS.json）。
- run2 `06-43-53`（158/166）、run3 `07-18-24`（164/166）、run4 `07-33-32`（161/166）：各有數項 `locator.click` 或 predicate 逾時，每次失敗的案例不同，定向重跑（targeted-33-74、rerun-failed-*）皆通過，判為主機資源停頓。
- 晚間 `matrix-1113-evening`（19:01，UI 稽核修改之後，workers=1、只跑一次）：UAT 列 164 項，160 過、4 敗。下方表格是這次的原樣結果，沒有改成 pass。
  - UAT-63 desktop＋mobile：兩個 viewport 都敗，是測試與畫面真的不一致，不是主機停頓。原因：夥伴聊天的空狀態在這個分支改成夥伴自己的開場白（`.msg.chat-empty`），測試仍斷言開新歌後 `.msg` 為 0。處理與定向重跑結果見本節最後一點。
  - UAT-04 desktop（predicate 7 秒逾時）、UAT-34 desktop（`page.screenshot` 撞到 45 秒測試期限）：同案例 mobile 通過，型態與先前的主機停頓相同；這次沒有定向重跑，維持 fail 紀錄。
  - 案例數從 166 變 164：deploy 圖片載入與 MIME 檢查（`e2e/deploy-assets.spec.ts`）整檔改由 `playwright.deploy.config.ts` 執行（下午 4/4 通過），主矩陣以 testIgnore 排除。
- 每次 run 的逐例截圖資料夾未提交（單次約 180MB 以上），只提交固定檔名的代表截圖，故下表連結指向的 run 資料夾僅在本機。
- 之後如需再跑：workers=1、只跑一次，不再追穩定度。
- 收尾定向重跑 `rerun-wrapup-1114`（2026-11-14，workers=1、只跑一次，build 版、含 MIDI 草稿的程式）：
  - UAT-63：測試期待已在 454420b 改為「舊訊息清空（`.msg:not(.chat-empty)` 為 0）＋夥伴開場白在（`.msg.chat-empty` 為 1）」，其餘斷言（輸入清空、無等待、舊答不入新歌）未動。desktop、mobile 皆 pass。這是測試期待跟上產品文案，不是產品行為被放寬。
  - UAT-04、UAT-34：desktop、mobile 皆 pass（各 2.4–3.8 秒），晚間的逾時沒有重現，與先前「主機停頓」判讀一致；原斷言與期限都沒改。
  - 這 6 次只是部分重跑，下方表格仍是晚間矩陣的原樣結果（160/164），沒有被改寫。截圖：[04 desktop](evidence/rerun-wrapup-1114/desktop/UAT-04.png)、[34 desktop](evidence/rerun-wrapup-1114/desktop/UAT-34.png)、[63 desktop](evidence/rerun-wrapup-1114/desktop/UAT-63.png)、[63 mobile](evidence/rerun-wrapup-1114/mobile/UAT-63.png)。
  - **ready_for_user_test 維持 false**：晚間完整矩陣在 MIDI 草稿（MiniLab 37 輸入、Ableton 匯出、Melody／Review 畫面變動）合入之前跑的，合入後沒有完整重跑；只有定向 6 次與 33 項單元測試、build 通過。要設 true，需在最終程式上完整跑一次 164 項全過。

| 案例 | Viewport | 結果 | 失敗原因 | 截圖 |
|---|---|---|---|---|
| UAT-01 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-01.png) |
| UAT-01 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-01.png) |
| UAT-02 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-02.png) |
| UAT-02 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-02.png) |
| UAT-03 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-03.png) |
| UAT-03 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-03.png) |
| UAT-04 | desktop | fail | Error: expect(received).not.toBeNull()<br><br>Received: null<br><br>Call Log:<br>- Timeout 7000ms exceeded while waiting on the predicate | [截圖](evidence/matrix-1113-evening/desktop/UAT-04.png) |
| UAT-04 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-04.png) |
| UAT-05 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-05.png) |
| UAT-05 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-05.png) |
| UAT-06 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-06.png) |
| UAT-06 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-06.png) |
| UAT-07 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-07.png) |
| UAT-07 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-07.png) |
| UAT-08 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-08.png) |
| UAT-08 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-08.png) |
| UAT-09 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-09.png) |
| UAT-09 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-09.png) |
| UAT-10 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-10.png) |
| UAT-10 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-10.png) |
| UAT-11 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-11.png) |
| UAT-11 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-11.png) |
| UAT-12 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-12.png) |
| UAT-12 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-12.png) |
| UAT-13 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-13.png) |
| UAT-13 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-13.png) |
| UAT-14 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-14.png) |
| UAT-14 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-14.png) |
| UAT-15 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-15.png) |
| UAT-15 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-15.png) |
| UAT-16 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-16.png) |
| UAT-16 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-16.png) |
| UAT-17 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-17.png) |
| UAT-17 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-17.png) |
| UAT-18 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-18.png) |
| UAT-18 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-18.png) |
| UAT-19 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-19.png) |
| UAT-19 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-19.png) |
| UAT-20 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-20.png) |
| UAT-20 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-20.png) |
| UAT-21 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-21.png) |
| UAT-21 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-21.png) |
| UAT-22 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-22.png) |
| UAT-22 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-22.png) |
| UAT-23 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-23.png) |
| UAT-23 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-23.png) |
| UAT-24 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-24.png) |
| UAT-24 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-24.png) |
| UAT-25 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-25.png) |
| UAT-25 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-25.png) |
| UAT-26 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-26.png) |
| UAT-26 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-26.png) |
| UAT-27 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-27.png) |
| UAT-27 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-27.png) |
| UAT-28 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-28.png) |
| UAT-28 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-28.png) |
| UAT-29 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-29.png) |
| UAT-29 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-29.png) |
| UAT-30 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-30.png) |
| UAT-30 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-30.png) |
| UAT-31 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-31.png) |
| UAT-31 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-31.png) |
| UAT-32 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-32.png) |
| UAT-32 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-32.png) |
| UAT-33 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-33.png) |
| UAT-33 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-33.png) |
| UAT-34 | desktop | fail | Test timeout of 45000ms exceeded. \| Error: page.screenshot: Test timeout of 45000ms exceeded.<br>Call log:<br>  - taking page screenshot<br>    - disabled all CSS animations<br>  - waiting for fonts to load...<br>  - fonts loaded<br> | [截圖](evidence/matrix-1113-evening/desktop/UAT-34.png) |
| UAT-34 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-34.png) |
| UAT-35 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-35.png) |
| UAT-35 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-35.png) |
| UAT-36 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-36.png) |
| UAT-36 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-36.png) |
| UAT-37 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-37.png) |
| UAT-37 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-37.png) |
| UAT-38 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-38.png) |
| UAT-38 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-38.png) |
| UAT-39 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-39.png) |
| UAT-39 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-39.png) |
| UAT-40 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-40.png) |
| UAT-40 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-40.png) |
| UAT-41 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-41.png) |
| UAT-41 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-41.png) |
| UAT-42 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-42.png) |
| UAT-42 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-42.png) |
| UAT-43 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-43.png) |
| UAT-43 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-43.png) |
| UAT-44 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-44.png) |
| UAT-44 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-44.png) |
| UAT-45 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-45.png) |
| UAT-45 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-45.png) |
| UAT-46 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-46.png) |
| UAT-46 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-46.png) |
| UAT-47 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-47.png) |
| UAT-47 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-47.png) |
| UAT-48 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-48.png) |
| UAT-48 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-48.png) |
| UAT-49 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-49.png) |
| UAT-49 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-49.png) |
| UAT-50 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-50.png) |
| UAT-50 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-50.png) |
| UAT-51 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-51.png) |
| UAT-51 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-51.png) |
| UAT-52 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-52.png) |
| UAT-52 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-52.png) |
| UAT-53 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-53.png) |
| UAT-53 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-53.png) |
| UAT-54 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-54.png) |
| UAT-54 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-54.png) |
| UAT-55 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-55.png) |
| UAT-55 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-55.png) |
| UAT-56 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-56.png) |
| UAT-56 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-56.png) |
| UAT-57 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-57.png) |
| UAT-57 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-57.png) |
| UAT-58 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-58.png) |
| UAT-58 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-58.png) |
| UAT-59 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-59.png) |
| UAT-59 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-59.png) |
| UAT-60 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-60.png) |
| UAT-60 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-60.png) |
| UAT-61 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-61.png) |
| UAT-61 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-61.png) |
| UAT-62 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-62.png) |
| UAT-62 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-62.png) |
| UAT-63 | desktop | fail | Error: expect(locator).toHaveCount(expected) failed<br><br>Locator:  locator('.msg')<br>Expected: 0<br>Received: 1<br>Timeout:  7000ms<br><br>Call log:<br>  - Expect "soft toHaveCount" locator('.msg') with timeout 7000ms<br>  - waiting for locator('.msg')<br>    18 × locator resolved to 1 element<br>       - unexpected value "1"<br> | [截圖](evidence/matrix-1113-evening/desktop/UAT-63.png) |
| UAT-63 | mobile | fail | Error: expect(locator).toHaveCount(expected) failed<br><br>Locator:  locator('.msg')<br>Expected: 0<br>Received: 1<br>Timeout:  7000ms<br><br>Call log:<br>  - Expect "soft toHaveCount" locator('.msg') with timeout 7000ms<br>  - waiting for locator('.msg')<br>    18 × locator resolved to 1 element<br>       - unexpected value "1"<br> | [截圖](evidence/matrix-1113-evening/mobile/UAT-63.png) |
| UAT-64 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-64.png) |
| UAT-64 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-64.png) |
| UAT-65 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-65.png) |
| UAT-65 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-65.png) |
| UAT-66 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-66.png) |
| UAT-66 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-66.png) |
| UAT-67 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-67.png) |
| UAT-67 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-67.png) |
| UAT-68 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-68.png) |
| UAT-68 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-68.png) |
| UAT-69 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-69.png) |
| UAT-69 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-69.png) |
| UAT-70 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-70.png) |
| UAT-70 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-70.png) |
| UAT-71 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-71.png) |
| UAT-71 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-71.png) |
| UAT-72 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-72.png) |
| UAT-72 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-72.png) |
| UAT-73 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-73.png) |
| UAT-73 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-73.png) |
| UAT-74 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-74.png) |
| UAT-74 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-74.png) |
| UAT-75 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-75.png) |
| UAT-75 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-75.png) |
| UAT-76 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-76.png) |
| UAT-76 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-76.png) |
| UAT-77 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-77.png) |
| UAT-77 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-77.png) |
| UAT-78 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-78.png) |
| UAT-78 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-78.png) |
| UAT-79 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-79.png) |
| UAT-79 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-79.png) |
| UAT-80 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-80.png) |
| UAT-80 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-80.png) |
| UAT-81 | desktop | pass |  | [截圖](evidence/matrix-1113-evening/desktop/UAT-81.png) |
| UAT-81 | mobile | pass |  | [截圖](evidence/matrix-1113-evening/mobile/UAT-81.png) |
| 空白歌曲的暖嗓音不會假稱來自旋律 | desktop | pass |  | 未產生 |
| 空白歌曲的暖嗓音不會假稱來自旋律 | mobile | pass |  | 未產生 |
