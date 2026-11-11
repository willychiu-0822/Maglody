import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeNotes } from '../../src/lib/pitch.ts'

test('chord coverage describes matching notes without including ranking bonuses', () => {
  const result = summarizeNotes([{ midi: 60, start: 0, dur: 1 }, { midi: 64, start: 1, dur: 1 }, { midi: 67, start: 2, dur: 1 }], 3)
  assert.ok(result.chordHints.length > 0)
  for (const hint of result.chordHints) {
    const match = hint.why.match(/覆蓋 (\d+)%/)
    assert.ok(match, hint.why)
    assert.ok(Number(match[1]) <= 100, hint.why)
    assert.doesNotMatch(hint.why, /你唱/)
  }
})
