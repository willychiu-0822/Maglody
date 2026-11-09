// 靈感庫：獨立於「目前這首歌」的專案資料，重新開始一首歌也不會遺失。
import { useCallback, useEffect, useRef, useState } from 'react'
import type { HumNote } from '../lib/pitch'
import type { Mode } from '../lib/theory'
import { deleteBlob } from '../lib/media'
import { uid } from '../lib/store'

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

/** 使用者第一則真實靈感，作為靈感庫的 seed */
export const SEED: Inspiration = {
  id: 'seed-fuzui-qianxing',
  createdAt: Date.UTC(2026, 10, 5),
  text: '負罪前行',
  note: '主題／情緒 vibe，可能當歌名或核心意象。',
  tags: ['title', 'vibe', 'image'],
  images: [],
  fromStep: 'idea',
  used: [],
}

function load(): Inspiration[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? (JSON.parse(raw) as Inspiration[]) : []
    if (!localStorage.getItem(SEEDED) && !list.some((x) => x.id === SEED.id)) {
      list.unshift(SEED)
      localStorage.setItem(SEEDED, '1')
    }
    return list
  } catch {
    return [SEED]
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
