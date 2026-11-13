import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMidiMessage, isPadMessage, DEFAULT_PAD_MAP, midiSupported, connectMidi } from '../../src/lib/midiInput.ts'

// 新版 Node 的 globalThis.navigator 是唯讀 getter，只能用 defineProperty 換掉
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
const setNavigator = (value) => Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true })
const restoreNavigator = () => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator)
  else delete globalThis.navigator
}

const fakeInput = (id, name) => ({ id, name, manufacturer: '', state: 'connected', onmidimessage: null })
const fakeAccess = (inputs) => ({ inputs: new Map(inputs.map((i) => [i.id, i])), onstatechange: null })
const send = (input, bytes) => input.onmidimessage({ data: Uint8Array.from(bytes) })
const recorder = () => {
  const states = []
  const messages = []
  return { states, messages, opts: { onState: (s) => states.push(s), onMessage: (msg, deviceName) => messages.push({ msg, deviceName }) } }
}

test('parseMidiMessage decodes note on, note off, CC, pitch bend and channels', () => {
  assert.deepEqual(parseMidiMessage([0x90, 60, 100]), { type: 'noteon', channel: 1, note: 60, velocity: 100 })
  assert.deepEqual(parseMidiMessage(Uint8Array.from([0x90, 60, 100])), { type: 'noteon', channel: 1, note: 60, velocity: 100 })
  assert.deepEqual(parseMidiMessage([0x90, 60, 0]), { type: 'noteoff', channel: 1, note: 60, velocity: 0 })
  assert.deepEqual(parseMidiMessage([0x80, 60, 64]), { type: 'noteoff', channel: 1, note: 60, velocity: 64 })
  assert.deepEqual(parseMidiMessage([0xb0, 74, 64]), { type: 'cc', channel: 1, controller: 74, value: 64 })
  assert.equal(parseMidiMessage([0x99, 36, 110]).channel, 10)
  assert.equal(parseMidiMessage([0x9f, 36, 110]).channel, 16)
  assert.equal(parseMidiMessage([0xb3, 1, 2]).channel, 4)
  assert.deepEqual(parseMidiMessage([0xe0, 0, 64]), { type: 'pitchbend', channel: 1, value: 0 })
  assert.equal(parseMidiMessage([0xe0, 0x7f, 0x7f]).value, 8191)
  assert.equal(parseMidiMessage([0xe0, 0, 0]).value, -8192)
})

test('parseMidiMessage ignores realtime, system, truncated and empty data', () => {
  assert.equal(parseMidiMessage([0xf8]).type, 'other')
  assert.equal(parseMidiMessage([0xfe]).type, 'other')
  assert.equal(parseMidiMessage([0xf0, 1, 2, 0xf7]).type, 'other')
  assert.equal(parseMidiMessage([0x90, 60]).type, 'other')
  assert.equal(parseMidiMessage([60, 100]).type, 'other')
  assert.equal(parseMidiMessage([]).type, 'other')
  assert.equal(parseMidiMessage(null).type, 'other')
  assert.equal(parseMidiMessage([0xc0, 5, 0]).type, 'other')
})

test('isPadMessage uses channel 10 notes 36-51 by default and accepts another map', () => {
  assert.deepEqual(DEFAULT_PAD_MAP, { channel: 10, noteLow: 36, noteHigh: 51 })
  assert.equal(isPadMessage(parseMidiMessage([0x99, 36, 110])), true)
  assert.equal(isPadMessage(parseMidiMessage([0x99, 51, 110])), true)
  assert.equal(isPadMessage(parseMidiMessage([0x89, 44, 0])), true)
  assert.equal(isPadMessage(parseMidiMessage([0x99, 35, 110])), false)
  assert.equal(isPadMessage(parseMidiMessage([0x99, 52, 110])), false)
  assert.equal(isPadMessage(parseMidiMessage([0x90, 36, 110])), false)
  assert.equal(isPadMessage(parseMidiMessage([0xb9, 36, 110])), false)
  const learned = { channel: 1, noteLow: 60, noteHigh: 63 }
  assert.equal(isPadMessage(parseMidiMessage([0x90, 60, 100]), learned), true)
  assert.equal(isPadMessage(parseMidiMessage([0x99, 36, 110]), learned), false)
})

test('missing Web MIDI API reports unsupported without throwing', async () => {
  setNavigator({})
  try {
    assert.equal(midiSupported(), false)
    const r = recorder()
    const dispose = await connectMidi(r.opts)
    assert.deepEqual(r.states, [{ status: 'unsupported' }])
    assert.equal(typeof dispose, 'function')
    dispose()
  } finally { restoreNavigator() }
})

test('rejected permission reports denied', async () => {
  setNavigator({ requestMIDIAccess: () => Promise.reject(new Error('SecurityError')) })
  try {
    assert.equal(midiSupported(), true)
    const r = recorder()
    const dispose = await connectMidi(r.opts)
    assert.deepEqual(r.states.map((s) => s.status), ['pending', 'denied'])
    dispose()
  } finally { restoreNavigator() }
})

test('a synchronously throwing requestMIDIAccess is also reported as denied', async () => {
  setNavigator({ requestMIDIAccess: () => { throw new Error('blocked by policy') } })
  try {
    const r = recorder()
    const dispose = await connectMidi(r.opts)
    assert.deepEqual(r.states.map((s) => s.status), ['pending', 'denied'])
    dispose()
  } finally { restoreNavigator() }
})

test('granted access with no input device reports none and asks without sysex', async () => {
  const access = fakeAccess([])
  let asked = null
  setNavigator({ requestMIDIAccess: (o) => { asked = o; return Promise.resolve(access) } })
  try {
    const r = recorder()
    const dispose = await connectMidi(r.opts)
    assert.deepEqual(asked, { sysex: false })
    assert.deepEqual(r.states, [{ status: 'pending' }, { status: 'none' }])
    dispose()
  } finally { restoreNavigator() }
})

test('connected keyboard forwards notes, pads and CC; survives hot-plug and unplug', async () => {
  const keys = fakeInput('a', 'MiniLab 3')
  const access = fakeAccess([keys])
  setNavigator({ requestMIDIAccess: () => Promise.resolve(access) })
  try {
    const r = recorder()
    const dispose = await connectMidi(r.opts)
    assert.deepEqual(r.states, [{ status: 'pending' }, { status: 'connected', deviceName: 'MiniLab 3' }])
    assert.equal(typeof keys.onmidimessage, 'function')
    assert.equal(typeof access.onstatechange, 'function')

    send(keys, [0x90, 60, 100])
    send(keys, [0x99, 36, 110])
    send(keys, [0xb0, 74, 64])
    keys.onmidimessage({ data: null })
    assert.equal(r.messages.length, 3)
    assert.deepEqual(r.messages[0], { msg: { type: 'noteon', channel: 1, note: 60, velocity: 100 }, deviceName: 'MiniLab 3' })
    assert.equal(isPadMessage(r.messages[0].msg), false)
    assert.equal(isPadMessage(r.messages[1].msg), true)
    assert.deepEqual(r.messages[2].msg, { type: 'cc', channel: 1, controller: 74, value: 64 })

    // 熱插拔：第二台裝置出現
    const second = fakeInput('b', 'Second Keys')
    access.inputs.set('b', second)
    access.onstatechange({ port: second })
    assert.equal(typeof second.onmidimessage, 'function')
    send(second, [0x91, 64, 90])
    assert.deepEqual(r.messages[3], { msg: { type: 'noteon', channel: 2, note: 64, velocity: 90 }, deviceName: 'Second Keys' })
    // 仍然是同一個狀態，不重複回報
    assert.equal(r.states.length, 2)

    // 拔掉第一台（從清單消失）：改回報第二台
    access.inputs.delete('a')
    access.onstatechange({ port: keys })
    assert.equal(keys.onmidimessage, null)
    assert.deepEqual(r.states.at(-1), { status: 'connected', deviceName: 'Second Keys' })

    // 拔掉第二台（留在清單但 state = disconnected）：沒有裝置
    second.state = 'disconnected'
    access.onstatechange({ port: second })
    assert.equal(second.onmidimessage, null)
    assert.deepEqual(r.states.at(-1), { status: 'none' })

    // 插回去：重新掛上
    second.state = 'connected'
    access.onstatechange({ port: second })
    assert.equal(typeof second.onmidimessage, 'function')
    assert.deepEqual(r.states.at(-1), { status: 'connected', deviceName: 'Second Keys' })

    // 解除連線：不再收訊息，也不再回報狀態
    const stale = second.onmidimessage
    const stateCount = r.states.length
    dispose()
    assert.equal(second.onmidimessage, null)
    assert.equal(access.onstatechange, null)
    stale({ data: Uint8Array.from([0x90, 62, 100]) })
    assert.equal(r.messages.length, 4)
    assert.equal(r.states.length, stateCount)
    dispose()
  } finally { restoreNavigator() }
})

test('throwing callbacks never escape connectMidi or the message handler', async () => {
  const keys = fakeInput('a', '')
  const access = fakeAccess([keys])
  setNavigator({ requestMIDIAccess: () => Promise.resolve(access) })
  try {
    const dispose = await connectMidi({
      onState: () => { throw new Error('state boom') },
      onMessage: () => { throw new Error('message boom') },
    })
    assert.doesNotThrow(() => send(keys, [0x90, 60, 100]))
    assert.doesNotThrow(() => access.onstatechange({}))
    dispose()
  } finally { restoreNavigator() }
})
