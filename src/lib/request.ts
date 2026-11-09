export class HttpError extends Error {
  readonly status: number
  constructor(status: number) { super(`HTTP ${status}`); this.status = status }
}

/** 逾時涵蓋 response body；不將供應商的錯誤頁或金鑰帶進例外。 */
export async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<unknown> {
  const controller = new AbortController()
  const abort = () => controller.abort(init.signal?.reason)
  if (init.signal?.aborted) abort()
  else init.signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) { await response.body?.cancel(); throw new HttpError(response.status) }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Empty response')
    try {
      const decoder = new TextDecoder()
      let size = 0, text = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 1_000_000) { await reader.cancel(); throw new Error('Response too large') }
        text += decoder.decode(value, { stream: true })
      }
      return JSON.parse(text + decoder.decode()) as unknown
    } finally { reader.releaseLock() }
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', abort)
  }
}
