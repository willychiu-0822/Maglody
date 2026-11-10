import { test, expect, setup, go, desks, primary } from './helpers'

async function outsideClick(page: import('@playwright/test').Page) {
  // The full-screen dialog receives this outside-sheet click on both layouts.
  await page.mouse.click(2, 2)
}

test('UAT-73 彈窗用明確按鈕關閉，保存提示按好才收起', async ({ page }, info) => {
  await setup(page)
  for (const opener of [page.getByRole('button', { name: '打開工作室選單' }), page.locator('.presence'), page.getByRole('button', { name: '記一下靈感' })]) {
    await opener.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await outsideClick(page)
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '關閉', exact: true }).click()
    await expect(dialog).toBeHidden()
  }
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await page.getByRole('textbox', { name: '靈感文字' }).fill('今天窗邊，有一小段旋律')
  await page.getByRole('button', { name: '夾進本子', exact: true }).click()
  const notice = page.locator('.toast[role="status"]')
  await expect(notice).toContainText('收好了')
  await page.screenshot({ path: `docs/uat/evidence/A-UI-12-notice-${info.project.name}.png`, fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await expect(page.getByRole('dialog').locator('.toast')).toContainText('收好了')
  await page.getByRole('dialog').getByRole('button', { name: '好', exact: true }).click()
  await expect(notice).toHaveCount(0)
  await page.getByRole('button', { name: '關閉', exact: true }).click()
  await expect(page.locator('.toast')).toHaveCount(0)
})
