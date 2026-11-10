import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHandler } from '../../server/app.ts'
import { allowedOrigins, createStaticHandler } from '../../server/static.ts'

function listen(handler) {
  const server = http.createServer(handler)
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}
function request(port, method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, method, path, headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }))
    })
    req.on('error', reject)
    req.end()
  })
}

test('production server serves the home page and health, and keeps API rules', async () => {
  const root = mkdtempSync(join(tmpdir(), 'maglody-static-'))
  mkdirSync(join(root, 'assets'))
  writeFileSync(join(root, 'index.html'), '<title>Maglody</title>')
  writeFileSync(join(root, 'assets', 'app.js'), 'console.log(1)')
  const api = createHandler({ name: 'mock', model: 'mock', async complete() { throw new Error('unused') } }, ['http://localhost:5173'])
  const server = await listen(createStaticHandler(api, root))
  const port = server.address().port
  try {
    const home = await request(port, 'GET', '/')
    assert.equal(home.status, 200)
    assert.match(home.headers['content-type'], /text\/html/)
    assert.match(home.body, /Maglody/)
    const health = await request(port, 'GET', '/api/health')
    assert.equal(health.status, 200)
    assert.deepEqual(JSON.parse(health.body), { provider: 'mock', model: 'mock' })
    const asset = await request(port, 'GET', '/assets/app.js')
    assert.equal(asset.status, 200)
    assert.match(asset.headers['content-type'], /javascript/)
    const missing = await request(port, 'GET', '/assets/missing.js')
    assert.equal(missing.status, 404)
    assert.equal(missing.headers['content-type'].startsWith('text/plain'), true)
    assert.doesNotMatch(missing.body, /<html/i)
    const escape = await request(port, 'GET', '/%2e%2e/%2e%2e/package.json')
    assert.notEqual(escape.status, 200)
    const denied = await request(port, 'POST', '/api/master', { origin: 'https://unknown.example', 'content-type': 'application/json' })
    assert.equal(denied.status, 403)
  } finally {
    server.closeAllConnections?.()
    server.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test('allowed origins keep the configured list and add the local port plus Render URL', () => {
  const previous = {
    ALLOW_ORIGIN: process.env.ALLOW_ORIGIN,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    PUBLIC_URL: process.env.PUBLIC_URL,
  }
  process.env.ALLOW_ORIGIN = 'https://studio.example/'
  process.env.RENDER_EXTERNAL_URL = 'https://maglody.onrender.com/'
  process.env.PUBLIC_URL = 'https://preview.example'
  try {
    const origins = allowedOrigins(8787)
    assert.deepEqual(origins, [
      'https://studio.example',
      'http://localhost:8787',
      'http://127.0.0.1:8787',
      'https://maglody.onrender.com',
      'https://preview.example',
    ])
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})
