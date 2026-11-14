// M-03：九檯剛進來時，主按鈕整顆都要在第一屏，不必捲動。空白儲存、三種螢幕。
// 這支用自己的最小 fixture（不用 helpers.ts），所以不會往 docs/uat/ 寫截圖。
import { test, expect } from '@playwright/test'

const desks = ['哼唱解析', '構想', '和聲', '旋律', '歌詞', '編曲', '錄音準備', '混音觀念', '總檢討']
const viewports = [
  { name: '手機 390×844', width: 390, height: 844, mobile: true },
  { name: '小手機 360×640', width: 360, height: 640, mobile: true },
  { name: '桌面 1280×800', width: 1280, height: 800, mobile: false },
]

for (const vp of viewports) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile })
    test(`九檯進場時主按鈕整顆在第一屏`, async ({ page }, info) => {
      test.skip(info.project.name === 'desktop', '螢幕尺寸由這支自己決定，跑一次就好')
      await page.route('**/api/master', (r) => r.abort('connectionrefused'))
      await page.goto('/')
      await expect(page.locator('main .primary-action').first()).toBeVisible()
      const rows: string[] = []
      const bad: string[] = []
      for (const desk of desks) {
        await page.getByRole('button', { name: '打開工作室選單' }).click()
        await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
        await expect(page.locator('.desk-name')).toContainText(desk)
        await page.waitForTimeout(500) // 讓進場的捲動與動畫停下來
        const m = await page.evaluate(() => {
          const el = document.querySelector('main .primary-action') as HTMLElement | null
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { text: el.textContent?.trim() ?? '', top: Math.round(r.top), bottom: Math.round(r.bottom), h: window.innerHeight, scrollY: Math.round(window.scrollY), overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 }
        })
        rows.push(`${desk}\t${m ? `${m.text}\ttop=${m.top} bottom=${m.bottom}/${m.h} scrollY=${m.scrollY}` : '（找不到主按鈕）'}`)
        if (!m || m.top < 0 || m.bottom > m.h) bad.push(`${desk}：${m ? `「${m.text}」top=${m.top} bottom=${m.bottom}（視窗高 ${m.h}）` : '找不到主按鈕'}`)
        if (m?.overflowX) bad.push(`${desk}：出現水平捲動`)
      }
      console.log(`\n[${vp.name}]\n${rows.join('\n')}`)
      expect(bad, `主按鈕不在第一屏：\n${bad.join('\n')}`).toEqual([])
    })
  })
}
