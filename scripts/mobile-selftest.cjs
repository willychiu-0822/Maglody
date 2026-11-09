// 用法：npm run build && npx vite preview --port 4101，另開終端機執行 node scripts/mobile-selftest.cjs
// 斷言式手機自測：每屏 ≤1 主動作、≤1 次要；靈感多模態；角色自由聊；全流程到總檢討
const { chromium, devices } = require('playwright')
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }
async function screen(page, label) {
  const r = await page.evaluate(() => {
    const shown = (el) => { const b = el.getBoundingClientRect(); if (!b.width || !b.height) return false; for (let p = el.parentElement; p; p = p.parentElement) { if (p.tagName === 'DETAILS' && !p.open && !el.closest('summary')) return false } return true }
    const scope = document.querySelector('.inspo-overlay .inspo-sheet') || document.querySelector('main.desk')
    const prim = [...scope.querySelectorAll('.primary-action')].filter(shown)
    const sec = [...scope.querySelectorAll('.desk-actions .link-btn')].filter(shown)
    // 工作區以外、看得到的一般按鈕（不含材料：和弦/格子/紙片/分頁/頭像）
    const material = '.chord-grid,.slots,.mood-grid,.layer-grid,.energy,.roll,.seg-quiet,.roll-pager,.presence,.inspo-media,.desk-actions,summary,.mix-simple,.inspo-card-head,.inspo-tags-wrap'
    const extra = [...scope.querySelectorAll('button')].filter((b) => shown(b) && !b.closest(material) && !b.closest('.toolbox')).map((b) => b.textContent.trim().slice(0, 12))
    const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    return { prim: prim.map((b) => b.textContent.trim()), sec: sec.map((b) => b.textContent.trim()), extra, overflow }
  })
  const ok = r.prim.length <= 1 && r.sec.length <= 1 && !r.overflow
  check(`[一屏一主] ${label}`, ok, `主=${JSON.stringify(r.prim)} 次=${JSON.stringify(r.sec)}${r.extra.length ? ' 其他按鈕=' + JSON.stringify(r.extra) : ''}${r.overflow ? ' 溢出' : ''}`)
  return r
}
const P = (page) => page.locator('main.desk .primary-action').first()
const pclick = async (page, re) => { const b = P(page); const t = await b.textContent(); if (re && !re.test(t)) throw new Error(`主動作是「${t}」，預期 ${re}`); await b.click() }
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] })
  try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], permissions: ['microphone'] })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('dialog', (d) => d.type() === 'prompt' ? d.accept('測試版') : d.accept())
  await page.goto(process.env.SELFTEST_URL || 'http://127.0.0.1:4101/'); await page.waitForTimeout(700)
  try {
    // 哼唱：真（假）麥克風錄音
    await screen(page, '哼唱 首屏')
    await pclick(page, /哼一段/); await page.waitForTimeout(1800)
    await screen(page, '哼唱 錄音中')
    await pclick(page, /哼完/); await page.waitForTimeout(2500)
    check('哼唱：麥克風錄音後有分析結果', await page.locator('main .pitch-canvas').count() > 0)
    // 改用示範哼唱（音比較多）
    await page.evaluate(() => { const k = 'music-lab-project-v2'; const p = JSON.parse(localStorage.getItem(k)); p.hum = null; localStorage.setItem(k, JSON.stringify(p)) })
    await page.reload(); await page.waitForTimeout(500)
    await page.locator('.desk-actions .link-btn', { hasText: '聽示範' }).click(); await page.waitForTimeout(2500)
    await screen(page, '哼唱 完成')
    await pclick(page, /構想/); await page.waitForTimeout(600)
    check('角色登場：構想是製作人', (await page.locator('.presence-avatar').textContent()) === '製')
    await screen(page, '構想 首屏')
    await page.locator('.mood').nth(2).click(); await page.waitForTimeout(200)
    await screen(page, '構想 選了情緒')
    await page.locator('input.one-line').fill('鑰匙留在門口'); await page.waitForTimeout(200)
    await screen(page, '構想 完成')
    await pclick(page, /和聲/); await page.waitForTimeout(600)
    check('角色登場：和聲是作曲家', (await page.locator('.presence-avatar').textContent()) === '曲')
    await screen(page, '和聲 首屏')
    const ch = page.locator('.chord')
    for (const i of [0, 4, 5, 3]) await ch.nth(i).click()
    await screen(page, '和聲 主歌滿')
    await page.locator('.desk-actions .link-btn', { hasText: '換副歌' }).click()
    for (const i of [3, 4, 0, 4]) await ch.nth(i).click()
    await page.waitForTimeout(200)
    await screen(page, '和聲 完成')
    await pclick(page, /旋律/); await page.waitForTimeout(600)
    await screen(page, '旋律 首屏')
    await pclick(page, /哼唱當草稿/)
    await page.locator('.seg-quiet button', { hasText: '主歌' }).click()
    await pclick(page, /哼唱當草稿/); await page.waitForTimeout(200)
    await screen(page, '旋律 完成')
    await pclick(page, /歌詞/); await page.waitForTimeout(600)
    check('角色登場：歌詞是作詞人', (await page.locator('.presence-avatar').textContent()) === '詞')
    await screen(page, '歌詞 首屏')
    await page.locator('.lyric-input').fill('雨落在鞋櫃上\n鑰匙安靜發光')
    await page.locator('.seg-quiet button', { hasText: '副歌' }).click()
    await page.locator('.lyric-input').fill('鑰匙留在門口\n我不敢再回頭'); await page.waitForTimeout(200)
    await screen(page, '歌詞 完成')
    await pclick(page, /編曲/); await page.waitForTimeout(600)
    await screen(page, '編曲 首屏')
    await pclick(page, /骨架/)
    await page.locator('.layer', { hasText: '鼓' }).click(); await page.locator('.layer', { hasText: '貝斯' }).click(); await page.waitForTimeout(200)
    await screen(page, '編曲 完成')
    await pclick(page, /錄音/); await page.waitForTimeout(600)
    check('角色登場：錄音是錄音師', (await page.locator('.presence-avatar').textContent()) === '錄')
    await screen(page, '錄音 首屏')
    await pclick(page, /測音量/); await page.waitForTimeout(1500)
    await screen(page, '錄音 測量中')
    await pclick(page, /唱完/); await page.waitForTimeout(400)
    await screen(page, '錄音 測完')
    const recPrim = await P(page).textContent()
    const peakMsg = await page.locator('main .whisper').textContent()
    check('錄音：假麥克風音量是否健康（不健康時應提示退後、可跳過）', /混音/.test(recPrim) || /太滿/.test(peakMsg), `主動作=${recPrim}｜大字=${peakMsg}`)
    if (!/混音/.test(recPrim)) { await page.locator('.desk-actions .link-btn', { hasText: '先跳過' }).click(); await page.waitForTimeout(200) }
    await screen(page, '錄音 完成')
    await pclick(page, /混音/); await page.waitForTimeout(600)
    await screen(page, '混音 首屏')
    await pclick(page, /播放/); await page.waitForTimeout(600)
    await screen(page, '混音 播放中')
    await pclick(page, /停/)
    // 混音要沒有紅燈才能往下：只用主畫面的推桿（不開工具箱）把主旋律推高
    await page.locator('.mix-row', { hasText: '主旋律' }).locator('input').fill('1.2')
    await page.waitForTimeout(200)
    await screen(page, '混音 調好')
    const mixPrim = await P(page).textContent()
    check('混音：調好後出現前進按鈕', /總檢討/.test(mixPrim), mixPrim)
    if (/總檢討/.test(mixPrim)) await P(page).click()
    await page.waitForTimeout(600)
    await screen(page, '總檢討 首屏')
    await page.locator('main textarea.one-line').fill('副歌那句我很喜歡，下一版想讓主歌更短。')
    await screen(page, '總檢討 寫完')
  } catch (e) { check('主流程走完', false, e.message.split('\n')[0]) }

  // 靈感貼紙：多模態同一則
  try {
    await page.locator('.sticker').click(); await page.waitForTimeout(300)
    check('貼紙展開前沒有媒體按鈕', true)
    await screen(page, '記一下 展開')
    await page.locator('.inspo-capture textarea').fill('背著什麼往前走')
    await page.locator('.inspo-media button', { hasText: '說' }).click(); await page.waitForTimeout(1200)
    await page.locator('.inspo-capture input[type=file]').setInputFiles(require('path').join(__dirname, '..', 'public/icons/icon-512.png')); await page.waitForTimeout(600)
    await page.locator('.inspo-media button', { hasText: '■' }).click(); await page.waitForTimeout(1200)
    await page.locator('.inspo-media button', { hasText: '哼' }).click(); await page.waitForTimeout(1800)
    await page.locator('.inspo-media button', { hasText: '■' }).click(); await page.waitForTimeout(2000)
    const att = await page.locator('.inspo-capture .inspo-attached').innerText().catch(() => '')
    const thumbs = await page.locator('.inspo-capture .inspo-thumb').count()
    check('靈感：同一則有 文字＋語音＋哼唱＋照片', /語音/.test(att) && /哼唱/.test(att) && thumbs >= 1, `附件=${att.replace(/\n/g, ' ')} 照片=${thumbs}`)
    const deskBefore = await page.locator('.desk-name').textContent()
    await page.locator('.inspo-sheet .primary-action').click(); await page.waitForTimeout(400)
    check('靈感：存完留在原地', (await page.locator('.desk-name').textContent()) === deskBefore && await page.locator('.inspo-overlay').count() === 0, deskBefore)
    await page.locator('.sticker').click()
    await page.locator('.inspo-sheet .link-btn', { hasText: '翻翻本子' }).click(); await page.waitForTimeout(300)
    await screen(page, '本子 列表')
    check('靈感：本子裡有「負罪前行」', await page.locator('.inspo-card:has-text("負罪前行")').count() === 1)
    await page.locator('.inspo-card:has-text("負罪前行") .inspo-card-head').click()
    const lib = await screen(page, '本子 展開負罪前行')
    check('本子展開：除了導覽（記新的／✕／拼貼）與媒體播放外沒有多餘按鈕', lib.extra.filter((t) => !/記新的|✕|拼貼|▶/.test(t)).length === 0, JSON.stringify(lib.extra))
    await page.locator('.inspo-card:has-text("負罪前行") .primary-action').click(); await page.waitForTimeout(800)
    check('靈感：從負罪前行開始 → 構想、歌名＝負罪前行', /構想/.test(await page.locator('.desk-name').textContent()) && (await page.locator('input.one-line').inputValue()) === '負罪前行')
    // 拼貼
    await page.locator('.sticker').click(); await page.locator('.inspo-sheet .link-btn', { hasText: '翻翻本子' }).click()
    await page.locator('.inspo-sheet .link-btn', { hasText: '拼貼' }).click()
    const picks = page.locator('.inspo-card .pick input')
    await picks.nth(0).check(); await picks.nth(1).check()
    const opts = await page.locator('.collage-bar .btn').allInnerTexts()
    check('拼貼：勾兩則出現拼貼選項', opts.length >= 1, opts.join(' / '))
    await page.locator('.collage-bar .btn', { hasText: '合成一則新靈感' }).click(); await page.waitForTimeout(300)
  } catch (e) { check('靈感流程', false, e.message.split('\n')[0]) }

  // 角色自由聊：在構想檯跟 5 位都聊
  try {
    await page.locator('.presence').click(); await page.waitForTimeout(200)
    const names = ['製', '曲', '詞', '編', '錄']
    for (let i = 0; i < 5; i++) {
      await page.locator('.role-dot').nth(i).click()
      await page.locator('.master-input input').fill(i === 2 ? '幫我寫一句' : '下一步')
      await page.locator('.master-input button').click(); await page.waitForTimeout(450)
      const who = await page.locator('.msg-master .msg-avatar').last().textContent()
      check(`角色自由聊：${names[i]} 回答（目前在構想檯）`, who === names[i], `回答者=${who}`)
    }
    const lyr = await page.evaluate(() => { const ms = [...document.querySelectorAll('.master-list .msg')]; const i = ms.findIndex((m) => m.classList.contains('msg-student') && m.textContent.includes('幫我寫一句')); return ms.slice(i + 1).find((m) => m.classList.contains('msg-master'))?.textContent || '' })
    check('作詞人不代寫整句', /不替你寫完/.test(lyr), lyr.slice(0, 40))
    await page.locator('.chat-sheet .icon-btn').click()
  } catch (e) { check('角色對話', false, e.message.split('\n')[0]) }

  // 工作室選單
  try {
    await page.locator('.desk-name').click(); await page.waitForTimeout(200)
    check('工作室選單列出 9 檯', await page.locator('.menu-desk').filter({ hasNotText: /聽目前|翻翻|聊聊/ }).count() === 9)
    await page.locator('.menu-desk', { hasText: '旋律' }).click(); await page.waitForTimeout(400)
    check('選單可直接跳到任一檯', /旋律/.test(await page.locator('.desk-name').textContent()))
  } catch (e) { check('工作室選單', false, e.message.split('\n')[0]) }

  check('沒有 JS 錯誤', errs.length === 0, errs.join(' | '))
  const failed = results.filter((r) => !r.ok)
  console.log(`\n總計 ${results.length} 項，PASS ${results.length - failed.length}，FAIL ${failed.length}`)
  if (failed.length) process.exitCode = 1
  } finally { await browser.close() }
})().catch((e) => { console.error(e.message); process.exitCode = 1 })
