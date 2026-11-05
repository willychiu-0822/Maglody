// Demo 版本：改稿前先存一版，改壞了可以回去（真實創作者的 demo 1、demo 2…）
import { useCallback, useEffect, useState } from 'react'
import type { Project } from './store'
import { uid } from './store'

export interface DemoVersion { id: string; name: string; note: string; at: number; project: Project }

const KEY = 'maglody-versions-v1'
const load = (): DemoVersion[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

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
