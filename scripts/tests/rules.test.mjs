// M-20：規則在不含 JSX、不含 CSS 的模組。測試直接載入這些檔，載入器不必 stub .css。
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { defaultProject } from '../../src/lib/store.ts'
import { progressionFeedback } from '../../src/rules/harmony.ts'
import { melodyFeedback } from '../../src/rules/melody.ts'
import { analyzeSection } from '../../src/rules/lyrics.ts'
import { arrangementFeedback } from '../../src/rules/arrangement.ts'
import { mixFeedback } from '../../src/rules/mix.ts'
import { deskPrerequisite, harmonyRequirements, mixRequirements } from '../../src/rules/requirements.ts'

const root = path.resolve(import.meta.dirname, '../..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const levels = (fb) => fb.map((f) => f.level)

test('M-20: rule modules have no JSX or CSS, and the coach does not import a screen file', () => {
  for (const rel of ['src/rules/harmony.ts', 'src/rules/melody.ts', 'src/rules/lyrics.ts', 'src/rules/arrangement.ts', 'src/rules/mix.ts', 'src/rules/requirements.ts', 'src/rules/types.ts']) {
    const src = read(rel)
    assert.doesNotMatch(src, /from ['"]react['"]/, rel)
    assert.doesNotMatch(src, /\.css['"]/, rel)
  }
  const app = read('src/App.tsx')
  assert.match(app, /deskPrerequisite\(step\.key, p\)/)
  assert.doesNotMatch(app, /先留一小句副歌旋律/)
  assert.doesNotMatch(app, /先留下一點聲音/)
  const mock = read('src/agent/mock.ts')
  assert.match(mock, /from '\.\.\/rules\/harmony'/)
  assert.match(mock, /from '\.\.\/rules\/melody'/)
  assert.match(mock, /from '\.\.\/rules\/lyrics'/)
  assert.match(mock, /from '\.\.\/rules\/arrangement'/)
  assert.match(mock, /from '\.\.\/rules\/mix'/)
  assert.doesNotMatch(mock, /from ['"][^'"]*components\//)
  assert.doesNotMatch(mock, /from ['"][^'"]*steps\//)
  const review = read('src/steps/Review.tsx')
  assert.match(review, /from '\.\.\/rules\/harmony'/)
  assert.match(review, /from '\.\.\/rules\/melody'/)
  assert.match(review, /from '\.\.\/rules\/lyrics'/)
  assert.match(review, /from '\.\.\/rules\/arrangement'/)
  assert.match(review, /from '\.\.\/rules\/mix'/)
  for (const rel of ['src/steps/Harmony.tsx', 'src/steps/Melody.tsx', 'src/steps/Lyrics.tsx', 'src/steps/Arrangement.tsx', 'src/steps/Mix.tsx']) {
    const src = read(rel)
    assert.match(src, /from '\.\.\/rules\//, rel)
    assert.doesNotMatch(src, /export function (progressionFeedback|melodyFeedback|analyzeSection|arrangementFeedback|mixFeedback)/, rel)
  }
  assert.doesNotMatch(read('scripts/test-loader.mjs'), /\.css/)
  assert.doesNotMatch(read('scripts/logic-regression.cjs'), /\.css/)
})

test('M-20: blank song feedback and desk prerequisites stay on the rule modules', () => {
  const p = defaultProject()
  const harmony = progressionFeedback(p.harmony.verse, p.harmony.mode, '主歌')
  assert.deepEqual(levels(harmony), ['warn'])
  assert.match(harmony[0].text, /主歌還有 4 格空著/)
  assert.deepEqual(levels(melodyFeedback(p, 'verse')), ['warn'])
  assert.deepEqual(analyzeSection(p.lyrics[0], p.idea.hook).fb, [])
  assert.deepEqual(levels(arrangementFeedback(p)), ['warn'])
  assert.ok(mixFeedback(p, null).some((f) => f.level === 'bad'))
  assert.equal(harmonyRequirements(p).every((r) => r.ok), false)
  assert.equal(deskPrerequisite('mix', p), '先留一小句副歌旋律，再來混音')
  assert.equal(deskPrerequisite('review', p), '先留下一點聲音：挑幾個和弦，或寫幾個音')
  assert.equal(deskPrerequisite('harmony', p), null)
  assert.equal(deskPrerequisite('melody', p), null)
})

test('M-20: a written song clears the same gates, and a held note is not a chorus melody', () => {
  const p = defaultProject()
  p.harmony.verse = [0, 4, 5, 3]
  p.harmony.chorus = [0, 4, 5, 3]
  const progression = progressionFeedback(p.harmony.verse, 'major', '主歌')
  assert.ok(progression.some((f) => f.level === 'good' && f.text.includes('穩定的和弦')))
  assert.ok(progression.some((f) => f.text.includes('停在 IV')))
  assert.equal(progression.some((f) => f.level === 'bad'), false)
  assert.equal(harmonyRequirements(p).every((r) => r.ok), true)

  p.melody.chorus[0] = 60
  p.melody.chorus[2] = 62
  p.melody.chorus[4] = 64
  p.melody.chorus[6] = 65
  assert.ok(melodyFeedback(p, 'chorus').length > 1)
  assert.equal(deskPrerequisite('mix', p), null)
  assert.equal(deskPrerequisite('review', p), null)

  const held = defaultProject()
  held.melody.chorus[0] = -1
  assert.equal(deskPrerequisite('mix', held), '先留一小句副歌旋律，再來混音')
  assert.equal(deskPrerequisite('review', held), '先留下一點聲音：挑幾個和弦，或寫幾個音')
  held.harmony.verse[0] = 0
  assert.equal(deskPrerequisite('review', held), null)

  const lyrics = analyzeSection({ id: 'v', kind: 'verse', text: '雨落在門前\n燈亮在窗邊' }, '')
  assert.ok(lyrics.ls.length === 2)
  assert.ok(lyrics.fb.length >= 1)
  assert.ok(lyrics.fb.every((f) => f.level === 'good' || f.level === 'warn' || f.level === 'bad'))

  p.arrangement = [
    { id: 'a', kind: 'intro', bars: 4, layers: { drums: false, bass: false, keys: true, pad: false, melody: false } },
    { id: 'b', kind: 'verse', bars: 8, layers: { drums: false, bass: true, keys: true, pad: false, melody: true } },
    { id: 'c', kind: 'chorus', bars: 8, layers: { drums: true, bass: true, keys: true, pad: true, melody: true } },
  ]
  const arranged = arrangementFeedback(p)
  assert.ok(arranged.length > 1)
  assert.equal(arranged.some((f) => f.text.includes('再排幾個段落')), false)

  p.mix.tracks.melody.vol = 1
  p.mix.listened = true
  assert.equal(mixFeedback(p, null).some((f) => f.level === 'bad'), false)
  assert.equal(mixRequirements(p).every((r) => r.ok), true)
  p.mix.tracks.melody.mute = true
  assert.equal(mixFeedback(p, null).some((f) => f.level === 'bad'), true)
  assert.equal(mixRequirements(p).every((r) => r.ok), false)
})
