// OpenAI provider：支援 Chat Completions（預設）與 Responses API。
// env：OPENAI_API_KEY（必填）、LLM_MODEL、OPENAI_API_STYLE=chat|responses、OPENAI_BASE_URL（可接相容端點）
import { env, ProviderError, type LlmProvider, type LlmRequest } from './types.ts'

export function createOpenAI(): LlmProvider {
  const key = env('OPENAI_API_KEY')
  const model = env('LLM_MODEL', 'gpt-4o-mini')
  const base = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
  const style = process.env.OPENAI_API_STYLE === 'responses' ? 'responses' : 'chat'
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }

  async function post(path: string, body: unknown) {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) throw new ProviderError(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status === 429 ? 429 : 502)
    return res.json() as Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
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
        })
        return data.choices?.[0]?.message?.content ?? ''
      }
      const data = await post('/responses', {
        model,
        instructions: req.system,
        input: req.messages.map((m) => ({ role: m.role, content: m.content })),
        text: { format: { type: 'json_object' } },
      })
      // Responses API：output[] 內的 message → content[] 內 type=output_text
      const parts: string[] = []
      for (const item of data.output ?? []) for (const c of item.content ?? []) if (c.type === 'output_text') parts.push(c.text)
      return parts.join('')
    },
  }
}
