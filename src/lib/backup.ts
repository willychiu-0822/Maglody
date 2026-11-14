import { defaultProject, type Project } from './store'
import { restoreProject, record } from './restore'
import { safeFileName } from './share'

export const MAX_BACKUP_BYTES = 2_000_000

export type BackupResult = { ok: true; project: Project } | { ok: false; reason: string }

const NOT_BACKUP = '這個檔案打不開，它看起來不是從 Maglody 存下來的備份。你現在的歌沒有動。'

/**
 * 讀備份檔。restoreProject 會把任何東西修成一首歌（連 {} 都會變成空白專案），
 * 所以先確認長得像備份，不然匯入會悄悄把使用者現在的歌換成空白。
 */
export function parseBackup(text: string): BackupResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, reason: '這個檔案太大，不像是一首歌的備份。你現在的歌沒有動。' }
  let value: unknown
  try { value = JSON.parse(text) } catch { return { ok: false, reason: NOT_BACKUP } }
  const p = record(value)
  const looksRight = p.version === 1 && ['idea', 'harmony', 'melody', 'lyrics', 'arrangement'].every((key) => key in p) && Object.keys(record(p.idea)).length > 0 && Object.keys(record(p.harmony)).length > 0
  if (!looksRight) return { ok: false, reason: NOT_BACKUP }
  return { ok: true, project: restoreProject(value, defaultProject()) }
}

export const backupFileName = (p: Project) => `${safeFileName(p.idea.title, '我的歌')}-備份.json`

export function downloadBackup(p: Project) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
  a.download = backupFileName(p)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
