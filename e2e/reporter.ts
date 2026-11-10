import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import fs from 'node:fs'
import path from 'node:path'
export default class UatReporter implements Reporter {
  rows: { case: string; viewport: string; status: string; reason: string; evidence: string }[] = []
  onTestEnd(test: TestCase, result: TestResult) {
    const trace = result.attachments.find(a => a.name === 'trace' && a.path)
    if (trace?.path && fs.existsSync(trace.path)) {
      const target = `docs/uat/evidence/${process.env.UAT_RUN_ID}/${test.parent.project()?.name}/${test.title.match(/UAT-\d+/)?.[0]}-trace.zip`
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.copyFileSync(trace.path, target)
    }
    const id = test.title.match(/UAT-\d+/)?.[0] ?? test.title
    const evidence = `docs/uat/evidence/${process.env.UAT_RUN_ID}/${test.parent.project()?.name}/${id}.png`
    this.rows.push({ case: id, viewport: test.parent.project()?.name ?? '', status: result.status === 'passed' ? 'pass' : result.status === 'skipped' ? 'blocked' : 'fail',
      reason: (result.errors.map(e => (e.message ?? '').replace(/\u001b\[[0-9;]*m/g, '')).join(' | ') || '').slice(0, 2500),
      evidence: fs.existsSync(evidence) ? evidence : '',
    })
  }
  onEnd(result: FullResult) {
    const updated = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
    const run = process.env.UAT_RUN_ID!
    const rows = this.rows.sort((a,b) => a.case.localeCompare(b.case) || a.viewport.localeCompare(b.viewport))
    const fail = rows.filter(r => r.status === 'fail').length
    const blocked = rows.filter(r => r.status === 'blocked').length
    const pass = rows.filter(r => r.status === 'pass').length
    const expectedCases = new Set(fs.readdirSync('e2e').filter(file => file.endsWith('.spec.ts')).flatMap(file =>
      [...fs.readFileSync(`e2e/${file}`, 'utf8').matchAll(/test\(['"](UAT-\d+)/g)].map(match => match[1])))
    const fullMatrix = rows.length === expectedCases.size * 2 && [...expectedCases].every(id =>
      ['desktop','mobile'].every(viewport => rows.some(row => row.case === id && row.viewport === viewport)))
    const allEvidence = rows.every(row => row.evidence && fs.existsSync(row.evidence))
    const visualOpen = fs.existsSync('docs/uat/failures.md') && fs.readFileSync('docs/uat/failures.md','utf8').includes('狀態：OPEN')
    const passed = (ids: string[]) => ids.every(id=>['desktop','mobile'].every(viewport=>rows.some(r=>r.case===id&&r.viewport===viewport&&r.status==='pass')))
    const checks = {R1:['UAT-28','UAT-57'],R2:['UAT-24','UAT-56'],R3:['UAT-25','UAT-30','UAT-53','UAT-59','UAT-61','UAT-62','UAT-63'],R4:['UAT-25','UAT-29','UAT-57'],R5:['UAT-13','UAT-14','UAT-15','UAT-16','UAT-49','UAT-60'],R6:['UAT-33','UAT-58']}
    const novice = {P0_context_coaching:['UAT-53'],P1_complete_demo:['UAT-54'],P1_denied_mic_demo:['UAT-55'],P1_one_primary:['UAT-24','UAT-56'],P1_approved_characters:['UAT-25','UAT-29','UAT-57'],P2_watercolor:['UAT-28','UAT-57'],P2_knowledge_sparks:['UAT-33','UAT-58']}
    const outcomes = (mapping:Record<string,string[]>)=>Object.fromEntries(Object.entries(mapping).map(([key,ids])=>[key,{status:passed(ids)?'pass':'not_verified',cases:ids}]))
    const status = { project: 'Maglody', updated, cases: rows.length, pass, fail, blocked,
      ready_for_user_test: result.status === 'passed' && fullMatrix && !fail && !blocked && allEvidence && !visualOpen,
      requirements:outcomes(checks), novice_feedback:outcomes(novice),
      exploration:outcomes({A_N08_long_conversation:['UAT-61'],A_N09_role_waiting:['UAT-62'],A_N10_mic_limit_without_frames:['UAT-52','UAT-43'],A_N11_new_song_conversation:['UAT-63'],text_first_song:['UAT-64']}),
      notes: `Chrome；desktop 1280x800/mobile 390x844；run=${run}；${fullMatrix ? '完整矩陣' : '部分重跑，不能作為整體通過依據'}；Web Audio 實際播放、麥克風假裝置、LLM 本機教練，實機/API 未驗證${visualOpen ? '；A 尚有未結缺失待驗收' : ''}${allEvidence ? '' : '；有案例缺少截圖證據'}` }
    fs.mkdirSync(`docs/uat/evidence/${run}`, { recursive: true })
    fs.writeFileSync(`docs/uat/evidence/${run}/results.json`, JSON.stringify({ ...status, rows }, null, 2)+'\n')
    fs.writeFileSync('docs/uat/UAT-STATUS.json', JSON.stringify(status,null,2)+'\n')
    const historyPath='docs/uat/UAT-RUNS.json'
    const history=fs.existsSync(historyPath)?JSON.parse(fs.readFileSync(historyPath,'utf8')):[]
    history.push({updated,run,cases:rows.length,pass,fail,blocked,ready_for_user_test:status.ready_for_user_test})
    fs.writeFileSync(historyPath,JSON.stringify(history,null,2)+'\n')
    const clean = (s: string) => s.replaceAll('|', '\\|').replaceAll('\n','<br>')
    fs.writeFileSync('docs/uat/UAT-RESULTS.md', `# Maglody UAT 執行結果\n\n台北時間：${updated}；run：${run}。\n\n${rows.length} 次執行：PASS ${pass}／FAIL ${fail}／BLOCKED ${blocked}。ready_for_user_test=${status.ready_for_user_test}。\n\n${status.notes}。各次歷史見 [evidence](evidence/)，功能修復與視覺交接見 [failures.md](failures.md)。每次執行有獨立 results.json，不覆蓋舊證據。\n\n| 案例 | Viewport | 結果 | 失敗原因 | 截圖 |\n|---|---|---|---|---|\n` + rows.map(r => `| ${r.case} | ${r.viewport} | ${r.status} | ${clean(r.reason)} | ${r.evidence ? `[截圖](${path.relative('docs/uat',r.evidence)})` : '未產生'} |`).join('\n')+'\n')
  }
}
