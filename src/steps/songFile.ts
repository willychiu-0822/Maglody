// 把整首歌算成一個聲音檔。用的是「從頭聽我的歌」同一份編排（scheduleSection），所以檔案聽起來和畫面上聽到的一樣。
import { scheduleSection, withRenderContext, type LoopSpec } from '../lib/audio'
import type { Project } from '../lib/store'
import { encodeWav } from '../lib/wav'
import { arrangedAudio } from './Arrangement'

/** 總檢討「從頭聽我的歌」與存成聲音檔共用：有編曲就照編曲，沒有就主歌＋副歌各 4 小節。 */
export function songSpecs(p: Project): LoopSpec[] {
  const plan = p.arrangement.length ? p.arrangement : (['verse', 'chorus'] as const).map((kind) => ({ id: kind, kind, bars: 4, layers: { drums: false, bass: true, keys: true, pad: false, melody: true } }))
  return plan.map((s) => ({ bpm: p.idea.bpm, ...arrangedAudio(p, s), layers: s.layers }))
}

export const songSeconds = (specs: LoopSpec[]) => specs.reduce((sum, s) => sum + s.bars.length * 8 * (60 / s.bpm / 2), 0)

const TAIL = 0.6 // 最後一個音的餘韻

export async function renderSong(p: Project, sampleRate = 44100): Promise<{ wav: ArrayBuffer; seconds: number }> {
  const specs = songSpecs(p)
  const length = songSeconds(specs)
  const seconds = length + TAIL
  const off = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate)
  const master = off.createGain()
  master.gain.value = 0.9
  master.connect(off.destination)
  withRenderContext(off, () => {
    let t = 0
    for (const spec of specs) {
      scheduleSection(spec, t, () => master, [])
      t += spec.bars.length * 8 * (60 / spec.bpm / 2)
    }
  })
  const rendered = await off.startRendering()
  const channels = [0, 1].map((c) => rendered.getChannelData(Math.min(c, rendered.numberOfChannels - 1)).slice())
  // 只往下收，不往上放大：疊太滿時壓到不爆音。
  const peak = Math.max(...channels.map((ch) => ch.reduce((m, x) => Math.max(m, Math.abs(x)), 0)))
  if (peak > 0.98) for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= 0.98 / peak
  return { wav: encodeWav(channels, sampleRate), seconds }
}
