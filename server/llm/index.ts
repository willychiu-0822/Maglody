import { createGemini, createVertex } from './gcp.ts'
import { createOpenAI } from './openai.ts'
import type { LlmProvider } from './types.ts'

/** 後端用的離線 provider：不連網，只驗證整條管線（前端本身另有更完整的 mock 大師） */
function createMock(): LlmProvider {
  return {
    name: 'mock',
    model: 'mock',
    async complete(req) {
      const last = req.messages[req.messages.length - 1]?.content ?? ''
      const q = /<學生的提問>(.*?)<\/學生的提問>/s.exec(last)?.[1]
      return JSON.stringify({
        text: q ? `（後端 mock）你問了「${q}」。接上真正的 LLM 後，我會依你的歌回答。` : '（後端 mock）我收到你剛做的事了。',
        next: '設定 LLM_PROVIDER=openai、vertex 或 gemini 來啟用真正的大師。',
        suggestions: [],
      })
    },
  }
}

/** 依 LLM_PROVIDER 選擇供應商：openai | vertex | gemini | mock（預設） */
export function createProvider(): LlmProvider {
  switch ((process.env.LLM_PROVIDER ?? 'mock').toLowerCase()) {
    case 'openai': return createOpenAI()
    case 'vertex': case 'gcp': return createVertex()
    case 'gemini': return createGemini()
    default: return createMock()
  }
}
