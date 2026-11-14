// 部署煙霧測試：照 server/Dockerfile 的複製範圍，把後端複製到空資料夾，
// 用最樸素的 `node`（沒有測試載入器、沒有 tsconfig、沒有 src/）啟動，再打 /api/health。
// 抓的是 M-01 這種「在 repo 裡跑得動、放進映像就少檔案」的問題。
// 限制：沒有真的建 Docker 映像（這台機器可能沒有 Docker）；它只驗證「複製範圍＋啟動指令」。
// 前提：Dockerfile 的 build context 是 server/（docs/cloud-setup.md 的 `gcloud run deploy --source server`）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contextDir = path.join(root, 'server')
const dockerfile = fs.readFileSync(path.join(contextDir, 'Dockerfile'), 'utf8').split('\n')

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'maglody-deploy-smoke-'))
let cmd = ['node', 'server/index.ts']
let workdir = '/'
for (const raw of dockerfile) {
  const line = raw.trim()
  if (/^WORKDIR\s+/i.test(line)) workdir = line.split(/\s+/)[1]
  const copy = line.match(/^COPY\s+(?!--)(\S+)\s+(\S+)$/i)
  if (copy) {
    const [, from, to] = copy
    const dest = path.join(tmp, path.isAbsolute(to) ? to : path.join(workdir, to))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.cpSync(path.join(contextDir, from), dest, { recursive: true, filter: (src) => !src.endsWith('node_modules') })
  }
  const run = line.match(/^CMD\s+(\[.*\])$/i)
  if (run) cmd = JSON.parse(run[1])
}
// WORKDIR /app 在容器裡就是根；這裡把它當成暫存資料夾裡的 app/
const cwd = path.join(tmp, workdir)
const port = 8700 + Math.floor(Math.random() * 200)
const child = spawn(cmd[0], cmd.slice(1), { cwd, env: { PATH: process.env.PATH, PORT: String(port), LLM_PROVIDER: 'mock' }, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''
child.stdout.on('data', (d) => { log += d })
child.stderr.on('data', (d) => { log += d })
let exited = null
child.on('exit', (code) => { exited = code })

let ok = false, detail = ''
for (let i = 0; i < 40 && exited === null; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`)
    detail = `HTTP ${res.status} ${await res.text()}`
    ok = res.status === 200
    break
  } catch { await new Promise((r) => setTimeout(r, 100)) }
}
child.kill()
fs.rmSync(tmp, { recursive: true, force: true })
if (ok) console.log(`PASS 部署煙霧測試：照 Dockerfile 的複製範圍啟動後 /api/health 回 200（${detail}）`)
else {
  console.error(`FAIL 部署煙霧測試：${exited !== null ? `後端啟動後立刻結束（exit ${exited}）` : '等不到 /api/health'}\n${log.trim().split('\n').slice(0, 6).join('\n')}`)
  process.exitCode = 1
}
