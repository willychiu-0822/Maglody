import type { Project } from './store'
import { playLoop } from './audio'
import { chordVoicing, diatonicChords } from './theory'

/** Speak the section the writer is actually editing, over its own melody. */
export function speakLyrics(p: Project, sectionId?: string) {
  const section = p.lyrics.find(s => s.id === sectionId) ?? p.lyrics.find(s => s.kind === 'chorus' && s.text.trim()) ?? p.lyrics.find(s => s.text.trim())
  if (!section?.text.trim()) return
  const part = section.kind === 'chorus' ? 'chorus' : 'verse'
  const chords = diatonicChords(p.harmony.root,p.harmony.mode)
  playLoop({bpm:p.idea.bpm,bars:p.harmony[part].map(d=>d==null?[]:chordVoicing(chords[d])),melody:p.melody[part],layers:{drums:false,bass:false,keys:true,pad:true,melody:true}})
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(section.text.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,2).join('，'))
    utterance.lang = 'zh-TW'; utterance.rate = .9
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance)
  }
}
