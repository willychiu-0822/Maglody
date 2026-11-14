// M-06：沒有接線上夥伴時的離線聊天（新手實際會遇到的版本）。
import test from 'node:test'
import assert from 'node:assert/strict'
import { askMaster } from '../../src/agent/client.ts'
import { NOT_SURE } from '../../src/agent/mock.ts'
import { quickPrompts } from '../../src/agent/quick.ts'
import { defaultProject } from '../../src/lib/store.ts'
import { ROLES } from '../../src/agent/roles.ts'

const ask = (p, question, personaId = 'composer', history = []) => askMaster(p, { step: 'harmony', question, persona: ROLES[personaId], personaId, history }, { endpoint: '' })
const wholeText = (reply) => [reply.text, reply.learned, reply.next].filter(Boolean).join('\n')
const sentences = (reply) => wholeText(reply).split(/[。！？!?\n]/).map((x) => x.trim()).filter((x) => x.length > 1)
const filled = () => {
  const p = defaultProject()
  p.idea = { ...p.idea, mood: 'warm', hook: '雨停了你還沒來' }
  p.harmony = { ...p.harmony, chorus: [0, 4, 5, 3], verse: [0, 3, 4, 0] }
  p.melody = { ...p.melody, chorus: [0, 2, 4, null, 2, 0, -1, -1, 4, null, null, null, null, null, null, null].map((x) => x == null ? null : x + 60) }
  return p
}

test('M-06: five different questions on a blank song never repeat a whole sentence or say "0 個"', async () => {
  const p = defaultProject()
  const qs = ['為什麼這和弦？', '幫我寫一首歌', '什麼是和弦？', '主歌和副歌差在哪？', '我不會唱歌可以嗎？']
  const replies = []
  for (const q of qs) replies.push((await ask(p, q)).reply)
  const seen = new Map()
  replies.forEach((r, i) => sentences(r).forEach((s) => {
    assert.ok(!seen.has(s) || seen.get(s) === i, `第 ${seen.get(s)} 則和第 ${i} 則都有這一句：「${s}」`)
    seen.set(s, i)
  }))
  for (const r of replies) assert.ok(!/0 個/.test(wholeText(r)), wholeText(r))
})

test('M-06: beginner questions each get an answer about that question, ending with something to press', async () => {
  const p = defaultProject()
  const expectations = [
    ['什麼是和弦？', /幾個音一起響/, 'harmony'],
    ['主歌和副歌差在哪？', /主歌.*副歌/, 'melody'],
    ['我不會唱歌可以嗎？', /不會唱沒關係/, 'hum'],
  ]
  for (const [q, pattern, step] of expectations) {
    const { reply } = await ask(p, q)
    assert.match(wholeText(reply), pattern, q)
    assert.ok(!wholeText(reply).includes(NOT_SURE), q)
    assert.ok(reply.suggestions?.some((s) => s.action?.type === 'goStep' && s.action.step === step), `${q} 應該帶一個「去${step}」的按鈕`)
  }
  for (const q of ['這個要怎麼用？', '我做錯了嗎？']) {
    const { reply } = await ask(p, q)
    assert.ok(reply.next && !wholeText(reply).includes(NOT_SURE), q)
  }
})

test('M-06: a question it cannot answer says so honestly and points to a way out', async () => {
  for (const id of Object.keys(ROLES)) {
    const { reply } = await ask(defaultProject(), '量子力學是什麼', id)
    assert.equal(reply.text, NOT_SURE)
    assert.ok(!reply.next && !/^[（(]/.test(reply.text))
  }
})

test('M-06: when it cannot answer, it still says what it hears in the song first', async () => {
  const { reply } = await ask(filled(), '你覺得這段怎麼樣？')
  assert.match(reply.text, /副歌用了/)
  assert.ok(reply.text.endsWith(NOT_SURE))
})

test('M-06: every opening line is answered for real, in the state where it is shown (blank and filled)', async () => {
  for (const [label, p] of [['空白', defaultProject()], ['有內容', filled()]]) {
    for (const id of Object.keys(ROLES)) {
      for (const q of quickPrompts(id, p)) {
        const { reply } = await ask(p, q, id)
        assert.ok(!reply.text.endsWith(NOT_SURE), `${label}／${ROLES[id].name}：「${q}」得到通用句`)
        assert.ok(!/0 個|還沒排和弦.*先哼最後兩個音/.test(wholeText(reply)), `${label}／${q}`)
      }
    }
  }
  assert.ok(!quickPrompts('composer', defaultProject()).includes('為什麼這和弦？'), '還沒排和弦時不出「為什麼這和弦？」')
  assert.ok(quickPrompts('composer', filled()).includes('為什麼這和弦？'))
})

test('M-06: the status sentence appears only when there is something to say, and not twice in one conversation', async () => {
  const blank = await ask(defaultProject(), '換一個更哀傷的走向')
  assert.ok(!/這首還沒命名|副歌用了|已經寫了|還沒排和弦/.test(blank.reply.text), blank.reply.text)
  const p = filled()
  const first = (await ask(p, '旋律怎麼寫？')).reply
  assert.match(first.text, /副歌用了/)
  const second = (await ask(p, '旋律怎麼寫？', 'composer', [{ role: 'assistant', content: JSON.stringify(first) }])).reply
  assert.ok(!/副歌用了/.test(second.text), '同一句狀態報告不該再貼一次')
})

// M-12：夥伴嘴裡說「按『…』」「點『…』」的按鈕，畫面上要真的有這個字。
import fs from 'node:fs'
import path from 'node:path'
test('M-12: every button the offline coach tells you to press exists somewhere in the UI text', () => {
  const root = path.resolve(import.meta.dirname, '../../src')
  const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx$/.test(e.name) ? [path.join(dir, e.name)] : [])
  const ui = files(root).map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  const mock = fs.readFileSync(path.join(root, 'agent/mock.ts'), 'utf8')
  const named = [...mock.matchAll(/[按點]「([^」$]+)」/g)].map((m) => m[1])
  assert.ok(named.length >= 2)
  const missing = named.filter((name) => !ui.includes(name))
  assert.deepEqual(missing, [], `夥伴提到畫面上找不到的按鈕：${missing.join('、')}`)
})
test('M-12: recording toolbox cards are not numbered from 2', () => {
  const rec = fs.readFileSync(path.resolve(import.meta.dirname, '../../src/steps/Recording.tsx'), 'utf8')
  assert.ok(!/title="\d\./.test(rec))
})
