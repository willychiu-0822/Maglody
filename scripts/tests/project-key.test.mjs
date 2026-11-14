// M-24：專案鍵從 maglody-project-v2 改成 maglody-project-v2，舊資料要開得起來。
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadProject, defaultProject, PROJECT_KEY, LEGACY_PROJECT_KEY } from '../../src/lib/store.ts'

const fakeStorage = (initial = {}) => {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = String(v) }, removeItem: (k) => { delete data[k] } }
}
const withStorage = (t, storage) => { const old = globalThis.localStorage; globalThis.localStorage = storage; t.after(() => { globalThis.localStorage = old }) }

test('M-24: the project key starts with maglody- and the legacy key is still readable', (t) => {
  assert.match(PROJECT_KEY, /^maglody-/)
  const song = defaultProject()
  song.idea.title = '舊鍵裡的歌'
  song.unlocked = 4
  withStorage(t, fakeStorage({ [LEGACY_PROJECT_KEY]: JSON.stringify(song) }))
  const loaded = loadProject()
  assert.equal(loaded.idea.title, '舊鍵裡的歌')
  assert.equal(loaded.unlocked, 4)
})

test('M-24: when both keys exist the new key wins', (t) => {
  const a = defaultProject(); a.idea.title = '舊'
  const b = defaultProject(); b.idea.title = '新'
  withStorage(t, fakeStorage({ [LEGACY_PROJECT_KEY]: JSON.stringify(a), [PROJECT_KEY]: JSON.stringify(b) }))
  assert.equal(loadProject().idea.title, '新')
})

test('M-24: nothing stored gives a blank song', (t) => {
  withStorage(t, fakeStorage())
  assert.equal(loadProject().idea.title, '')
})
