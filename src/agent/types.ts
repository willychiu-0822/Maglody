export type { AgentAction, AgentSuggestion, AgentReply } from '../../server/shared/reply.ts'
import type { AgentReply } from '../../server/shared/reply.ts'

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
