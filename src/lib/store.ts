import { useCallback, useEffect, useState } from 'react'
import type { Mode } from './theory'
import type { HumNote } from './pitch'
import type { TrackId, TrackSettings } from './audio'

export type SectionKind = 'intro' | 'verse' | 'pre' | 'chorus' | 'bridge' | 'inter' | 'outro'
export type LayerId = 'drums' | 'bass' | 'keys' | 'pad' | 'melody'

export interface LyricSection { id: string; kind: SectionKind; text: string }
export interface ArrSection { id: string; kind: SectionKind; bars: number; layers: Record<LayerId, boolean> }

export interface Project {
  version: 1
  unlocked: number
  done: boolean[]
  hum: {
    notes: HumNote[]
    duration: number
    keyRoot: number
    keyMode: Mode
    confidence: number
    chordHints: string[]
    rangeLow: number
    rangeHigh: number
    source: 'mic' | 'file' | 'demo'
  } | null
  idea: { mood: string; vibe: string; theme: string; image: string; story: string; title: string; hook: string; bpm: number }
  lyrics: LyricSection[]
  harmony: { root: number; mode: Mode; verse: (number | null)[]; chorus: (number | null)[]; quizRight: number; quizTotal: number }
  melody: { verse: (number | null)[]; chorus: (number | null)[]; reflections: string }
  arrangement: ArrSection[]
  recording: { checks: Record<string, boolean>; levelPeakDb: number | null; pitchHits: number }
  mix: { tracks: Record<TrackId, TrackSettings>; listened: boolean }
  review: { ratings: Record<string, number>; checks: Record<string, boolean>; verdict: string }
}

export const STEP_COUNT = 9

export const uid = () => Math.random().toString(36).slice(2, 9)

export const defaultProject = (): Project => ({
  version: 1,
  unlocked: 0,
  done: new Array(STEP_COUNT).fill(false),
  hum: null,
  idea: { mood: '', vibe: '', theme: '', image: '', story: '', title: '', hook: '', bpm: 90 },
  lyrics: [
    { id: uid(), kind: 'verse', text: '' },
    { id: uid(), kind: 'chorus', text: '' },
  ],
  harmony: { root: 0, mode: 'major', verse: [null, null, null, null], chorus: [null, null, null, null], quizRight: 0, quizTotal: 0 },
  melody: { verse: new Array(32).fill(null), chorus: new Array(32).fill(null), reflections: '' },
  arrangement: [],
  recording: { checks: {}, levelPeakDb: null, pitchHits: 0 },
  mix: {
    tracks: {
      melody: { vol: 0.5, pan: 0, hp: false, mute: false },
      chords: { vol: 0.9, pan: 0, hp: false, mute: false },
      bass: { vol: 0.9, pan: 0, hp: false, mute: false },
      drums: { vol: 0.9, pan: 0, hp: false, mute: false },
    },
    listened: false,
  },
  review: { ratings: {}, checks: {}, verdict: '' },
})

const KEY = 'music-lab-project-v2'

function load(): Project {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProject()
    const p = JSON.parse(raw) as Partial<Project>
    const d = defaultProject()
    return { ...d, ...p, idea: { ...d.idea, ...p.idea }, harmony: { ...d.harmony, ...p.harmony }, melody: { ...d.melody, ...p.melody }, recording: { ...d.recording, ...p.recording }, mix: { ...d.mix, ...p.mix, tracks: { ...d.mix.tracks, ...p.mix?.tracks } }, review: { ...d.review, ...p.review } } as Project
  } catch {
    return defaultProject()
  }
}

export function useProject() {
  const [project, setProject] = useState<Project>(load)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(project)); setStorageError(false) } catch { setStorageError(true) }
  }, [project])
  const update = useCallback(<K extends keyof Project>(key: K, value: Project[K] | ((prev: Project[K]) => Project[K])) => {
    setProject((p) => ({ ...p, [key]: typeof value === 'function' ? (value as (x: Project[K]) => Project[K])(p[key]) : value }))
  }, [])
  const reset = useCallback(() => setProject(defaultProject()), [])
  return { project, setProject, update, reset, storageError }
}

export type Update = ReturnType<typeof useProject>['update']
