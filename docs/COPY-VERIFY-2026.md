# 文案核對（2026-11-11 20:26，未完成）

靈感本子的錄音與草稿儲存失敗提示已改為口語短句；原文、位置與問題見 [文案盤點](COPY-AUDIT.md)。仍明確提醒錄音尚未收好、內容暫留本頁，以及騰出空間重試或先另存文字。

`npm run build` 通過。`npx playwright test e2e/novice-feedback.spec.ts e2e/resilience.spec.ts --grep 'UAT-60|UAT-16'` 桌面與手機共 4 項通過，涵蓋錄音儲存失敗後另存文字與重試收好錄音。

本輪未拍這些失敗狀態的前後對照圖，也未逐頁重審全站文案；不能視為文案驗收完成。先前九個工作檯的初始畫面對照及限制見 [COPY-VERIFY-1758.md](COPY-VERIFY-1758.md)。完整 UAT 未重跑，`ready_for_user_test` 不應設為 true。
