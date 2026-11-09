const assert=require('node:assert/strict');const {buildSync}=require('esbuild')
const {defaultProject,recordingStep,mixStep,lyricsStep,buildMidi,arrangedAudio,askMaster}=(()=>{
  const text=buildSync({stdin:{contents:`export {defaultProject} from './src/lib/store';export {recordingStep} from './src/steps/Recording';export {mixStep} from './src/steps/Mix';export {lyricsStep} from './src/steps/Lyrics';export {buildMidi} from './src/lib/midi';export {arrangedAudio} from './src/steps/Arrangement';export {askMaster} from './src/agent/client'`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',write:false,define:{'import.meta.env.VITE_AGENT_URL':'""'}}).outputFiles[0].text
  const m={exports:{}};new Function('module','exports','require',text)(m,m.exports,require);return m.exports
})()
let failed=0
function check(name,run){try{run();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e.message)}}
check('A-05 silence never passes recording preparation',()=>{const p=defaultProject();p.recording.levelPeakDb=-100;assert.equal(recordingStep.requirements(p).every(r=>r.ok),false)})
check('A-14 muted melody cannot pass mix',()=>{const p=defaultProject();p.mix.listened=true;p.melody.chorus[0]=60;p.mix.tracks.melody.vol=1.2;p.mix.tracks.melody.mute=true;assert.equal(mixStep.requirements(p).every(r=>r.ok),false)})
check('A-04 free lyric writing can continue without an earlier Hook',()=>{const p=defaultProject();p.lyrics[0].text='雨落在門前\n燈亮在窗邊';p.lyrics[1].text='雨聲帶我走\n再往前回頭';assert.ok(lyricsStep.requirements(p).every(r=>r.ok))})
check('A-03 full section audio has exactly seven bars',()=>{const p=defaultProject();const a=arrangedAudio(p,{kind:'verse',bars:7,layers:{},id:'test'});assert.equal(a.bars.length,7);assert.equal(a.melody.length,56)})
function midiEvents(bytes){
  let pos=14;const events=[];const u32=i=>bytes[i]*16777216+bytes[i+1]*65536+bytes[i+2]*256+bytes[i+3]
  const read=()=>{let n=0,b;do{b=bytes[pos++];n=(n<<7)+(b&127)}while(b&128);return n}
  while(pos<bytes.length){const end=pos+8+u32(pos+4);pos+=8;let t=0;while(pos<end){t+=read();const status=bytes[pos++];if(status===255){pos++;const len=read();pos+=len}else{const a=bytes[pos++],b=bytes[pos++];events.push({t,status,a,b})}}}
  return events
}
check('A-15 MIDI sustains cross a bar and stop at section boundary',()=>{
 const p=defaultProject();p.melody.verse[7]=60;p.melody.verse[8]=-1;p.melody.verse[9]=-1;p.melody.verse[10]=-1
 const events=midiEvents(buildMidi(p));const on=events.find(e=>e.status===0x90&&e.a===60),off=events.find(e=>e.status===0x80&&e.a===60)
 assert.equal(off.t-on.t,950)
 p.arrangement=[{id:'short',kind:'verse',bars:1,layers:{melody:true}}]
 const short=midiEvents(buildMidi(p));assert.equal(short.find(e=>e.status===0x80&&e.a===60).t-short.find(e=>e.status===0x90&&e.a===60).t,230)
})
;(async()=>{
 try{const {reply}=await askMaster(defaultProject(),{step:'idea',persona:{name:'編曲',focus:'',voice:''},question:'下一步'});assert.doesNotMatch(reply.text,/我放兩個版本給你比/);console.log('PASS A-08 offline partner never claims nonexistent versions')}catch(e){failed++;console.error('FAIL A-08',e.message)}
 if(failed)process.exitCode=1
})()
