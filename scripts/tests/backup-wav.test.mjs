// M-07：備份檔的讀寫與 WAV 編碼。
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseBackup, backupFileName } from '../../src/lib/backup.ts'
import { defaultProject } from '../../src/lib/store.ts'
import { encodeWav, describeWav } from '../../src/lib/wav.ts'
import { safeFileName } from '../../src/lib/share.ts'

const rich = () => {
  const p = defaultProject()
  p.unlocked = 6
  p.done = [true, true, true, true, true, true, false, false, false]
  p.hum = { notes: [{ midi: 60, start: 0, dur: 0.4 }, { midi: 64, start: 0.5, dur: 0.3 }], duration: 2, keyRoot: 2, keyMode: 'minor', confidence: 0.7, chordHints: ['Dm', 'Gm'], rangeLow: 57, rangeHigh: 72, source: 'mic' }
  p.idea = { mood: 'sad', vibe: '雨', theme: '等待', image: '窗邊', story: '一個下雨的下午', title: '雨停了', hook: '雨停了你還沒來', bpm: 76 }
  p.harmony = { root: 2, mode: 'minor', verse: [0, 5, 3, 4], chorus: [3, null, 0, 4], quizRight: 2, quizTotal: 3 }
  p.melody = { verse: [62, 64, -1, 65, ...Array(28).fill(null)], chorus: [69, ...Array(31).fill(null)], reflections: '第二句想再高一點' }
  p.lyrics = [{ id: 'a', kind: 'verse', text: '雨落在鞋櫃上\n鑰匙安靜發光' }, { id: 'b', kind: 'chorus', text: '雨停了你還沒來' }]
  p.arrangement = [{ id: 'x', kind: 'intro', bars: 4, layers: { drums: false, bass: false, keys: true, pad: true, melody: false } }, { id: 'y', kind: 'chorus', bars: 8, layers: { drums: true, bass: true, keys: true, pad: false, melody: true } }]
  p.recording = { checks: { quiet: true }, levelPeakDb: -12, pitchHits: 3 }
  p.mix.tracks.melody.vol = 0.8
  p.mix.listened = true
  p.review = { ratings: { story: 4 }, checks: { sing: true }, verdict: '想再聽副歌' }
  return p
}

test('M-07: a backup exported from a song imports back deep-equal', () => {
  const p = rich()
  const result = parseBackup(JSON.stringify(p, null, 2))
  assert.equal(result.ok, true)
  assert.deepEqual(result.project, p)
})

test('M-07: files that are not backups are refused, with a reason that says the song was not touched', () => {
  for (const text of ['', '這不是 JSON', '{}', '[]', 'null', '"x"', '{"version":1}', '{"version":2,"idea":{"a":1},"harmony":{"a":1},"melody":{},"lyrics":[],"arrangement":[]}', '<html></html>', 'x'.repeat(2_000_001)]) {
    const r = parseBackup(text)
    assert.equal(r.ok, false, text.slice(0, 30))
    assert.match(r.reason, /沒有動/)
  }
})

test('M-07: backup file name carries the song title and never the old project name', () => {
  const p = defaultProject()
  assert.equal(backupFileName(p), '我的歌-備份.json')
  p.idea.title = '雨停了/你還沒來:?'
  assert.ok(!/[\\/:*?"<>|]/.test(backupFileName(p)))
  assert.ok(!/music-lab/.test(backupFileName(p)))
  assert.equal(safeFileName('   ', '預設'), '預設')
})

test('M-07: WAV encoding keeps length, channels and level', () => {
  const sr = 8000
  const sine = Float32Array.from({ length: sr * 2 }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 440 * i / sr))
  const info = describeWav(encodeWav([sine, sine], sr))
  assert.equal(info.channels, 2)
  assert.equal(info.sampleRate, sr)
  assert.ok(Math.abs(info.seconds - 2) < 1e-6)
  assert.ok(Math.abs(info.peak - 0.5) < 0.01)
  assert.ok(Math.abs(info.rms - 0.5 / Math.SQRT2) < 0.01)
  const silent = describeWav(encodeWav([new Float32Array(sr)], sr))
  assert.equal(silent.rms, 0)
  assert.throws(() => describeWav(new ArrayBuffer(10)))
})
