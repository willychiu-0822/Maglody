import { useMemo } from 'react'
import type { Project } from '../lib/store'
import { buildMidi, downloadMidi, midiTrackNames } from '../lib/midi'
import './ableton.css'
import { ABLETON_NOTE, ABLETON_STEPS } from '../rules/ableton'
import { ROLES } from '../agent/roles'

/** 編曲口吻：把 .mid 帶進 Ableton Live 的 Session View。整張卡預設不出現，要實驗開關打開才看得到。 */
const TRACK_ZH: Record<string, string> = { Melody: '旋律', Chords: '和弦', Bass: '貝斯', Drums: '鼓' }
const FALLBACK_TRACKS = ['旋律', '和弦', '貝斯', '鼓']


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
        <span className="why-q ableton-q">{ROLES.arranger.label}</span>
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
