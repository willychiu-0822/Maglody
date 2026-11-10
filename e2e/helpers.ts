import { test as base, expect, type Page, type TestInfo } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
export { expect }
export type { Page }
export const desks = ['哼唱解析', '構想', '和聲', '旋律', '歌詞', '編曲', '錄音準備', '混音觀念', '總檢討']
export const projectKey = 'music-lab-project-v2'
export async function shot(page: Page, info: TestInfo, suffix = '') {
  const id = info.title.match(/UAT-\d+/)![0]
  const file = path.resolve(`docs/uat/evidence/${process.env.UAT_RUN_ID}/${info.project.name}/${id}${suffix ? '-'+suffix : ''}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Full-page screenshots otherwise pin the sticky header at the last scroll offset.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' })
  if (!suffix) await info.attach('uat-screenshot', { path: file, contentType: 'image/png' })
}
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use, info) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.route('**/api/master', r => r.abort('connectionrefused'))
    await use(errors)
    await shot(page, info)
    expect(errors, '使用者操作不應產生未處理 JS 錯誤').toEqual([])
  }, { auto: true }],
})
export async function go(page: Page, desk: string) {
  await page.getByRole('button', { name: '打開工作室選單' }).click()
  await page.locator('.menu-desk').filter({ has: page.locator('span').filter({ hasText: new RegExp(`^${desk}$`) }) }).click()
  await expect(page.locator('.desk-name')).toContainText(desk)
}
export const primary = (page: Page) => page.locator('main .primary-action')
export async function act(page: Page, name: RegExp) {
  await expect(primary(page)).toHaveText(name)
  await primary(page).click()
}
export async function readProject(page: Page) { return page.evaluate(k => JSON.parse(localStorage.getItem(k)!), projectKey) }
export async function setup(page: Page, patch: Record<string, unknown> = {}) {
  await page.goto('/')
  await expect(primary(page)).toBeVisible()
  if (Object.keys(patch).length) {
    await page.evaluate(({ key, patch }) => {
      const p = JSON.parse(localStorage.getItem(key)!)
      localStorage.setItem(key, JSON.stringify({ ...p, ...patch }))
    }, { key: projectKey, patch })
    await page.reload()
  }
}
export const finished = {
  idea: { mood: 'warm', vibe: '', theme: '', image: '', story: '', title: '鑰匙留在門口', hook: '鑰匙留在門口', bpm: 90 },
  harmony: { root: 0, mode: 'major', verse: [0,4,5,3], chorus: [3,4,0,4], quizRight:0, quizTotal:0 },
  melody: { verse: [60,62,64,67,...Array(28).fill(null)], chorus: [64,67,69,72,...Array(28).fill(null)], reflections: '' },
  lyrics: [{ id:'v',kind:'verse',text:'雨落在鞋櫃上\n鑰匙安靜發光' }, {id:'c',kind:'chorus',text:'鑰匙留在門口\n我不敢再回頭'}],
  arrangement: [
    {id:'intro',kind:'intro',bars:4,layers:{drums:false,bass:false,keys:true,pad:false,melody:false}},
    {id:'v',kind:'verse',bars:8,layers:{drums:false,bass:false,keys:true,pad:false,melody:true}},
    {id:'c',kind:'chorus',bars:8,layers:{drums:true,bass:true,keys:true,pad:false,melody:true}},
  ],
}
export async function harmony(page: Page) {
  for (const i of [0,4,5,3]) await page.locator('.chord-grid .chord').nth(i).click()
  await page.getByRole('button', { name: '換副歌 →', exact:true }).click()
  for (const i of [3,4,0,4]) await page.locator('.chord-grid .chord').nth(i).click()
}
export async function captureText(page: Page, text: string) {
  await page.getByRole('button', { name: '記一下靈感' }).click()
  await page.locator('.inspo-capture textarea').fill(text)
  await page.getByRole('button', {name:'夾進本子',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'靈感',exact:true})).toBeHidden()
}
export async function library(page: Page) {
  await page.getByRole('button', {name:'記一下靈感'}).click()
  await page.getByRole('button', {name:/翻翻本子/}).click()
}
export const stopRecording = async (page: Page) => {
  await page.locator('.inspo-big.rec').click()
  await expect(page.locator('.inspo-big.rec')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'夾進本子',exact:true})).toBeEnabled()
}
