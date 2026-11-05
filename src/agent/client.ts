import type { Project } from '../lib/store'
import { songContext } from './context'
import { mockReply } from './mock'
import { MASTER_SYSTEM_PROMPT, buildUserTurn } from './prompts'
import type { AgentReply } from './types'

/** 離線時讓五位夥伴有自己的口吻（只加開場與收尾，不改變「不代寫」的內容） */
const FLAVOR: Record<string, { open: string[]; close: string; idle: string }> = {
  製作人: { open: ['退一步看整首：', '先問一個大方向的問題——', '以製作人的耳朵聽，'], close: '這像不像你一開始想要的感覺？', idle: '我比較在意整首歌往哪裡走。你現在最不確定的是哪一段？' },
  作曲家: { open: ['（輕輕哼了兩句）', '我在琴上試了一下，', '用耳朵聽聽看：'], close: '先哼哼看，耳朵會告訴你。', idle: '要不要先哼給我聽？聲音比文字更好討論。' },
  作詞人: { open: ['（翻開筆記本）', '我想先問你一個畫面：', '慢慢來，'], close: '那時候你看到了什麼？', idle: '說說那個當下吧，哪怕只有一個顏色、一個聲音。' },
  編曲: { open: ['我放兩個版本給你比：', '從編曲的角度，', '直接說重點：'], close: '先聽 A，再聽 B，選一個。', idle: '告訴我哪一段想要更熱鬧、哪一段想要收，我們來比比看。' },
  錄音師: { open: ['一步一步來。', '先確認一件事：', '技術上很簡單：'], close: '一次只改一個地方。', idle: '錄音、音量、混音、帶進 REAPER，卡在哪一步？' },
}
function flavor(reply: AgentReply, persona?: { name: string }, question?: string): AgentReply {
  const f = persona && FLAVOR[persona.name]
  if (!f) return reply
  const generic = /離線模式只會回答/.test(reply.text)
  if (generic && question) return { ...reply, text: f.idle, next: undefined }
  // 拒絕代寫的回覆保持原樣，不加開場，避免語氣被沖淡
  if (/不替你寫完|不替你寫/.test(reply.text)) return reply
  // mock 已經加過角色開場（「我哼著聽——」等）就不要再疊一層
  if (/^.{1,12}——/.test(reply.text)) return { ...reply, next: reply.next ?? f.close }
  const open = f.open[(reply.text.length + persona!.name.length) % f.open.length]
  return { ...reply, text: `${open}${reply.text}`, next: reply.next ?? f.close }
}

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
  persona?: { name: string; focus: string; voice: string }
  event?: { kind: string; detail: string }
  question?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

function isReply(x: unknown): x is AgentReply {
  return !!x && typeof (x as AgentReply).text === 'string'
}

export async function askMaster(p: Project, input: AskInput): Promise<{ reply: AgentReply; source: 'mock' | 'llm' }> {
  if (!ENDPOINT) return { reply: flavor(mockReply(p, input), input.persona, input.question), source: 'mock' }
  try {
    const user = buildUserTurn({ step: input.step, persona: input.persona, songContext: songContext(p), event: input.event, question: input.question })
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
    return { reply: flavor(mockReply(p, input), input.persona, input.question), source: 'mock' }
  }
}
