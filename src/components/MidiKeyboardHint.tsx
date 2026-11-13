import './midi.css'
import type { MidiStatus } from '../lib/midiInput'
import { noteNameOct } from '../lib/theory'

/** 作曲家對 MIDI 鍵盤的小提示：接上、等待、被擋、聽到哪個音。 */
export function MidiKeyboardHint({ status, deviceName, lastNote, onConnect, note }: {
  status: MidiStatus
  deviceName?: string
  lastNote: number | null
  onConnect: () => void
  /** 額外補一句（例如彈的音不在格子裡） */
  note?: string
}) {
  return (
    <div className="midi-hint" data-testid="midi-hint" data-status={status} role="status">
      {status === 'unsupported' && <p className="midi-hint-line midi-hint-quiet">這個瀏覽器收不到鍵盤訊號，螢幕上的琴格照樣能寫。</p>}
      {(status === 'idle' || status === 'none') && (
        <>
          <button type="button" className="btn small midi-hint-btn" onClick={onConnect}>接上 MIDI 鍵盤</button>
          {status === 'none' && <p className="midi-hint-line">還沒看到鍵盤。線插好之後再按一次。</p>}
        </>
      )}
      {status === 'pending' && <p className="midi-hint-line">等你在瀏覽器按允許……</p>}
      {status === 'denied' && <p className="midi-hint-line">瀏覽器沒放行鍵盤。沒關係，螢幕上的琴格一樣能寫；想再試，到網址列的權限把 MIDI 打開。</p>}
      {status === 'connected' && (
        <>
          <p className="midi-hint-line">作曲家：喔，你接了鍵盤（{deviceName || 'MIDI 鍵盤'}）。這段直接彈給我聽。</p>
          {lastNote != null && <p className="midi-hint-line midi-hint-heard">聽到了：{noteNameOct(lastNote)}</p>}
          {note && <p className="midi-hint-line midi-hint-quiet">{note}</p>}
        </>
      )}
    </div>
  )
}
