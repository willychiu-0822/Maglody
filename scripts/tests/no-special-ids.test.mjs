// M-22：程式裡不該有針對某一則靈感 id 的例外（刪除、顯示……）。
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../src')
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : [])

test('M-22: no code branches on a specific inspiration id, and the old seed text is gone', () => {
  for (const file of files(root)) {
    const src = fs.readFileSync(file, 'utf8')
    assert.ok(!/seed-fuzui|負罪前行/.test(src), `${path.relative(root, file)} 還留著舊的 seed`)
    assert.ok(!/\.id\s*[!=]==?\s*['"](?:seed|example)/.test(src), `${path.relative(root, file)} 針對特定 id 寫了例外`)
  }
})
