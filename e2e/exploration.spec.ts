import { test, expect, setup, go, act, finished } from './helpers'

// Observe real Web Audio scheduled sources; do not replace their playback.
test('UAT-26 離開工作檯立即停止鼓與延遲預聽', async ({page}) => {
  await page.addInitScript(()=>{
    const sources: {node:AudioScheduledSourceNode;until:number}[]=[]
    Object.assign(window,{uatSources:sources})
    for(const prototype of [OscillatorNode.prototype,AudioBufferSourceNode.prototype]) {
      const originalStart=prototype.start
      const originalStop=prototype.stop
      prototype.start=function(this:AudioScheduledSourceNode,...args:Parameters<AudioScheduledSourceNode['start']>) {
        sources.push({node:this,until:Infinity})
        return originalStart.apply(this as OscillatorNode,args)
      }
      prototype.stop=function(this:AudioScheduledSourceNode,when?:number) {
        const entry=sources.find(x=>x.node===this)
        if(entry) entry.until=when??this.context.currentTime
        return originalStop.call(this as OscillatorNode,when)
      }
    }
  })
  const pending=()=>page.evaluate(()=>{
    const sources=(window as unknown as {uatSources:{node:AudioScheduledSourceNode;until:number}[]}).uatSources
    return sources.filter(x=>x.until>x.node.context.currentTime+0.1).length
  })
  await setup(page,finished)
  await go(page,'混音觀念')
  await act(page,/播放/)
  expect(await pending()).toBeGreaterThan(0)
  await go(page,'歌詞')
  expect(await pending(),'離檯後不能繼續播鼓或任何已排程音源').toBe(0)
  await go(page,'構想')
  await page.getByRole('button',{name:'溫暖療癒',exact:true}).click()
  await go(page,'歌詞')
  // The second chord used to start roughly 2.8 seconds after leaving.
  await page.waitForTimeout(3500)
  expect(await pending(),'換頁之後延遲的第二個和弦不能復活').toBe(0)
})

test('UAT-27 首次進入後即可離線重開且保留同源其他快取', async ({page,context}) => {
  await page.goto('/manifest.webmanifest')
  await page.evaluate(async()=>{
    const cache=await caches.open('unrelated-app-uat')
    await cache.put('/unrelated-uat',new Response('keep me'))
  })
  await setup(page)
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready
    if(!navigator.serviceWorker.controller) await new Promise<void>(resolve=>navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true}))
  })
  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.locator('.desk-name')).toBeVisible()
    await expect(page.locator('main .primary-action')).toHaveText(/哼一段/)
    expect(await page.evaluate(async()=>!!await (await caches.open('unrelated-app-uat')).match('/unrelated-uat')),'不能刪除同源其他應用快取').toBe(true)
  } finally { await context.setOffline(false) }
})
