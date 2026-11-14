import { test, expect, type Page } from '@playwright/test'

const desks = ['哼唱解析', '構想', '和聲', '旋律', '歌詞', '編曲', '錄音準備', '混音觀念', '總檢討']
const banned = ['MiniLab', '還沒在真的', '跟我說']

async function go(page: Page, desk: string) {
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
  await expect(page.locator('.desk-name')).toContainText(desk)
}

async function expectDraftHidden(page: Page) {
  const html = await page.content()
  for (const phrase of banned) expect(html, `畫面上不該有「${phrase}」`).not.toContain(phrase)
  expect(html).not.toContain('接上 MIDI')
  expect(html).not.toContain('鍵盤訊號')
  expect(html).not.toContain('帶進 Ableton')
  await expect(page.getByTestId('midi-hint')).toHaveCount(0)
  await expect(page.getByTestId('ableton-guide')).toHaveCount(0)
}

test('預設收起沒驗過的鍵盤和 Ableton，REAPER 的 MIDI 下載還在', async ({ page }) => {
  await page.addInitScript(`(() => {
    const orig = navigator.requestMIDIAccess && navigator.requestMIDIAccess.bind(navigator)
    let calls = 0
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: orig ? function requestMIDIAccess(...args) { calls += 1; return orig(...args) } : undefined,
    })
    window.__midiCalls = () => calls
    window.__midiWasSupported = typeof orig === 'function'
  })()`)
  await page.goto('/')
  await expect(page.locator('main .primary-action')).toBeVisible()
  const probe = await page.evaluate(() => ({
    calls: (window as unknown as { __midiCalls: () => number }).__midiCalls(),
    was: (window as unknown as { __midiWasSupported: boolean }).__midiWasSupported,
  }))
  expect(probe.was, '這個瀏覽器要有 Web MIDI，才算測到「有能力也不顯示」').toBe(true)
  expect(probe.calls, '開關關掉時不該去要鍵盤權限').toBe(0)

  for (const desk of desks) {
    await go(page, desk)
    await expectDraftHidden(page)
  }

  await go(page, '旋律')
  const beforeGrid = await page.getByRole('region', { name: '旋律創作紙頁' }).evaluate((el) => {
    const roll = el.querySelector('.roll')
    if (!roll) return 'no-roll'
    const hint = el.querySelector('[data-testid="midi-hint"]')
    if (hint && (hint.compareDocumentPosition(roll) & Node.DOCUMENT_POSITION_FOLLOWING)) return 'hint-before-roll'
    const range = document.createRange()
    range.setStart(el, 0)
    range.setEndBefore(roll)
    return range.toString()
  })
  expect(beforeGrid).not.toBe('no-roll')
  expect(beforeGrid).not.toBe('hint-before-roll')
  expect(beforeGrid).not.toMatch(/MIDI/)

  await go(page, '總檢討')
  await page.locator('main .toolbox > summary').click()
  await expect(page.getByRole('button', { name: '下載 MIDI（帶進 REAPER）' })).toBeVisible()
  await expect(page.getByTestId('ableton-guide')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { __midiCalls: () => number }).__midiCalls())).toBe(0)
})

test('不支援 Web MIDI 時，打開開關也不出現鍵盤字樣', async ({ page }) => {
  await page.addInitScript(`(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', { configurable: true, writable: true, value: undefined })
  })()`)
  await page.goto('/?lab=midi')
  await expect(page.locator('main .primary-action')).toBeVisible()
  expect(await page.evaluate(() => typeof navigator.requestMIDIAccess)).toBe('undefined')
  await go(page, '旋律')
  await expect(page.getByTestId('midi-hint')).toHaveCount(0)
  const html = await page.content()
  expect(html).not.toContain('接上 MIDI')
  expect(html).not.toContain('鍵盤訊號')
  expect(html).not.toContain('MIDI 鍵盤')
  for (const phrase of banned) expect(html).not.toContain(phrase)
  await go(page, '總檢討')
  await page.locator('main .toolbox > summary').click()
  await expect(page.getByTestId('ableton-guide')).toBeVisible()
  await expect(page.getByTestId('ableton-download')).toBeVisible()
  await expect(page.getByRole('button', { name: '下載 MIDI（帶進 REAPER）' })).toBeVisible()
})

test('?lab=midi 打開後，鍵盤在工具箱裡能寫進格子，Ableton 下載也還在', async ({ page }) => {
  await page.addInitScript(`(() => {
    const input = { id: 'lab', name: '練習用鍵盤', manufacturer: '', state: 'connected', onmidimessage: null }
    const inputs = new Map([[input.id, input]])
    const access = { inputs, onstatechange: null, sysexEnabled: false }
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: () => Promise.resolve(access),
    })
    window.__labMidi = { play(note) { input.onmidimessage && input.onmidimessage({ data: new Uint8Array([0x90, note, 100]) }) } }
  })()`)
  await page.goto('/?lab=midi')
  await expect(page.locator('main .primary-action')).toBeVisible()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('maglody-lab-midi'))).toBe('1')

  await go(page, '旋律')
  const place = await page.evaluate(() => {
    const hint = document.querySelector('[data-testid="midi-hint"]')
    const roll = document.querySelector('.roll')
    const box = document.querySelector('main .toolbox')
    if (!hint || !roll || !box) return 'missing'
    const afterRoll = (roll.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    return afterRoll && box.contains(hint) ? 'toolbox-after-grid' : 'wrong-place'
  })
  expect(place).toBe('toolbox-after-grid')
  await page.locator('main .toolbox > summary').click()
  const hint = page.getByTestId('midi-hint')
  await expect(hint).toBeVisible()
  const connect = hint.getByRole('button', { name: '接上 MIDI 鍵盤' })
  if (await connect.count()) await connect.click()
  await expect(hint).toHaveAttribute('data-status', 'connected')
  await expect(hint).toContainText('練習用鍵盤')
  await page.evaluate('window.__labMidi.play(60)')
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('music-lab-project-v2')!).melody.chorus[0])).toBe(60)

  await go(page, '總檢討')
  await page.locator('main .toolbox > summary').click()
  await expect(page.getByTestId('ableton-note')).toContainText('先讓它響')
  const download = page.waitForEvent('download')
  await page.getByTestId('ableton-download').click()
  expect((await download).suggestedFilename()).toBe('maglody-song.mid')
  const html = await page.content()
  for (const phrase of banned) expect(html).not.toContain(phrase)
  await expect(page.getByRole('button', { name: '下載 MIDI（帶進 REAPER）' })).toBeVisible()

  await page.goto('/')
  await go(page, '總檢討')
  await expect(page.getByTestId('ableton-guide')).toHaveCount(1)
  await page.goto('/?lab=off')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('maglody-lab-midi'))).toBeNull()
  await go(page, '旋律')
  await expect(page.getByTestId('midi-hint')).toHaveCount(0)
  await go(page, '總檢討')
  await expect(page.getByTestId('ableton-guide')).toHaveCount(0)
})
