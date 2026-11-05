import type { Project } from '../lib/store'
import { diatonicChords, keyName } from '../lib/theory'
import { KIND_ZH, lyricLines } from '../steps/Lyrics'
import { fmtTime, songSeconds } from '../steps/Arrangement'
import { MOODS } from '../steps/Ideation'

/** 一路長出來的作品面板：讓學生隨時看見「我的歌」做到哪 */
export function SongSheet({ p }: { p: Project }) {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const prog = (d: (number | null)[]) => (d.every((x) => x == null) ? '—' : d.map((x) => (x == null ? '?' : chords[x].name)).join(' | '))
  const mood = MOODS.find((m) => m.id === p.idea.mood)
  const mel = (c: (number | null)[]) => c.filter((m) => m != null && m >= 0).length
  return (
    <div className="sheet">
      <div className="sheet-title">{p.idea.title || '（未命名的歌）'}</div>
      <dl>
        <dt>種子</dt>
        <dd>{p.hum ? `${p.hum.notes.length} 個音的哼唱 · ${keyName(p.hum.keyRoot, p.hum.keyMode)}` : '—'}</dd>
        <dt>情緒</dt>
        <dd>{mood ? `${mood.name} · ${p.idea.bpm} BPM` : '—'}</dd>
        <dt>畫面</dt>
        <dd>{p.idea.image || '—'}</dd>
        <dt>記憶點</dt>
        <dd>{p.idea.hook ? `「${p.idea.hook}」` : '—'}</dd>
        <dt>歌詞</dt>
        <dd>{p.lyrics.filter((s) => s.text.trim()).map((s) => `${KIND_ZH[s.kind]} ${lyricLines(s.text).length} 句`).join('、') || '—'}</dd>
        <dt>調</dt>
        <dd>{keyName(p.harmony.root, p.harmony.mode)}</dd>
        <dt>主歌和弦</dt>
        <dd className="mono">{prog(p.harmony.verse)}</dd>
        <dt>副歌和弦</dt>
        <dd className="mono">{prog(p.harmony.chorus)}</dd>
        <dt>旋律</dt>
        <dd>{mel(p.melody.verse) || mel(p.melody.chorus) ? `主歌 ${mel(p.melody.verse)} 音 · 副歌 ${mel(p.melody.chorus)} 音` : '—'}</dd>
        <dt>結構</dt>
        <dd>{p.arrangement.length ? `${p.arrangement.map((s) => KIND_ZH[s.kind]).join('→')}（${fmtTime(songSeconds(p))}）` : '—'}</dd>
      </dl>
    </div>
  )
}
