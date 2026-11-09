import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultProject } from '../../src/lib/store.ts'
import { buildMidi } from '../../src/lib/midi.ts'
import { detectPitch } from '../../src/lib/pitch.ts'

test('default projects do not share mutable data; MIDI export has a valid header', () => {
  const p = defaultProject()
  p.harmony.verse[0] = 4
  assert.equal(defaultProject().harmony.verse[0], null)
  const midi = buildMidi(p)
  assert.equal(Buffer.from(midi).subarray(0, 4).toString(), 'MThd')
})
test('pitch detector handles silence and a known offline sine wave', () => {
  assert.ok(detectPitch(new Float32Array(2048), 8000) <= 0)
  const signal = Float32Array.from({ length: 2048 }, (_, i) => 0.4 * Math.sin(2 * Math.PI * 440 * i / 8000))
  assert.ok(Math.abs(detectPitch(signal, 8000) - 440) < 2)
})
