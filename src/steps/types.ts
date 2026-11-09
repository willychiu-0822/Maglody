import type { ComponentType } from 'react'
import type { Project, Update } from '../lib/store'

/** notify：把學生剛做的事告訴大師 Agent（先做後懂的旁白由此觸發） */
export type Notify = (kind: string, detail: string) => void
/** next：這一檯的條件達成後，前往下一檯（由 App 提供；未達成時為 null） */
export interface StepProps { goTo?: (key: string) => void; p: Project; update: Update; notify: Notify; next: { label: string; go: () => void } | null }
export interface Requirement { label: string; ok: boolean }

export interface StepDef {
  key: string
  title: string
  subtitle: string
  glyph: string
  Component: ComponentType<StepProps>
  requirements: (p: Project) => Requirement[]
}
