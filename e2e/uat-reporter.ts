import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
export default class UATReporter implements Reporter {
  rows: { id:string; viewport:string; title:string; status:string; error:string }[]=[]
  onTestEnd(test:TestCase,result:TestResult){this.rows.push({id:test.title.match(/UAT-\d+/)?.[0]||test.title,viewport:test.parent.project()?.name||'',title:test.title,status:result.status,error:result.errors.map(e=>e.message?.replace(/\u001b\[[0-9;]*m/g,'')).join('; ')})}
  onEnd(result:FullResult){
    const updated=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Taipei'}).slice(0,16)
    const pass=this.rows.filter(r=>r.status==='passed').length
    const fail=this.rows.filter(r=>['failed','timedOut','interrupted'].includes(r.status)).length
    const blocked=this.rows.length-pass-fail
    const evidence=existsSync('docs/uat/evidence')?readdirSync('docs/uat/evidence').filter(f=>f.endsWith('.png')):[]
    const body=`# Maglody UAT 結果\n\n執行時間：${updated}（台北）\n\nChrome／離線 mock；手機 390×844、桌面 1280×800。執行：\`npm run test:e2e\`。${new Set(this.rows.map(r=>r.id)).size} 個旅程案例 × 兩種尺寸 = ${this.rows.length} 次驗證。${pass} pass / ${fail} fail / ${blocked} blocked。\n\n| 案例 | 尺寸 | 結果 | 證據 |\n|---|---|---|---|\n`+this.rows.map(r=>`| ${r.title} | ${r.viewport} | ${r.status} | ${evidence.filter(f=>f.includes(r.viewport)&&(f.startsWith(r.id+'-')||r.id==='UAT-01'&&f.startsWith('A-R1-')||r.id==='UAT-02'&&f.startsWith('A-R4-')||r.id==='UAT-03'&&f.startsWith('A-R3-')||r.id==='UAT-04'&&f.startsWith('A-R2-')||r.id==='UAT-05'&&f.startsWith('A-R5-')||r.id==='UAT-06'&&f.startsWith('A-R6-')||r.id==='UAT-07'&&f.startsWith('A-R5-hum-')||r.id==='UAT-08'&&f.startsWith('A-A04-')||r.id==='UAT-09'&&f.startsWith('A-A07-')||r.id==='UAT-10'&&f.startsWith('A-R5-modal-')||r.id==='UAT-11'&&f.startsWith('A-A02-')||r.id==='UAT-12'&&f.startsWith('A-A05-'))).map(f=>`[${f}](evidence/${f})`).join(', ')||'見下方失敗記錄'} |`).join('\n')+`\n\n## 失敗原因\n\n`+(this.rows.filter(r=>r.status!=='passed').map(r=>`### ${r.id} ${r.viewport}\n\n${r.error}`).join('\n\n')||'無。')+`\n\n## 範圍與限制\n\n真實手機麥克風、iOS Safari、PWA 安裝、真 LLM 金鑰與主觀可聽品質仍需產品負責人實機驗證。錄音用 Chrome 假裝置；保存驗證讀取實際 IndexedDB Blob。Git metadata 唯讀，因此本輪尚無 commit，未 push、未部署、未開 tunnel。Session B 分支未提供可讀的 failures.md；這份報告為 A 本機補充，未冒稱 B 已驗收。\n`
    writeFileSync('docs/uat/UAT-RESULTS.md',body)
    writeFileSync('docs/uat/UAT-STATUS.json',JSON.stringify({project:'Maglody',updated,cases:this.rows.length,pass,fail,blocked,ready_for_user_test:result.status==='passed'&&fail===0&&blocked===0&&Array.from({length:25},(_,i)=>`UAT-${String(i+1).padStart(2,'0')}`).every(id=>['mobile','desktop'].every(viewport=>this.rows.some(r=>r.id===id&&r.viewport===viewport&&r.status==='passed'))),notes:'本機 Chrome 雙尺寸 UAT；離線 mock、假麥克風。真機/真 LLM 尚未驗證；Git worktree metadata 唯讀未能 commit。無部署。'},null,2)+'\n')
    const history='docs/uat/UAT-RUNS.json';const runs=existsSync(history)?JSON.parse(readFileSync(history,'utf8')):[];runs.push({updated,status:result.status,pass,fail,blocked});writeFileSync(history,JSON.stringify(runs,null,2)+'\n')
  }
}
