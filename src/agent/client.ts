import type { Project } from '../lib/store'
import { songContext } from './context'
import { mockReply } from './mock'
import { MASTER_SYSTEM_PROMPT, buildUserTurn } from './prompts'
import type { AgentReply } from './types'

/**
 * 大師 Agent 的呼叫入口。
 * - 預設：離線 mock（規則式，零成本、零延遲）。
 * - 設定 VITE_AGENT_URL（例如 http://localhost:8787/api/master）後改走後端（server/index.ts），由後端依 LLM_PROVIDER 選 OpenAI／Vertex AI／Gemini。
 *   API 金鑰只放在後端，前端永遠拿不到。
 * - LLM 失敗時自動退回 mock，學習流程不中斷。
 */
const ENDPOINT = (import.meta.env.VITE_AGENT_URL as string | undefined) ?? ''

export const agentMode = (): 'llm' | 'mock' => (ENDPOINT ? 'llm' : 'mock')

export interface AskInput {
  step: string
  event?: { kind: string; detail: string }
  question?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

function isReply(x: unknown): x is AgentReply {
  return !!x && typeof (x as AgentReply).text === 'string'
}

export async function askMaster(p: Project, input: AskInput): Promise<{ reply: AgentReply; source: 'mock' | 'llm' }> {
  if (!ENDPOINT) return { reply: mockReply(p, input), source: 'mock' }
  try {
    const user = buildUserTurn({ step: input.step, songContext: songContext(p), event: input.event, question: input.question })
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: MASTER_SYSTEM_PROMPT, messages: [...(input.history ?? []).slice(-8), { role: 'user', content: user }] }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!isReply(data)) throw new Error('bad reply')
    // 前端再保險一次：只接受已知的 action 類型
    data.suggestions = (data.suggestions ?? []).filter((s) => !s.action || ['tryProgression', 'goStep', 'playResult'].includes(s.action.type)).slice(0, 3)
    return { reply: data, source: 'llm' }
  } catch (e) {
    console.warn('[master] LLM 失敗，改用離線模式', e)
    return { reply: mockReply(p, input), source: 'mock' }
  }
}
