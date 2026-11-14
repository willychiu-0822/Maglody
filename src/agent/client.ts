import type { Project } from '../lib/store'
import { songContext } from './context'
import { mockReply } from './mock'
import type { RoleId } from '../../server/shared/personas.ts'
import { MASTER_LIMITS as L, clip } from '../../server/shared/limits.ts'
import type { AgentReply } from './types'
import { sanitizeReply } from '../../server/shared/reply.ts'
import { fetchJson } from '../../server/shared/request.ts'

/** 離線時讓五位夥伴有自己的口吻（只加開場與收尾，不改變「不代寫」的內容） */
const FLAVOR: Record<string, { open: string[]; close: string; idle: string }> = {
  製作人: { open: ['退一步看整首：', '先問一個大方向的問題——', '以製作人的耳朵聽，'], close: '這像不像你一開始想要的感覺？', idle: '我比較在意整首歌往哪裡走。你現在最不確定的是哪一段？' },
  作曲家: { open: ['（輕輕哼了兩句）', '我在琴上試了一下，', '用耳朵聽聽看：'], close: '先哼哼看，耳朵會告訴你。', idle: '要不要先哼給我聽？聲音比文字更好討論。' },
  作詞人: { open: ['（翻開筆記本）', '我想先問你一個畫面：', '慢慢來，'], close: '那時候你看到了什麼？', idle: '說說那個當下吧，哪怕只有一個顏色、一個聲音。' },
  編曲: { open: ['先想像兩種配器的差別：', '從編曲的角度，', '直接說重點：'], close: '可以在編曲檯逐次試聽，比較你喜歡哪一種。', idle: '告訴我哪一段想要更熱鬧、哪一段想要收，我們來比比看。' },
  錄音師: { open: ['一步一步來。', '先確認一件事：', '技術上很簡單：'], close: '一次只改一個地方。', idle: '錄音、音量、混音、帶進 REAPER，卡在哪一步？' },
}
function flavor(reply: AgentReply, persona?: { name: string }, question?: string): AgentReply {
  const f = persona && FLAVOR[persona.name]
  if (!f) return reply
  // 拒絕代寫的句子保持乾淨，不加口吻前綴
  if (/不替你寫完|我不替你寫/.test(reply.text)) return reply
  const generic = /離線模式只會回答/.test(reply.text)
  if (generic && question) return { ...reply, text: f.idle, next: undefined }
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
const ENDPOINT = (import.meta.env?.VITE_AGENT_URL as string | undefined) ?? ''

export const agentMode = (): 'llm' | 'mock' => (ENDPOINT ? 'llm' : 'mock')

export interface AskInput {
  step: string
  persona?: { name: string; focus: string; voice: string }
  /** 夥伴代號；後端用它查角色設定，不接受前端自己寫的角色文字 */
  personaId?: RoleId
  event?: { kind: string; detail: string }
  question?: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

export async function askMaster(p: Project, input: AskInput, options: { endpoint?: string; signal?: AbortSignal; timeoutMs?: number } = {}): Promise<{ reply: AgentReply; source: 'mock' | 'llm' }> {
  const endpoint = options.endpoint ?? ENDPOINT
  if (!endpoint || input.question && /(幫我|替我|直接).*(寫|作|完成)|代寫|寫一首/.test(input.question)) return { reply: flavor(mockReply(p, input), input.persona, input.question), source: 'mock' }
  try {
    const data = await fetchJson(endpoint, {
      signal: options.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 只送資料；system prompt 和角色設定由後端自己帶。
      body: JSON.stringify({
        step: input.step,
        persona: input.personaId,
        songContext: clip(songContext(p), L.songContext),
        event: input.event && { kind: input.event.kind, detail: clip(input.event.detail, L.eventDetail) },
        question: input.question && clip(input.question, L.question),
        history: (input.history ?? []).slice(-L.historyTurns).map((m) => ({ role: m.role, content: clip(m.content, L.historyTurn) })),
      }),
    }, options.timeoutMs ?? 15_000)
    if (data && typeof data === 'object' && ('offline' in data && data.offline || /後端 mock|LLM_PROVIDER|接上真正的 LLM/.test(JSON.stringify(data)))) throw new Error('Use studio coach')
    const reply = sanitizeReply(data)
    return { reply, source: 'llm' }
  } catch (e) {
    if (options.signal?.aborted) throw e
    console.warn('[master] LLM 失敗，改用離線模式')
    return { reply: flavor(mockReply(p, input), input.persona, input.question), source: 'mock' }
  }
}
