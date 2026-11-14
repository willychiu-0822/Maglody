import { useMemo } from 'react'
import type { Project } from '../lib/store'
import { buildMidi, downloadMidi, midiTrackNames } from '../lib/midi'
import './ableton.css'

/** 編曲口吻：把 .mid 帶進 Ableton Live 的 Session View。整張卡預設不出現，要實驗開關打開才看得到。 */
const TRACK_ZH: Record<string, string> = { Melody: '旋律', Chords: '和弦', Bass: '貝斯', Drums: '鼓' }
const FALLBACK_TRACKS = ['旋律', '和弦', '貝斯', '鼓']

export const ABLETON_STEPS = [
  '開 Live，按 Tab 切到 Session View（一格一格的那個畫面）。',
  '把剛下載的 .mid 從資料夾拖到空白的地方，Live 會幫每一軌各開一條 MIDI 軌（旋律、和弦、貝斯、鼓）。如果它問要不要一起帶入速度，選要。',
  '每一軌還沒有聲音很正常：從左邊瀏覽器拖一個樂器到軌道上（旋律放鋼琴或合成器、鼓放 Drum Rack）。',
  '按每一格左邊的小三角形，它就會一直轉。想再疊一層，把那條軌道的錄音鍵點亮，用鍵盤彈上去。',
  '滿意了再按 Tab 到 Arrangement View，把片段排成完整的歌。',
]

export const ABLETON_NOTE = '按鈕要是長得不一樣，就找會讓那一格轉起來的。先讓它響。'

function trackLabels(p: Project): string[] {
  try {
    const names = midiTrackNames(buildMidi(p)).filter((n) => n && n !== 'Tempo')
    if (!names.length) return FALLBACK_TRACKS
    return names.map((n) => { const en = n.split(' ').pop() ?? n; return TRACK_ZH[en] ?? n })
  } catch {
    return FALLBACK_TRACKS
  }
}

export function AbletonGuide({ p }: { p: Project }) {
  const tracks = useMemo(() => trackLabels(p), [p])
  return (
    <section className="card ableton-guide" data-testid="ableton-guide">
      <div className="ableton-head">
        <span className="why-q ableton-q">編曲家</span>
        <h3 className="why-title ableton-title">帶進 Ableton Live</h3>
      </div>
      <p className="ableton-lead">想在 Live 裡接著玩的話，我把譜包成一個 .mid 給你帶走。</p>
      <div className="row wrap">
        <button type="button" className="btn ableton-download" data-testid="ableton-download" onClick={() => downloadMidi(p)}>下載 .mid（給 Ableton）</button>
      </div>
      <p className="ableton-tracks small" data-testid="ableton-tracks">
        <span className="muted">檔案裡有 {tracks.length} 軌：</span>{tracks.join('／')}
      </p>
      <p className="ableton-steps-title">拖進 Ableton 的 Session View 後這樣做</p>
      <ol className="ableton-steps">{ABLETON_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
      <p className="ableton-note muted small" data-testid="ableton-note">{ABLETON_NOTE}</p>
    </section>
  )
}
