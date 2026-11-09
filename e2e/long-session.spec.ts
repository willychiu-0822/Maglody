import { test, expect, setup, go, shot } from './helpers'

test('UAT-61 長對話後換檯，場景夥伴仍會回應新問題', async ({ page }, info) => {
  let replies = 0
  await page.route('**/api/master', route => route.fulfill({ json: {
    text: `我聽到了第 ${++replies} 個想法，先哼一句再比較。`,
  } }))
  await setup(page)
  await page.locator('.presence').click()
  // Exercise the real chat window past its bounded history, without seeding internal state.
  for (let i = 1; i <= 22; i++) {
    await page.locator('.master-input input').fill('我想換個結尾')
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.msg-master').last()).toContainText(`第 ${i} 個想法`)
  }
  await page.getByRole('button', { name: '關閉', exact: true }).click()
  await go(page, '歌詞')
  await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
  await page.locator('.presence').click()
  await page.locator('.master-input input').fill('我想寫窗外的雨')
  await page.getByRole('button', { name: '送出', exact: true }).click()
  await expect(page.locator('.msg-master').last()).toContainText('第 23 個想法')
  await page.getByRole('button', { name: '關閉', exact: true }).click()
  await expect(page.locator('.presence-state')).toContainText('第 23 個想法')
  await expect(page.locator('.studio-presence')).toHaveAttribute('data-state', 'responding')
  await shot(page, info, 'scene-response')
})
