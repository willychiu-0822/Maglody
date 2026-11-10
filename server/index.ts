// API 金鑰只留在後端。Node 22.18+：node server/index.ts
// production（npm start）同時提供 dist/ 與 /api，給單一 HTTPS 網址使用。
// listen 不指定 host：Node 聽所有介面。不要改成 127.0.0.1，否則雲端健康檢查連不上。
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { createProvider } from './llm/index.ts'
import { createHandler } from './app.ts'
import { allowedOrigins, createStaticHandler } from './static.ts'

const port = Number(process.env.PORT ?? 8787)
try {
  const provider = createProvider()
  const allowed = allowedOrigins(port)
  const api = createHandler(provider, allowed)
  const serveStatic = process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === '1'
  const root = process.env.STATIC_DIR ?? fileURLToPath(new URL('../dist/', import.meta.url))
  const handler = serveStatic ? createStaticHandler(api, root) : api
  const server = http.createServer(handler)
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.on('error', (error) => { console.error('[master] Server failed:', error.message); process.exitCode = 1 })
  server.listen(port, () => console.log(`Maglody：http://127.0.0.1:${port}/api/master（provider=${provider.name}, model=${provider.model}, static=${serveStatic ? 'on' : 'off'}）`))
} catch (error) {
  console.error(`[master] 無法啟動：${error instanceof Error ? error.message : 'Unknown configuration error'}。請參考 README 的環境變數表。`)
  process.exitCode = 1
}
