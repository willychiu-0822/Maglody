// M-01 的護欄：後端在映像裡只有 server/ 這個資料夾，而且是用 Node 直接執行 TypeScript（不經過測試載入器）。
// 所以 server/ 底下的檔案 ① 不能 import server/ 以外的東西 ② 相對 import 一定要寫 .ts 副檔名。
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../server')
const files = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : /\.ts$/.test(e.name) ? [path.join(dir, e.name)] : [])

test('server/ is self-contained and uses explicit .ts extensions', () => {
  const problems = []
  for (const file of files(root)) {
    const src = fs.readFileSync(file, 'utf8')
    for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const spec = m[1] ?? m[2]
      if (!spec.startsWith('.')) continue
      const target = path.resolve(path.dirname(file), spec)
      const rel = path.relative(root, file)
      if (path.relative(root, target).startsWith('..')) problems.push(`${rel} 引用了 server/ 外面的檔案：${spec}`)
      else if (!/\.ts$/.test(spec)) problems.push(`${rel} 的相對 import 沒寫 .ts：${spec}`)
      else if (!fs.existsSync(target)) problems.push(`${rel} 引用的檔案不存在：${spec}`)
    }
  }
  assert.deepEqual(problems, [])
})
