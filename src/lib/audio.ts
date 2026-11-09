// Web Audio 小合成器：鋼琴感音色、和弦、鼓組與簡易循環播放
import { midiToFreq } from './theory'

let ctx: AudioContext | null = null
const sources = new Set<AudioScheduledSourceNode>()
export function trackAudioSource<T extends AudioScheduledSourceNode>(source: T): T {
  sources.add(source)
  source.addEventListener('ended', () => sources.delete(source), { once: true })
  return source
}
const delayed = new Set<number>()
export function afterSound(fn: () => void, ms: number) {
  const id = window.setTimeout(() => { delayed.delete(id); fn() }, ms)
  delayed.add(id)
  return id
}

/** iOS Safari 16.4+：讓播放不受靜音開關影響；錄音時切成 play-and-record */
export function setAudioSession(type: 'playback' | 'play-and-record') {
  const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (s) try { s.type = type } catch { /* 不支援時忽略 */ }
}

export function ac(): AudioContext {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new C()
    setAudioSession('playback')
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export type Wave = OscillatorType

export interface ToneOpts {
  type?: Wave
  gain?: number
  attack?: number
  release?: number
  dest?: AudioNode
}

export function tone(midi: number, start: number, dur: number, o: ToneOpts = {}) {
  const c = ac()
  const osc = trackAudioSource(c.createOscillator())
  const g = c.createGain()
  osc.type = o.type ?? 'triangle'
  osc.frequency.value = midiToFreq(midi)
  const peak = o.gain ?? 0.25
  const a = o.attack ?? 0.01
  const r = o.release ?? 0.15
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(peak, start + a)
  g.gain.exponentialRampToValueAtTime(Math.max(peak * 0.5, 0.0002), start + Math.max(a + 0.01, dur * 0.6))
  g.gain.setValueAtTime(Math.max(peak * 0.5, 0.0002), start + dur)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + r)
  osc.connect(g).connect(o.dest ?? c.destination)
  osc.start(start)
  osc.stop(start + dur + r + 0.05)
  return osc
}

export function playNote(midi: number, dur = 0.5, o: ToneOpts = {}) {
  const c = ac()
  tone(midi, c.currentTime + 0.02, dur, o)
}

export function playChord(midis: number[], dur = 1.2, o: ToneOpts = {}) {
  const c = ac()
  const t = c.currentTime + 0.02
  midis.forEach((m, i) => tone(m, t + i * 0.015, dur, { gain: 0.14, type: 'triangle', release: 0.4, ...o }))
}

let noiseBuf: AudioBuffer | null = null
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

export function kick(t: number, dest: AudioNode, gain = 0.9) {
  const c = ac()
  const o = trackAudioSource(c.createOscillator())
  const g = c.createGain()
  o.frequency.setValueAtTime(140, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + 0.32)
  return o
}

export function snare(t: number, dest: AudioNode, gain = 0.4) {
  const c = ac()
  const s = trackAudioSource(c.createBufferSource())
  s.buffer = noise(c)
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 1200
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  s.connect(f).connect(g).connect(dest)
  s.start(t)
  s.stop(t + 0.2)
  return s
}

export function hat(t: number, dest: AudioNode, gain = 0.12) {
  const c = ac()
  const s = trackAudioSource(c.createBufferSource())
  s.buffer = noise(c)
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = 7000
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  s.connect(f).connect(g).connect(dest)
  s.start(t)
  s.stop(t + 0.06)
  return s
}

export function click(t: number, accent: boolean, dest?: AudioNode) {
  const c = ac()
  const o = trackAudioSource(c.createOscillator())
  const g = c.createGain()
  o.frequency.value = accent ? 1600 : 1000
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  o.connect(g).connect(dest ?? c.destination)
  o.start(t)
  o.stop(t + 0.06)
}

// ---------- 混音匯流排 ----------
export type TrackId = 'melody' | 'chords' | 'bass' | 'drums'

export interface TrackSettings { vol: number; pan: number; hp: boolean; mute: boolean }

export interface Bus {
  input: GainNode
  hp: BiquadFilterNode
  pan: StereoPannerNode
  out: GainNode
}

export interface MixGraph {
  buses: Record<TrackId, Bus>
  master: GainNode
  analyser: AnalyserNode
  dispose: () => void
}

export function createMixGraph(): MixGraph {
  const c = ac()
  const master = c.createGain()
  master.gain.value = 0.9
  const analyser = c.createAnalyser()
  analyser.fftSize = 2048
  master.connect(analyser)
  analyser.connect(c.destination)
  const mk = (): Bus => {
    const input = c.createGain()
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 20
    const pan = c.createStereoPanner()
    const out = c.createGain()
    input.connect(hp).connect(pan).connect(out).connect(master)
    return { input, hp, pan, out }
  }
  const buses = { melody: mk(), chords: mk(), bass: mk(), drums: mk() }
  return {
    buses,
    master,
    analyser,
    dispose: () => {
      try { master.disconnect(); analyser.disconnect() } catch { /* ignore */ }
    },
  }
}

export function applyTrack(bus: Bus, s: TrackSettings, isBass: boolean) {
  const c = ac()
  const t = c.currentTime
  bus.out.gain.setTargetAtTime(s.mute ? 0 : s.vol, t, 0.02)
  bus.pan.pan.setTargetAtTime(s.pan, t, 0.02)
  bus.hp.frequency.setTargetAtTime(s.hp ? (isBass ? 40 : 180) : 20, t, 0.02)
}

// ---------- 循環播放器 ----------
export interface LoopSpec {
  bpm: number
  bars: number[][] // 每小節和弦的 voicing（midi）
  melody?: (number | null)[] // 每格八分音符
  layers: { drums: boolean; bass: boolean; keys: boolean; pad: boolean; melody: boolean }
  mix?: MixGraph
  onStep?: (step: number) => void
  loop?: boolean
}

export interface Player { stop: () => void }

const active = new Set<Player>()
let generation = 0
export const audioGeneration = () => generation
/** Original recordings share the same cancellation lifecycle as synthesized audio. */
export function playMedia(blob: Blob): Player {
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  const player: Player = {stop: () => { audio.pause(); audio.removeAttribute('src'); URL.revokeObjectURL(url); active.delete(player) }}
  active.add(player)
  audio.addEventListener('ended', player.stop, {once:true})
  audio.addEventListener('error', player.stop, {once:true})
  void audio.play().catch(player.stop)
  return player
}
/** 換章節時停止所有正在播放的循環 */
export function stopAll() {
  generation++
  delayed.forEach(id => clearTimeout(id)); delayed.clear()
  ;[...active].forEach(p => p.stop())
  sources.forEach(source => { try { source.stop() } catch { /* already stopped */ } }); sources.clear()
  window.speechSynthesis?.cancel()
}

export function playLoop(spec: LoopSpec): Player {
  if (!spec.bars.length) return { stop() {} }
  const c = ac()
  const graph = spec.mix
  const dest = (id: TrackId): AudioNode => (graph ? graph.buses[id].input : c.destination)
  const eighth = 60 / spec.bpm / 2
  const barDur = eighth * 8
  const totalSteps = spec.bars.length * 8
  let stopped = false
  let startAt = c.currentTime + 0.1
  const timers: number[] = []
  const scheduled: AudioScheduledSourceNode[] = []

  const scheduleCycle = (t0: number) => {
    spec.bars.forEach((voicing, b) => {
      const bt = t0 + b * barDur
      if (spec.layers.keys) {
        for (let k = 0; k < 4; k++) {
          voicing.slice(0, 3).forEach((m) => scheduled.push(tone(m, bt + k * eighth * 2, eighth * 1.6, { gain: 0.07, type: 'triangle', dest: dest('chords') })))
        }
      }
      if (spec.layers.pad) {
        voicing.slice(0, 3).forEach((m) => scheduled.push(tone(m + 12, bt, barDur * 0.95, { gain: 0.035, type: 'sawtooth', attack: 0.3, release: 0.4, dest: dest('chords') })))
      }
      if (spec.layers.bass && voicing.length) {
        const root = voicing[voicing.length - 1] - 12
        ;[0, 3, 4, 6].forEach((s) => scheduled.push(tone(root, bt + s * eighth, eighth * 0.9, { gain: 0.3, type: 'sine', dest: dest('bass') })))
      }
      if (spec.layers.drums) {
        for (let s = 0; s < 8; s++) {
          const st = bt + s * eighth
          if (s === 0 || s === 5) scheduled.push(kick(st, dest('drums')))
          if (s === 2 || s === 6) scheduled.push(snare(st, dest('drums')))
          scheduled.push(hat(st, dest('drums')))
        }
      }
    })
    if (spec.layers.melody && spec.melody) {
      spec.melody.slice(0, totalSteps).forEach((m, i) => {
        if (m == null || m < 0) return
        let len = 1
        while (i + len < totalSteps && spec.melody![i + len] === -1) len++
        scheduled.push(tone(m, t0 + i * eighth, eighth * len * 0.92, { gain: 0.22, type: 'square', attack: 0.02, release: 0.1, dest: dest('melody') }))
      })
    }
    if (spec.onStep) {
      for (let s = 0; s < totalSteps; s++) {
        const delay = (t0 + s * eighth - c.currentTime) * 1000
        timers.push(window.setTimeout(() => !stopped && spec.onStep!(s), Math.max(0, delay)))
      }
    }
  }

  const cycle = () => {
    if (stopped) return
    scheduleCycle(startAt)
    const next = startAt + totalSteps * eighth
    if (spec.loop) {
      timers.push(window.setTimeout(() => { startAt = next; cycle() }, (next - c.currentTime - 0.3) * 1000))
    } else {
      timers.push(window.setTimeout(() => { stopped = true; active.delete(player); spec.onStep?.(-1) }, (next - c.currentTime) * 1000))
    }
  }
  cycle()
  const player: Player = {
    stop: () => {
      active.delete(player)
      stopped = true
      timers.forEach((t) => clearTimeout(t))
      scheduled.forEach((n) => { try { n.stop() } catch { /* already stopped */ } })
    },
  }
  active.add(player)
  return player
}


/** Natural completion advances a sequence; cancelling never starts another section. */
export function playSequence(specs: LoopSpec[], onSection?: (i: number) => void, onComplete?: () => void): Player {
  let cancelled = false
  let current: Player | null = null
  const player: Player = { stop: () => { cancelled = true; current?.stop(); active.delete(player) } }
  const next = (i: number) => {
    if (cancelled) return
    if (i >= specs.length) { active.delete(player); onComplete?.(); return }
    const spec = specs[i]
    if (!spec.bars.length) { next(i + 1); return }
    onSection?.(i)
    current = playLoop({ ...spec, loop: false, onStep: step => { spec.onStep?.(step); if (step < 0) next(i + 1) } })
  }
  active.add(player)
  next(0)
  return player
}
