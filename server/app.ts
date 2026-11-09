import type { IncomingMessage, ServerResponse } from 'node:http'
import { sanitizeReply, isObject } from '../src/agent/reply.ts'
import { ProviderError, type ChatTurn, type LlmProvider } from './llm/types.ts'

const MAX_BYTES = 200_000
export function parseRequest(raw: string): { system: string; messages: ChatTurn[]; json: true } {
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new ProviderError('Invalid JSON', 400) }
  if (!isObject(value) || typeof value.system !== 'string' || !value.system.trim() || value.system.length > 20_000 || !Array.isArray(value.messages) || !value.messages.length || value.messages.length > 10) throw new ProviderError('Invalid request', 400)
  const messages: ChatTurn[] = value.messages.map((m) => {
    if (!isObject(m) || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 30_000) throw new ProviderError('Invalid message', 400)
    return { role: m.role, content: m.content }
  })
  if (messages.at(-1)?.role !== 'user') throw new ProviderError('Last message must be user', 400)
  return { system: value.system, messages, json: true }
}

export function createHandler(provider: LlmProvider, allowed = ['http://localhost:5173']) {
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
      const chunks: Buffer[] = []
      let size = 0
      try {
        for await (const chunk of req) {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          size += bytes.length
          if (size > MAX_BYTES) { send(413, { error: 'Request too large' }); return }
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
