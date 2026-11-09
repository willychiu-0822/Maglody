import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const files = (await readdir('dist/assets')).sort()
const studio = (await readdir('dist/studio', { recursive: true })).filter(file=>file.endsWith('.webp')).sort()
const assets = [...files.map(file => `./assets/${file}`), ...studio.map(file=>`./studio/${file}`), './paper-fibers.svg']
const html = await readFile('dist/index.html', 'utf8')
const worker = await readFile('public/sw.js', 'utf8')
const revision = createHash('sha256').update(html).update(JSON.stringify(assets)).update(worker).update(Buffer.concat(await Promise.all(studio.map(file=>readFile(`dist/studio/${file}`))))).digest('hex').slice(0, 12)
await writeFile('dist/sw.js', worker.replace("'maglody-shell-dev'", `'maglody-shell-${revision}'`).replace('const BUILD_ASSETS = []', `const BUILD_ASSETS = ${JSON.stringify(assets)}`))
console.log(`Offline shell prepared: ${assets.length} build assets`)
