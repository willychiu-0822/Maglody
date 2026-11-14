import { fetchJson, HttpError } from '../shared/request.ts'
import { isObject } from '../shared/reply.ts'
// OpenAI provider：支援 Chat Completions（預設）與 Responses API。
// env：OPENAI_API_KEY（必填）、LLM_MODEL、OPENAI_API_STYLE=chat|responses、OPENAI_BASE_URL（可接相容端點）
import { env, ProviderError, type LlmProvider, type LlmRequest } from './types.ts'

export function createOpenAI(): LlmProvider {
  const key = env('OPENAI_API_KEY')
  const model = env('LLM_MODEL', 'gpt-4o-mini')
  const base = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const style = process.env.OPENAI_API_STYLE ?? 'chat'
  if (style !== 'responses' && style !== 'chat') throw new ProviderError('Invalid OPENAI_API_STYLE', 500)
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }

  async function post(path: string, body: unknown, signal?: AbortSignal) {
    try {
      return await fetchJson(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal })
    } catch (error) {
      throw new ProviderError('OpenAI request failed', error instanceof HttpError && error.status === 429 ? 429 : 502)
    }
  }

  return {
    name: `openai-${style}`,
    model,
    async complete(req: LlmRequest) {
      if (style === 'chat') {
        const data = await post('/chat/completions', {
          model,
          messages: [{ role: 'system', content: req.system }, ...req.messages],
          response_format: { type: 'json_object' },
        }, req.signal)
        const choice = isObject(data) && Array.isArray(data.choices) ? data.choices[0] : undefined
        const message = isObject(choice) ? choice.message : undefined
        if (!isObject(message) || typeof message.content !== 'string' || !message.content.trim()) throw new ProviderError('Empty OpenAI response')
        return message.content
      }
      const data = await post('/responses', {
        model,
        instructions: req.system,
        input: req.messages.map((m) => ({ role: m.role, content: m.content })),
        text: { format: { type: 'json_object' } },
      }, req.signal)
      // Responses API：output[] 內的 message → content[] 內 type=output_text
      const parts: string[] = []
      if (isObject(data) && Array.isArray(data.output)) for (const item of data.output) {
        if (!isObject(item) || !Array.isArray(item.content)) continue
        for (const c of item.content) if (isObject(c) && c.type === 'output_text' && typeof c.text === 'string') parts.push(c.text)
      }
      if (!parts.join('').trim()) throw new ProviderError('Empty OpenAI response')
      return parts.join('')
    },
  }
}
