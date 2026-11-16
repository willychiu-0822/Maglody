import { analyzeBuffer, type HumAnalysis } from './pitch'

// 在 Worker 裡分析；Worker 起不來、出錯或逾時就退回主執行緒同步分析（結果一樣，只是會卡一下）。
export function analyzeBufferAsync(data: Float32Array, sampleRate: number): Promise<HumAnalysis> {
  const fallback = () => analyzeBuffer(data, sampleRate)
  if (typeof Worker === 'undefined') return Promise.resolve().then(fallback)
  return new Promise<HumAnalysis>((resolve) => {
    let w: Worker
    try {
      w = new Worker(new URL('./pitch.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      resolve(fallback())
      return
    }
    let done = false
    const finish = (fn: () => HumAnalysis) => {
      if (done) return
      done = true
      clearTimeout(timer)
      w.terminate()
      resolve(fn())
    }
    const timer = setTimeout(() => finish(fallback), 15000)
    w.onmessage = (e: MessageEvent<{ result?: HumAnalysis; error?: string }>) => {
      const r = e.data.result
      finish(r ? () => r : fallback)
    }
    w.onerror = () => finish(fallback)
    // 複製一份再傳，原本的錄音資料（rawRef）還要留著給試聽用
    w.postMessage({ id: 0, data: data.slice(), sampleRate })
  })
}
