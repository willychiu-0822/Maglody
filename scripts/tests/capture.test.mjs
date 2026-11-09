import test from 'node:test'
import assert from 'node:assert/strict'
import { CaptureGate } from '../../src/lib/capture.ts'
import { RecordingSession } from '../../src/inspire/recording-session.ts'

test('permission gate rejects duplicate starts and stops late streams after cancel', () => {
  const gate = new CaptureGate(); let stops = 0
  const stream = { getTracks: () => [{ stop: () => stops++ }] }
  const first = gate.begin(); assert.equal(gate.begin(), null)
  gate.cancel(); const second = gate.begin()
  assert.equal(gate.accept(first, stream), false); assert.equal(stops, 1)
  assert.equal(gate.accept(second, stream), true)
  gate.cancel(); gate.cancel(); assert.equal(stops, 2)
})
function fixture(t, getMedia) {
  let stops = 0, starts = 0, recorder
  const stream = { getTracks: () => [{ stop: () => stops++ }] }
  const oldWindow = globalThis.window, oldRecorder = globalThis.MediaRecorder
  const oldDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  globalThis.window = globalThis
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: getMedia ?? (async () => stream) } })
  globalThis.MediaRecorder = class {
    state = 'inactive'; mimeType = 'audio/webm'
    constructor() { recorder = this }
    start() { this.state = 'recording'; starts++ }
    stop() { this.state = 'inactive'; queueMicrotask(() => { this.ondataavailable?.({ data: new Blob(['audio']) }); this.onstop?.() }) }
  }
  t.after(() => { globalThis.window = oldWindow; globalThis.MediaRecorder = oldRecorder; if (oldDevices) Object.defineProperty(navigator, 'mediaDevices', oldDevices); else delete navigator.mediaDevices })
  let state
  const session = new RecordingSession((next) => { state = next }, () => {}, () => {})
  t.after(() => session.dispose())
  return { session, stream, stops: () => stops, starts: () => starts, recorder: () => recorder, state: () => state }
}
test('recorder stop is idempotent and resolves a final blob; cleanup stops tracks', async (t) => {
  const f = fixture(t)
  await f.session.start('hum'); await f.session.start('voice'); assert.equal(f.starts(), 1)
  const first = f.session.stop(); assert.equal(first, f.session.stop())
  const result = await first
  assert.equal(await result.blob.text(), 'audio'); assert.equal(f.stops(), 1); assert.equal(f.state().recording, null)
  assert.equal(f.recorder().onstop, null)
})
test('unmount while awaiting permission closes the late microphone', async (t) => {
  let resolve
  const f = fixture(t, () => new Promise((r) => { resolve = r }))
  const pending = f.session.start('hum'); f.session.dispose(); resolve(f.stream); await pending
  assert.equal(f.stops(), 1); assert.equal(f.starts(), 0)
})
test('recorder error releases capture and settles pending stop', async (t) => {
  const f = fixture(t); await f.session.start('hum')
  const pending = f.session.stop(); f.recorder().onerror()
  assert.equal(await pending, null); assert.equal(f.stops(), 1); assert.ok(f.state().error)
})
