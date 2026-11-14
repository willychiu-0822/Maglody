// 前後端共用。後端在容器裡只有 server/ 這個資料夾，所以共用的程式放在 server/shared/，import 一律寫 .ts 副檔名。
export type AgentAction =
  | { type: 'tryProgression'; part: 'verse' | 'chorus'; degs: number[] }
  | { type: 'goStep'; step: string }
  | { type: 'playResult' }

export interface AgentSuggestion { label: string; action?: AgentAction }

export interface AgentReply {
  text: string
  learned?: string
  next?: string
  suggestions?: AgentSuggestion[]
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
const steps = new Set(['hum', 'idea', 'harmony', 'melody', 'lyrics', 'arrange', 'record', 'mix', 'review'])
const str = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : undefined

/** 同一個信任邊界用於後端模型輸出與前端 HTTP 回覆。 */
export function sanitizeReply(value: unknown): AgentReply {
  if (!isObject(value) || typeof value.text !== 'string' || !value.text.trim()) throw new Error('Invalid agent reply')
  const suggestions: AgentSuggestion[] = []
  if (Array.isArray(value.suggestions)) for (const suggestion of value.suggestions) {
    if (!isObject(suggestion) || typeof suggestion.label !== 'string' || !suggestion.label.trim()) continue
    let action: AgentAction | undefined
    const a = suggestion.action
    if (isObject(a)) {
      if (a.type === 'playResult') action = { type: 'playResult' }
      if (a.type === 'goStep' && typeof a.step === 'string' && steps.has(a.step)) action = { type: 'goStep', step: a.step }
      if (a.type === 'tryProgression' && (a.part === 'verse' || a.part === 'chorus') && Array.isArray(a.degs) && a.degs.length === 4 && a.degs.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        action = { type: 'tryProgression', part: a.part, degs: [...a.degs] }
      }
    }
    suggestions.push({ label: suggestion.label.slice(0, 60), ...(action ? { action } : {}) })
    if (suggestions.length === 3) break
  }
  return { text: value.text.slice(0, 400), learned: str(value.learned, 200), next: str(value.next, 200), suggestions }
}
