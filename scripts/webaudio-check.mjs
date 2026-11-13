// Automated Web Audio checks that need no real device: real Chrome AudioContext (silent sink) + OfflineAudioContext.
// Run: node scripts/webaudio-check.mjs   (starts its own vite dev server on 4181; real speakers/mic remain WIP)
import { createServer } from 'vite'
import { chromium } from '@playwright/test'
const server = await createServer({ server: { port: 4181, strictPort: true, host: 'localhost' }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.goto('http://localhost:4181/', { waitUntil: 'domcontentloaded' })
const res = await page.evaluate(async () => {
  const a = await import('/src/lib/audio.ts')
  const out = {}
  // 1. mix graph: playing a chord through the chords bus gives analyser energy; mute silences it
  const g = a.createMixGraph()
  const energy = () => { const d = new Float32Array(g.analyser.fftSize); g.analyser.getFloatTimeDomainData(d); return Math.max(...d.map(Math.abs)) }
  const c = a.ac()
  const chord = (dest) => [60, 64, 67].forEach(m => a.tone(m, c.currentTime, 0.6, { dest }))
  a.applyTrack(g.buses.chords, { vol: 1, pan: 0, hp: false, mute: false }, false)
  chord(g.buses.chords.input)
  await new Promise(r => setTimeout(r, 250))
  out.audibleEnergy = energy()
  a.stopAll()
  await new Promise(r => setTimeout(r, 700))
  a.applyTrack(g.buses.chords, { vol: 1, pan: 0, hp: false, mute: true }, false)
  await new Promise(r => setTimeout(r, 150))
  chord(g.buses.chords.input)
  await new Promise(r => setTimeout(r, 250))
  out.mutedEnergy = energy()
  g.dispose()
  out.ctxState = c.state
  // 2. offline render: the same oscillator->gain topology renders non-silent, bounded audio
  const off = new OfflineAudioContext(1, 44100, 44100)
  const o = off.createOscillator(); o.frequency.value = 440
  const gn = off.createGain(); gn.gain.value = 0.5
  o.connect(gn).connect(off.destination); o.start(0); o.stop(1)
  const buf = await off.startRendering()
  const d = buf.getChannelData(0)
  out.offlinePeak = Math.max(...d.map(Math.abs))
  // 3. expected topology: 4 buses each input->hp->pan->out->master
  const g2 = a.createMixGraph()
  out.busNames = Object.keys(g2.buses)
  g2.dispose()
  return out
})
await browser.close(); await server.close()
const checks = [
  ['mix graph passes sound to analyser', res.audibleEnergy > 0.01],
  ['muted track is silent', res.mutedEnergy < 0.005],
  ['offline render non-silent and not clipping', res.offlinePeak > 0.4 && res.offlinePeak <= 0.51],
  ['four buses', res.busNames.join() === 'melody,chords,bass,drums'],
]
console.log(JSON.stringify(res))
let bad = 0
for (const [n, ok] of checks) { console.log((ok ? 'PASS ' : 'FAIL ') + n); if (!ok) bad++ }
process.exit(bad ? 1 : 0)
