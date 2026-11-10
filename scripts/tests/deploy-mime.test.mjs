import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

test('deploy server sends browser-safe MIME types for studio assets', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'maglody-mime-'))
  const types = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', mp3: 'audio/mpeg', wav: 'audio/wav', webm: 'video/webm', woff2: 'font/woff2' }
  await mkdir(join(dir, 'dist'))
  for (const ext of Object.keys(types)) await writeFile(join(dir, 'dist', `asset.${ext}`), 'test')
  const server = spawn(process.execPath, [resolve('scripts/deploy-serve.mjs')], { env: { ...process.env, MAGLODY_DIST: join(dir, 'dist'), PORT: '4109' }, stdio: 'ignore' })
  try {
    let response
    for (let i = 0; i < 50; i++) {
      try { response = await fetch('http://127.0.0.1:4109/asset.webp'); break } catch { await delay(100) }
    }
    assert.ok(response, 'deploy server starts')
    for (const [ext, type] of Object.entries(types)) {
      const r = await fetch(`http://127.0.0.1:4109/asset.${ext}`)
      assert.equal(r.status, 200, ext)
      assert.equal(r.headers.get('content-type'), type, ext)
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff', ext)
    }
  } finally {
    server.kill()
    await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve))
    await rm(dir, { recursive: true, force: true })
  }
})
