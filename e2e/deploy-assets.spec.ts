import { test, expect } from '@playwright/test'

const desks = ['哼唱解析', '構想', '和聲', '旋律', '歌詞', '編曲', '錄音準備', '混音觀念', '總檢討']

test('部署伺服器的每個工作檯圖片和背景都能載入', async ({ page }) => {
  await page.goto('/')
  for (const [index, desk] of desks.entries()) {
    if (index) {
      await page.getByRole('button', { name: '打開工作室選單' }).click()
      await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
    }
    await expect(page.locator('.desk-name')).toContainText(desk)
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
      await Promise.all([...urls].map(url => new Promise<void>(resolve => {
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = () => { bad.push(`background: ${url}`); resolve() }
        image.src = url
      })))
      return bad
    })
    expect(failures, desk).toEqual([])
  }
})
