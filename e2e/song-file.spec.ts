// M-07：走完九檯要拿得走東西。聲音檔要能放、不是靜音、長度對得上編排；備份檔要匯得回來。
// 用自己的最小 fixture（不用 helpers.ts），不會往 docs/uat/ 寫任何東西。
import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import { describeWav } from '../src/lib/wav'

const KEY = 'maglody-project-v2'
const BPM = 170
const song = {
  version: 1, unlocked: 8, done: Array(9).fill(true),
  idea: { mood: 'warm', vibe: '', theme: '', image: '', story: '', title: '雨停了', hook: '雨停了你還沒來', bpm: BPM },
  harmony: { root: 0, mode: 'major', verse: [0, 4, 5, 3], chorus: [3, 4, 0, 4], quizRight: 0, quizTotal: 0 },
  melody: { verse: [60, 62, 64, 67, ...Array(28).fill(null)], chorus: [64, 67, 69, 72, ...Array(28).fill(null)], reflections: '' },
  lyrics: [{ id: 'v', kind: 'verse', text: '雨落在鞋櫃上' }, { id: 'c', kind: 'chorus', text: '雨停了你還沒來' }],
  arrangement: [
    { id: 'v', kind: 'verse', bars: 2, layers: { drums: false, bass: true, keys: true, pad: false, melody: true } },
    { id: 'c', kind: 'chorus', bars: 2, layers: { drums: true, bass: true, keys: true, pad: true, melody: true } },
  ],
  review: { ratings: {}, checks: {}, verdict: '想再聽副歌' },
}
const expectedSeconds = 4 * 8 * (60 / BPM / 2) // 4 小節

async function open(page: Page, project: unknown = song) {
  await page.route('**/api/master', (r) => r.abort('connectionrefused'))
  await page.addInitScript(({ k, v }) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)) }, { k: KEY, v: project })
  await page.goto('/')
  await expect(page.locator('.desk-name')).toContainText('總檢討')
}
const readFile = async (download: import('@playwright/test').Download) => {
  const path = await download.path()
  return fs.readFileSync(path)
}

test('M-07 聽完之後，主動作變成「把歌存成聲音檔」，得到的 WAV 不是靜音、長度和編排差不到 1 秒', async ({ page }) => {
  await open(page)
  await page.locator('main .primary-action').click()
  await expect(page.locator('main .primary-action')).toHaveText('把歌存成聲音檔', { timeout: Math.ceil(expectedSeconds + 6) * 1000 })
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('main .primary-action').click()])
  expect(download.suggestedFilename()).toBe('雨停了.wav')
  const buf = readFile(await Promise.resolve(download))
  const wav = describeWav(new Uint8Array(await buf).buffer.slice(0) as ArrayBuffer)
  expect(Math.abs(wav.seconds - expectedSeconds), `長度 ${wav.seconds}s，編排 ${expectedSeconds}s`).toBeLessThan(1)
  expect(wav.rms, '不是靜音').toBeGreaterThan(0.005)
  expect(wav.peak, '沒有爆音').toBeLessThanOrEqual(1)
  expect(wav.channels).toBe(2)
})

test('M-07 還沒聽也能從工具箱存聲音檔', async ({ page }) => {
  await open(page)
  await page.locator('.toolbox > summary').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '存成聲音檔（.wav）' }).click()])
  const wav = describeWav(new Uint8Array(await readFile(download)).buffer.slice(0) as ArrayBuffer)
  expect(wav.rms).toBeGreaterThan(0.005)
})

test('M-07 有哼唱時，可以先聽你一開始哼的，再聽現在的', async ({ page }) => {
  const withHum = { ...song, hum: { notes: [{ midi: 60, start: 0, dur: 0.4 }, { midi: 62, start: 0.5, dur: 0.4 }], duration: 1, keyRoot: 0, keyMode: 'major', confidence: 0.8, chordHints: ['C'], rangeLow: 60, rangeHigh: 62, source: 'mic' } }
  await open(page, withHum)
  await page.getByRole('button', { name: '先聽你一開始哼的，再聽現在的' }).click()
  await expect(page.locator('main .primary-action')).toHaveText('■ 停')
  await expect(page.locator('main .primary-action')).toHaveText('把歌存成聲音檔', { timeout: 20_000 })
})

test('M-07 備份檔匯得回來：匯出的內容在空白瀏覽器匯入後，專案與匯出前相同', async ({ page, browser }) => {
  await open(page)
  const before = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-more > summary').click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '存一份備份' }).click()])
  expect(download.suggestedFilename()).not.toMatch(/music-lab/)
  const file = await download.path()
  // 全新的瀏覽器，什麼都沒有
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page2 = await fresh.newPage()
  await page2.route('**/api/master', (r) => r.abort('connectionrefused'))
  await page2.goto('/')
  await expect(page2.locator('main .primary-action').first()).toBeVisible()
  await page2.getByRole('button', { name: '打開工作室選單' }).click()
  await page2.locator('.menu-more > summary').click()
  await page2.locator('input[type=file][accept*=json]').setInputFiles(file)
  await page2.getByRole('button', { name: '打開這份備份' }).click()
  await expect(page2.locator('.desk-name')).toContainText('總檢討')
  const after = await page2.evaluate((k) => JSON.parse(localStorage.getItem(k)!), KEY)
  expect(after).toEqual(before)
  await fresh.close()
})

test('M-07 壞掉的備份檔：原本的歌不變，並說明原因', async ({ page }) => {
  await open(page)
  const before = await page.evaluate((k) => localStorage.getItem(k), KEY)
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-more > summary').click()
  const input = page.locator('input[type=file][accept*=json]')
  for (const [name, body] of [['a.json', '{}'], ['b.json', '這不是 JSON'], ['c.json', '[1,2,3]'], ['d.json', '{"version":1}']] as const) {
    await input.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(body) })
    await expect(page.getByText('你現在的歌沒有動')).toBeVisible()
    await expect(page.getByRole('button', { name: '打開這份備份' })).toHaveCount(0)
  }
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(before)
})
