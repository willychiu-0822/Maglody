// M-11：稱呼統一。帶你的人叫「夥伴」，這個地方叫「工作室」，那句話固定叫「一句話」；
// M-14：不把創作講成過關（「打勾」）。只掃使用者看得到的字（跳過註解）。
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [])
const visibleLines = (file) => fs.readFileSync(file, 'utf8').split('\n').map((text, i) => ({ text, line: i + 1 })).filter(({ text }) => !/^\s*(\/\/|\/\*|\*)/.test(text))

test('M-11: no 大師 in the page description, manifest or README', () => {
  for (const f of ['index.html', 'public/manifest.webmanifest', 'README.md']) assert.ok(!/大師/.test(fs.readFileSync(path.join(root, f), 'utf8')), `${f} 還有「大師」`)
})

test('M-11／M-14: the words that were retired do not show up in the app text', () => {
  const retired = [/探險/, /冒險/, /記憶點/, /\bHook\b/, /一句靈感/, /那句話/, /打勾/, /大師/]
  const hits = []
  for (const file of files(path.join(root, 'src'))) for (const { text, line } of visibleLines(file)) for (const re of retired) if (re.test(text)) hits.push(`${path.relative(root, file)}:${line} ${re}`)
  assert.deepEqual(hits, [])
})
