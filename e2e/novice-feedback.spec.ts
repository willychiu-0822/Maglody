import { test, expect, setup, go, primary, finished, readProject, shot } from './helpers'

test('UAT-53 P0 三位夥伴引用歌曲、角色各異與後端mock不漏工程字', async ({page})=>{
  await setup(page,finished)
  await page.locator('.presence').click()
  const replies:string[]=[]
  for(const [i,role,question,content] of [
    [0,'作曲家','你覺得這段怎麼樣？','F–G–C–G'],
    [1,'作詞人','你會怎麼看這一句？','雨落在鞋櫃上'],
    [2,'錄音師','這版有什麼可以試？','90 BPM'],
  ] as const) {
    await page.route('**/api/master', r=> i===0 ? r.fulfill({json:{text:'（後端 mock）接上真正的 LLM',next:'設定 LLM_PROVIDER'}}) : i===1 ? r.fulfill({json:{offline:true}}) : r.abort())
    await page.getByRole('tab',{name:role,exact:true}).click()
    const count=await page.locator('.msg-master:not(:has(.typing))').count()
    await page.locator('.master-input input').fill(question)
    await page.getByRole('button',{name:'送出',exact:true}).click()
    await expect(page.locator('.msg-master:not(:has(.typing))')).toHaveCount(count+1)
    const reply=page.locator('.msg-master').last()
    await expect(reply).toContainText('鑰匙留在門口')
    await expect(reply).toContainText(content)
    replies.push(await reply.innerText())
  }
  expect(new Set(replies).size).toBe(3)
  await page.getByRole('tab',{name:'作詞人',exact:true}).click()
  await page.locator('.master-input input').fill('幫我寫一整首歌')
  await page.getByRole('button',{name:'送出',exact:true}).click()
  await expect(page.locator('.msg-master').last()).toContainText('不替你寫完')
  await expect(page.locator('body')).not.toContainText(/LLM_PROVIDER|後端 mock|接上真正的 LLM|API_KEY/)
})

test('UAT-54 P1 歌曲素材齊全可跨主副歌播放、缺項直達',async({page},info)=>{
  await page.addInitScript(()=>{
    const nodes:AudioScheduledSourceNode[]=[]
    Object.assign(window,{noviceAudio:nodes})
    const start=OscillatorNode.prototype.start
    OscillatorNode.prototype.start=function(...args:Parameters<OscillatorNode['start']>){nodes.push(this);return start.apply(this,args)}
  })
  await setup(page,{...finished,arrangement:[],idea:{...finished.idea,bpm:170}})
  await go(page,'總檢討')
  await expect(page.locator('.demo-missing')).toHaveCount(0)
  await expect(primary(page)).toBeEnabled()
  await primary(page).click()
  await expect(page.locator('.whisper')).toContainText('主歌')
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {noviceAudio:unknown[]}).noviceAudio.length)).toBeGreaterThan(0)
  await expect(page.locator('.whisper')).toContainText('副歌',{timeout:10000})
  await shot(page,info,'chorus')
  await primary(page).click()
  await expect(primary(page)).toContainText('從頭聽')
  await page.evaluate(()=>{const key='music-lab-project-v2',p=JSON.parse(localStorage.getItem(key)!);p.harmony.chorus=[null,null,null,null];localStorage.setItem(key,JSON.stringify(p))})
  await page.reload()
  await go(page,'總檢討')
  await expect(page.locator('.demo-missing')).toContainText('副歌和弦')
  await page.getByRole('button',{name:'去補副歌和弦 →',exact:true}).click()
  await expect(page.locator('.desk-name')).toContainText('和聲')
})

test('UAT-55 P1 拒麥後直接聽有聲示範並繼續',async({page},info)=>{
  await page.addInitScript(()=>{
    navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError')}
    const start=AudioBufferSourceNode.prototype.start
    Object.assign(window,{demoPlayed:false})
    AudioBufferSourceNode.prototype.start=function(...args:Parameters<AudioBufferSourceNode['start']>){
      if(this.buffer && this.buffer.getChannelData(0).some(x=>Math.abs(x)>.01)) Object.assign(window,{demoPlayed:true})
      return start.apply(this,args)
    }
  })
  await setup(page)
  await primary(page).click()
  await expect(page.locator('.error')).toBeVisible()
  await page.getByRole('button',{name:/聽示範/}).click()
  await expect(primary(page)).toContainText('構想')
  await expect(page.locator('.whisper')).toContainText('示範')
  await expect(page.locator('.error')).toHaveCount(0)
  expect(await page.evaluate(()=>(window as unknown as {demoPlayed:boolean}).demoPlayed)).toBe(true)
  expect((await readProject(page)).hum.source).toBe('demo')
  await expect(page.locator('.presence-state')).not.toContainText('你哼了')
  await shot(page,info,'demo')
  await primary(page).click()
  await expect(page.locator('.desk-name')).toContainText('構想')
})

test('UAT-56 R2 推薦入口、寫詞不代筆與唯一主動作',async({page},info)=>{
  await setup(page)
  await go(page,'構想')
  await expect(primary(page)).toHaveCount(1)
  await expect(page.locator('.mood[data-recommended]')).toHaveCount(1)
  await primary(page).click()
  expect((await readProject(page)).idea.mood).toBe('warm')
  await primary(page).click()
  await expect(page.locator('input.one-line')).toBeFocused()
  await page.locator('input.one-line').fill('窗邊的那杯茶')
  await expect(primary(page)).toContainText('和聲')
  await primary(page).click()
  await expect(page.locator('.toolbox')).not.toHaveAttribute('open','')
  await expect(page.locator('.chord[data-recommended]')).toHaveCount(1)
  for(let i=0;i<4;i++) await primary(page).click()
  expect((await readProject(page)).harmony.verse).toEqual([0,4,5,3])
  await shot(page,info,'harmony')
  await go(page,'歌詞')
  await expect(primary(page)).toHaveCount(1)
  await primary(page).click()
  await expect(page.locator('.lyric-input')).toBeFocused()
  await expect(page.locator('.lyric-input')).toHaveValue('')
})

test('UAT-57 R1 R3 R4 核可素材載入預算與離線切換五角色',async({page,context},info)=>{
  await setup(page)
  const art=await page.evaluate(()=>Array.from(document.images).filter(img=>img.src.includes('/studio/')).map(img=>new URL(img.src).pathname))
  expect(art.sort()).toEqual(['/studio/roles/composer.webp','/studio/room.webp'])
  let size=0
  for(const url of art){const response=await page.request.get(url);size+=(await response.body()).length}
  expect(size,'首屏可見素材共小於150KB').toBeLessThan(150000)
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}))})
  await context.setOffline(true)
  try {
    await page.reload()
    for(const [desk,role] of [['構想','producer'],['哼唱解析','composer'],['歌詞','lyricist'],['編曲','arranger'],['錄音準備','engineer']]){
      await go(page,desk)
      const image=page.locator('.studio-character')
      await expect(image).toHaveAttribute('src',`/studio/roles/${role}.webp`)
      await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
      await expect.poll(()=>page.locator('.studio-scene img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true)
      await shot(page,info,role)
    }
  } finally {await context.setOffline(false)}
})

test('UAT-58 R6 火花先一行、額外觀察一次一則',async({page})=>{
  await setup(page)
  await go(page,'構想')
  await expect(page.locator('.knowledge-spark')).toHaveCount(0)
  await primary(page).click()
  const spark=page.locator('.knowledge-spark')
  await expect(spark).toBeVisible()
  expect(await spark.evaluate(e=>e.hasAttribute('open'))).toBe(false)
  await expect(page.locator('.spark-body')).toBeHidden()
  await spark.locator(':scope > summary').click()
  await expect(page.locator('.spark-body')).toBeVisible()
  await expect(page.locator('.spark-body details')).not.toHaveAttribute('open','')
  await page.locator('input.one-line').fill('窗邊的那杯茶')
  await page.locator('.toolbox > summary').click()
  await page.getByRole('textbox',{name:'故事：誰、在哪、發生什麼'}).fill('夜裡我在車站望著窗邊那杯茶，雨一直下，沒有人說話。')
  const more=page.getByRole('button',{name:/還有.*觀察/})
  await expect(more).toBeVisible()
  const before=await page.locator('.fb-list .fb').count()
  await more.click()
  await expect(page.locator('.fb-list .fb')).toHaveCount(before+1)
})

test('UAT-59 新手提問後立刻換檯，作詞人不沿用作曲家旁白',async({page})=>{
  await setup(page,finished)
  await page.route('**/api/master',async route=>{
    await new Promise(resolve=>setTimeout(resolve,800))
    await route.fulfill({json:{offline:true}})
  })
  await page.locator('.presence').click()
  await page.locator('.master-input input').fill('下一步')
  await page.getByRole('button',{name:'送出',exact:true}).click()
  await page.getByRole('button',{name:'關閉',exact:true}).click()
  await go(page,'歌詞')
  await expect(page.locator('.presence-name strong')).toHaveText('作詞人')
  await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
  await page.waitForTimeout(1200)
  await expect(page.locator('.presence-state')).toHaveText('作詞人翻開筆記本。')
  await page.locator('.presence').click()
  await expect(page.locator('.msg-master').last()).toContainText('鑰匙留在門口')
  await expect(page.locator('.msg-master .msg-speaker').last()).toHaveText('作曲家')
  await expect(page.locator('.msg-master .msg-avatar img').last()).toHaveAttribute('src', '/studio/roles/composer.webp')
})

test('UAT-60 新手先救文字再回草稿救錄音，兩份成果都保留',async({page},info)=>{
  await page.addInitScript(()=>{
    const state={fail:true}
    Object.assign(window,{noviceDisk:state})
    const put=IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put=function(...args:Parameters<IDBObjectStore['put']>){
      if(this.name==='blobs'&&state.fail)throw new DOMException('full','QuotaExceededError')
      return put.apply(this,args)
    }
  })
  await setup(page)
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await page.locator('.inspo-capture textarea').fill('窗外雨聲不要忘記')
  await page.locator('.inspo-big').filter({hasText:'說'}).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible()
  await page.waitForTimeout(700)
  await page.locator('.inspo-big.rec').click()
  await expect(page.locator('.inspo-capture')).toContainText('儲存失敗')
  await page.getByRole('button',{name:'先另存文字，錄音留著',exact:true}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.evaluate(()=>{(window as unknown as {noviceDisk:{fail:boolean}}).noviceDisk.fail=false})
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await expect(page.locator('.inspo-capture textarea')).toHaveValue('窗外雨聲不要忘記')
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('maglody-inspirations-v1')!).filter((x:{text:string})=>x.text==='窗外雨聲不要忘記'))
  expect(saved).toHaveLength(2)
  expect(saved.filter((x:{voice?:unknown})=>!!x.voice)).toHaveLength(1)
  const id=saved.find((x:{voice?:unknown})=>!!x.voice).voice.assetId
  expect(await page.evaluate(id=>new Promise<number>((resolve,reject)=>{
    const open=indexedDB.open('maglody-media',1)
    open.onerror=()=>reject(open.error)
    open.onsuccess=()=>{const db=open.result,request=db.transaction('blobs').objectStore('blobs').get(id);request.onsuccess=()=>{resolve(request.result?.size||0);db.close()};request.onerror=()=>reject(request.error)}
  }),id)).toBeGreaterThan(0)
  await page.getByRole('button',{name:'記一下靈感'}).click()
  await page.getByRole('button',{name:/翻翻本子/}).click()
  await expect(page.locator('.inspo-card').filter({hasText:'窗外雨聲不要忘記'})).toHaveCount(2)
  await shot(page,info,'recovered')
})
