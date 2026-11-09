// Run the production audio scheduler against a deterministic Web Audio boundary.
const assert = require('node:assert/strict')
const Module = require('node:module')
const {buildSync} = require('esbuild')
const sources=[];const timers=new Map();let tid=0
const param = () => ({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}})
const node = () => ({connect(){return this},disconnect(){},gain:param(),frequency:param(),pan:param()})
class AudioContext {
  currentTime=0;sampleRate=22050;state='running';destination=node()
  createGain(){return node()}
  createOscillator(){const n={...node(),stops:[],start(){},stop(t){this.stops.push(t)},addEventListener(){}};sources.push(n);return n}
  createBufferSource(){return this.createOscillator()}
  createBiquadFilter(){return node()}
  createBuffer(){return {getChannelData(){return new Float32Array(22050)}}}
}
global.window={AudioContext,setTimeout:(fn,ms)=>{timers.set(++tid,{fn,ms});return tid},clearTimeout:id=>timers.delete(id),speechSynthesis:{cancel(){}}}
global.clearTimeout=window.clearTimeout
const m = new Module(process.cwd()+'/scripts/audio-bundle.cjs');m.paths=module.paths;m.filename=m.id
m._compile(buildSync({entryPoints:['src/lib/audio.ts'],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].text,m.filename)
const audio=m.exports
const checks=[]
function check(name,run){try {run();console.log('PASS',name)} catch(e){checks.push(name);console.error('FAIL',name,e.message)}}
check('A-03 stopping a song does not signal natural completion',()=>{
  let ended=0
  const player=audio.playLoop({bpm:90,bars:[[60,64,67]],layers:{keys:true,bass:true,pad:false,melody:false,drums:true},onStep:n=>{if(n<0)ended++}})
  player.stop();assert.equal(ended,0)
})
check('A-03 individual stop cancels every scheduled drum',()=>{ assert.ok(sources.every(s=>s.stops.includes(undefined))) })
check('A-03 stopAll cancels drums and individual preview notes',()=>{
  audio.playNote(64)
  audio.stopAll();assert.ok(sources.every(s=>s.stops.includes(undefined)),`${sources.filter(s=>!s.stops.includes(undefined)).length} sources still scheduled`)
})
check('A-03 stopAll clears scheduled callbacks',()=>{assert.equal(timers.size,0)})
if(checks.length) process.exitCode=1
