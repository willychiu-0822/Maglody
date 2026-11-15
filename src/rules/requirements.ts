import type { Project } from '../lib/store'
import { energy } from './arrangement'
import { lyricLines } from './lyrics'
import { mixFeedback } from './mix'
import type { Requirement } from './types'

// 每一檯「做到什麼才算過」和「進這一檯前要先有什麼」，都收在這一個檔案。

const notes = (cells: (number | null)[]) => cells.filter((m) => m != null && m >= 0).length

export const humRequirements = (p: Project): Requirement[] => [
  { label: '先留一段聲音：自己哼、上傳，或聽示範都可以', ok: !!p.hum },
  { label: '讓我聽見至少 3 個音', ok: (p.hum?.notes.length ?? 0) >= 3 },
]

export const ideationRequirements = (p: Project): Requirement[] => [
  { label: '選一個情緒', ok: !!p.idea.mood },
  { label: '留下一句話', ok: !!p.idea.hook.trim() },
]

export const harmonyRequirements = (p: Project): Requirement[] => [
  { label: '主歌 4 個和弦', ok: !p.harmony.verse.includes(null) },
  { label: '副歌 4 個和弦', ok: !p.harmony.chorus.includes(null) },
]

export const melodyRequirements = (p: Project): Requirement[] => [
  { label: '主歌有幾個音', ok: notes(p.melody.verse) >= 4 },
  { label: '副歌有幾個音', ok: notes(p.melody.chorus) >= 4 },
]

export const lyricsRequirements = (p: Project): Requirement[] => [
  { label: '至少一段主歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'verse' && lyricLines(s.text).length >= 2) },
  { label: '至少一段副歌（2 句以上）', ok: p.lyrics.some((s) => s.kind === 'chorus' && lyricLines(s.text).length >= 2) },
]

export const arrangementRequirements = (p: Project): Requirement[] => [
  { label: '至少 4 個段落', ok: p.arrangement.length >= 4 },
  { label: '包含主歌與副歌', ok: p.arrangement.some((s) => s.kind === 'verse') && p.arrangement.some((s) => s.kind === 'chorus') },
  { label: '各段樂器不完全相同', ok: new Set(p.arrangement.map(energy)).size > 1 },
]

export const recordingRequirements = (p: Project): Requirement[] => [
  { label: '試過音量，留一點空間（或先跳過）', ok: (p.recording.levelPeakDb != null && p.recording.levelPeakDb > -60 && p.recording.levelPeakDb <= -3) || !!p.recording.checks.nomic },
]

export const mixRequirements = (p: Project): Requirement[] => [
  { label: '聽聽這段混音', ok: p.mix.listened && notes(p.melody.chorus) > 0 },
  // 任務只講畫面上看得到的東西：主畫面的「主旋律」那條推桿
  { label: '「主旋律」那條推桿被伴奏蓋住了，往右推近一點', ok: !mixFeedback(p, null).some((f) => f.level === 'bad') },
]

export const reviewRequirements = (p: Project): Requirement[] => [
  { label: '記下你聽完的想法', ok: p.review.verdict.trim().length >= 4 },
]

/** 隨時能進的打磨檯，進去之前還是要先有一點聲音。沒問題就回 null。 */
export function deskPrerequisite(key: string, p: Project): string | null {
  if (key === 'mix' && notes(p.melody.chorus) === 0) return '先留一小句副歌旋律，再來混音'
  if (key === 'review') {
    const hasWrittenSound = [...p.harmony.verse, ...p.harmony.chorus].some((n) => n != null) || notes(p.melody.verse) + notes(p.melody.chorus) > 0
    if (!hasWrittenSound) return '先留下一點聲音：挑幾個和弦，或寫幾個音'
  }
  return null
}
