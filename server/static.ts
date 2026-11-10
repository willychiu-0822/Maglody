import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

/** 部署時把本機埠與平台公開網址併進 CORS，同一台主機不用先填 ALLOW_ORIGIN。 */
export function allowedOrigins(port: number): string[] {
  const raw = process.env.ALLOW_ORIGIN
  const configured = (raw == null || raw.trim() === '' ? 'http://localhost:5173' : raw)
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean)
  const extras = [`http://localhost:${port}`, `http://127.0.0.1:${port}`]
  for (const name of ['RENDER_EXTERNAL_URL', 'PUBLIC_URL']) {
    const value = process.env[name]?.trim().replace(/\/$/, '')
    if (value) extras.push(value)
  }
  return [...new Set([...configured, ...extras])]
}

function resolveInside(root: string, pathname: string): string | null {
  let decoded: string
  try { decoded = decodeURIComponent(pathname) } catch { return null }
  if (decoded.includes('\0')) return null
  const full = resolve(root, `.${decoded.startsWith('/') ? decoded : `/${decoded}`}`)
  if (full !== root && !full.startsWith(root + sep)) return null
  return full
}

function isInside(root: string, file: string): boolean {
  try {
    const rootReal = realpathSync(root)
    const fileReal = realpathSync(file)
    return fileReal === rootReal || fileReal.startsWith(rootReal + sep)
  } catch {
    return false
  }
}

function sendText(res: ServerResponse, status: number, body: string) {
  if (res.writableEnded) return
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).end(body)
}

/**
 * production 用：/api/* 交給既有的大師 handler，其餘從 dist 讀檔。
 * 缺檔的腳本或圖片回純文字 404，避免 service worker 把 HTML 當成程式快取。
 */
export function createStaticHandler(api: Handler, root: string): Handler {
  const rootResolved = resolve(root)
  return (req, res) => {
    const raw = req.url ?? '/'
    const query = raw.indexOf('?')
    const pathname = query === -1 ? raw : raw.slice(0, query)
    if (pathname === '/api' || pathname.startsWith('/api/')) return api(req, res)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Method not allowed')
      return
    }
    if (!existsSync(rootResolved)) {
      sendText(res, 503, 'dist/ is missing. Run npm run build before npm start.')
      return
    }
    const target = resolveInside(rootResolved, pathname)
    if (!target) { sendText(res, 400, 'Bad path'); return }
    let file = target
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html')
    } catch {
      sendText(res, 404, 'Not found')
      return
    }
    if (!existsSync(file) || !statSync(file).isFile() || !isInside(rootResolved, file)) {
      sendText(res, 404, 'Not found')
      return
    }
    const ext = extname(file).toLowerCase()
    const hashed = pathname.startsWith('/assets/')
    const cache = ext === '.html' || file.endsWith(`${sep}sw.js`)
      ? 'no-cache'
      : hashed
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600'
    const size = statSync(file).size
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Content-Length': size,
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff',
    })
    if (req.method === 'HEAD') { res.end(); return }
    const stream = createReadStream(file)
    stream.on('error', () => { if (!res.writableEnded) res.end() })
    res.on('error', () => stream.destroy())
    stream.pipe(res)
  }
}
