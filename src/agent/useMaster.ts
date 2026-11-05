import { useCallback, useRef, useState } from 'react'
import type { Project } from '../lib/store'
import { askMaster } from './client'
import type { AgentMessage } from './types'
import { uid } from '../lib/store'

/**
 * 大師 Agent 的對話狀態。
 * notify：學生做了一件事 → 大師旁白（同一種事件 1.2 秒內只觸發一次，避免洗版）。
 * ask：學生提問。
 */
export function useMaster(getProject: () => Project) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [busy, setBusy] = useState(false)
  const last = useRef<Record<string, number>>({})
  const timer = useRef<Record<string, number>>({})
  const msgsRef = useRef(messages)
  msgsRef.current = messages

  const history = () =>
    msgsRef.current.slice(-8).map((m) => ({ role: m.role === 'student' ? ('user' as const) : ('assistant' as const), content: m.reply ? JSON.stringify(m.reply) : m.text }))

  const push = (m: AgentMessage) => setMessages((xs) => [...xs.slice(-40), m])

  const run = useCallback(async (step: string, input: { event?: { kind: string; detail: string }; question?: string }) => {
    setBusy(true)
    // 等一個 tick，讓剛剛的 state 更新寫進專案後再讀
    await new Promise((r) => setTimeout(r, 0))
    const { reply, source } = await askMaster(getProject(), { step, ...input, history: history() })
    setBusy(false)
    if (reply.text || reply.learned) push({ id: uid(), role: 'master', step, text: reply.text, reply, source })
  }, [getProject]) // eslint-disable-line react-hooks/exhaustive-deps

  const notify = useCallback((step: string, kind: string, detail = '') => {
    const key = `${step}:${kind}:${detail}`
    window.clearTimeout(timer.current[key])
    // 編輯型事件（打字、拖拉）等使用者停手再說話
    const delay = /edit|change/.test(kind) ? 1500 : 150
    timer.current[key] = window.setTimeout(() => {
      const now = Date.now()
      if (now - (last.current[key] ?? 0) < 1200) return
      last.current[key] = now
      void run(step, { event: { kind, detail } })
    }, delay)
  }, [run])

  const ask = useCallback((step: string, question: string) => {
    push({ id: uid(), role: 'student', step, text: question })
    void run(step, { question })
  }, [run])

  return { messages, busy, notify, ask }
}
