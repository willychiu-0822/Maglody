import { test, expect, desks, setup, go, primary, act, readProject, finished, shot, captureText, library, stopRecording } from './helpers'

test('UAT-13 九檯隨時記靈感、保存留在原地', async ({ page }) => {
  await setup(page)
  for(const desk of desks) {
    await go(page,desk)
    await captureText(page,`來自${desk}的靈感`)
    await expect(page.locator('.desk-name')).toContainText(desk)
  }
  await page.reload()
  await library(page)
  for(const desk of desks) await expect(page.locator('.inspo-card').filter({hasText:`來自${desk}的靈感`})).toHaveCount(1)
})

test('UAT-14 同一則文字語音哼唱照片保存', async ({ page }) => {
  await page.addInitScript(()=>{
    const observed={voiceDurations:[] as number[],humEnded:0}
    Object.assign(window,{uatPlayback:observed})
    const NativeAudio=window.Audio
    window.Audio=class extends NativeAudio {
      constructor(src?:string) {
        super(src)
        this.addEventListener('playing',()=>observed.voiceDurations.push(this.duration))
      }
    }
    const create=AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator=function() {
      const oscillator=create.call(this)
      oscillator.addEventListener('ended',()=>observed.humEnded++)
      return oscillator
    }
  })
  await setup(page)
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await page.locator('.inspo-capture textarea').fill('雨中的一首歌')
  await page.locator('.inspo-big').filter({hasText:'說'}).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible()
  await page.waitForTimeout(700)
  await stopRecording(page)
  await expect(page.locator('.inspo-attached')).toContainText('語音')
  await page.locator('.inspo-big').filter({hasText:'哼'}).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible()
  await page.waitForTimeout(1000)
  await stopRecording(page)
  await expect(page.locator('.inspo-attached')).toContainText('哼唱')
  await page.locator('.inspo-capture input[type=file]').setInputFiles('public/icons/icon-192.png')
  await expect(page.locator('.inspo-thumb')).toBeVisible()
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await page.reload()
  await library(page)
  const card=page.locator('.inspo-card').filter({hasText:'雨中的一首歌'})
  await expect(card).toContainText('語音・哼唱・1 張照片')
  await card.locator('.inspo-card-head').click()
  await expect(card.locator('img')).toBeVisible()
  await card.getByRole('button',{name:'▶ 語音',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {uatPlayback:{voiceDurations:number[]}}).uatPlayback.voiceDurations.some(duration=>duration>0))).toBe(true)
  await card.getByRole('button',{name:/▶ 哼唱/}).click()
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {uatPlayback:{humEnded:number}}).uatPlayback.humEnded)).toBeGreaterThan(0)
})

test('UAT-15 錄音中直接保存不遺失最後附件', async ({ page }) => {
  await setup(page)
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await page.locator('.inspo-capture textarea').fill('邊說邊記')
  await page.locator('.inspo-big').filter({hasText:'說'}).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible()
  await page.waitForTimeout(800)
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'靈感',exact:true})).toBeHidden()
  await page.reload()
  await library(page)
  await expect(page.locator('.inspo-card').filter({hasText:'邊說邊記'})).toContainText('語音')
})

test('UAT-16 媒體儲存失敗可以恢復文字捕捉', async ({ page }) => {
  await page.addInitScript(()=>{
    const original=IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put=function(...args: Parameters<IDBObjectStore['put']>){
      if(this.name==='blobs') throw new DOMException('UAT disk full','QuotaExceededError')
      return original.apply(this,args)
    }
  })
  await setup(page)
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await page.locator('.inspo-capture textarea').fill('文字仍要留下')
  await page.locator('.inspo-big').filter({hasText:'說'}).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible()
  await page.waitForTimeout(700)
  await page.locator('.inspo-big.rec').click()
  await expect(page.locator('.toast[role="status"]')).toContainText(/儲存|空間|失敗/)
  await expect(page.locator('.inspo-big').first()).toBeEnabled()
  await page.getByRole('button',{name:'先另存文字，錄音留著',exact:true}).click()
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await expect(page.locator('.inspo-capture textarea')).toHaveValue('文字仍要留下')
  await expect(page.locator('.inspo-capture')).toContainText('聲音暫留在這頁')
  await page.getByRole('button',{name:/翻翻本子/}).click()
  await expect(page.locator('.inspo-card').filter({hasText:'文字仍要留下'})).toHaveCount(1)
})

test('UAT-17 從靈感開始與拼貼', async ({ page }) => {
  await setup(page)
  await captureText(page,'夜車與路燈')
  await library(page)
  const seed=page.locator('.inspo-card').filter({hasText:'負罪前行'})
  await seed.locator('.inspo-card-head').click()
  await seed.locator('.primary-action').click()
  await expect(page.locator('.desk-name')).toContainText('構想')
  expect((await readProject(page)).idea.title).toBe('負罪前行')
  await library(page)
  await page.getByRole('button',{name:'拼貼：挑幾則拼成新東西'}).click()
  await page.locator('.pick input').nth(0).check()
  await page.locator('.pick input').nth(1).check()
  await page.getByRole('button',{name:'合成一則新靈感',exact:true}).click()
  await library(page)
  await expect(page.locator('.inspo-card')).toHaveCount(3)
  await expect(page.locator('.inspo-card').first()).toContainText('夜車與路燈')
  await expect(page.locator('.inspo-card').first()).toContainText('負罪前行')
})

test('UAT-18 知識先小火花、主動展開收合', async ({ page }) => {
  await setup(page)
  await go(page,'構想')
  await expect(page.locator('.why-body')).toHaveCount(0)
  await page.getByRole('button',{name:'溫暖療癒',exact:true}).click()
  await page.locator('.toolbox > summary').click()
  const spark=page.locator('.why-head').first()
  await expect(spark).toBeVisible()
  await expect(spark).toHaveAttribute('aria-expanded','false')
  await expect(page.locator('.why-body')).toHaveCount(0)
  await spark.click()
  await expect(page.locator('.why-body')).toBeVisible()
  await spark.click()
  await expect(page.locator('.why-body')).toHaveCount(0)
})

test('UAT-19 本子空白仍能新增', async ({ page }) => {
  await page.addInitScript(()=>{
    localStorage.setItem('maglody-inspirations-v1','[]')
    localStorage.setItem('maglody-inspirations-seeded','1')
  })
  await setup(page)
  await library(page)
  await expect(page.locator('.inspo-list')).toContainText('本子還是空的')
  await page.getByRole('button',{name:'← 記新的',exact:true}).click()
  await page.locator('.inspo-capture textarea').fill('第一頁')
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await library(page)
  await expect(page.locator('.inspo-card')).toHaveCount(1)
})

test('UAT-20 破損資料可恢復、不白屏', async ({ page },info) => {
  await setup(page)
  const corruptions: [string,unknown][] = [
    ['music-lab-project-v2',{unlocked:-2,idea:{hook:'可恢復的句子'},lyrics:null,harmony:{verse:null},mix:{tracks:{melody:null}}}],
    ['maglody-inspirations-v1',{not:'an array'}],
    ['maglody-versions-v1',{not:'an array'}],
    ['maglody-inspirations-v1',[null,{id:'broken',text:'還能讀的靈感',tags:null,images:[null],used:null}]],
    ['maglody-versions-v1',[null,{id:'v',name:'Demo v1',project:{lyrics:null}}]],
    ['maglody-inspirations-v1',[{id:'voice-bad',text:'',voice:{assetId:'missing',transcript:{}},tags:[],images:[],used:[]}]],
    ['music-lab-project-v2',null],
  ]
  for(const [key,value] of corruptions) {
    await page.evaluate(({key,value})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(value))},{key,value})
    await page.reload()
    await expect(page.locator('.desk-name')).toBeVisible()
    if(key==='music-lab-project-v2' && value!==null) expect((await readProject(page)).idea.hook).toBe('可恢復的句子')
    await page.getByRole('button',{name:'打開工作室選單'}).click()
    await expect(page.getByRole('dialog',{name:'工作室',exact:true})).toBeVisible()
    await shot(page,info,key)
    await page.getByRole('button',{name:'關閉',exact:true}).click()
    if(key==='maglody-inspirations-v1') {
      await library(page)
      await expect(page.locator('.inspo-list')).toBeVisible()
      await page.getByRole('button',{name:'關閉',exact:true}).click()
    }
  }
})

test('UAT-21 真離線重載、mock 角色與靈感', async ({ page, context }) => {
  await setup(page)
  await page.evaluate(async()=>{await navigator.serviceWorker.ready})
  await page.reload()
  await expect(primary(page)).toBeVisible()
  await context.setOffline(true)
  try {
    await page.reload()
    await expect(primary(page)).toBeVisible()
    await captureText(page,'沒網路也收好')
    await page.locator('.presence').click()
    await page.locator('.master-input input').fill('下一步')
    await page.getByRole('button',{name:'送出',exact:true}).click()
    await expect(page.locator('.msg-student').last()).toContainText('下一步')
    await expect(page.locator('.msg-master:not(:has(.typing))').last()).not.toHaveText('')
    await expect(page.locator('.typing')).toHaveCount(0)
    await page.getByRole('button',{name:'關閉',exact:true}).click()
    await library(page)
    await expect(page.locator('.inspo-card').filter({hasText:'沒網路也收好'})).toHaveCount(1)
  } finally { await context.setOffline(false) }
})

test('UAT-22 Demo 版本保存、還原與重新開始', async ({ page }) => {
  await setup(page,finished)
  await captureText(page,'重開仍保留的靈感')
  await page.getByRole('button',{name:'打開工作室選單'}).click()
  await page.locator('.menu-more > summary').click()
  const dialogs:string[]=[]
  page.on('dialog',async d=>{dialogs.push(d.message());await d.accept(d.type()==='prompt'?'第一版':undefined)})
  await page.getByRole('button',{name:'存成新的一版',exact:true}).click()
  await expect(page.locator('.version strong')).toHaveText('Demo v1')
  await expect.poll(()=>dialogs.find(s=>s.startsWith('存好了：'))).toBe('存好了：Demo v1')
  await page.getByRole('button',{name:'關閉',exact:true}).click()
  await go(page,'構想')
  await page.locator('input.one-line').fill('改過的句子')
  await page.getByRole('button',{name:'打開工作室選單'}).click()
  await page.locator('.menu-more > summary').click()
  await page.getByRole('button',{name:'回到這版',exact:true}).click()
  await page.getByRole('button',{name:'關閉',exact:true}).click()
  await expect(page.locator('input.one-line')).toHaveValue('鑰匙留在門口')
  await page.getByRole('button',{name:'打開工作室選單'}).click()
  await page.locator('.menu-more > summary').click()
  await page.getByRole('button',{name:'重新開始一首新歌',exact:true}).click()
  await expect(primary(page)).toHaveText(/哼一段/)
  await library(page)
  await expect(page.locator('.inspo-card').filter({hasText:'重開仍保留的靈感'})).toHaveCount(1)
})

test('UAT-23 API 503 與畸形回覆降級 mock', async ({ page }) => {
  await setup(page)
  await page.locator('.presence').click()
  for(const bad of ['503','invalid']) {
    await page.route('**/api/master',r=>r.fulfill({status:bad==='503'?503:200,contentType:'application/json',body:bad==='503'?'{}':'{"text":null}'}))
    const before=await page.locator('.msg-master:not(:has(.typing))').count()
    await page.locator('.master-input input').fill('下一步')
    await page.getByRole('button',{name:'送出',exact:true}).click()
    await expect(page.locator('.msg-master:not(:has(.typing))')).toHaveCount(before+1)
    await expect(page.locator('.typing')).toHaveCount(0)
    await expect(page.locator('.msg-master').last()).not.toHaveText('')
  }
})

test('UAT-24 R1紙墨、R2每檯恰一主動作與寬度', async ({ page },info) => {
  await setup(page)
  const palette=await page.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,ink:getComputedStyle(document.body).color}))
  expect(palette.bg).not.toBe('rgb(255, 255, 255)')
  expect(palette.ink).not.toBe('rgb(0, 0, 0)')
  for(const desk of desks) {
    await go(page,desk)
    await shot(page,info,desk)
    await expect.soft(primary(page).filter({visible:true}),`${desk} 應恰有 1 個主要動作`).toHaveCount(1,{timeout:500})
    expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${desk} 不應頁面橫向溢出`).toBe(true)
  }
})

test('UAT-25 R3夥伴在場與R4人物外觀', async ({ page },info) => {
  await setup(page)
  for(const desk of desks) {
    await go(page,desk)
    await expect(page.locator('.presence')).toBeVisible()
    await expect(page.locator('.presence-name')).not.toHaveText('')
  }
  await page.locator('.presence').click()
  for(let i=0;i<5;i++) {
    await page.getByRole('tab').nth(i).click()
    await shot(page,info,`role-${i+1}`)
    const portrait=page.locator('.chat-sheet .role-dot[aria-selected="true"] img, .chat-sheet .role-dot[aria-selected="true"] svg, .chat-sheet [data-character-portrait]')
    await expect.soft(portrait.filter({visible:true}),'角色應有可見人物外觀，不是單字字形').not.toHaveCount(0,{timeout:500})
  }
})
