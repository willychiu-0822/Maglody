# Maglody UAT 執行結果

台北時間：2026-11-13 15:55；run：2026-11-13T07-33-32-592Z。

166 次執行：PASS 161／FAIL 5／BLOCKED 0。ready_for_user_test=false。

Chrome；desktop 1280x800/mobile 390x844；run=2026-11-13T07-33-32-592Z；完整矩陣；Web Audio 實際播放、麥克風假裝置、LLM 本機教練，實機/API 未驗證。各次歷史見 [evidence](evidence/)，功能修復與視覺交接見 [failures.md](failures.md)。每次執行有獨立 results.json，不覆蓋舊證據。

## 執行歷史與判讀（2026-11-13，誠實記錄）

- run1 `2026-11-13T06-38-44-476Z`：完整矩陣 166/166 一次全綠（原斷言、原期限未改；依 UAT-RUNS.json）。failures.md 內的「162/162」是矩陣尚為 162 項時的舊數字。
- run2 `06-43-53`（158/166）、run3 `07-18-24`（164/166）、run4 `07-33-32`（161/166）：各有數項 `locator.click` 或 predicate 逾時（例如 UAT-03/04 mobile，log 為 element is not stable），判為主機資源停頓；定向重跑（targeted-33-74、rerun-failed-*）皆通過。下方表格是最後一次（run4，161/166）的原樣結果，未改成 pass。
- deploy 的 MIME 檢查（e2e/deploy-assets.spec.ts）改用 `playwright.deploy.config.ts`，4/4 通過；一般設定以 testIgnore 排除。
- 之後如需再跑：workers=1、只跑一次，不再追穩定度。
- 每次 run 的逐例截圖資料夾（體積約 6.8GB）未提交，只提交固定檔名的代表截圖，故下表連結指向的 run 資料夾僅在本機。

| 案例 | Viewport | 結果 | 失敗原因 | 截圖 |
|---|---|---|---|---|
| UAT-01 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-01.png) |
| UAT-01 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-01.png) |
| UAT-02 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-02.png) |
| UAT-02 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-02.png) |
| UAT-03 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-03.png) |
| UAT-03 | mobile | fail | TimeoutError: locator.click: Timeout 8000ms exceeded.<br>Call log:<br>  - waiting for locator('.mood').nth(1)<br>    - locator resolved to <button class="mood " aria-label="溫暖療癒" aria-pressed="false" data-recommended="true">…</button><br>  - attempting click action<br>    2 × waiting for element to be visible, enabled and stable<br>      - element is not stable<br>    - retrying click action<br>    - waiting 20ms<br>    2 × waiting for element to be visible, enabled and stable<br>      - element is not stable<br>    - retrying click action<br>      - waiting 100ms<br>    - waiting for element to be visible, enabled and stable<br> | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-03.png) |
| UAT-04 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-04.png) |
| UAT-04 | mobile | fail | Error: expect(received).not.toBeNull()<br><br>Received: null<br><br>Call Log:<br>- Timeout 7000ms exceeded while waiting on the predicate | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-04.png) |
| UAT-05 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-05.png) |
| UAT-05 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-05.png) |
| UAT-06 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-06.png) |
| UAT-06 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-06.png) |
| UAT-07 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-07.png) |
| UAT-07 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-07.png) |
| UAT-08 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-08.png) |
| UAT-08 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-08.png) |
| UAT-09 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-09.png) |
| UAT-09 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-09.png) |
| UAT-10 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-10.png) |
| UAT-10 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-10.png) |
| UAT-11 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-11.png) |
| UAT-11 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-11.png) |
| UAT-12 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-12.png) |
| UAT-12 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-12.png) |
| UAT-13 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-13.png) |
| UAT-13 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-13.png) |
| UAT-14 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-14.png) |
| UAT-14 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-14.png) |
| UAT-15 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-15.png) |
| UAT-15 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-15.png) |
| UAT-16 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-16.png) |
| UAT-16 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-16.png) |
| UAT-17 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-17.png) |
| UAT-17 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-17.png) |
| UAT-18 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-18.png) |
| UAT-18 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-18.png) |
| UAT-19 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-19.png) |
| UAT-19 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-19.png) |
| UAT-20 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-20.png) |
| UAT-20 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-20.png) |
| UAT-21 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-21.png) |
| UAT-21 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-21.png) |
| UAT-22 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-22.png) |
| UAT-22 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-22.png) |
| UAT-23 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-23.png) |
| UAT-23 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-23.png) |
| UAT-24 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-24.png) |
| UAT-24 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-24.png) |
| UAT-25 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-25.png) |
| UAT-25 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-25.png) |
| UAT-26 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-26.png) |
| UAT-26 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-26.png) |
| UAT-27 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-27.png) |
| UAT-27 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-27.png) |
| UAT-28 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-28.png) |
| UAT-28 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-28.png) |
| UAT-29 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-29.png) |
| UAT-29 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-29.png) |
| UAT-30 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-30.png) |
| UAT-30 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-30.png) |
| UAT-31 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-31.png) |
| UAT-31 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-31.png) |
| UAT-32 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-32.png) |
| UAT-32 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-32.png) |
| UAT-33 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-33.png) |
| UAT-33 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-33.png) |
| UAT-34 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-34.png) |
| UAT-34 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-34.png) |
| UAT-35 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-35.png) |
| UAT-35 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-35.png) |
| UAT-36 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-36.png) |
| UAT-36 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-36.png) |
| UAT-37 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-37.png) |
| UAT-37 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-37.png) |
| UAT-38 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-38.png) |
| UAT-38 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-38.png) |
| UAT-39 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-39.png) |
| UAT-39 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-39.png) |
| UAT-40 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-40.png) |
| UAT-40 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-40.png) |
| UAT-41 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-41.png) |
| UAT-41 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-41.png) |
| UAT-42 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-42.png) |
| UAT-42 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-42.png) |
| UAT-43 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-43.png) |
| UAT-43 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-43.png) |
| UAT-44 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-44.png) |
| UAT-44 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-44.png) |
| UAT-45 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-45.png) |
| UAT-45 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-45.png) |
| UAT-46 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-46.png) |
| UAT-46 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-46.png) |
| UAT-47 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-47.png) |
| UAT-47 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-47.png) |
| UAT-48 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-48.png) |
| UAT-48 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-48.png) |
| UAT-49 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-49.png) |
| UAT-49 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-49.png) |
| UAT-50 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-50.png) |
| UAT-50 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-50.png) |
| UAT-51 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-51.png) |
| UAT-51 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-51.png) |
| UAT-52 | desktop | fail | Error: expect(received).toBeTruthy()<br><br>Received: false<br><br>Call Log:<br>- Timeout 32000ms exceeded while waiting on the predicate | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-52.png) |
| UAT-52 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-52.png) |
| UAT-53 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-53.png) |
| UAT-53 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-53.png) |
| UAT-54 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-54.png) |
| UAT-54 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-54.png) |
| UAT-55 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-55.png) |
| UAT-55 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-55.png) |
| UAT-56 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-56.png) |
| UAT-56 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-56.png) |
| UAT-57 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-57.png) |
| UAT-57 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-57.png) |
| UAT-58 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-58.png) |
| UAT-58 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-58.png) |
| UAT-59 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-59.png) |
| UAT-59 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-59.png) |
| UAT-60 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-60.png) |
| UAT-60 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-60.png) |
| UAT-61 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-61.png) |
| UAT-61 | mobile | fail | TimeoutError: locator.click: Timeout 8000ms exceeded.<br>Call log:<br>  - waiting for locator('.presence')<br>    - locator resolved to <button class="presence" aria-label="跟作曲家聊">…</button><br>  - attempting click action<br>    2 × waiting for element to be visible, enabled and stable<br>      - element is not stable<br>    - retrying click action<br>    - waiting 20ms<br>    - waiting for element to be visible, enabled and stable<br> | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-61.png) |
| UAT-62 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-62.png) |
| UAT-62 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-62.png) |
| UAT-63 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-63.png) |
| UAT-63 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-63.png) |
| UAT-64 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-64.png) |
| UAT-64 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-64.png) |
| UAT-65 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-65.png) |
| UAT-65 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-65.png) |
| UAT-66 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-66.png) |
| UAT-66 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-66.png) |
| UAT-67 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-67.png) |
| UAT-67 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-67.png) |
| UAT-68 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-68.png) |
| UAT-68 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-68.png) |
| UAT-69 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-69.png) |
| UAT-69 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-69.png) |
| UAT-70 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-70.png) |
| UAT-70 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-70.png) |
| UAT-71 | desktop | fail | Test timeout of 45000ms exceeded. \| TimeoutError: locator.click: Timeout 8000ms exceeded.<br>Call log:<br>  - waiting for getByRole('group', { name: '素材手記', exact: true }).getByText('翻開素材手記', { exact: true })<br>    - locator resolved to <span>翻開素材手記</span><br>  - attempting click action<br>    - waiting for element to be visible, enabled and stable<br> | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-71.png) |
| UAT-71 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-71.png) |
| UAT-72 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-72.png) |
| UAT-72 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-72.png) |
| UAT-73 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-73.png) |
| UAT-73 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-73.png) |
| UAT-74 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-74.png) |
| UAT-74 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-74.png) |
| UAT-75 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-75.png) |
| UAT-75 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-75.png) |
| UAT-76 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-76.png) |
| UAT-76 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-76.png) |
| UAT-77 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-77.png) |
| UAT-77 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-77.png) |
| UAT-78 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-78.png) |
| UAT-78 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-78.png) |
| UAT-79 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-79.png) |
| UAT-79 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-79.png) |
| UAT-80 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-80.png) |
| UAT-80 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-80.png) |
| UAT-81 | desktop | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/desktop/UAT-81.png) |
| UAT-81 | mobile | pass |  | [截圖](evidence/2026-11-13T07-33-32-592Z/mobile/UAT-81.png) |
| 空白歌曲的暖嗓音不會假稱來自旋律 | desktop | pass |  | 未產生 |
| 空白歌曲的暖嗓音不會假稱來自旋律 | mobile | pass |  | 未產生 |
| 部署伺服器的每個工作檯圖片和背景都能載入 | desktop | pass |  | 未產生 |
| 部署伺服器的每個工作檯圖片和背景都能載入 | mobile | pass |  | 未產生 |
