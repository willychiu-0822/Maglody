export type AgentAction =
  | { type: 'tryProgression'; part: 'verse' | 'chorus'; degs: number[] }
  | { type: 'goStep'; step: string }
  | { type: 'playResult' }

export interface AgentSuggestion { label: string; action?: AgentAction }

export interface AgentReply {
  text: string
  learned?: string
  next?: string
  suggestions?: AgentSuggestion[]
}

export interface AgentEvent { step: string; kind: string; detail: string }

export interface AgentMessage {
  id: string
  /** 說話的角色（RoleId）；學生訊息則是學生想問的對象 */
  role_id?: string
  at?: number
  role: 'master' | 'student'
  step: string
  text: string
  reply?: AgentReply
  source?: 'mock' | 'llm'
}
