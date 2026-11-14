import type { IncomingMessage, ServerResponse } from 'node:http'
import { sanitizeReply, isObject } from './shared/reply.ts'
import { MASTER_SYSTEM_PROMPT, STEP_GUIDES, buildUserTurn } from './shared/prompts.ts'
import { PERSONAS, isRoleId } from './shared/personas.ts'
import { MASTER_LIMITS as L } from './shared/limits.ts'
import { createRateLimiter, clientKey, type RateLimitOptions } from './shared/rate-limit.ts'
import { ProviderError, type ChatTurn, type LlmProvider } from './llm/types.ts'

const bad = (message = 'Invalid request') => new ProviderError(message, 400)
const text = (value: unknown, max: number, { required = false } = {}) => {
  if (value === undefined || value === null || value === '') { if (required) throw bad(); return undefined }
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw bad()
  return value
}

/**
 * 請求只收「資料」：工作檯、夥伴代號、歌曲摘要、提問、歷史。
 * system prompt 與角色設定都由後端自己帶；請求裡出現 system／messages 一律拒絕。
 */
export function parseRequest(raw: string): { system: string; messages: ChatTurn[]; json: true } {
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new ProviderError('Invalid JSON', 400) }
  if (!isObject(value) || 'system' in value || 'messages' in value) throw bad()
  const step = value.step
  if (typeof step !== 'string' || !Object.hasOwn(STEP_GUIDES, step)) throw bad()
  if (value.persona !== undefined && !isRoleId(value.persona)) throw bad()
  const songContext = text(value.songContext, L.songContext, { required: true })!
  const question = text(value.question, L.question)
  let event: { kind: string; detail: string } | undefined
  if (value.event !== undefined) {
    const e = value.event
    if (!isObject(e) || typeof e.kind !== 'string' || !/^[\w:.-]{1,40}$/.test(e.kind)) throw bad()
    event = { kind: e.kind, detail: text(e.detail, L.eventDetail) ?? '' }
  }
  const history: ChatTurn[] = []
  if (value.history !== undefined) {
    if (!Array.isArray(value.history) || value.history.length > L.historyTurns) throw bad()
    for (const m of value.history) {
      if (!isObject(m) || (m.role !== 'user' && m.role !== 'assistant')) throw bad('Invalid message')
      history.push({ role: m.role, content: text(m.content, L.historyTurn, { required: true })! })
    }
  }
  const persona = isRoleId(value.persona) ? PERSONAS[value.persona] : undefined
  const user = buildUserTurn({ step, persona, songContext, event, question })
  return { system: MASTER_SYSTEM_PROMPT, messages: [...history, { role: 'user', content: user }], json: true }
}

export interface HandlerOptions {
  /** 每個來源每分鐘、整個服務每日的請求上限 */
  rate?: Partial<RateLimitOptions>
  /** 前面有幾層自己的代理（Cloud Run／Render 是 1），用來從 X-Forwarded-For 取來源 */
  trustedHops?: number
}

export function createHandler(provider: LlmProvider, allowed = ['http://localhost:5173'], options: HandlerOptions = {}) {
  const limiter = createRateLimiter({ perMinute: 20, perDay: 3000, ...options.rate })
  return async (req: IncomingMessage, res: ServerResponse) => {
    const send = (status: number, data: unknown) => {
      if (!res.destroyed && !res.writableEnded) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(data))
    }
    const origin = req.headers.origin
    if (allowed.includes('*')) res.setHeader('Access-Control-Allow-Origin', '*')
    else if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    try {
      if (origin && !allowed.includes('*') && !allowed.includes(origin)) { send(403, { error: 'Origin not allowed' }); return }
      if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }
      if (req.method === 'GET' && req.url === '/api/health') { send(200, { provider: provider.name, model: provider.model }); return }
      if (req.method !== 'POST' || req.url !== '/api/master') { send(404, { error: 'Not found' }); return }
      if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] ?? '')) { send(415, { error: 'Expected application/json' }); return }
      const limit = limiter.check(clientKey(req, options.trustedHops ?? 0))
      if (!limit.ok) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); send(429, { error: 'Too many requests' }); return }
      const chunks: Buffer[] = []
      let size = 0
      try {
        for await (const chunk of req) {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          size += bytes.length
          if (size > L.bodyBytes) { send(413, { error: 'Request too large' }); return }
          chunks.push(bytes)
        }
      } catch { send(400, { error: 'Incomplete request' }); return }
      const input = parseRequest(Buffer.concat(chunks).toString('utf8'))
      if (provider.name === 'mock') { send(200, { offline: true }); return }
      let output
      const controller = new AbortController()
      const abort = () => controller.abort()
      res.on?.('close', abort)
      try {
        const raw = await provider.complete({ ...input, signal: controller.signal })
        output = sanitizeReply(JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')))
      } catch (error) {
        // 不將供應商原文／憑證／學生內容送回瀏覽器或記錄到 log。
        const status = error instanceof ProviderError && error.status === 429 ? 429 : 502
        send(status, { error: status === 429 ? 'Provider rate limit' : 'Provider unavailable or invalid reply' })
        return
      }
      finally { res.off?.('close', abort) }
      send(200, output)
    } catch (error) {
      send(error instanceof ProviderError ? error.status : 500, { error: error instanceof ProviderError ? error.message : 'Internal server error' })
    }
  }
}
