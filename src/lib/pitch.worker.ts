// 哼唱分析的 Worker：把最久 1 秒的計算移出主執行緒（M-27）
import { analyzeBuffer } from './pitch'

self.onmessage = (e: MessageEvent<{ id: number; data: Float32Array; sampleRate: number }>) => {
  const { id, data, sampleRate } = e.data
  try {
    ;(self as unknown as Worker).postMessage({ id, result: analyzeBuffer(data, sampleRate) })
  } catch (err) {
    ;(self as unknown as Worker).postMessage({ id, error: String(err) })
  }
}
