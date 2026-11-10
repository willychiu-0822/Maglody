import { test, expect, setup, primary, readProject } from './helpers'

function shortWav() {
  const sampleRate = 22050, samples = sampleRate * 2
  const b = Buffer.alloc(44 + samples * 2)
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sampleRate, 24)
  b.writeUInt32LE(sampleRate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++) {
    const f = [261.63, 329.63, 392, 329.63][Math.floor(i / (sampleRate / 2))]
    b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * f * i / sampleRate) * 16000), 44 + i * 2)
  }
  return { name: '我的小旋律.wav', mimeType: 'audio/wav', buffer: b }
}

test('UAT-78 音檔用真按鈕與鍵盤選取，壞檔按好後可重試且保留原稿', async ({ page }, info) => {
  // A label posing as a button, a native alert, a stale file input, or a failed decode overwriting the old hum must fail.
  const native: string[] = []
  page.on('dialog', d => { native.push(d.message()); void d.dismiss() })
  await setup(page)
  await page.getByRole('button', { name: '沒有麥克風？聽示範', exact: true }).click()
  await expect(primary(page)).toContainText('構想')
  const before = (await readProject(page)).hum
  await page.locator('.toolbox > summary').click()
  const upload = page.getByRole('button', { name: '上傳音檔', exact: true })
  await expect(upload).toBeVisible()
  const bounds = await upload.boundingBox()
  expect(bounds!.height).toBeGreaterThanOrEqual(44)
  expect(bounds!.width).toBeGreaterThanOrEqual(44)
  const bad = { name: '我的小旋律.wav', mimeType: 'audio/wav', buffer: Buffer.from('這份內容還不是音訊') }
  for (let attempt = 0; attempt < 2; attempt++) {
    await upload.focus()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    await (await chooser).setFiles(bad)
    const notice = page.getByRole('status', { name: '音檔提示', exact: true })
    await expect(notice).toContainText('mp3 / wav / m4a')
    expect((await readProject(page)).hum).toEqual(before)
    await expect(primary(page)).toHaveCount(1)
    if (attempt === 0) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: `docs/uat/evidence/A-UI-16-error-${info.project.name}.png`, fullPage: true, animations: 'disabled' })
    }
    await notice.getByRole('button', { name: '好', exact: true }).click()
    await expect(notice).toHaveCount(0)
    await expect(upload).toBeFocused()
  }
  const chooser = page.waitForEvent('filechooser')
  await upload.click()
  await (await chooser).setFiles(shortWav())
  await expect.poll(async () => (await readProject(page)).hum?.source).toBe('file')
  const hum = (await readProject(page)).hum
  expect(hum.notes.length).toBeGreaterThanOrEqual(3)
  expect(hum.duration).toBeCloseTo(2, 0)
  await expect(page.locator('.workpage .whisper')).toContainText('音檔整理好了')
  await expect(primary(page)).toHaveCount(1)
  expect(native).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: `docs/uat/evidence/A-UI-16-upload-${info.project.name}.png`, fullPage: true, animations: 'disabled' })
})
