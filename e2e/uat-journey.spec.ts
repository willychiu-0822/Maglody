import { test, expect, type Page } from './helpers'
import { readFile } from 'node:fs/promises'
const visit = async (page: Page, name: string) => { await page.getByRole('button',{name:'打開工作室選單'}).click(); await page.locator('.menu-desk').filter({has:page.locator('span',{hasText:new RegExp(`^${name}$`)})}).click() }
const primary=(page:Page)=>page.locator('main .primary-action')
const shot=async(page:Page,id:string,viewport:string)=>page.screenshot({path:`docs/uat/evidence/${id}-${viewport}.png`,fullPage:true,animations:'disabled'})
const fixture = async(page:Page)=>{
  await page.evaluate(()=>{const key='music-lab-project-v2';const p=JSON.parse(localStorage.getItem(key)!);p.harmony.verse=[0,3,4,0];p.harmony.chorus=[3,4,0,4];p.melody.verse[0]=60;p.melody.chorus[0]=67;p.mix.tracks.melody.vol=1.2;localStorage.setItem(key,JSON.stringify(p))});await page.reload()
}
test.beforeEach(async({page})=>{await page.goto('/')})
test('UAT-40 從示範到自己的第一版 Demo、下載 MIDI 並重整',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.getByRole('button',{name:'沒有麥克風？聽示範',exact:true}).click()
  await expect(primary(page)).toContainText('構想');await primary(page).click()
  await page.locator('.mood').nth(2).click()
  await page.getByRole('textbox',{name:'這首歌的一句話'}).fill('鑰匙留在門口')
  await primary(page).click()
  for(const i of [0,4,5,3]) await page.locator('.chord').nth(i).click()
  await page.getByRole('button',{name:'換副歌 →',exact:true}).click()
  for(const i of [3,4,0,4]) await page.locator('.chord').nth(i).click()
  await primary(page).click()
  await primary(page).click()
  await page.locator('.seg-quiet button').filter({hasText:'主歌'}).click()
  await expect(primary(page)).toHaveText('用我的哼唱當草稿');await primary(page).click()
  await expect(primary(page)).toContainText('歌詞');await primary(page).click()
  await page.getByRole('textbox',{name:'主歌歌詞'}).fill('雨落在鞋櫃上\n鑰匙安靜發光')
  await page.locator('.seg-quiet button').filter({hasText:'副歌'}).click()
  await page.getByRole('textbox',{name:'副歌歌詞'}).fill('鑰匙留在門口\n我不敢再回頭')
  await primary(page).click();await primary(page).click()
  await page.locator('.layer').filter({hasText:'鼓'}).click();await page.locator('.layer').filter({hasText:'貝斯'}).click()
  await expect(primary(page)).toContainText('錄音');await primary(page).click()
  await page.getByRole('button',{name:'沒有麥克風，先跳過',exact:true}).click()
  await primary(page).click();await primary(page).click()
  await expect(primary(page)).toHaveText('■ 停');await primary(page).click()
  await page.locator('.mix-row').filter({hasText:'主旋律'}).locator('input').fill('1.2')
  await expect(primary(page)).toContainText('總檢討');await primary(page).click()
  await page.getByRole('textbox',{name:'我對這首歌的想法'}).fill('喜歡副歌，下一版讓主歌短一些。')
  await primary(page).click();await expect(primary(page)).toHaveText('■ 停');await primary(page).click()
  const downloaded=page.waitForEvent('download')
  await page.getByRole('button',{name:'下載 MIDI，帶進 REAPER',exact:true}).click()
  const download=await downloaded
  expect(download.suggestedFilename()).toContain('鑰匙留在門口')
  const bytes=await readFile((await download.path())!)
  expect(bytes.subarray(0,4).toString()).toBe('MThd');expect(bytes.length).toBeGreaterThan(300)
  await page.reload()
  await expect(page.getByRole('textbox',{name:'我對這首歌的想法'})).toHaveValue('喜歡副歌，下一版讓主歌短一些。')
  expect(errors).toEqual([])
  await shot(page,'UAT-40',info.project.name)
})
test('UAT-41 存 Demo 版本可還原且名稱不空白',async({page},info)=>{
  await visit(page,'構想');await page.locator('.mood').first().click();await page.getByRole('textbox',{name:'這首歌的一句話'}).fill('第一版的雨')
  await page.getByRole('button',{name:'打開工作室選單'}).click();await page.locator('.menu-more > summary').click()
  await page.getByRole('button',{name:'存成新的一版',exact:true}).click()
  await page.getByRole('textbox',{name:'這一版的說明（選填）'}).fill('想保留的版本')
  await page.getByRole('button',{name:'收好這一版',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'留住這一版',exact:true})).toContainText('存好了：Demo v1')
  await page.getByRole('button',{name:'好，回到工作室',exact:true}).click()
  await expect(page.locator('.version')).toContainText('Demo v1')
  await page.getByRole('button',{name:'關閉',exact:true}).click()
  await page.getByRole('textbox',{name:'這首歌的一句話'}).fill('第二版的風')
  await page.getByRole('button',{name:'打開工作室選單'}).click();await page.locator('.menu-more > summary').click()
  await page.getByRole('button',{name:'回到這版',exact:true}).click()
  await page.getByRole('dialog',{name:'回到這一版',exact:true}).getByRole('button',{name:'回到 Demo v1',exact:true}).click()
  await page.getByRole('button',{name:'關閉',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'這首歌的一句話'})).toHaveValue('第一版的雨')
  await expect(page.locator('input.one-line')).toHaveValue('第一版的雨')
  await shot(page,'UAT-41',info.project.name)
})
test('UAT-42 照片拼貼後刪原靈感仍保留媒體',async({page},info)=>{
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click()
  await page.getByRole('textbox',{name:'靈感文字'}).fill('照片原稿')
  await page.locator('.inspo-capture input[type=file]').setInputFiles('public/icons/icon-192.png')
  await expect(page.locator('.inspo-thumb')).toBeVisible()
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click()
  await page.getByRole('button',{name:/翻翻本子/}).click()
  await page.getByRole('button',{name:'拼貼：挑幾則拼成新東西',exact:true}).click()
  await page.locator('.pick input').nth(0).check();await page.locator('.pick input').nth(1).check()
  await expect(page.locator('.collage-bar .primary-action:visible')).toHaveCount(1)
  await expect(page.locator('.collage-bar .btn:visible')).toHaveCount(1)
  await shot(page,'A-R2-collage',info.project.name)
  await page.getByRole('button',{name:'合成一則新靈感',exact:true}).click()
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click();await page.getByRole('button',{name:/翻翻本子/}).click()
  const original=page.locator('.inspo-card').filter({has:page.locator('.inspo-text',{hasText:/^照片原稿$/})})
  await original.locator('.inspo-card-head').click();await original.getByRole('button',{name:'其他用法…',exact:true}).click()
  page.once('dialog',d=>d.accept());await original.getByRole('button',{name:'刪除',exact:true}).click()
  await expect(original).toHaveCount(0)
  await page.reload();await page.getByRole('button',{name:'記一下靈感',exact:true}).click();await page.getByRole('button',{name:/翻翻本子/}).click()
  const collage=page.locator('.inspo-card').filter({has:page.locator('.inspo-text',{hasText:/照片原稿.*負罪前行/s})})
  await collage.locator('.inspo-card-head').click()
  const thumb=collage.locator('img.inspo-thumb');await expect(thumb).toBeVisible()
  await expect.poll(()=>thumb.evaluate((e:HTMLImageElement)=>e.naturalWidth>0)).toBeTruthy()
  await shot(page,'UAT-42',info.project.name)
})
test('UAT-43 權限晚回來時不會偷偷開麥',async({page},info)=>{
  await page.evaluate(()=>{
    const w=window as unknown as {release:()=>void;stopped:number}
    w.stopped=0
    navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{w.release=()=>resolve({getTracks:()=>[{stop:()=>w.stopped++}]} as unknown as MediaStream)})
  })
  await page.getByRole('button',{name:'● 哼一段',exact:true}).click()
  await expect(primary(page)).toBeDisabled()
  await visit(page,'歌詞')
  await page.evaluate(()=>(window as unknown as {release:()=>void}).release())
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {stopped:number}).stopped)).toBe(1)
  await expect(page.locator('.desk-name')).toContainText('歌詞')
  await shot(page,'UAT-43',info.project.name)
})
test('UAT-44 長詞句與多段落仍可操作',async({page},info)=>{
  await visit(page,'歌詞');await page.locator('.toolbox > summary').click()
  for(let i=0;i<12;i++)await page.getByRole('button',{name:'＋ 橋段',exact:true}).click()
  await page.locator('.lyric-input').fill('averylongunbrokenword'.repeat(15))
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
  await visit(page,'編曲');await page.locator('.toolbox > summary').click()
  for(let i=0;i<15;i++)await page.getByRole('button',{name:'＋ 主歌',exact:true}).click()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
  await shot(page,'UAT-44',info.project.name)
})
test('UAT-45 試聽的是正在編輯的歌詞段落',async({page},info)=>{
  await page.evaluate(()=>{const w=window as unknown as {spoken:string};window.speechSynthesis.speak=(utterance)=>{w.spoken=utterance.text}})
  await visit(page,'歌詞');await page.locator('.lyric-input').fill('雨落在門前\n燈亮在窗邊')
  await primary(page).click()
  expect(await page.evaluate(()=>(window as unknown as {spoken:string}).spoken)).toBe('雨落在門前，燈亮在窗邊')
  await shot(page,'UAT-45',info.project.name)
})
test('UAT-46 情緒第一次和重播使用相同調式',async({page},info)=>{
  await page.getByRole('button',{name:'沒有麥克風？聽示範',exact:true}).click();await expect(primary(page)).toContainText('構想');await primary(page).click()
  await page.evaluate(()=>{
    const w=window as unknown as {frequencies:number[]};w.frequencies=[]
    const create=AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator=function(){const osc=create.call(this);const start=osc.start.bind(osc);osc.start=(when)=>{w.frequencies.push(osc.frequency.value);start(when)};return osc}
  })
  await page.locator('.mood').filter({hasText:'憂傷失落'}).click()
  const first=await page.evaluate(()=>(window as unknown as {frequencies:number[]}).frequencies.slice(8,11))
  await page.evaluate(()=>{(window as unknown as {frequencies:number[]}).frequencies=[]})
  await page.getByRole('button',{name:'▶ 再聽一次這個感覺',exact:true}).click()
  const replay=await page.evaluate(()=>(window as unknown as {frequencies:number[]}).frequencies.slice(8,11))
  expect(first.length).toBe(3);expect(replay).toEqual(first)
  await shot(page,'UAT-46',info.project.name)
})
test('UAT-47 靜音不可誤判混好，停止 A/B 後回到自己的混音',async({page},info)=>{
  await fixture(page);await visit(page,'混音觀念');await primary(page).click()
  await page.getByRole('button',{name:'聽聽沒混之前',exact:true}).click()
  await expect(page.getByRole('button',{name:'回到我的混音',exact:true})).toBeVisible()
  await primary(page).click();await page.getByRole('button',{name:'▶ 再聽一次',exact:true}).click()
  await expect(page.getByRole('button',{name:'聽聽沒混之前',exact:true})).toBeVisible();await primary(page).click()
  await page.locator('.toolbox > summary').click()
  await page.locator('.strip').filter({hasText:'主旋律（代替人聲）'}).getByRole('button',{name:'靜音',exact:true}).click()
  await page.locator('.toolbox > summary').click()
  await expect(primary(page)).toHaveText('▶ 播放副歌')
  await shot(page,'UAT-47',info.project.name)
})
test('UAT-48 夜晚紙面與減少動畫仍可辨認',async({page},info)=>{
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'})
  await expect(page.locator('.studio-character')).toBeVisible()
  expect(await page.locator('.studio-character').evaluate(e=>getComputedStyle(e).animationName)).toBe('none')
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()
  await shot(page,'UAT-48',info.project.name)
})
test('UAT-49 媒體寫入失敗後先救回錄音，再換成哼唱',async({page,context},info)=>{
  await context.grantPermissions(['microphone'])
  await page.evaluate(()=>{
    const w=window as unknown as {failMedia:boolean;streams:MediaStream[]};w.failMedia=true;w.streams=[]
    const put=IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){if(w.failMedia)throw new Error('media full');return put.apply(this,args)}
    const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    navigator.mediaDevices.getUserMedia=async options=>{const stream=await get(options);w.streams.push(stream);return stream}
  })
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click()
  const media=page.locator('.inspo-media .inspo-big')
  await media.nth(0).click();await expect(page.locator('.inspo-big.rec')).toBeVisible();await page.waitForTimeout(400)
  await media.nth(0).click();await expect(page.locator('.toast')).toContainText('還沒收好')
  await media.nth(1).click()
  // No recording yet does not mean the asynchronous IDB retry has settled.
  // Keep the storage fault active until that retry releases the controls.
  await expect(media.nth(1)).toBeEnabled()
  await expect(page.locator('.toast')).toContainText('還沒收好')
  await expect(page.locator('.inspo-big.rec')).toHaveCount(0)
  await page.evaluate(()=>{(window as unknown as {failMedia:boolean}).failMedia=false})
  await media.nth(1).click();await expect(page.locator('.inspo-big.rec')).toBeVisible();await page.waitForTimeout(400)
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(()=>(window as unknown as {streams:MediaStream[]}).streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')))).toBeTruthy()
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('maglody-inspirations-v1')!)[0])
  expect(saved.voice.assetId).toBeTruthy();expect(saved.hum.assetId).toBeTruthy();expect(saved.voice.assetId).not.toBe(saved.hum.assetId)
  await shot(page,'UAT-49',info.project.name)
})
test('UAT-50 沒辨識到音符也能播放原始哼唱，換檯會停止',async({page,context},info)=>{
  await context.grantPermissions(['microphone'])
  await page.evaluate(()=>{
    AudioContext.prototype.decodeAudioData=()=>Promise.reject(new Error('unsupported decoding'))
    const w=window as unknown as {played:HTMLMediaElement[]};w.played=[]
    const play=HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play=function(){w.played.push(this);return play.call(this)}
  })
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click();await page.locator('.inspo-media .inspo-big').nth(1).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible();await page.waitForTimeout(1500)
  await page.getByRole('button',{name:'夾進本子',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click();await page.getByRole('button',{name:/翻翻本子/}).click()
  await page.locator('.inspo-card-head').first().click()
  await page.getByRole('button',{name:/原始哼唱/}).click()
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {played:HTMLMediaElement[]}).played.length)).toBe(1)
  await page.getByRole('button',{name:'關閉',exact:true}).click();await visit(page,'歌詞')
  expect(await page.evaluate(()=>(window as unknown as {played:HTMLMediaElement[]}).played.every(a=>a.paused))).toBeTruthy()
  await page.evaluate(()=>{
    const w=window as unknown as {startedSources:number;stoppedSources:number};w.startedSources=0;w.stoppedSources=0
    const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop
    AudioBufferSourceNode.prototype.start=function(...args:Parameters<typeof start>){w.startedSources++;return start.apply(this,args)}
    AudioBufferSourceNode.prototype.stop=function(...args:Parameters<typeof stop>){w.stoppedSources++;return stop.apply(this,args)}
  })
  await visit(page,'哼唱解析');await page.getByRole('button',{name:'沒有麥克風？聽示範',exact:true}).click()
  await expect(primary(page)).toContainText('構想');await page.locator('.toolbox > summary').click()
  await page.getByRole('button',{name:'▶ 原始錄音',exact:true}).click()
  await visit(page,'歌詞')
  expect(await page.evaluate(()=>(window as unknown as {startedSources:number}).startedSources)).toBe(2)
  expect(await page.evaluate(()=>(window as unknown as {stoppedSources:number}).stoppedSources)).toBe(2)
  await shot(page,'UAT-50',info.project.name)
})
test('UAT-51 錄音裝置提早停止仍可收好聲音',async({page,context},info)=>{
  await context.grantPermissions(['microphone'])
  await page.evaluate(()=>{
    const w=window as unknown as {rec:MediaRecorder};const RealRecorder=MediaRecorder
    window.MediaRecorder=class extends RealRecorder {constructor(stream:MediaStream){super(stream);w.rec=this}}
  })
  await page.getByRole('button',{name:'記一下靈感',exact:true}).click();await page.locator('.inspo-media .inspo-big').nth(1).click()
  await expect(page.locator('.inspo-big.rec')).toBeVisible();await page.waitForTimeout(400)
  await page.evaluate(()=>(window as unknown as {rec:MediaRecorder}).rec.stop())
  await page.getByRole('button',{name:'夾進本子',exact:true}).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('maglody-inspirations-v1')!)[0])
  expect(saved.hum.assetId).toBeTruthy()
  await shot(page,'UAT-51',info.project.name)
})
test('UAT-52 新手忘記按停止，25 秒後也會關麥並保留分析',async({page,context},info)=>{
  test.setTimeout(40000)
  await context.grantPermissions(['microphone'])
  await page.evaluate(()=>{
    const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    navigator.mediaDevices.getUserMedia=async options=>{const stream=await get(options);(window as unknown as {stream:MediaStream}).stream=stream;return stream}
  })
  await page.getByRole('button',{name:'● 哼一段',exact:true}).click()
  await expect(primary(page)).toHaveText('■ 哼完了')
  // A hidden or stalled page may stop drawing frames while audio capture continues.
  // The recording limit must release the microphone independently of the pitch display.
  await page.evaluate(() => { window.requestAnimationFrame = () => 0 })
  // Deliberately leave recording alone, as a first-time user might.
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {stream:MediaStream}).stream.getTracks().every(t=>t.readyState==='ended')),{timeout:32000,intervals:[500]}).toBeTruthy()
  await expect(primary(page)).not.toHaveText('■ 哼完了')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('music-lab-project-v2')!)?.hum?.duration||0)).toBeGreaterThanOrEqual(24)
  await shot(page,'UAT-52',info.project.name)
})
