// LLM provider 抽象層：大師 Agent 只依賴這個介面，換供應商只要換一個檔案。
export interface ChatTurn { role: 'user' | 'assistant'; content: string }

export interface LlmRequest {
  system: string
  messages: ChatTurn[]
  /** 要求供應商只回 JSON（各家 API 的 JSON mode） */
  json: true
}

export interface LlmProvider {
  name: string
  model: string
  /** 回傳模型輸出的原始文字（應為 JSON 字串） */
  complete(req: LlmRequest): Promise<string>
}

export class ProviderError extends Error {
  status: number
  constructor(message: string, status = 502) { super(message); this.status = status }
}

export function env(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (v == null || v === '') throw new ProviderError(`缺少環境變數 ${name}`, 500)
  return v
}
