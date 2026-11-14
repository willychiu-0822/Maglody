import { useEffect, useState } from 'react'

/**
 * 還沒在真機上確認的草稿，預設不給一般人看。
 * main 只放驗過的功能；沒驗過的留在這個開關後面，驗過再拿掉。
 *
 * 這一個開關同時蓋住兩件還沒驗的事：旋律檯的鍵盤輸入，和總檢討的 Ableton 引導。
 *
 * 打開：網址加上 ?lab=midi，或把 localStorage 的 maglody-lab-midi 設成 "1"。
 * 關掉：?lab=off 或 ?lab=0，那個值會一起清掉。
 */
export const MIDI_LAB_KEY = 'maglody-lab-midi'

export function midiLabState(search: string, stored: string | null): { on: boolean; write: 'on' | 'off' | null } {
  const lab = new URLSearchParams(search).get('lab')
  if (lab === 'midi') return { on: true, write: 'on' }
  if (lab === 'off' || lab === '0') return { on: false, write: 'off' }
  return { on: stored === '1', write: null }
}

function readStored(): string | null {
  try { return localStorage.getItem(MIDI_LAB_KEY) } catch { return null }
}

export function useMidiLab(): boolean {
  const [on] = useState(() => (typeof window === 'undefined' ? false : midiLabState(window.location.search, readStored()).on))
  useEffect(() => {
    if (typeof window === 'undefined') return
    const { write } = midiLabState(window.location.search, readStored())
    try {
      if (write === 'on') localStorage.setItem(MIDI_LAB_KEY, '1')
      else if (write === 'off') localStorage.removeItem(MIDI_LAB_KEY)
    } catch { /* 私密模式寫不進去，這一頁仍照網址決定 */ }
  }, [])
  return on
}
