import { test, expect, setup, go, desks, primary, finished } from './helpers'

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

async function checkTargets(page: import('@playwright/test').Page, scope = '.app') {
  const small = await page.locator(`${scope} button, ${scope} summary, ${scope} select, ${scope} input[type="range"]`).evaluateAll(elements => elements.filter(e => e.checkVisibility()).flatMap(e => {
    const b = e.getBoundingClientRect()
    return b.width < 43.9 || b.height < 43.9 ? [`${e.tagName}.${e.className}: ${e.textContent?.trim().slice(0, 25)} (${b.width}×${b.height})`] : []
  }))
  expect(small, '包含次要操作、材料與展開控制的點擊區都至少44×44px').toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

test('UAT-74 九檯與彈窗的墨線按鈕至少44px，按下有回饋且只有一主動作', async ({ page }, info) => {
  await setup(page, finished)
  for (const [index, desk] of desks.entries()) {
    await go(page, desk)
    await expect(primary(page)).toHaveCount(1)
    await checkTargets(page)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    const bounds = await page.locator('.studio-presence').evaluate(e => {
      const scene = e.getBoundingClientRect()
      const character = e.querySelector('.studio-character')!.getBoundingClientRect()
      return { sceneTop: scene.top, sceneBottom: scene.bottom, top: character.top, bottom: character.bottom }
    })
    expect(bounds.top, '人物必須完整站在場景內').toBeGreaterThanOrEqual(bounds.sceneTop)
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.sceneBottom + 4)
    await page.screenshot({ path: `docs/uat/evidence/A-UI-13-page-${index + 1}-${info.project.name}.png`, fullPage: true, animations: 'disabled' })
    // Check every progressively disclosed tool, including nested details.
    await page.locator('main details').evaluateAll(elements => elements.forEach(e => { (e as HTMLDetailsElement).open = true }))
    await checkTargets(page)
  }
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  let dialog = page.getByRole('dialog')
  await expect(dialog.locator('.primary-action')).toHaveCount(1)
  await checkTargets(page, 'dialog')
  await page.screenshot({ path: `docs/uat/evidence/A-UI-13-map-${info.project.name}.png`, animations: 'disabled' })
  await dialog.locator('.primary-action').click()
  await page.locator('.presence').click()
  dialog = page.getByRole('dialog')
  await checkTargets(page, 'dialog')
  await expect(dialog.locator('.primary-action')).toHaveCount(1)
  await page.screenshot({ path: `docs/uat/evidence/A-UI-13-chat-${info.project.name}.png`, animations: 'disabled' })
  await dialog.getByRole('button', { name: '關閉', exact: true }).click()
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await page.getByRole('textbox', { name: '靈感文字' }).fill('把窗邊的風留在下一頁')
  await checkTargets(page, 'dialog')
  const save = page.getByRole('button', { name: '夾進本子', exact: true })
  await save.scrollIntoViewIfNeeded()
  const box = await save.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await expect.poll(() => save.evaluate(e => getComputedStyle(e).filter)).toBe('brightness(0.9)')
  await page.mouse.up()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('button', { name: '好', exact: true }).click()
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await page.screenshot({ path: `docs/uat/evidence/A-UI-13-capture-${info.project.name}.png`, animations: 'disabled' })
  await page.getByRole('button', { name: /翻翻本子/ }).click()
  await checkTargets(page, 'dialog')
  await expect(page.getByRole('dialog').locator('.primary-action')).toHaveCount(1)
  await page.screenshot({ path: `docs/uat/evidence/A-UI-13-library-${info.project.name}.png`, animations: 'disabled' })
})
