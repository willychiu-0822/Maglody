// M-10：主畫面（不含展開的工具箱與「想知道？」）逐檯掃，不該出現工程術語。
import { test, expect, go, setup, desks } from './helpers'

const banned = /https|localhost|dB|BPM|MIDI|REAPER|Hook|Vibe|半音|峰值|增益|音分|級數|大師|探險|冒險/

test('UAT-91 M-10: 九檯主畫面沒有工程術語', async ({ page }) => {
  await setup(page)
  for (const desk of desks) {
    await go(page, desk)
    const text = await page.locator('main').evaluate((main) => {
      const c = main.cloneNode(true) as HTMLElement
      c.querySelectorAll('details, .why, textarea, input, select').forEach((n) => n.remove())
      return c.innerText
    })
    expect(text.match(banned)?.[0] ?? null, `${desk} 主畫面出現術語`).toBeNull()
  }
})
