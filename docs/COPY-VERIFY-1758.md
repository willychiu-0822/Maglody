# 文案核對（第 12 輪，未完成）

改前和改後各拍了九個工作檯的空白初始畫面，桌面 1280×800、手機 390×844。路徑中的編號依序為哼唱解析、構想、和聲、旋律、歌詞、編曲、錄音準備、混音觀念、總檢討。這批改動出現在互動後的離線回覆，空白畫面不能證明改寫後的對話呈現；尚需觸發每個事件及錯誤，再逐張看圖。

| 頁 | 改前桌面／手機 | 改後桌面／手機 | 人工核對 |
| --- | --- | --- | --- |
| 哼唱解析 | [desktop](uat/evidence/copy-1758/before/desktop-1.png)／[mobile](uat/evidence/copy-1758/before/mobile-1.png) | [desktop](uat/evidence/copy-1758/after/desktop-1.png)／[mobile](uat/evidence/copy-1758/after/mobile-1.png) | 手機初始頁已看；任務文字「完成一段哼唱分析」仍生硬。 |
| 構想 | [desktop](uat/evidence/copy-1758/before/desktop-2.png)／[mobile](uat/evidence/copy-1758/before/mobile-2.png) | [desktop](uat/evidence/copy-1758/after/desktop-2.png)／[mobile](uat/evidence/copy-1758/after/mobile-2.png) | 尚未逐張人工審閱。 |
| 和聲 | [desktop](uat/evidence/copy-1758/before/desktop-3.png)／[mobile](uat/evidence/copy-1758/before/mobile-3.png) | [desktop](uat/evidence/copy-1758/after/desktop-3.png)／[mobile](uat/evidence/copy-1758/after/mobile-3.png) | 尚未逐張人工審閱。 |
| 旋律 | [desktop](uat/evidence/copy-1758/before/desktop-4.png)／[mobile](uat/evidence/copy-1758/before/mobile-4.png) | [desktop](uat/evidence/copy-1758/after/desktop-4.png)／[mobile](uat/evidence/copy-1758/after/mobile-4.png) | 尚未逐張人工審閱。 |
| 歌詞 | [desktop](uat/evidence/copy-1758/before/desktop-5.png)／[mobile](uat/evidence/copy-1758/before/mobile-5.png) | [desktop](uat/evidence/copy-1758/after/desktop-5.png)／[mobile](uat/evidence/copy-1758/after/mobile-5.png) | 尚未逐張人工審閱。 |
| 編曲 | [desktop](uat/evidence/copy-1758/before/desktop-6.png)／[mobile](uat/evidence/copy-1758/before/mobile-6.png) | [desktop](uat/evidence/copy-1758/after/desktop-6.png)／[mobile](uat/evidence/copy-1758/after/mobile-6.png) | 尚未逐張人工審閱。 |
| 錄音準備 | [desktop](uat/evidence/copy-1758/before/desktop-7.png)／[mobile](uat/evidence/copy-1758/before/mobile-7.png) | [desktop](uat/evidence/copy-1758/after/desktop-7.png)／[mobile](uat/evidence/copy-1758/after/mobile-7.png) | 尚未逐張人工審閱。 |
| 混音觀念 | [desktop](uat/evidence/copy-1758/before/desktop-8.png)／[mobile](uat/evidence/copy-1758/before/mobile-8.png) | [desktop](uat/evidence/copy-1758/after/desktop-8.png)／[mobile](uat/evidence/copy-1758/after/mobile-8.png) | 尚未逐張人工審閱。 |
| 總檢討 | [desktop](uat/evidence/copy-1758/before/desktop-9.png)／[mobile](uat/evidence/copy-1758/before/mobile-9.png) | [desktop](uat/evidence/copy-1758/after/desktop-9.png)／[mobile](uat/evidence/copy-1758/after/mobile-9.png) | 尚未逐張人工審閱。 |

## 本批及剩餘問題

- 離線回饋移除「你做到了」固定評語；構想與錄音知識不再把建議寫成唯一答案；最後一檯不預設已完成第一首歌。尚未拍下觸發這些台詞的前後圖。
- 來源搜尋共 907 行候選，混有註解與程式資料，尚未逐行人工判讀；英文、動態組合、錯誤及真實 LLM 輸出亦待覆核。全站重寫尚未完成。
- `scripts/deploy-serve.mjs` 不存在於此工作樹及目前 HEAD，尚未補部署服務或部署服務 E2E。需先確認真正部署入口。
- 本輪僅定向跑 UAT-53、58，雙尺寸共 4/4 通過；完整矩陣未重跑，不能放行。selftest 遇長時間執行停頓後中止，不能當通過。
