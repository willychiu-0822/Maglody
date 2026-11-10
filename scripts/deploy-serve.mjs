// Production build server: only dist/ is public; /api/* goes to the local agent.
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(process.env.MAGLODY_DIST || fileURLToPath(new URL('../dist/', import.meta.url)))
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'video/webm', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname.startsWith('/api/')) {
    const upstream = http.request({ hostname: '127.0.0.1', port: 8787, path: req.url, method: req.method, headers: req.headers }, (reply) => {
      res.writeHead(reply.statusCode, reply.headers)
      reply.pipe(res)
    })
    upstream.setTimeout(30000, () => upstream.destroy(new Error('Agent timeout')))
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Agent unavailable' }))
    })
    req.pipe(upstream)
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }
  try {
    const pathname = decodeURIComponent(url.pathname)
    const path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) {
      res.writeHead(403).end()
      return
    }
    const file = await stat(path)
    if (!file.isFile()) throw new Error('Not a file')
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
      'Content-Length': file.size,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    })
    if (req.method === 'HEAD') res.end()
    else createReadStream(path).on('error', () => res.destroy()).pipe(res)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
  }
}).listen(Number(process.env.PORT || 4109), '127.0.0.1', () => console.log('Maglody dist + /api proxy ready'))
