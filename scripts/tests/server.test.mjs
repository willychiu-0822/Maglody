import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createHandler, parseRequest } from '../../server/app.ts'
import { sanitizeReply } from '../../src/agent/reply.ts'

const valid = { system: 'coach', messages: [{ role: 'user', content: 'hi' }] }
export async function request(body, provider = { name: 'stub', model: 'stub', complete: async () => '{"text":"ok"}' }, headers = {}) {
  const req = Object.assign(Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]), { method: 'POST', url: '/api/master', headers: { 'content-type': 'application/json', ...headers } })
  const res = { status: 0, headers: {}, setHeader(k, v) { this.headers[k] = v }, writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); return this }, end(body) { this.body = body ? JSON.parse(body) : undefined; this.writableEnded = true } }
  await createHandler(provider)(req, res)
  return res
}
test('malformed requests return JSON 400 without invoking provider', async () => {
  for (const body of ['{', 'null', '{}', { ...valid, messages: [null] }, { ...valid, messages: [{ role: 'system', content: 'x' }] }, { ...valid, messages: [{ role: 'assistant', content: 'x' }] }, { ...valid, system: 'x'.repeat(20001) }]) {
    const res = await request(body, { complete() { assert.fail('must not call provider') } })
    assert.equal(res.status, 400)
    assert.equal(typeof res.body.error, 'string')
  }
  assert.equal(parseRequest(JSON.stringify(valid)).json, true)
})
test('body bytes, content type and CORS are enforced', async () => {
  assert.equal((await request('中'.repeat(70000))).status, 413)
  assert.equal((await request(valid, undefined, { 'content-type': 'text/plain' })).status, 415)
  const denied = await request(valid, undefined, { origin: 'https://unknown.example' })
  assert.equal(denied.status, 403)
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined)
})
test('invalid upstream output is 502 and does not expose provider details', async () => {
  for (const out of ['null', '{}', '{"text":""}', '{']) assert.equal((await request(valid, { complete: async () => out })).status, 502)
  const res = await request(valid, { complete() { throw new Error('secret-key') } })
  assert.equal(res.status, 502)
  assert.ok(!JSON.stringify(res).includes('secret-key'))
  assert.equal((await request(valid)).body.text, 'ok')
})
test('reply sanitizer drops invalid actions and caps fields', () => {
  const reply = sanitizeReply({ text: 'x'.repeat(900), suggestions: [null, { label: 'bad degree', action: { type: 'tryProgression', part: 'verse', degs: [0, 1, 2, 99] } }, { label: 'bad step', action: { type: 'goStep', step: 'evil' } }, { label: 'valid', action: { type: 'tryProgression', part: 'chorus', degs: [0, 4, 5, 3] } }] })
  assert.equal(reply.text.length, 400)
  assert.equal(reply.suggestions[0].action, undefined)
  assert.equal(reply.suggestions[1].action, undefined)
  assert.deepEqual(reply.suggestions[2].action.degs, [0, 4, 5, 3])
})
