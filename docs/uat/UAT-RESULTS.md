# Maglody UAT 結果

執行時間：2026-11-10 00:02（台北）

Chrome／離線 mock；手機 390×844、桌面 1280×800。執行：`npm run test:e2e`。25 個旅程案例 × 兩種尺寸 = 50 次驗證。50 pass / 0 fail / 0 blocked。

| 案例 | 尺寸 | 結果 | 證據 |
|---|---|---|---|
| UAT-01 R1 紙墨在手機與桌面可讀且無溢出 | mobile | passed | [A-R1-mobile.png](evidence/A-R1-mobile.png) |
| UAT-02 R4 五位角色圖與對應檯位 | mobile | passed | [A-R4-arranger-mobile.png](evidence/A-R4-arranger-mobile.png), [A-R4-composer-mobile.png](evidence/A-R4-composer-mobile.png), [A-R4-engineer-mobile.png](evidence/A-R4-engineer-mobile.png), [A-R4-lyricist-mobile.png](evidence/A-R4-lyricist-mobile.png), [A-R4-producer-mobile.png](evidence/A-R4-producer-mobile.png) |
| UAT-03 R3 人物待機、回應與減少動畫 | mobile | passed | [A-R3-chat-mobile.png](evidence/A-R3-chat-mobile.png) |
| UAT-04 R2 九檯單一動作與 modal 鍵盤焦點 | mobile | passed | [A-R2-collage-mobile.png](evidence/A-R2-collage-mobile.png), [A-R2-mobile.png](evidence/A-R2-mobile.png) |
| UAT-05 R5 任意檯位捕捉文字且保留原稿 | mobile | passed | [A-R5-hum-saved-mobile.png](evidence/A-R5-hum-saved-mobile.png), [A-R5-mobile.png](evidence/A-R5-mobile.png), [A-R5-modal-mobile.png](evidence/A-R5-modal-mobile.png) |
| UAT-06 R6 動手後才出現火花、主動展開說明 | mobile | passed | [A-R6-open-mobile.png](evidence/A-R6-open-mobile.png), [A-R6-spark-mobile.png](evidence/A-R6-spark-mobile.png) |
| UAT-07 A-01 R5 錄音中直接存檔不能遺失聲音 | mobile | passed | [A-R5-hum-saved-mobile.png](evidence/A-R5-hum-saved-mobile.png) |
| UAT-08 A-04 歌詞不會打字到一半切換段落 | mobile | passed | [A-A04-mobile.png](evidence/A-A04-mobile.png) |
| UAT-09 A-07 空白跳檯仍能先寫旋律、混音與匯出有路徑 | mobile | passed | [A-A07-mobile.png](evidence/A-A07-mobile.png) |
| UAT-10 R5 聊天和選單中可記靈感再回原處 | mobile | passed | [A-R5-modal-mobile.png](evidence/A-R5-modal-mobile.png) |
| UAT-11 A-02 儲存失敗時保留草稿並明示未存 | mobile | passed | [A-A02-mobile.png](evidence/A-A02-mobile.png) |
| UAT-12 A-05 拒絕麥克風回到可重試且能寫文字 | mobile | passed | [A-A05-mobile.png](evidence/A-A05-mobile.png) |
| UAT-13 從示範到自己的第一版 Demo、下載 MIDI 並重整 | mobile | passed | [UAT-13-mobile.png](evidence/UAT-13-mobile.png) |
| UAT-14 存 Demo 版本可還原且名稱不空白 | mobile | passed | [UAT-14-mobile.png](evidence/UAT-14-mobile.png) |
| UAT-15 照片拼貼後刪原靈感仍保留媒體 | mobile | passed | [UAT-15-mobile.png](evidence/UAT-15-mobile.png) |
| UAT-16 權限晚回來時不會偷偷開麥 | mobile | passed | [UAT-16-mobile.png](evidence/UAT-16-mobile.png) |
| UAT-17 長詞句與多段落仍可操作 | mobile | passed | [UAT-17-mobile.png](evidence/UAT-17-mobile.png) |
| UAT-18 試聽的是正在編輯的歌詞段落 | mobile | passed | [UAT-18-mobile.png](evidence/UAT-18-mobile.png) |
| UAT-19 情緒第一次和重播使用相同調式 | mobile | passed | [UAT-19-mobile.png](evidence/UAT-19-mobile.png) |
| UAT-20 靜音不可誤判混好，停止 A/B 後回到自己的混音 | mobile | passed | [UAT-20-mobile.png](evidence/UAT-20-mobile.png) |
| UAT-21 夜晚紙面與減少動畫仍可辨認 | mobile | passed | [UAT-21-mobile.png](evidence/UAT-21-mobile.png) |
| UAT-22 媒體寫入失敗後先救回錄音，再換成哼唱 | mobile | passed | [UAT-22-mobile.png](evidence/UAT-22-mobile.png) |
| UAT-23 沒辨識到音符也能播放原始哼唱，換檯會停止 | mobile | passed | [UAT-23-mobile.png](evidence/UAT-23-mobile.png) |
| UAT-24 錄音裝置提早停止仍可收好聲音 | mobile | passed | [UAT-24-mobile.png](evidence/UAT-24-mobile.png) |
| UAT-25 新手忘記按停止，25 秒後也會關麥並保留分析 | mobile | passed | [UAT-25-mobile.png](evidence/UAT-25-mobile.png) |
| UAT-01 R1 紙墨在手機與桌面可讀且無溢出 | desktop | passed | [A-R1-desktop.png](evidence/A-R1-desktop.png) |
| UAT-02 R4 五位角色圖與對應檯位 | desktop | passed | [A-R4-arranger-desktop.png](evidence/A-R4-arranger-desktop.png), [A-R4-composer-desktop.png](evidence/A-R4-composer-desktop.png), [A-R4-engineer-desktop.png](evidence/A-R4-engineer-desktop.png), [A-R4-lyricist-desktop.png](evidence/A-R4-lyricist-desktop.png), [A-R4-producer-desktop.png](evidence/A-R4-producer-desktop.png) |
| UAT-03 R3 人物待機、回應與減少動畫 | desktop | passed | [A-R3-chat-desktop.png](evidence/A-R3-chat-desktop.png) |
| UAT-04 R2 九檯單一動作與 modal 鍵盤焦點 | desktop | passed | [A-R2-collage-desktop.png](evidence/A-R2-collage-desktop.png), [A-R2-desktop.png](evidence/A-R2-desktop.png) |
| UAT-05 R5 任意檯位捕捉文字且保留原稿 | desktop | passed | [A-R5-desktop.png](evidence/A-R5-desktop.png), [A-R5-hum-saved-desktop.png](evidence/A-R5-hum-saved-desktop.png), [A-R5-modal-desktop.png](evidence/A-R5-modal-desktop.png) |
| UAT-06 R6 動手後才出現火花、主動展開說明 | desktop | passed | [A-R6-open-desktop.png](evidence/A-R6-open-desktop.png), [A-R6-spark-desktop.png](evidence/A-R6-spark-desktop.png) |
| UAT-07 A-01 R5 錄音中直接存檔不能遺失聲音 | desktop | passed | [A-R5-hum-saved-desktop.png](evidence/A-R5-hum-saved-desktop.png) |
| UAT-08 A-04 歌詞不會打字到一半切換段落 | desktop | passed | [A-A04-desktop.png](evidence/A-A04-desktop.png) |
| UAT-09 A-07 空白跳檯仍能先寫旋律、混音與匯出有路徑 | desktop | passed | [A-A07-desktop.png](evidence/A-A07-desktop.png) |
| UAT-10 R5 聊天和選單中可記靈感再回原處 | desktop | passed | [A-R5-modal-desktop.png](evidence/A-R5-modal-desktop.png) |
| UAT-11 A-02 儲存失敗時保留草稿並明示未存 | desktop | passed | [A-A02-desktop.png](evidence/A-A02-desktop.png) |
| UAT-12 A-05 拒絕麥克風回到可重試且能寫文字 | desktop | passed | [A-A05-desktop.png](evidence/A-A05-desktop.png) |
| UAT-13 從示範到自己的第一版 Demo、下載 MIDI 並重整 | desktop | passed | [UAT-13-desktop.png](evidence/UAT-13-desktop.png) |
| UAT-14 存 Demo 版本可還原且名稱不空白 | desktop | passed | [UAT-14-desktop.png](evidence/UAT-14-desktop.png) |
| UAT-15 照片拼貼後刪原靈感仍保留媒體 | desktop | passed | [UAT-15-desktop.png](evidence/UAT-15-desktop.png) |
| UAT-16 權限晚回來時不會偷偷開麥 | desktop | passed | [UAT-16-desktop.png](evidence/UAT-16-desktop.png) |
| UAT-17 長詞句與多段落仍可操作 | desktop | passed | [UAT-17-desktop.png](evidence/UAT-17-desktop.png) |
| UAT-18 試聽的是正在編輯的歌詞段落 | desktop | passed | [UAT-18-desktop.png](evidence/UAT-18-desktop.png) |
| UAT-19 情緒第一次和重播使用相同調式 | desktop | passed | [UAT-19-desktop.png](evidence/UAT-19-desktop.png) |
| UAT-20 靜音不可誤判混好，停止 A/B 後回到自己的混音 | desktop | passed | [UAT-20-desktop.png](evidence/UAT-20-desktop.png) |
| UAT-21 夜晚紙面與減少動畫仍可辨認 | desktop | passed | [UAT-21-desktop.png](evidence/UAT-21-desktop.png) |
| UAT-22 媒體寫入失敗後先救回錄音，再換成哼唱 | desktop | passed | [UAT-22-desktop.png](evidence/UAT-22-desktop.png) |
| UAT-23 沒辨識到音符也能播放原始哼唱，換檯會停止 | desktop | passed | [UAT-23-desktop.png](evidence/UAT-23-desktop.png) |
| UAT-24 錄音裝置提早停止仍可收好聲音 | desktop | passed | [UAT-24-desktop.png](evidence/UAT-24-desktop.png) |
| UAT-25 新手忘記按停止，25 秒後也會關麥並保留分析 | desktop | passed | [UAT-25-desktop.png](evidence/UAT-25-desktop.png) |

## 失敗原因

無。

## 範圍與限制

真實手機麥克風、iOS Safari、PWA 安裝、真 LLM 金鑰與主觀可聽品質仍需產品負責人實機驗證。錄音用 Chrome 假裝置；保存驗證讀取實際 IndexedDB Blob。Git metadata 唯讀，因此本輪尚無 commit，未 push、未部署、未開 tunnel。Session B 分支未提供可讀的 failures.md；這份報告為 A 本機補充，未冒稱 B 已驗收。
