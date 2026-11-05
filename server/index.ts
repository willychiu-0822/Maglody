// Music Lab 大師 Agent 後端（Node 22.18+，直接執行 TypeScript：node server/index.ts）
// 前端：VITE_AGENT_URL=http://localhost:8787/api/master npm run dev
// API 金鑰／GCP 憑證只留在這裡，瀏覽器拿不到。
import http from 'node:http'
import { createProvider } from './llm/index.ts'
import { ProviderError, type ChatTurn } from './llm/types.ts'

const PORT = Number(process.env.PORT ?? 8787)
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN ?? 'http://localhost:5173'
let provider: ReturnType<typeof createProvider>
try {
  provider = createProvider()
} catch (e) {
  console.error(`[master] 無法啟動：${(e as Error).message}。請參考 README 的環境變數表。`)
  process.exit(1)
}
const ACTIONS = new Set(['tryProgression', 'goStep', 'playResult'])
const STEPS = new Set(['hum', 'idea', 'harmony', 'melody', 'lyrics', 'arrange', 'record', 'mix', 'review'])

interface Suggestion { label: string; action?: { type: string; part?: string; degs?: number[]; step?: string } }

/** 不信任模型輸出：只保留已知欄位與合法動作，避免前端收到奇怪的指令 */
function sanitize(raw: string) {
  const s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '')
  const o = JSON.parse(s) as Record<string, unknown>
  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : undefined)
  const sugs = Array.isArray(o.suggestions) ? (o.suggestions as Suggestion[]) : []
  return {
    text: str(o.text, 400) ?? '',
    learned: str(o.learned, 200),
    next: str(o.next, 200),
    suggestions: sugs
      .filter((x) => x && typeof x.label === 'string')
      .map((x) => {
        const a = x.action
        if (!a || !ACTIONS.has(a.type)) return { label: x.label.slice(0, 60) }
        if (a.type === 'tryProgression') {
          const degs = Array.isArray(a.degs) ? a.degs.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).slice(0, 4) : []
          if (degs.length !== 4) return { label: x.label.slice(0, 60) }
          return { label: x.label.slice(0, 60), action: { type: a.type, part: a.part === 'verse' ? 'verse' : 'chorus', degs } }
        }
        if (a.type === 'goStep') return STEPS.has(a.step ?? '') ? { label: x.label.slice(0, 60), action: { type: a.type, step: a.step } } : { label: x.label.slice(0, 60) }
        return { label: x.label.slice(0, 60), action: { type: a.type } }
      })
      .slice(0, 3),
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGIN)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ provider: provider.name, model: provider.model }))
    return
  }
  if (req.method !== 'POST' || req.url !== '/api/master') { res.writeHead(404).end(); return }
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 200_000) { res.writeHead(413).end(); return }
  }
  try {
    const { system, messages } = JSON.parse(raw) as { system?: unknown; messages?: unknown }
    if (typeof system !== 'string' || !Array.isArray(messages)) throw new ProviderError('bad request', 400)
    const turns = (messages as ChatTurn[]).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-10)
    if (!turns.length || turns[turns.length - 1].role !== 'user') throw new ProviderError('最後一則必須是 user', 400)
    const out = await provider.complete({ system, messages: turns, json: true })
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(sanitize(out)))
  } catch (e) {
    const status = e instanceof ProviderError ? e.status : e instanceof SyntaxError ? 502 : 500
    console.warn('[master]', e)
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: String((e as Error).message) }))
  }
})

server.listen(PORT, () => console.log(`Music Lab 大師後端：http://localhost:${PORT}/api/master（provider=${provider.name}, model=${provider.model}）`))
