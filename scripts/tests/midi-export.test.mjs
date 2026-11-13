import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultProject } from '../../src/lib/store.ts'
import { buildMidi, midiTrackNames } from '../../src/lib/midi.ts'

const BAR = 480 * 4
const u32 = (b, i) => b[i] * 16777216 + b[i + 1] * 65536 + b[i + 2] * 256 + b[i + 3]
const ascii = (b, i) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3])

/** 把 SMF 拆成 header + 各軌事件；每軌記下宣告長度與實際走到的位置。 */
function parseSmf(bytes) {
  const header = { id: ascii(bytes, 0), len: u32(bytes, 4), format: bytes[8] * 256 + bytes[9], ntrks: bytes[10] * 256 + bytes[11], ppq: bytes[12] * 256 + bytes[13] }
  const tracks = []
  let pos = 8 + header.len
  while (pos < bytes.length) {
    const id = ascii(bytes, pos)
    const declared = u32(bytes, pos + 4)
    const start = pos + 8
    const end = start + declared
    let i = start, t = 0, sawEnd = false
    const events = []
    const vlq = () => { let n = 0, b; do { b = bytes[i++]; n = n * 128 + (b & 127) } while (b & 128); return n }
    while (i < end && !sawEnd) {
      t += vlq()
      const status = bytes[i++]
      if (status === 0xff) {
        const type = bytes[i++]
        const len = vlq()
        events.push({ t, status, type, data: bytes.subarray(i, i + len) })
        i += len
        if (type === 0x2f) sawEnd = true
      } else {
        assert.ok(status & 0x80, `track ${tracks.length}: every event carries its own status byte`)
        events.push({ t, status, a: bytes[i++], b: bytes[i++] })
      }
    }
    tracks.push({ id, declared, parsedEnd: i, end, events, tail: [...bytes.subarray(end - 3, end)] })
    pos = end
  }
  return { header, tracks, consumed: pos }
}

function fixture(drums = true) {
  const p = defaultProject()
  p.idea.bpm = 96
  p.harmony.verse = [0, 4, 5, 3]
  p.harmony.chorus = [3, 0, 4, 5]
  p.melody.verse[0] = 60
  p.melody.verse[2] = 62
  p.melody.chorus[0] = 67
  const layers = (on) => ({ drums: on, bass: true, keys: true, pad: false, melody: true })
  p.arrangement = [
    { id: 'intro', kind: 'intro', bars: 2, layers: layers(false) },
    { id: 'verse', kind: 'verse', bars: 4, layers: layers(drums) },
    { id: 'chorus', kind: 'chorus', bars: 4, layers: layers(drums) },
  ]
  return p
}

const drumNotes = (smf) => smf.tracks[4].events.filter((e) => e.status !== 0xff)

test('MIDI header: MThd, format 1, five tracks, PPQ 480', () => {
  const bytes = buildMidi(fixture())
  const { header, tracks } = parseSmf(bytes)
  assert.equal(header.id, 'MThd')
  assert.equal(header.len, 6)
  assert.equal(header.format, 1)
  assert.equal(header.ntrks, 5)
  assert.equal(header.ppq, 480)
  assert.equal(tracks.length, 5, 'header track count matches the MTrk chunks actually written')
})

test('track names list Tempo, Melody, Chords, Bass, Drums in order', () => {
  const names = midiTrackNames(buildMidi(fixture()))
  assert.deepEqual(names, ['Tempo', '主旋律 Melody', '和弦 Chords', '貝斯 Bass', '鼓 Drums'])
  for (const word of ['Melody', 'Chords', 'Bass', 'Drums']) assert.ok(names.some((n) => n.includes(word)), `${word} track is named`)
  assert.deepEqual(midiTrackNames(new Uint8Array()), [])
})

test('every MTrk length field matches its chunk and ends with FF 2F 00', () => {
  for (const p of [fixture(), fixture(false), defaultProject()]) {
    const bytes = buildMidi(p)
    const { tracks, consumed } = parseSmf(bytes)
    assert.equal(consumed, bytes.length, 'declared lengths add up to the whole file')
    tracks.forEach((trk, n) => {
      assert.equal(trk.id, 'MTrk', `chunk ${n} id`)
      assert.equal(trk.parsedEnd, trk.end, `chunk ${n}: events end exactly at the declared length`)
      assert.deepEqual(trk.tail, [0xff, 0x2f, 0x00], `chunk ${n} ends with end-of-track`)
      const last = trk.events[trk.events.length - 1]
      assert.equal(last.type, 0x2f)
      assert.equal(trk.events.filter((e) => e.status === 0xff && e.type === 0x2f).length, 1, `chunk ${n} has one end-of-track`)
    })
  }
})

test('drums track: channel-10 kick, snare, closed hat, each note-on closed by a note-off', () => {
  const notes = drumNotes(parseSmf(buildMidi(fixture())))
  assert.ok(notes.length > 0)
  assert.ok(notes.every((e) => e.status === 0x99 || e.status === 0x89), 'only channel 10 note-on/off')
  const ons = (n) => notes.filter((e) => e.status === 0x99 && e.a === n)
  const offs = (n) => notes.filter((e) => e.status === 0x89 && e.a === n)
  // 2 小節前奏沒有鼓，之後 8 小節：每小節 2 大鼓、2 小鼓、8 hi-hat
  assert.equal(ons(36).length, 16)
  assert.equal(ons(38).length, 16)
  assert.equal(ons(42).length, 64)
  assert.deepEqual([...new Set(notes.map((e) => e.a))].sort(), [36, 38, 42])
  for (const n of [36, 38, 42]) {
    const on = ons(n), off = offs(n)
    assert.equal(off.length, on.length, `note ${n}: as many note-offs as note-ons`)
    on.forEach((e, i) => {
      assert.ok(e.b > 0, 'note-on has a velocity')
      assert.ok(off[i].t > e.t, `note ${n} #${i}: note-off comes after its note-on`)
      if (on[i + 1]) assert.ok(off[i].t <= on[i + 1].t, `note ${n} #${i}: closed before the next hit`)
    })
  }
  // 與 audio.ts 的播放節奏一致：八分音符第 0、5 格大鼓，第 2、6 格小鼓，每格 hi-hat
  const first = 2 * BAR
  assert.ok(notes.every((e) => e.t >= first), 'no drums during the intro (drums layer off)')
  const inFirstBar = (n) => ons(n).filter((e) => e.t < first + BAR).map((e) => (e.t - first) / 240)
  assert.deepEqual(inFirstBar(36), [0, 5])
  assert.deepEqual(inFirstBar(38), [2, 6])
  assert.deepEqual(inFirstBar(42), [0, 1, 2, 3, 4, 5, 6, 7])
  assert.ok(notes.every((e) => e.t <= 10 * BAR), 'drums stop with the song')
})

test('drums layer off everywhere leaves the drums track without notes', () => {
  const smf = parseSmf(buildMidi(fixture(false)))
  assert.equal(smf.header.ntrks, 5)
  assert.equal(drumNotes(smf).length, 0)
  assert.deepEqual(smf.tracks[4].events.map((e) => e.type), [0x03, 0x2f], 'only the name and end-of-track remain')
  const all = smf.tracks.flatMap((trk) => trk.events)
  assert.ok(!all.some((e) => (e.status & 0x0f) === 9 && e.status !== 0xff), 'no channel-10 events anywhere')
  assert.ok(all.some((e) => e.status === 0x90), 'melody is still exported')
})

test('without an arrangement the verse→chorus fallback includes drums', () => {
  const p = fixture()
  p.arrangement = []
  const notes = drumNotes(parseSmf(buildMidi(p)))
  assert.equal(notes.filter((e) => e.status === 0x99 && e.a === 36).length, 16)
  assert.equal(notes.filter((e) => e.status === 0x99 && e.a === 42).length, 64)
})

test('tempo meta equals round(60000000 / bpm)', () => {
  for (const bpm of [96, 120, 73]) {
    const p = fixture()
    p.idea.bpm = bpm
    const tempo = parseSmf(buildMidi(p)).tracks[0].events.find((e) => e.status === 0xff && e.type === 0x51)
    assert.ok(tempo, 'tempo meta present in the first track')
    assert.equal(tempo.t, 0)
    assert.equal(tempo.data.length, 3)
    assert.equal(tempo.data[0] * 65536 + tempo.data[1] * 256 + tempo.data[2], Math.round(60000000 / bpm))
  }
})
