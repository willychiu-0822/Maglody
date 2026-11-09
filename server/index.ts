// API 金鑰只留在後端。Node 22.18+：node server/index.ts
import http from 'node:http'
import { createProvider } from './llm/index.ts'
import { createHandler } from './app.ts'

const port = Number(process.env.PORT ?? 8787)
try {
  const provider = createProvider()
  const allowed = (process.env.ALLOW_ORIGIN ?? 'http://localhost:5173').split(',').map((x) => x.trim()).filter(Boolean)
  const server = http.createServer(createHandler(provider, allowed))
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.on('error', (error) => { console.error('[master] Server failed:', error.message); process.exitCode = 1 })
  server.listen(port, () => console.log(`Maglody：http://localhost:${port}/api/master（provider=${provider.name}, model=${provider.model}）`))
} catch (error) {
  console.error(`[master] 無法啟動：${error instanceof Error ? error.message : 'Unknown configuration error'}。請參考 README 的環境變數表。`)
  process.exitCode = 1
}
