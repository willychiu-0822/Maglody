import { test, expect, type Page } from '@playwright/test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'

const desks = ['哼唱解析', '構想', '和聲', '旋律', '歌詞', '編曲', '錄音準備', '混音觀念', '總檢討']

test('部署伺服器為圖片、音訊和字型提供正確的 MIME 類型', async ({ request }) => {
  const directory = await mkdtemp(join(process.cwd(), 'dist', 'mime-test-'))
  const types: Record<string, string> = {
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    mp3: 'audio/mpeg', wav: 'audio/wav', webm: 'video/webm', woff2: 'font/woff2',
  }
  try {
    for (const [extension, type] of Object.entries(types)) {
      await writeFile(join(directory, `sample.${extension}`), 'fixture')
      const response = await request.get(`/${basename(directory)}/sample.${extension}`)
      expect(response.status(), extension).toBe(200)
      expect(response.headers()['content-type'], extension).toBe(type)
      expect(response.headers()['x-content-type-options'], extension).toBe('nosniff')
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

async function checkAssets(page: Page, surface: string) {
    const failures = await page.evaluate(async () => {
      const images = Array.from(document.images)
      await Promise.all(images.map(image => image.decode().catch(() => undefined)))
      const bad = images.filter(image => !image.complete || image.naturalWidth === 0).map(image => `img: ${image.currentSrc || image.src}`)
      const urls = new Set<string>()
      for (const element of document.querySelectorAll('*')) {
        for (const pseudo of [null, '::before', '::after']) {
          const background = getComputedStyle(element, pseudo).backgroundImage
          for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) urls.add(match[1])
        }
      }
      if (![...urls].some(url => url.includes('/paper-fibers.svg'))) bad.push('background: paper texture was not checked')
      await Promise.all([...urls].map(url => new Promise<void>(resolve => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => { bad.push(`background: ${url}`); resolve() }
        image.src = url
      })))
      return bad
    })
    expect(failures, surface).toEqual([])
}

test('部署伺服器的每個工作檯圖片和背景都能載入', async ({ page }) => {
  await page.goto('/')
  for (const [index, desk] of desks.entries()) {
    if (index) {
      await page.getByRole('button', { name: '打開工作室選單' }).click()
      await checkAssets(page, '工作室選單')
      await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
    }
    await expect(page.locator('.desk-name')).toContainText(desk)
    await checkAssets(page, desk)
  }
  await page.locator('.presence').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await checkAssets(page, '夥伴對話')
  await page.getByRole('dialog').getByRole('button', { name: '關閉', exact: true }).click()
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await checkAssets(page, '記靈感')
  await page.getByRole('button', { name: /翻翻本子/ }).click()
  await checkAssets(page, '靈感本子')
})
