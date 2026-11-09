import type { Project, SectionKind } from './store'
import type { TrackId } from './audio'
import type { Mode } from './theory'

export const record = (x: unknown): Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x) ? x as Record<string, unknown> : {}
const text = (x: unknown, fallback = '') => typeof x === 'string' ? x : fallback
const num = (x: unknown, fallback: number, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback
const flags = (x: unknown) => Object.fromEntries(Object.entries(record(x)).filter(([,v])=>typeof v === 'boolean')) as Record<string, boolean>
const mode = (x: unknown): Mode => x === 'minor' ? 'minor' : 'major'
const kind = (x: unknown): x is SectionKind => typeof x === 'string' && ['intro','verse','pre','chorus','bridge','inter','outro'].includes(x)
const cells = (x: unknown, length: number, min: number, max: number): (number|null)[] => Array.from({length}, (_,i)=>{
  const v=Array.isArray(x)?x[i]:null
  return typeof v === 'number' && Number.isInteger(v) && v>=min && v<=max ? v : null
})

/** Persisted browser data is untrusted: repair each field without discarding valid work. */
export function restoreProject(value: unknown, defaults: Project): Project {
  const p=record(value), d=defaults
  const idea=record(p.idea), h=record(p.harmony), m=record(p.melody), r=record(p.recording), mix=record(p.mix), tracks=record(mix.tracks), review=record(p.review)
  const restoredIdea={...d.idea}
  for(const key of ['mood','vibe','theme','image','story','title','hook'] as const) restoredIdea[key]=text(idea[key])
  restoredIdea.bpm=num(idea.bpm,d.idea.bpm,55,170)
  const restoredTracks={...d.mix.tracks}
  for(const key of ['melody','chords','bass','drums'] as TrackId[]) {
    const t=record(tracks[key]), fallback=d.mix.tracks[key]
    restoredTracks[key]={vol:num(t.vol,fallback.vol,0,1.2),pan:num(t.pan,fallback.pan,-1,1),hp:typeof t.hp==='boolean'?t.hp:fallback.hp,mute:typeof t.mute==='boolean'?t.mute:fallback.mute}
  }
  const lyricList=Array.isArray(p.lyrics)?p.lyrics.flatMap((x,i)=>{
    const s=record(x)
    return kind(s.kind)&&typeof s.text==='string'?[{id:text(s.id,`restored-lyric-${i}`),kind:s.kind,text:s.text}]:[]
  }):[]
  const arrangement=Array.isArray(p.arrangement)?p.arrangement.flatMap((x,i)=>{
    const s=record(x), l=record(s.layers)
    return kind(s.kind)?[{id:text(s.id,`restored-section-${i}`),kind:s.kind,bars:Math.round(num(s.bars,4,2,16)),layers:{drums:l.drums===true,bass:l.bass===true,keys:l.keys===true,pad:l.pad===true,melody:l.melody===true}}]:[]
  }):[]
  const hum=record(p.hum)
  const notes=Array.isArray(hum.notes)?hum.notes.flatMap(x=>{
    const n=record(x)
    return typeof n.midi==='number'&&Number.isFinite(n.midi)&&typeof n.start==='number'&&Number.isFinite(n.start)&&typeof n.dur==='number'&&Number.isFinite(n.dur)&&n.dur>0&&n.start>=0?[{midi:num(n.midi,60,0,127),start:n.start,dur:n.dur}]:[]
  }):null
  return {
    version:1,unlocked:Math.floor(num(p.unlocked,0,0,8)),done:Array.from({length:9},(_,i)=>Array.isArray(p.done)&&p.done[i]===true),
    idea:restoredIdea,lyrics:lyricList.length?lyricList:d.lyrics,
    harmony:{root:Math.floor(num(h.root,0,0,11)),mode:mode(h.mode),verse:cells(h.verse,4,0,6),chorus:cells(h.chorus,4,0,6),quizRight:num(h.quizRight,0,0,1e6),quizTotal:num(h.quizTotal,0,0,1e6)},
    melody:{verse:cells(m.verse,32,-1,127),chorus:cells(m.chorus,32,-1,127),reflections:text(m.reflections)},
    arrangement,recording:{checks:flags(r.checks),levelPeakDb:typeof r.levelPeakDb==='number'?num(r.levelPeakDb,-100,-100,12):null,pitchHits:num(r.pitchHits,0,0,1e6)},
    mix:{tracks:restoredTracks,listened:mix.listened===true},
    review:{ratings:Object.fromEntries(Object.entries(record(review.ratings)).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=1&&v<=5)) as Record<string,number>,checks:flags(review.checks),verdict:text(review.verdict)},
    hum:notes?{notes,duration:num(hum.duration,1,0,60),keyRoot:Math.floor(num(hum.keyRoot,0,0,11)),keyMode:mode(hum.keyMode),confidence:num(hum.confidence,0,0,1),chordHints:Array.isArray(hum.chordHints)?hum.chordHints.filter((x):x is string=>typeof x==='string'):[],rangeLow:num(hum.rangeLow,60,0,127),rangeHigh:num(hum.rangeHigh,72,0,127),source:hum.source==='mic'||hum.source==='file'?hum.source:'demo'}:null,
  }
}
