// Demo 版本：改稿前先存一版，改壞了可以回去（真實創作者的 demo 1、demo 2…）
import { useCallback, useRef, useState } from 'react'
import type { Project } from './store'
import { record, restoreProject } from './restore'
import { defaultProject, uid } from './store'

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
  const listRef = useRef(list)
  const persist = useCallback((next: DemoVersion[]) => {
    localStorage.setItem(KEY, JSON.stringify(next.slice(0, 20)))
    listRef.current = next.slice(0, 20)
    setList(listRef.current)
  }, [])
  const save = useCallback((p: Project, note: string) => {
    const number = Math.max(0, ...listRef.current.map(v => Number(v.name.match(/v(\d+)/)?.[1]) || 0)) + 1
    const name = `Demo v${number}`
    persist([{ id: uid(), name, note, at: Date.now(), project: structuredClone(p) }, ...listRef.current])
    return name
  }, [persist])
  const remove = useCallback((id: string) => persist(listRef.current.filter(v => v.id !== id)), [persist])
  return { list, save, remove }
}
export type VersionsApi = ReturnType<typeof useVersions>
