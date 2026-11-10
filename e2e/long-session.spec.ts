import { test, expect, setup, go, shot, finished } from './helpers'

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
    await expect(page.locator('.msg-master').last().locator('.msg-speaker')).toHaveText('作曲家')
    await expect(page.locator('.msg-master').last().locator('.msg-avatar img')).toHaveAttribute('src', '/studio/roles/composer.webp')
    await page.getByRole('tab', { name: '作詞人', exact: true }).click()
    await expect(page.locator('.typing')).toHaveCount(0)
    await page.locator('.master-input input').fill('我想寫窗外的雨')
    await expect(page.getByRole('button', { name: '送出', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.msg-master').last()).toContainText('先寫眼前看見的一個畫面')
    await expect(page.locator('.msg-master').last().locator('.msg-speaker')).toHaveText('作詞人')
    await expect(page.locator('.msg-master').last().locator('.msg-avatar img')).toHaveAttribute('src', '/studio/roles/lyricist.webp')
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
    await expect(page.locator('.msg-master').last().locator('.msg-speaker')).toHaveText('作曲家')
    await expect(page.locator('.msg-master').last().locator('.msg-avatar img')).toHaveAttribute('src', '/studio/roles/composer.webp')
    await page.getByRole('button', { name: '關閉', exact: true }).click()
    await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
  } finally { release() }
})

test('UAT-63 重新開始新歌，清空舊對話並隔離晚到回覆', async ({ page }, info) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/api/master', async route => {
    const turn = ++requests
    if (turn === 2) await gate
    await route.fulfill({ json: { text: turn < 3 ? '舊歌《鑰匙留在門口》可以留點空白。' : '新歌先留下一個自己的聲音。' } })
  })
  await setup(page, finished)
  try {
    await page.locator('.presence').click()
    await page.locator('.master-input input').fill('舊歌想怎麼改？')
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.msg-master').last()).toContainText('舊歌《鑰匙留在門口》')
    await page.locator('.master-input input').fill('再想一個舊歌的方向')
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.typing')).toBeVisible()
    await page.locator('.master-input input').fill('還沒送出的舊歌問題')
    await page.getByRole('button', { name: '關閉', exact: true }).click()
    await page.getByRole('button', { name: '打開工作室選單' }).click()
    await page.locator('.menu-more > summary').click()
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: '重新開始一首新歌', exact: true }).click()
    await expect(page.locator('.presence-state')).toHaveText('作曲家在琴邊坐下。')
    await page.locator('.presence').click()
    await expect.soft(page.locator('.msg')).toHaveCount(0)
    await expect.soft(page.locator('.master-input input')).toHaveValue('')
    await expect.soft(page.locator('.typing')).toHaveCount(0)
    await shot(page, info, 'new-song-before-old-reply')
    const oldResponse = page.waitForResponse('**/api/master')
    release()
    await (await oldResponse).finished()
    await page.locator('.master-input input').fill('新歌從哪開始？')
    await page.getByRole('button', { name: '送出', exact: true }).click()
    await expect(page.locator('.msg-master').last()).toContainText('新歌先留下')
    await expect(page.locator('.master-list')).not.toContainText('舊歌')
    await expect(page.locator('.msg-master')).toHaveCount(1)
    await page.getByRole('button', { name: '關閉', exact: true }).click()
    await expect(page.locator('.presence-state')).toContainText('新歌先留下')
  } finally { release() }
})
