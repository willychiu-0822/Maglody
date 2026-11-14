import test from 'node:test'
import assert from 'node:assert/strict'
import { midiLabState, MIDI_LAB_KEY } from '../../src/lib/lab.ts'
import { ABLETON_NOTE, ABLETON_STEPS } from '../../src/components/AbletonGuide.tsx'

const BANNED = ['MiniLab', '還沒在真的', '跟我說']

test('midi lab stays off unless the switch is explicit', () => {
  assert.equal(MIDI_LAB_KEY, 'maglody-lab-midi')
  assert.deepEqual(midiLabState('', null), { on: false, write: null })
  assert.deepEqual(midiLabState('?lab=something', null), { on: false, write: null })
  assert.deepEqual(midiLabState('?lab=MIDI', null), { on: false, write: null })
  assert.deepEqual(midiLabState('', 'true'), { on: false, write: null })
  assert.deepEqual(midiLabState('', '0'), { on: false, write: null })
  assert.deepEqual(midiLabState('?other=midi', '1'), { on: true, write: null })
})

test('?lab=midi turns the draft on and asks to remember it', () => {
  assert.deepEqual(midiLabState('?lab=midi', null), { on: true, write: 'on' })
  assert.deepEqual(midiLabState('lab=midi', null), { on: true, write: 'on' })
  assert.deepEqual(midiLabState('?lab=midi&x=1', '0'), { on: true, write: 'on' })
})

test('?lab=off and ?lab=0 close the draft even if it was remembered', () => {
  assert.deepEqual(midiLabState('?lab=off', '1'), { on: false, write: 'off' })
  assert.deepEqual(midiLabState('?lab=0', '1'), { on: false, write: 'off' })
})

test('ableton draft copy is the arranger talking, without the device or the lab note', () => {
  const copy = [ABLETON_NOTE, ...ABLETON_STEPS].join('\n')
  for (const phrase of BANNED) assert.equal(copy.includes(phrase), false, phrase)
  assert.match(ABLETON_STEPS[3], /三角形/)
  assert.match(ABLETON_STEPS[3], /鍵盤/)
  assert.match(ABLETON_NOTE, /轉起來/)
  assert.equal(ABLETON_STEPS.length, 5)
})
