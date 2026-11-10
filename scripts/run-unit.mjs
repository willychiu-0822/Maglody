// Node 22 只接受 --experimental-test-isolation；Node 23 起改名為 --test-isolation。
// 選這顆 Node 實際支援的那個，隔離模式仍是 none（與原本腳本相同，沒有放寬斷言）。
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'

const files = readdirSync('scripts/tests')
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => `scripts/tests/${name}`)
const flag = ['--experimental-test-isolation=none', '--test-isolation=none'].find((candidate) => {
  return spawnSync(process.execPath, [candidate, '-e', '0'], { stdio: 'ignore' }).status === 0
})
if (!flag) {
  console.error('此 Node 無法在同一個行程跑測試。需要 --experimental-test-isolation=none 或 --test-isolation=none。')
  process.exit(1)
}
const run = spawnSync(process.execPath, ['--import', './scripts/test-loader.mjs', '--test', flag, ...files], { stdio: 'inherit' })
process.exit(run.status === null ? 1 : run.status)
