// Web MIDI 鍵盤輸入：解析訊息、連線（含熱插拔）、React hook。
// 這個檔案不可以 import CSS：單元測試在純 Node 底下直接載入它。
import { useCallback, useEffect, useRef, useState } from 'react'

export type MidiMessageType = 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'other'

export interface MidiMessage {
  type: MidiMessageType
  /** 1–16 */
  channel: number
  note?: number
  velocity?: number
  controller?: number
  /** cc：0–127；pitchbend：-8192–8191（0 = 置中） */
  value?: number
}

export function parseMidiMessage(data: Uint8Array | number[] | null | undefined): MidiMessage {
  if (!data || data.length < 1) return { type: 'other', channel: 1 }
  const status = data[0] & 0xff
  // < 0x80：不是狀態位元組；>= 0xF0：系統訊息，其中 >= 0xF8 是即時訊息（clock、active sensing…），一律略過
  if (status < 0x80 || status >= 0xf0) return { type: 'other', channel: 1 }
  const kind = status & 0xf0
  const channel = (status & 0x0f) + 1
  if (data.length < 3) return { type: 'other', channel }
  const d1 = data[1] & 0x7f
  const d2 = data[2] & 0x7f
  switch (kind) {
    case 0x90:
      // 力度 0 的 note-on 就是 note-off（很多鍵盤這樣送）
      return d2 > 0 ? { type: 'noteon', channel, note: d1, velocity: d2 } : { type: 'noteoff', channel, note: d1, velocity: 0 }
    case 0x80:
      return { type: 'noteoff', channel, note: d1, velocity: d2 }
    case 0xb0:
      return { type: 'cc', channel, controller: d1, value: d2 }
    case 0xe0:
      return { type: 'pitchbend', channel, value: ((d2 << 7) | d1) - 8192 }
    default:
      return { type: 'other', channel }
  }
}

export interface PadMap {
  /** 1–16 */
  channel: number
  noteLow: number
  noteHigh: number
}

/**
 * 預設的打擊墊對應：頻道 10、音 36–51。
 * Arturia MiniLab 3 的出廠設定「常見的說法」是頻道 10，Bank A = 36–43、Bank B = 44–51。
 * 注意：這組數字沒有在實體鍵盤上驗證過。所以 map 可以整個換掉，
 * 之後做「MIDI 學習」設定時直接傳自己的 PadMap 進來。
 */
export const DEFAULT_PAD_MAP: PadMap = { channel: 10, noteLow: 36, noteHigh: 51 }

export function isPadMessage(msg: MidiMessage, map: PadMap = DEFAULT_PAD_MAP): boolean {
  if (msg.type !== 'noteon' && msg.type !== 'noteoff') return false
  return msg.channel === map.channel && msg.note != null && msg.note >= map.noteLow && msg.note <= map.noteHigh
}

export function midiSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function'
}

export type MidiStatus = 'unsupported' | 'idle' | 'pending' | 'connected' | 'none' | 'denied'

export interface MidiState {
  status: MidiStatus
  deviceName?: string
}

export interface ConnectMidiOptions {
  onMessage(msg: MidiMessage, deviceName: string): void
  onState(state: MidiState): void
}

const FALLBACK_NAME = 'MIDI 鍵盤'
const nameOf = (input: MIDIInput): string => input.name || input.manufacturer || FALLBACK_NAME

/**
 * 要求 MIDI 權限並接上所有輸入裝置；裝置插拔時自動重新掛上。
 * 回傳的函式用來解除連線。這個函式不會丟例外。
 * 'none' = 拿到權限但沒有輸入裝置；'denied' = 瀏覽器或使用者拒絕。
 */
export async function connectMidi(opts: ConnectMidiOptions): Promise<() => void> {
  let last = ''
  const report = (s: MidiState) => {
    const key = `${s.status}|${s.deviceName ?? ''}`
    if (key === last) return
    last = key
    try { opts.onState(s) } catch { /* 回呼出錯不影響連線 */ }
  }
  if (!midiSupported()) {
    report({ status: 'unsupported' })
    return () => {}
  }
  report({ status: 'pending' })
  let access: MIDIAccess
  try {
    access = await navigator.requestMIDIAccess({ sysex: false })
  } catch {
    report({ status: 'denied' })
    return () => {}
  }
  let disposed = false
  const attached = new Set<MIDIInput>()
  const sync = () => {
    if (disposed) return
    const live: MIDIInput[] = []
    try {
      access.inputs.forEach((input) => { if (input.state !== 'disconnected') live.push(input) })
    } catch { /* 讀不到裝置清單就當作沒有裝置 */ }
    for (const input of live) {
      if (attached.has(input)) continue
      attached.add(input)
      try {
        input.onmidimessage = (e) => {
          if (disposed || !e.data) return
          try { opts.onMessage(parseMidiMessage(e.data), nameOf(input)) } catch { /* 回呼出錯不影響連線 */ }
        }
      } catch { /* 掛不上就略過這個裝置 */ }
    }
    for (const input of [...attached]) {
      if (live.includes(input)) continue
      attached.delete(input)
      try { input.onmidimessage = null } catch { /* 已經拔掉了 */ }
    }
    report(live.length ? { status: 'connected', deviceName: nameOf(live[0]) } : { status: 'none' })
  }
  try { access.onstatechange = sync } catch { /* 沒有熱插拔通知也能用 */ }
  sync()
  return () => {
    if (disposed) return
    disposed = true
    try { access.onstatechange = null } catch { /* ignore */ }
    for (const input of attached) {
      try { input.onmidimessage = null } catch { /* ignore */ }
    }
    attached.clear()
  }
}

export interface MidiKeyboard {
  status: MidiStatus
  deviceName?: string
  /** 最近一次彈下的音（MIDI 編號）；還沒彈過是 null */
  lastNote: number | null
  /** 一定要在使用者手勢（按鈕點擊）裡呼叫：Chrome 會跳權限視窗 */
  connect: () => void
}

/**
 * 鍵盤的 note-on 會送到 onNote。打擊墊訊息（isPadMessage）不會進 onNote，
 * 之後給編曲用；現在只透過選填的 onPad 送出去。
 */
export function useMidiKeyboard(
  onNote?: (midiNote: number, velocity: number) => void,
  onPad?: (msg: MidiMessage) => void,
  /** 預設開。草稿開關關掉時傳 false：不詢問權限、不接線、不寫進格子。 */
  enabled = true,
): MidiKeyboard {
  const [state, setState] = useState<MidiState>(() => ({ status: midiSupported() ? 'idle' : 'unsupported' }))
  const [lastNote, setLastNote] = useState<number | null>(null)
  const onNoteRef = useRef(onNote)
  const onPadRef = useRef(onPad)
  const disposeRef = useRef<(() => void) | null>(null)
  const aliveRef = useRef(false)
  const busyRef = useRef(false)

  // 永遠用最新的回呼，重新 render 不必重新訂閱
  useEffect(() => {
    onNoteRef.current = onNote
    onPadRef.current = onPad
  })

  const connect = useCallback(() => {
    if (!enabled || busyRef.current) return
    busyRef.current = true
    disposeRef.current?.()
    disposeRef.current = null
    void connectMidi({
      onMessage: (msg) => {
        if (!aliveRef.current) return
        if (isPadMessage(msg)) { onPadRef.current?.(msg); return }
        if (msg.type !== 'noteon' || msg.note == null) return
        setLastNote(msg.note)
        onNoteRef.current?.(msg.note, msg.velocity ?? 0)
      },
      onState: (s) => { if (aliveRef.current) setState(s) },
    }).then((dispose) => {
      busyRef.current = false
      if (aliveRef.current) disposeRef.current = dispose
      else dispose()
    })
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    aliveRef.current = true
    let cancelled = false
    if (midiSupported()) {
      // 之前已經允許過就直接接上；否則等使用者自己按按鈕
      try {
        const q = navigator.permissions?.query({ name: 'midi' } as unknown as PermissionDescriptor)
        q?.then((r) => { if (!cancelled && r.state === 'granted') connect() }).catch(() => {})
      } catch { /* 不支援查詢權限：維持 idle */ }
    }
    return () => {
      cancelled = true
      aliveRef.current = false
      disposeRef.current?.()
      disposeRef.current = null
    }
  }, [connect, enabled])

  return { status: state.status, deviceName: state.deviceName, lastNote, connect }
}
