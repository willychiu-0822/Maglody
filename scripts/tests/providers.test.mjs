import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchJson } from '../../server/shared/request.ts'
import { askMaster } from '../../src/agent/client.ts'
import { defaultProject } from '../../src/lib/store.ts'
import { ROLES } from '../../src/agent/roles.ts'
import { createOpenAI } from '../../server/llm/openai.ts'
import { createGemini, createVertex } from '../../server/llm/gcp.ts'
import { createProvider } from '../../server/llm/index.ts'
function env(t, name, value) { const old = process.env[name]; process.env[name] = value; t.after(() => old === undefined ? delete process.env[name] : process.env[name] = old) }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })

test('timeouts cover fetch and stalled response bodies', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })))
  await assert.rejects(fetchJson('https://stub', {}, 10), /timed out/)
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => new Response(new ReadableStream({ start(c) { signal.addEventListener('abort', () => c.error(signal.reason), { once: true }) } })))
  await assert.rejects(fetchJson('https://stub', {}, 10), /timed out/)
})
test('OpenAI chat and Responses payloads and malformed responses', async (t) => {
  env(t, 'OPENAI_API_KEY', 'test-only')
  env(t, 'OPENAI_API_STYLE', 'chat')
  const req = { system: 'coach', messages: [{ role: 'user', content: 'hi' }], json: true }
  let sent
  t.mock.method(globalThis, 'fetch', async (_, init) => { sent = JSON.parse(init.body); return json({ choices: [{ message: { content: '{"text":"ok"}' } }] }) })
  assert.equal(await createOpenAI().complete(req), '{"text":"ok"}')
  assert.equal(sent.messages[0].role, 'system')
  env(t, 'OPENAI_API_STYLE', 'responses')
  t.mock.method(globalThis, 'fetch', async (_, init) => { sent = JSON.parse(init.body); return json({ output: [{ content: [{ type: 'output_text', text: 'ok' }] }] }) })
  assert.equal(await createOpenAI().complete(req), 'ok')
  assert.equal(sent.instructions, 'coach')
  for (const data of [null, {}, { output: [null] }]) {
    t.mock.method(globalThis, 'fetch', async () => json(data))
    await assert.rejects(createOpenAI().complete(req))
  }
  t.mock.method(globalThis, 'fetch', async () => json({ error: 'secret' }, 429))
  await assert.rejects(createOpenAI().complete(req), (e) => e.status === 429 && !e.message.includes('secret'))
})
test('Gemini and Vertex work against local fetch fixtures; config errors fail clearly', async (t) => {
  env(t, 'GEMINI_API_KEY', 'test-only'); env(t, 'GCP_PROJECT', 'project'); env(t, 'GCP_ACCESS_TOKEN', 'token')
  let headers, sent
  t.mock.method(globalThis, 'fetch', async (_, init) => { headers = init.headers; sent = JSON.parse(init.body); return json({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) })
  const req = { system: 'coach', messages: [{ role: 'assistant', content: 'hi' }], json: true }
  assert.equal(await createGemini().complete(req), 'ok'); assert.equal(headers['x-goog-api-key'], 'test-only'); assert.equal(sent.contents[0].role, 'model')
  assert.equal(await createVertex().complete(req), 'ok'); assert.equal(headers.Authorization, 'Bearer token')
  env(t, 'OPENAI_API_KEY', '')
  assert.throws(createOpenAI, /OPENAI_API_KEY/)
  env(t, 'LLM_PROVIDER', 'typo')
  assert.throws(createProvider, /LLM_PROVIDER/)
})
test('five offline personas and all LLM failures fall back without network', async (t) => {
  const p = defaultProject()
  const voices = new Set()
  for (const persona of Object.values(ROLES)) {
    const { reply, source } = await askMaster(p, { step: 'idea', question: '下一步', persona }, { endpoint: '' })
    assert.equal(source, 'mock'); assert.ok(reply.text); voices.add(reply.text)
    const refusal = await askMaster(p, { step: 'lyrics', question: '幫我寫一句', persona }, { endpoint: '' })
    assert.match(refusal.reply.text, /不替你寫/)
  }
  assert.equal(voices.size, 5)
  for (const response of [() => json({}, 401), () => json({}, 404), () => json(null), () => json({ text: '' }), () => { throw new Error('offline') }]) {
    t.mock.method(globalThis, 'fetch', async () => response())
    const result = await askMaster(p, { step: 'idea', question: '下一步' }, { endpoint: 'https://stub' })
    assert.equal(result.source, 'mock'); assert.ok(result.reply.text)
  }
})
test('M-02: the browser sends data only — no system prompt, persona by id, history clipped', async (t) => {
  let sent
  t.mock.method(globalThis, 'fetch', async (_, init) => { sent = JSON.parse(init.body); return json({ text: '好' }) })
  const p = defaultProject()
  const history = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: '長'.repeat(5000) }))
  const { source } = await askMaster(p, { step: 'idea', question: '下一步', personaId: 'lyricist', persona: ROLES.lyricist, history }, { endpoint: 'https://stub' })
  assert.equal(source, 'llm')
  assert.ok(!('system' in sent) && !('messages' in sent))
  assert.equal(sent.persona, 'lyricist')
  assert.equal(sent.step, 'idea')
  assert.equal(sent.history.length, 8)
  assert.ok(sent.history.every((m) => m.content.length <= 1600))
  assert.ok(!JSON.stringify(sent).includes('聲音說話多於用術語') && !JSON.stringify(sent).includes('安靜、細膩'))
})
