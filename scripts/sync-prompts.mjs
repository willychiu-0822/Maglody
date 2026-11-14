// 由 server/shared/prompts.ts 重新產生 docs/agent-prompts.md 的「System prompt」與「導引」兩節，避免兩邊不同步。
// 用法：node scripts/sync-prompts.mjs
import fs from 'node:fs'
const src = fs.readFileSync('server/shared/prompts.ts', 'utf8')
const sys = src.match(/MASTER_SYSTEM_PROMPT = `([\s\S]*?)`/)[1]
const guides = [...src.matchAll(/^ {2}(\w+): '([^']+)',$/gm)].map((m) => `| \`${m[1]}\` | ${m[2]} |`).join('\n')
let md = fs.readFileSync('docs/agent-prompts.md', 'utf8')
md = md.replace(/(## System prompt[^\n]*\n\n```text\n)[\s\S]*?(\n```)/, (_, a, b) => a + sys + b)
md = md.replace(/(\| 工作檯 \| 導引 \|\n\|---\|---\|\n)[\s\S]*?(\n\n## User turn)/, (_, a, b) => a + guides + b)
fs.writeFileSync('docs/agent-prompts.md', md)
console.log('docs/agent-prompts.md synced')
