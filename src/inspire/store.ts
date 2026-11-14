// 靈感庫：獨立於「目前這首歌」的專案資料，重新開始一首歌也不會遺失。
import { useCallback, useEffect, useRef, useState } from 'react'
import type { HumNote } from '../lib/pitch'
import type { Mode } from '../lib/theory'
import { deleteBlob } from '../lib/media'
import { uid } from '../lib/store'
import { record } from '../lib/restore'

/** 這則靈感「可能是什麼」：可以多選，之後決定要拉進哪一步 */
export type InspoTag = 'title' | 'vibe' | 'lyric' | 'image' | 'story' | 'melody'

export const TAG_ZH: Record<InspoTag, string> = {
  title: '歌名', vibe: '情緒／vibe', lyric: '一句詞', image: '畫面', story: '故事', melody: '旋律',
}

/** 一則靈感可同時掛：文字、語音（含聽寫）、哼唱（含音高分析）、多張照片 */
export interface Inspiration {
  id: string
  createdAt: number
  text: string
  note?: string
  tags: InspoTag[]
  voice?: { assetId: string; durationSec: number; transcript?: string }
  hum?: { assetId?: string; notes: HumNote[]; durationSec: number; keyRoot: number; keyMode: Mode; rangeLow: number; rangeHigh: number }
  images: { assetId: string; w: number; h: number }[]
  fromStep: string
  used: { step: string; how: string; at: number }[]
}

const KEY = 'maglody-inspirations-v1'
const SEEDED = 'maglody-inspirations-seeded'

/** 本子第一次打開時放的一張範例紙片：內容中性、明講是範例、可以像任何一則一樣丟掉。丟掉之後不會再出現。 */
export const EXAMPLE_TEXT = '窗外的雨剛停'
const exampleInspiration = (): Inspiration => ({
  id: 'example-inspiration',
  createdAt: Date.now(),
  text: EXAMPLE_TEXT,
  note: '這是一張範例紙片，示範靈感長什麼樣子。可以直接丟掉。',
  tags: ['title', 'vibe', 'image'],
  images: [],
  fromStep: 'idea',
  used: [],
})

function load(): Inspiration[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    const list: Inspiration[] = Array.isArray(parsed) ? parsed.flatMap(value => {
      const x = record(value)
      if (typeof x.id !== 'string' || typeof x.text !== 'string') return []
      const finite = (value: unknown, fallback: number, min = 0, max = 3600) =>
        typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback
      const validAsset = (value: unknown) => typeof record(value).assetId === 'string' && !!record(value).assetId
      const voice = record(x.voice)
      const hum = record(x.hum)
      const notes = Array.isArray(hum.notes) ? hum.notes.flatMap(value => {
        const n = record(value)
        const midi = finite(n.midi, -1, 0, 127)
        const start = finite(n.start, -1, 0, 60)
        const dur = finite(n.dur, -1, 0.001, 60)
        return midi >= 0 && start >= 0 && dur > 0 ? [{ midi, start, dur }] : []
      }).slice(0, 200) : null
      return [{
        id: x.id, text: x.text, createdAt: finite(x.createdAt, Date.now(), 0, 8640000000000000),
        note: typeof x.note === 'string' ? x.note : undefined,
        tags: Array.isArray(x.tags) ? x.tags.filter((t): t is InspoTag => typeof t === 'string' && Object.hasOwn(TAG_ZH, t)) : [],
        images: Array.isArray(x.images) ? x.images.filter(validAsset).map(value => {
          const image = record(value)
          return { assetId: image.assetId as string, w: finite(image.w, 1, 1, 100000), h: finite(image.h, 1, 1, 100000) }
        }) : [],
        voice: validAsset(voice) ? { assetId: voice.assetId as string, durationSec: finite(voice.durationSec, 0), transcript: typeof voice.transcript === 'string' ? voice.transcript : undefined } : undefined,
        hum: notes ? {
          assetId: validAsset(hum) ? hum.assetId as string : undefined, notes,
          durationSec: finite(hum.durationSec, 0, 0, 60),
          keyRoot: Math.floor(finite(hum.keyRoot, 0, 0, 11)), keyMode: hum.keyMode === 'minor' ? 'minor' : 'major',
          rangeLow: finite(hum.rangeLow, 60, 0, 127), rangeHigh: finite(hum.rangeHigh, 72, 0, 127),
        } : undefined,
        fromStep: typeof x.fromStep === 'string' ? x.fromStep : 'idea',
        used: Array.isArray(x.used) ? x.used.filter(v => typeof record(v).step === 'string' && typeof record(v).how === 'string') as Inspiration['used'] : [],
      }]
    }) : []
    if (!localStorage.getItem(SEEDED)) {
      list.unshift(exampleInspiration())
      localStorage.setItem(SEEDED, '1')
    }
    return list
  } catch {
    return []
  }
}

export function useInspirations() {
  const [list, setList] = useState<Inspiration[]>(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 空間不足時忽略 */ }
  }, [list])
  const listRef = useRef(list)
  const persist = useCallback((next: Inspiration[]) => {
    localStorage.setItem(KEY, JSON.stringify(next))
    listRef.current = next
    setList(next)
  }, [])
  const add = useCallback((x: Omit<Inspiration, 'id' | 'createdAt' | 'used'>) => {
    const item: Inspiration = { ...x, id: uid(), createdAt: Date.now(), used: [] }
    persist([item, ...listRef.current])
    return item
  }, [persist])
  const patch = useCallback((id: string, p: Partial<Inspiration>) => persist(listRef.current.map(x => x.id === id ? {...x, ...p} : x)), [persist])
  const markUsed = useCallback((id: string, step: string, how: string) => persist(listRef.current.map(x => x.id === id ? {...x, used: [...x.used, {step,how,at:Date.now()}]} : x)), [persist])
  const remove = useCallback((id: string) => {
    const removed = listRef.current.find(x => x.id === id)
    const remaining = listRef.current.filter(x => x.id !== id)
    persist(remaining)
    const assets = (x: Inspiration) => [x.voice?.assetId, x.hum?.assetId, ...x.images.map(i => i.assetId)].filter((a): a is string => !!a)
    const used = new Set(remaining.flatMap(assets))
    if (removed) assets(removed).filter(a => !used.has(a)).forEach(a => { void deleteBlob(a).catch(() => {}) })
  }, [persist])
  return { list, add, patch, markUsed, remove }
}

export type InspoApi = ReturnType<typeof useInspirations>
