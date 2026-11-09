import { fetchJson, HttpError } from '../../src/lib/request.ts'
import { isObject } from '../../src/agent/reply.ts'
// Google provider：
//  - vertex：Vertex AI Gemini（GCP 專案 + OAuth 存取權杖）
//      env：GCP_PROJECT（必填）、GCP_LOCATION（預設 us-central1，可設 global）、LLM_MODEL
//      權杖順序：GCP_ACCESS_TOKEN → Cloud Run 服務帳戶（GCP_USE_METADATA=1）→ 本機 `gcloud auth print-access-token`
//  - gemini：Gemini Developer API（只需 GEMINI_API_KEY，適合本機開發）
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { env, ProviderError, type LlmProvider, type LlmRequest } from './types.ts'

const run = promisify(execFile)
let cached: { token: string; at: number } | null = null

async function accessToken(signal?: AbortSignal): Promise<string> {
  if (process.env.GCP_ACCESS_TOKEN) return process.env.GCP_ACCESS_TOKEN
  // gcloud 權杖約 60 分鐘有效，快取 45 分鐘
  if (cached && Date.now() - cached.at < 45 * 60_000) return cached.token
  // 部署在 Cloud Run 時（部署指令會設 GCP_USE_METADATA=1）：向 GCP metadata server 取得服務帳戶權杖，
  // 這是 Google 官方函式庫在 Cloud Run 上取得憑證的同一種方式，不需要任何金鑰檔。本機開發不會走這條路。
  if (process.env.GCP_USE_METADATA === '1') {
    const j = await fetchJson('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', { headers: { 'Metadata-Flavor': 'Google' }, signal }, 5_000)
    if (!isObject(j) || typeof j.access_token !== 'string' || !j.access_token || typeof j.expires_in !== 'number' || j.expires_in <= 60) throw new ProviderError('Invalid metadata token', 502)
    cached = { token: j.access_token, at: Date.now() - 45 * 60_000 + Math.min(45 * 60_000, (j.expires_in - 60) * 1000) }
    return cached.token
  }
  try {
    const { stdout } = await run('gcloud', ['auth', 'print-access-token'], { timeout: 5_000, maxBuffer: 16_384, signal })
    if (!stdout.trim()) throw new Error('Empty GCP token')
    cached = { token: stdout.trim(), at: Date.now() }
    return cached.token
  } catch {
    throw new ProviderError('取得 GCP 存取權杖失敗：本機請先執行 gcloud auth login；Cloud Run 上請設 GCP_USE_METADATA=1 並給服務帳戶「Vertex AI 使用者」角色', 500)
  }
}

function body(req: LlmRequest) {
  return {
    systemInstruction: { parts: [{ text: req.system }] },
    contents: req.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 1200 },
  }
}

async function call(url: string, headers: Record<string, string>, req: LlmRequest) {
  let data: unknown
  try {
    data = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body(req)), signal: req.signal })
  } catch (error) {
    throw new ProviderError('Gemini request failed', error instanceof HttpError && error.status === 429 ? 429 : 502)
  }
  const candidate = isObject(data) && Array.isArray(data.candidates) ? data.candidates[0] : undefined
  const content = isObject(candidate) ? candidate.content : undefined
  const parts = isObject(content) && Array.isArray(content.parts) ? content.parts : []
  const text = parts.filter(isObject).map((p) => typeof p.text === 'string' ? p.text : '').join('')
  if (!text.trim()) throw new ProviderError('Empty Gemini response')
  return text
}

export function createVertex(): LlmProvider {
  const project = env('GCP_PROJECT')
  const location = process.env.GCP_LOCATION ?? 'us-central1'
  const model = env('LLM_MODEL', 'gemini-2.5-flash')
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`
  // VERTEX_BASE_URL：走公司代理或本機測試時覆寫
  const base = (process.env.VERTEX_BASE_URL ?? `https://${host}`).replace(/\/$/, '')
  const url = `${base}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`
  return {
    name: 'vertex',
    model,
    async complete(req) {
      return call(url, { Authorization: `Bearer ${await accessToken(req.signal)}` }, req)
    },
  }
}

export function createGemini(): LlmProvider {
  const key = env('GEMINI_API_KEY')
  const model = env('LLM_MODEL', 'gemini-2.5-flash')
  const base = (process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com').replace(/\/$/, '')
  const url = `${base}/v1beta/models/${model}:generateContent`
  return { name: 'gemini', model, complete: (req) => call(url, { 'x-goog-api-key': key }, req) }
}
