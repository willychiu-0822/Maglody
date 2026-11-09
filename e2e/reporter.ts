import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import fs from 'node:fs'
import path from 'node:path'
export default class UatReporter implements Reporter {
  rows: { case: string; viewport: string; status: string; reason: string; evidence: string }[] = []
  onTestEnd(test: TestCase, result: TestResult) {
    const id = test.title.match(/UAT-\d+/)?.[0] ?? test.title
    this.rows.push({ case: id, viewport: test.parent.project()?.name ?? '', status: result.status === 'passed' ? 'pass' : result.status === 'skipped' ? 'blocked' : 'fail',
      reason: (result.errors.map(e => (e.message ?? '').replace(/\u001b\[[0-9;]*m/g, '')).join(' | ') || '').slice(0, 2500),
      evidence: result.attachments.find(a => a.name === 'uat-screenshot')?.path?.replace(process.cwd() + '/', '') ?? '',
    })
  }
  onEnd(result: FullResult) {
    const updated = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
    const run = process.env.UAT_RUN_ID!
    const rows = this.rows.sort((a,b) => a.case.localeCompare(b.case) || a.viewport.localeCompare(b.viewport))
    const fail = rows.filter(r => r.status === 'fail').length
    const blocked = rows.filter(r => r.status === 'blocked').length
    const pass = rows.filter(r => r.status === 'pass').length
    const fullMatrix = rows.length >= 50 && new Set(rows.map(r => r.case)).size * 2 === rows.length
    const visualOpen = fs.existsSync('docs/uat/failures.md') && fs.readFileSync('docs/uat/failures.md','utf8').includes('狀態：OPEN')
    const status = { project: 'Maglody', updated, cases: rows.length, pass, fail, blocked,
      ready_for_user_test: result.status === 'passed' && fullMatrix && !fail && !blocked && !visualOpen,
      notes: `Chrome；desktop 1280x800/mobile 390x844；run=${run}；${fullMatrix ? '完整矩陣' : '部分重跑，不能作為整體通過依據'}；音訊/LLM 採 mock，真實裝置/API 未驗證${visualOpen ? '；A 尚有視覺缺失待修' : ''}` }
    fs.mkdirSync(`docs/uat/evidence/${run}`, { recursive: true })
    fs.writeFileSync(`docs/uat/evidence/${run}/results.json`, JSON.stringify({ ...status, rows }, null, 2)+'\n')
    fs.writeFileSync('docs/uat/UAT-STATUS.json', JSON.stringify(status,null,2)+'\n')
    const clean = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n','<br>')
    fs.writeFileSync('docs/uat/UAT-RESULTS.md', `# Maglody UAT 執行結果\n\n台北時間：${updated}；run：${run}。\n\n${rows.length} 次執行：PASS ${pass}／FAIL ${fail}／BLOCKED ${blocked}。ready_for_user_test=${status.ready_for_user_test}。\n\n${status.notes}。各次歷史見 [evidence](evidence/)，功能修復與視覺交接見 [failures.md](failures.md)。每次執行有獨立 results.json，不覆蓋舊證據。\n\n| 案例 | Viewport | 結果 | 失敗原因 | 截圖 |\n|---|---|---|---|---|\n` + rows.map(r => `| ${r.case} | ${r.viewport} | ${r.status} | ${clean(r.reason)} | ${r.evidence ? `[截圖](${path.relative('docs/uat',r.evidence)})` : '未產生'} |`).join('\n')+'\n')
  }
}
