import type { ComponentType } from 'react'
import type { Project, Update } from '../lib/store'

export interface StepProps { p: Project; update: Update }
export interface Requirement { label: string; ok: boolean }

export interface StepDef {
  key: string
  title: string
  subtitle: string
  glyph: string
  Component: ComponentType<StepProps>
  requirements: (p: Project) => Requirement[]
}
