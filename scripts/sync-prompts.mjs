// 由 server/shared/prompts.ts 重新產生 docs/agent-prompts.md 的「System prompt」與「導引」兩節，避免兩邊不同步。
// 用法：node scripts/sync-prompts.mjs（Node 24 可以直接匯入 .ts）
import fs from 'node:fs'
import { MASTER_SYSTEM_PROMPT, STEP_GUIDES } from '../server/shared/prompts.ts'
const guides = Object.entries(STEP_GUIDES).map(([k, v]) => `| \`${k}\` | ${v} |`).join('\n')
let md = fs.readFileSync('docs/agent-prompts.md', 'utf8')
md = md.replace(/(## System prompt[^\n]*\n\n```text\n)[\s\S]*?(\n```)/, (_, a, b) => a + MASTER_SYSTEM_PROMPT + b)
md = md.replace(/(\| 工作檯 \| 導引 \|\n\|---\|---\|\n)[\s\S]*?(\n\n## User turn)/, (_, a, b) => a + guides + b)
fs.writeFileSync('docs/agent-prompts.md', md)
console.log('docs/agent-prompts.md synced')
