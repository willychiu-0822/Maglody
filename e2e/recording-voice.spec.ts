import { test, expect } from '@playwright/test'

test('空白歌曲的暖嗓音不會假稱來自旋律', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: /^錄音準備$/ }) }).click()
  await page.locator('.toolbox summary').click()
  await page.getByText('2. 暖嗓：音準跟唱').evaluate(element => element.scrollIntoView({ block: 'center' }))
  await page.screenshot({ path: `docs/uat/evidence/copy-recording-${testInfo.project.name}-after.png` })
  await expect(page.getByText('先拿這幾個音暖暖嗓。')).toBeVisible()
})
