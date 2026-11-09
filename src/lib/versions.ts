// Demo 版本：改稿前先存一版，改壞了可以回去（真實創作者的 demo 1、demo 2…）
import { useCallback, useEffect, useState } from 'react'
import type { Project } from './store'
import { uid, defaultProject } from './store'
import { record, restoreProject } from './restore'

export interface DemoVersion { id: string; name: string; note: string; at: number; project: Project }

const KEY = 'maglody-versions-v1'
const load = (): DemoVersion[] => {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.flatMap((value) => {
      const v = record(value)
      return typeof v.id === 'string' && typeof v.name === 'string' && v.project && typeof v.project === 'object'
        ? [{ id: v.id, name: v.name, note: typeof v.note === 'string' ? v.note : '', at: typeof v.at === 'number' ? v.at : 0, project: restoreProject(v.project, defaultProject()) }] : []
    })
  } catch { return [] }
}

export function useVersions() {
  const [list, setList] = useState<DemoVersion[]>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))) } catch { /* 空間不足時忽略 */ } }, [list])
  const save = useCallback((p: Project, note: string) => {
    let name = ''
    setList((l) => {
      name = `Demo v${l.length + 1}`
      return [{ id: uid(), name, note, at: Date.now(), project: structuredClone(p) }, ...l]
    })
    return name
  }, [])
  const remove = useCallback((id: string) => setList((l) => l.filter((v) => v.id !== id)), [])
  return { list, save, remove }
}
export type VersionsApi = ReturnType<typeof useVersions>
