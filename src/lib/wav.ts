/** 16 位元 PCM WAV：手機的播放器、LINE、訊息 App 都能直接播。 */
export function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  const frames = channels[0]?.length ?? 0
  const n = channels.length
  const dataBytes = frames * n * 2
  const out = new ArrayBuffer(44 + dataBytes)
  const v = new DataView(out)
  const tag = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i)) }
  tag(0, 'RIFF'); v.setUint32(4, 36 + dataBytes, true); tag(8, 'WAVE')
  tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, n, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * n * 2, true); v.setUint16(32, n * 2, true); v.setUint16(34, 16, true)
  tag(36, 'data'); v.setUint32(40, dataBytes, true)
  let o = 44
  for (let i = 0; i < frames; i++) for (let c = 0; c < n; c++) {
    const x = Math.max(-1, Math.min(1, channels[c][i]))
    v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true)
    o += 2
  }
  return out
}

/** 讀回 WAV 的長度與音量（測試用：確認檔案不是靜音、長度對得上）。 */
export function describeWav(buf: ArrayBuffer) {
  const v = new DataView(buf)
  const tag = (o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3))
  if (buf.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE' || tag(36) !== 'data') throw new Error('不是 WAV 檔')
  const channels = v.getUint16(22, true)
  const sampleRate = v.getUint32(24, true)
  const bytes = v.getUint32(40, true)
  const frames = Math.floor(bytes / (channels * 2))
  let peak = 0, sum = 0
  for (let i = 0; i < frames * channels; i++) {
    const x = v.getInt16(44 + i * 2, true) / 0x8000
    peak = Math.max(peak, Math.abs(x)); sum += x * x
  }
  return { channels, sampleRate, frames, seconds: frames / sampleRate, peak, rms: Math.sqrt(sum / Math.max(1, frames * channels)) }
}
