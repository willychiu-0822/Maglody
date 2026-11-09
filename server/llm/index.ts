import { createGemini, createVertex } from './gcp.ts'
import { createOpenAI } from './openai.ts'
import { ProviderError, type LlmProvider } from './types.ts'

/** 後端用的離線 provider：不連網，只驗證整條管線（前端本身另有更完整的 mock 大師） */
function createMock(): LlmProvider {
  return {
    name: 'mock',
    model: 'mock',
    async complete(req) {
      void req
      return JSON.stringify({ text: '先聽聽你的歌。你最想調整哪一段？' })
    },
  }
}

/** 依 LLM_PROVIDER 選擇供應商：openai | vertex | gemini | mock（預設） */
export function createProvider(): LlmProvider {
  switch ((process.env.LLM_PROVIDER ?? 'mock').toLowerCase()) {
    case 'openai': return createOpenAI()
    case 'vertex': case 'gcp': return createVertex()
    case 'gemini': return createGemini()
    case 'mock': return createMock()
    default: throw new ProviderError('Invalid LLM_PROVIDER', 500)
  }
}
