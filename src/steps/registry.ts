import { lazy } from 'react'
import { DESK_NAMES } from '../../server/shared/names.ts'
import * as R from '../rules/requirements'
import type { StepDef } from './types'

// 九檯畫面各自切成獨立 chunk，進到那一檯才下載；標題、規則留在這裡，選單與前置條件不用等畫面載入。

export const humStep: StepDef = {
  key: 'hum',
  title: DESK_NAMES.hum,
  subtitle: '把腦中的旋律變成看得見的音',
  glyph: '哼',
  Component: lazy(() => import('./Hum')),
  requirements: R.humRequirements,
}

export const ideationStep: StepDef = {
  key: 'idea',
  title: DESK_NAMES.idea,
  subtitle: '決定這首歌要說什麼',
  glyph: '想',
  Component: lazy(() => import('./Ideation')),
  requirements: R.ideationRequirements,
}

export const harmonyStep: StepDef = {
  key: 'harmony',
  title: DESK_NAMES.harmony,
  subtitle: '選調、排和弦、用耳朵確認',
  glyph: '和',
  Component: lazy(() => import('./Harmony')),
  requirements: R.harmonyRequirements,
}

export const melodyStep: StepDef = {
  key: 'melody',
  title: DESK_NAMES.melody,
  subtitle: '把哼唱整理成可以唱的旋律',
  glyph: '曲',
  Component: lazy(() => import('./Melody')),
  requirements: R.melodyRequirements,
}

export const lyricsStep: StepDef = {
  key: 'lyrics',
  title: DESK_NAMES.lyrics,
  subtitle: '用你的話，把心裡的畫面唱出來',
  glyph: '詞',
  Component: lazy(() => import('./Lyrics')),
  requirements: R.lyricsRequirements,
}

export const arrangementStep: StepDef = {
  key: 'arrange',
  title: DESK_NAMES.arrange,
  subtitle: '決定什麼時候加、什麼時候減',
  glyph: '編',
  Component: lazy(() => import('./Arrangement')),
  requirements: R.arrangementRequirements,
}

export const recordingStep: StepDef = {
  key: 'record',
  title: DESK_NAMES.record,
  subtitle: '測音量、暖嗓、整理環境',
  glyph: '錄',
  Component: lazy(() => import('./Recording')),
  requirements: R.recordingRequirements,
}

export const mixStep: StepDef = {
  key: 'mix',
  title: DESK_NAMES.mix,
  subtitle: '讓每個聲音都有位置',
  glyph: '混',
  Component: lazy(() => import('./Mix')),
  requirements: R.mixRequirements,
}

export const reviewStep: StepDef = {
  key: 'review',
  title: DESK_NAMES.review,
  subtitle: '聽聽這首歌現在的樣子',
  glyph: '成',
  Component: lazy(() => import('./Review')),
  requirements: R.reviewRequirements,
}

export const STEPS: StepDef[] = [humStep, ideationStep, harmonyStep, melodyStep, lyricsStep, arrangementStep, recordingStep, mixStep, reviewStep]
