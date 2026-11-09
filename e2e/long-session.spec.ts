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

test('UAT-62 等待作曲家時切換角色，不讓作詞人冒充思考中', async ({ page }, info) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/api/master', async route => {
    const composer = ++requests === 1
    if (composer) await gate
    await route.fulfill({ json: { text: composer ? '先留一格空白，讓旋律可以換氣。' : '可以先寫眼前看見的一個畫面。' } })
  })
  await setup(page)
  try {
    await page.locator('.presence').click()
    await page.locator('.master-input input').fill('旋律怎麼留白？')
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.typing')).toBeVisible()
    await expect(page.locator('.msg-master').last().locator('.msg-avatar')).toHaveText('曲')
    await page.getByRole('tab', { name: '作詞人', exact: true }).click()
    await expect(page.locator('.typing')).toHaveCount(0)
    await page.locator('.master-input input').fill('我想寫窗外的雨')
    await expect(page.getByRole('button', { name: '送出', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.msg-master').last()).toContainText('先寫眼前看見的一個畫面')
    await expect(page.locator('.msg-master').last().locator('.msg-avatar')).toHaveText('詞')
    await page.getByRole('tab', { name: '作曲家', exact: true }).click()
    await expect(page.locator('.typing')).toBeVisible()
    await page.getByRole('button', { name: '關閉', exact: true }).click()
    await expect(page.locator('.studio-presence')).toHaveAttribute('data-state', 'listening')
    await go(page, '歌詞')
    await expect(page.locator('.studio-presence')).toHaveAttribute('data-state', 'idle')
    await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
    await shot(page, info, 'while-composer-pending')
    release()
    await page.locator('.presence').click()
    await expect(page.locator('.msg-master').last()).toContainText('讓旋律可以換氣')
    await expect(page.locator('.msg-master').last().locator('.msg-avatar')).toHaveText('曲')
    await page.getByRole('button', { name: '關閉', exact: true }).click()
    await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
  } finally { release() }
})
