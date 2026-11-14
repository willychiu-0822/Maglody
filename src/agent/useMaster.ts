import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../lib/store'
import { askMaster } from './client'
import type { AgentMessage } from './types'
import { uid } from '../lib/store'
import { DESK_ROLE, ROLES, type RoleId } from './roles'

/**
 * 大師 Agent 的對話狀態。
 * notify：學生做了一件事 → 大師旁白（同一種事件 1.2 秒內只觸發一次，避免洗版）。
 * ask：學生提問。
 */
export function useMaster(getProject: () => Project) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [pending, setPending] = useState<{ id: string; step: string; roleId: RoleId }[]>([])
  const last = useRef<Record<string, number>>({})
  const timer = useRef<Record<string, number>>({})
  const generation = useRef(0)
  const msgsRef = useRef(messages)
  msgsRef.current = messages

  const history = () =>
    msgsRef.current.slice(-8).map((m) => ({ role: m.role === 'student' ? ('user' as const) : ('assistant' as const), content: m.reply ? JSON.stringify(m.reply) : m.text }))

  const push = (m: AgentMessage) => setMessages((xs) => [...xs.slice(-40), m])

  const run = useCallback(async (step: string, input: { event?: { kind: string; detail: string }; question?: string }, roleId?: RoleId) => {
    const song = generation.current
    const rid = roleId ?? DESK_ROLE[step] ?? 'producer'
    const r = ROLES[rid]
    const id = uid()
    setPending(xs => [...xs, { id, step, roleId: rid }])
    try {
      // 等一個 tick，讓剛剛的 state 更新寫進專案後再讀
      await new Promise((res) => setTimeout(res, 0))
      if (song !== generation.current) return
      const { reply, source } = await askMaster(getProject(), { step, ...input, persona: { name: r.name, focus: r.focus, voice: r.voice }, personaId: rid, history: history() })
      if (song === generation.current && (reply.text || reply.learned)) push({ id: uid(), role: 'master', role_id: rid, step, text: reply.text, reply, source, at: Date.now() })
    } finally { setPending(xs => xs.filter(request => request.id !== id)) }
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

  const ask = useCallback((step: string, question: string, roleId?: RoleId) => {
    push({ id: uid(), role: 'student', role_id: roleId, step, text: question })
    void run(step, { question }, roleId)
  }, [run])

  const clear = useCallback(() => {
    generation.current++
    Object.values(timer.current).forEach(clearTimeout)
    timer.current = {}
    last.current = {}
    msgsRef.current = []
    setMessages([])
    setPending([])
  }, [])

  useEffect(() => () => { Object.values(timer.current).forEach(clearTimeout) }, [])
  const isBusy = (step: string, roleId: RoleId) => pending.some(request => request.step === step && request.roleId === roleId)
  return { messages, isBusy, notify, ask, clear, session: generation.current }
}
