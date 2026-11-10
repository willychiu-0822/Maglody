import type { Project } from '../lib/store'
import { diatonicChords, noteNameOct } from '../lib/theory'

/** A small, read-only scrapbook of this song; opening it never changes the draft. */
export function SongMaterials({ p }: { p: Project }) {
  const chords = diatonicChords(p.harmony.root, p.harmony.mode)
  const parts = [{ key: 'verse', name: '主歌' }, { key: 'chorus', name: '副歌' }] as const
  const harmonies = parts.filter(part => p.harmony[part.key].some(n => n != null))
  const melodies = parts.map(part => ({ ...part, notes: p.melody[part.key].filter((n): n is number => n != null && n >= 0).slice(0, 8) })).filter(part => part.notes.length)
  const hum = melodies.length ? [] : (p.hum?.notes.slice(0, 8).map(n => n.midi) ?? [])
  const lyrics = p.lyrics.filter(section => section.text.trim()).slice(0, 2)
  const hasMaterials = p.idea.hook.trim() || harmonies.length || melodies.length || hum.length || lyrics.length
  return <details className="material-journal" aria-label="素材手記">
    <summary><span>翻開素材手記</span><span className="journal-fold" aria-hidden="true">＋</span></summary>
    <div className="journal-pages">
      {!hasMaterials && <p className="journal-empty">第一筆還在醞釀。你留下的詞和聲音，會慢慢收在這裡。</p>}
      {!!p.idea.hook.trim() && <article className="material-note" data-material="idea" aria-label="一句靈感"><h2>一句靈感</h2><p>{p.idea.hook.slice(0, 120)}{p.idea.hook.length > 120 ? '…' : ''}</p></article>}
      {!!harmonies.length && <article className="material-note" data-material="harmony" aria-label="和弦片段"><h2>和弦的顏色</h2>{harmonies.map(part => <p key={part.key}><small>{part.name}</small><span>{p.harmony[part.key].map(n => n == null ? '＿' : chords[n].name).join(' → ')}</span></p>)}</article>}
      {!!(melodies.length || hum.length) && <article className="material-note" data-material="melody" aria-label="旋律片段"><h2>旋律的腳步</h2>{(melodies.length ? melodies : [{ key: 'hum', name: '哼唱種子', notes: hum }]).map(part => <p key={part.key}><small>{part.name} · 開頭幾個音</small><span>{part.notes.map(noteNameOct).join(' · ')}</span></p>)}</article>}
      {!!lyrics.length && <article className="material-note" data-material="lyrics" aria-label="詞句片段"><h2>留在紙上的詞</h2>{lyrics.map(section => <p key={section.id}>{section.text.trim().slice(0, 100)}{section.text.trim().length > 100 ? '…' : ''}</p>)}</article>}
    </div>
  </details>
}
