import type { ComponentType } from 'react'
import type { Project, Update } from '../lib/store'

/** notify：把學生剛做的事告訴大師 Agent（先做後懂的旁白由此觸發） */
export type Notify = (kind: string, detail: string) => void
export interface StepProps { p: Project; update: Update; notify: Notify }
export interface Requirement { label: string; ok: boolean }

export interface StepDef {
  key: string
  title: string
  subtitle: string
  glyph: string
  Component: ComponentType<StepProps>
  requirements: (p: Project) => Requirement[]
}
