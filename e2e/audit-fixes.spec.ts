// 審查報告 2026-11-14 的 P2 驗收案例。用自己的最小 fixture（不用 helpers.ts），不會往 docs/uat/ 寫任何東西。
import { test, expect, type Page } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'

const KEY = 'maglody-project-v2'
const notes = (n: number) => [60, 62, 64, 67, 69, 72].slice(0, n).concat(Array(32 - n).fill(null))

async function open(page: Page, project: Record<string, unknown> = {}) {
  await page.route('**/api/master', (r) => r.abort('connectionrefused'))
  await page.addInitScript(({ k, v }) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)) }, { k: KEY, v: { version: 1, ...project } })
  await page.goto('/')
  await expect(page.locator('main .primary-action').first()).toBeVisible()
}
async function visit(page: Page, desk: string) {
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
  await expect(page.locator('.desk-name')).toContainText(desk)
}
const mission = (page: Page) => page.locator('.desk-mission strong')
const activePart = (page: Page) => page.locator('.seg-quiet button.on')

test.describe('M-08 旋律檯：亮著的分頁、小任務、主按鈕講同一段', () => {
  test('空白進來：停在主歌，小任務和主按鈕都是主歌', async ({ page }) => {
    await open(page)
    await visit(page, '旋律')
    await expect(activePart(page)).toHaveText('主歌')
    await expect(mission(page)).toContainText('主歌')
  })
  test('主歌寫好、副歌空的：停在副歌，小任務指副歌', async ({ page }) => {
    await open(page, { melody: { verse: notes(5), chorus: notes(0), reflections: '' } })
    await visit(page, '旋律')
    await expect(activePart(page)).toHaveText('副歌')
    await expect(mission(page)).toContainText('副歌')
  })
  test('一段寫好、另一段空的：有一步就能切過去的動作，小任務也換成那一段', async ({ page }) => {
    await open(page, { melody: { verse: notes(0), chorus: notes(5), reflections: '' } })
    await visit(page, '旋律')
    // 剛進來停在第一個沒完成的主歌；切去已經寫好的副歌，再用一個動作回主歌
    await page.locator('.seg-quiet button').filter({ hasText: '副歌' }).click()
    await expect(page.getByRole('button', { name: '換主歌 →', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '換主歌 →', exact: true }).click()
    await expect(activePart(page)).toHaveText('主歌')
    await expect(mission(page)).toContainText('主歌')
  })
  test('有哼唱草稿時，主按鈕直接說倒進哪一段', async ({ page }) => {
    const hum = { notes: [{ midi: 60, start: 0, dur: 0.4 }, { midi: 62, start: 0.5, dur: 0.4 }, { midi: 64, start: 1, dur: 0.4 }, { midi: 67, start: 1.5, dur: 0.4 }], duration: 2, keyRoot: 0, keyMode: 'major', confidence: 0.8, chordHints: ['C'], rangeLow: 60, rangeHigh: 67, source: 'demo' }
    await open(page, { hum })
    await visit(page, '旋律')
    await expect(page.locator('main .primary-action')).toHaveText('把哼唱倒進主歌')
    await page.locator('main .primary-action').click()
    await expect(mission(page)).toContainText('副歌')
  })
})

test.describe('M-09 混音檯：小任務只講畫面上看得到的東西', () => {
  test('不打開工具箱，只照小任務推「主旋律」推桿，前進鈕就出現', async ({ page }) => {
    await open(page, { harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 }, melody: { verse: notes(5), chorus: notes(5), reflections: '' } })
    await visit(page, '混音觀念')
    await page.locator('main .primary-action').click() // ▶ 播放副歌
    await expect(page.locator('main .primary-action')).toContainText('■ 停')
    await page.locator('main .primary-action').click()
    const text = await mission(page).innerText()
    expect(text).not.toMatch(/紅燈|燈/)
    expect(text).toContain('主旋律')
    expect(await page.locator('.toolbox').evaluate((e) => (e as HTMLDetailsElement).open)).toBe(false)
    await page.locator('.mix-row', { hasText: '主旋律' }).locator('input').fill('1.2')
    await expect(page.locator('main .primary-action')).toContainText('去')
  })
})

test.describe('M-14 歌詞檯：最早那句話是問一句，不是關卡', () => {
  const lyrics = [{ id: 'v', kind: 'verse', text: '雨落在鞋櫃上\n鑰匙安靜發光' }, { id: 'c', kind: 'chorus', text: '可是你還沒有來\n我一個人等著' }]
  const base = { idea: { mood: 'warm', vibe: '', theme: '', image: '', story: '', title: '', hook: '雨停了你還沒來', bpm: 90 }, lyrics, harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 }, melody: { verse: notes(5), chorus: notes(5), reflections: '' } }
  test('主歌、副歌各兩句，副歌沒有原句：前進鈕照樣出現，夥伴問一句', async ({ page }) => {
    await open(page, base)
    await visit(page, '歌詞')
    await expect(page.getByRole('group', { name: '最早那句還要留嗎' })).toBeVisible()
    await expect(page.locator('main .primary-action')).toContainText('詞有了，去')
    await expect(page.locator('body')).not.toContainText('打勾')
  })
  test('選「放進副歌」：原句進了副歌，問題消失', async ({ page }) => {
    await open(page, base)
    await visit(page, '歌詞')
    await page.getByRole('button', { name: '放進副歌', exact: true }).click()
    await expect(page.getByRole('group', { name: '最早那句還要留嗎' })).toHaveCount(0)
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)
    expect(saved.lyrics.find((s: { kind: string }) => s.kind === 'chorus').text).toContain('雨停了你還沒來')
    expect(saved.idea.hook).toBe('雨停了你還沒來')
  })
  test('選「我改主意了」：構想檯那句換成副歌第一句，歌詞不動', async ({ page }) => {
    await open(page, base)
    await visit(page, '歌詞')
    await page.getByRole('button', { name: '我改主意了', exact: true }).click()
    await expect(page.getByRole('group', { name: '最早那句還要留嗎' })).toHaveCount(0)
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)
    expect(saved.idea.hook).toBe('可是你還沒有來')
    expect(saved.lyrics.find((s: { kind: string }) => s.kind === 'chorus').text).toBe('可是你還沒有來\n我一個人等著')
    await expect(page.locator('main .primary-action')).toContainText('詞有了，去')
  })
})

test.describe('M-16 每個彈窗都有一顆有字、能用、按了會關掉它的按鈕', () => {
  const LEAVE = /^(回到.+繼續創作|聊到這裡，回去做歌|先不記|闔上本子|先不存|先不換|繼續這首歌)$/
  async function expectLeaves(page: Page) {
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toHaveCount(1)
    const leave = dialog.getByRole('button', { name: LEAVE })
    await expect(leave.first()).toBeVisible()
    await expect(leave.first()).toBeEnabled()
    await leave.first().click()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  }
  test('選單', async ({ page }) => { await open(page); await page.getByRole('button', { name: '打開工作室選單' }).click(); await expectLeaves(page) })
  test('聊天', async ({ page }) => { await open(page); await page.locator('.presence').click(); await expectLeaves(page) })
  test('記靈感（內容是空的、主按鈕停用時也一樣）', async ({ page }) => {
    await open(page); await page.getByRole('button', { name: '記一下靈感' }).click()
    await expect(page.getByRole('button', { name: '夾進本子', exact: true })).toBeDisabled()
    await expectLeaves(page)
  })
  test('靈感本子', async ({ page }) => {
    await open(page); await page.getByRole('button', { name: '記一下靈感' }).click()
    await page.getByRole('button', { name: /翻翻本子/ }).click()
    await expectLeaves(page)
  })
  for (const [label, open_] of [['存一版', '存成新的一版'], ['重新開始', '重新開始一首新歌']] as const) {
    test(`改稿紙頁：${label}`, async ({ page }) => {
      await open(page); await page.getByRole('button', { name: '打開工作室選單' }).click()
      await page.locator('.menu-more > summary').click()
      await page.getByRole('button', { name: open_, exact: true }).click()
      await expect(page.locator('dialog[open]')).toHaveCount(2) // 選單還開著，改稿紙頁疊在上面
      await page.locator('dialog[open]').last().getByRole('button', { name: LEAVE }).first().click()
      await expect(page.locator('dialog[open]')).toHaveCount(1) // 回到選單
    })
  }
})

test.describe('M-17 站台放在子路徑時，人物和底圖照樣載得到', () => {
  const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' }
  test('dist 掛在 /maglody/ 底下：首屏與聊天視窗沒有 4xx、沒有破圖', async ({ page }) => {
    const root = path.resolve('dist')
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://x')
      if (!url.pathname.startsWith('/maglody/')) { res.writeHead(404).end(); return }
      const rel = decodeURIComponent(url.pathname.slice('/maglody/'.length)) || 'index.html'
      const file = path.join(root, rel)
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as AddressInfo).port
    const bad: string[] = []
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/api/')) bad.push(`${r.status()} ${r.url()}`) })
    try {
      await page.route('**/api/master', (r) => r.abort('connectionrefused'))
      await page.goto(`http://127.0.0.1:${port}/maglody/`)
      await expect(page.locator('main .primary-action').first()).toBeVisible()
      await page.locator('.presence').click()
      await expect(page.locator('dialog[open] img[data-character-portrait]')).toBeVisible()
      await page.waitForLoadState('networkidle')
      const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src))
      expect(broken, '有圖載不到').toEqual([])
      expect(bad, '有 4xx 請求').toEqual([])
    } finally { server.close() }
  })
})

test.describe('M-18 Demo 版本：滿了要先問，也能刪', () => {
  const VKEY = 'maglody-versions-v1'
  const versions = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id${n - i}`, name: `Demo v${n - i}`, note: '', at: 1000 + n - i, project: { version: 1 } })) // 新的在前
  async function openWithVersions(page: Page, n: number) {
    await page.addInitScript(({ k, v }) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)) }, { k: VKEY, v: versions(n) })
    await open(page)
    await page.getByRole('button', { name: '打開工作室選單' }).click()
    await page.locator('.menu-more > summary').click()
  }
  const stored = (page: Page) => page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? '[]') as { name: string }[]).map((v) => v.name), VKEY)

  test('第 21 次存檔會先問；選「先不存」，20 版原封不動', async ({ page }) => {
    await openWithVersions(page, 20)
    const before = await stored(page)
    await page.getByRole('button', { name: '存成新的一版', exact: true }).click()
    await expect(page.getByText('本子只放得下 20 版')).toContainText('Demo v1')
    await page.locator('dialog[open]').last().getByRole('button', { name: '先不存' }).click()
    expect(await stored(page)).toEqual(before)
  })
  test('選「換掉」：最舊的一版被換掉，新的一版進來', async ({ page }) => {
    await openWithVersions(page, 20)
    await page.getByRole('button', { name: '存成新的一版', exact: true }).click()
    await page.getByRole('button', { name: /^換掉 Demo v1，收好這一版$/ }).click()
    const after = await stored(page)
    expect(after).toHaveLength(20)
    expect(after).not.toContain('Demo v1')
    expect(after[0]).toBe('Demo v21')
  })
  test('少於 20 版時照舊直接存，不多問', async ({ page }) => {
    await openWithVersions(page, 3)
    await page.getByRole('button', { name: '存成新的一版', exact: true }).click()
    await expect(page.getByText('本子只放得下 20 版')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '收好這一版', exact: true })).toBeVisible()
  })
  test('版本能從畫面刪除，刪之前有確認，選「先不刪」什麼都不動', async ({ page }) => {
    await openWithVersions(page, 3)
    await page.getByRole('button', { name: '刪掉 Demo v2', exact: true }).click()
    await page.locator('dialog[open]').last().getByRole('button', { name: '先不刪' }).click()
    expect(await stored(page)).toEqual(['Demo v3', 'Demo v2', 'Demo v1'])
    await page.getByRole('button', { name: '刪掉 Demo v2', exact: true }).click()
    await page.locator('dialog[open]').last().getByRole('button', { name: '刪掉 Demo v2', exact: true }).click()
    expect(await stored(page)).toEqual(['Demo v3', 'Demo v1'])
  })
})

test.describe('M-21 隱私：第一次聽寫前先說明，可以選只錄音；選單有「你的東西放在哪」', () => {
  async function toCapture(page: Page) {
    await open(page)
    await page.getByRole('button', { name: '記一下靈感' }).click()
  }
  test('第一次按「說」：先出現說明，兩個選項；選「只錄音」就直接開始錄', async ({ page }) => {
    await toCapture(page)
    await page.locator('.inspo-big').filter({ hasText: '說' }).click()
    const ask = page.getByRole('group', { name: '語音聽寫說明' })
    await expect(ask).toContainText('瀏覽器幫忙把你說的話打成字')
    await expect(ask).toContainText('語音服務')
    await expect(page.locator('.inspo-big.rec')).toHaveCount(0) // 說明之前不會偷偷開始錄
    await ask.getByRole('button', { name: '只錄音', exact: true }).click()
    await expect(page.locator('.inspo-big.rec')).toBeVisible()
    await expect(page.locator('.inspo-live')).toHaveCount(0) // 沒有聽寫的即時文字
  })
  test('選「好，開始說」之後記住，下次不再問', async ({ page }) => {
    await toCapture(page)
    await page.locator('.inspo-big').filter({ hasText: '說' }).click()
    await page.getByRole('button', { name: '好，開始說', exact: true }).click()
    await expect(page.locator('.inspo-big.rec')).toBeVisible()
    await page.locator('.inspo-big.rec').click()
    await expect(page.locator('.inspo-big.rec')).toHaveCount(0)
    await page.locator('.inspo-big').filter({ hasText: '說' }).click()
    await expect(page.getByRole('group', { name: '語音聽寫說明' })).toHaveCount(0)
  })
  test('選單「更多」裡找得到資料存放說明：本機儲存、聽寫、夥伴各一句', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: '打開工作室選單' }).click()
    await page.locator('.menu-more > summary').click()
    await page.locator('.data-note > summary').click()
    const note = page.locator('.data-note')
    await expect(note).toContainText('存在這支裝置的瀏覽器裡')
    await expect(note).toContainText('語音辨識')
    await expect(note).toContainText('夥伴')
  })
})

test.describe('M-22 靈感本子：新使用者不會有一則刪不掉的別人的靈感', () => {
  test('全新使用者的本子只有一張標明是範例的紙片，而且可以刪', async ({ page }) => {
    await open(page)
    await page.getByRole('button', { name: '記一下靈感' }).click()
    await page.getByRole('button', { name: /翻翻本子/ }).click()
    const cards = page.locator('.inspo-card')
    await expect(cards).toHaveCount(1)
    await cards.first().locator('.inspo-card-head').click()
    await expect(cards.first()).toContainText('這是一張範例紙片')
    await cards.first().getByRole('button', { name: '其他用法…', exact: true }).click()
    await cards.first().locator('[data-notebook-remove]').click()
    await page.getByRole('dialog', { name: '移除這張紙片', exact: true }).getByRole('button', { name: '確定移除這張紙片', exact: true }).click()
    await expect(cards).toHaveCount(0)
    // 丟掉之後重新整理，不會再回來
    await page.reload()
    await page.getByRole('button', { name: '記一下靈感' }).click()
    await page.getByRole('button', { name: /翻翻本子/ }).click()
    await expect(page.locator('.inspo-card')).toHaveCount(0)
  })
})

test.describe('M-23／M-26 重新整理回到同一檯；夥伴的話不會自己消失', () => {
  const finishedSong = { unlocked: 8, done: Array(9).fill(true), idea: { mood: 'warm', vibe: '', theme: '', image: '', story: '', title: '雨停了', hook: '雨停了你還沒來', bpm: 90 }, harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 } }
  test('M-23 從選單回到哼唱解析，重新整理後仍在哼唱解析', async ({ page }) => {
    await open(page, finishedSong)
    await expect(page.locator('.desk-name')).toContainText('總檢討')
    await visit(page, '哼唱解析')
    await page.reload()
    await expect(page.locator('.desk-name')).toContainText('哼唱解析')
    await visit(page, '和聲')
    await page.reload()
    await expect(page.locator('.desk-name')).toContainText('和聲')
  })
  test('M-26 夥伴對剛才動作的回應，不操作 31 秒後仍看得到', async ({ page }) => {
    test.setTimeout(75_000)
    await open(page)
    await page.getByRole('button', { name: '沒有麥克風？聽示範' }).click()
    const line = page.locator('.presence-state')
    await expect(line).toContainText('停留最久', { timeout: 10_000 })
    const said = await line.innerText()
    await page.waitForTimeout(31_000)
    await expect(line).toHaveText(said)
  })
})

test.describe('M-13 總檢討：不像成績單，也不是一面下載牆', () => {
  const song = { unlocked: 8, idea: { mood: 'warm', vibe: '', theme: '', image: '', story: '', title: '雨停了', hook: '雨停了你還沒來', bpm: 90 }, harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 }, melody: { verse: notes(5), chorus: notes(5), reflections: '' }, lyrics: [{ id: 'v', kind: 'verse', text: '雨落在鞋櫃上\n鑰匙安靜發光' }, { id: 'c', kind: 'chorus', text: '雨停了你還沒來\n我一個人等著' }], arrangement: [{ id: 'v', kind: 'verse', bars: 8, layers: { drums: false, bass: true, keys: true, pad: false, melody: true } }, { id: 'c', kind: 'chorus', bars: 8, layers: { drums: true, bass: true, keys: true, pad: true, melody: true } }] }
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('390×844 工具箱全開，整頁不超過 2,000 px；沒有成排的 1–5 分鈕；下載 .mid 只有一顆', async ({ page }) => {
    await open(page, song)
    await page.locator('.toolbox > summary').click()
    await page.getByText('想看夥伴的小發現').click()
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(height, `整頁高 ${height}px`).toBeLessThanOrEqual(2000)
    await expect(page.locator('.stars, .star')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /MIDI|\.mid/ })).toHaveCount(1)
  })
  test('只問一題「哪一段最想再聽？」，選了會記住、再按一次取消', async ({ page }) => {
    await open(page, song)
    await page.locator('.toolbox > summary').click()
    await page.getByRole('button', { name: '副歌', exact: true }).click()
    expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).review.checks['fav:chorus'], KEY)).toBe(true)
    await page.getByRole('button', { name: '主歌', exact: true }).click()
    const checks = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).review.checks, KEY)
    expect(checks['fav:verse']).toBe(true)
    expect(checks['fav:chorus']).toBeUndefined()
  })
})

test.describe('M-07 第一次存檔後，夥伴說一次歌存在哪裡', () => {
  test('第一次按前進後出現；按「好」收起；重新整理後不再出現', async ({ page }) => {
    await open(page, { harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 } })
    await expect(page.getByText('歌是存在這支手機的瀏覽器裡的')).toHaveCount(0)
    await page.getByRole('button', { name: '沒有麥克風？聽示範' }).click()
    await page.locator('main .primary-action').filter({ hasText: '用這段繼續' }).click()
    const note = page.locator('.toast', { hasText: '歌是存在這支手機的瀏覽器裡的' })
    await expect(note).toContainText('存一份備份')
    await note.getByRole('button', { name: '好', exact: true }).click()
    await expect(note).toHaveCount(0)
    await page.reload()
    await visit(page, '哼唱解析')
    await page.locator('main .primary-action').filter({ hasText: '用這段繼續' }).click() // 哼唱結果已存下來，再前進一次
    await expect(page.locator('.desk-name')).toContainText('構想')
    await expect(page.getByText('歌是存在這支手機的瀏覽器裡的')).toHaveCount(0)
  })
})
