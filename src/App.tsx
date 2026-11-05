import { useCallback, useEffect, useRef, useState } from 'react'
import { useProject } from './lib/store'
import { playChord, playLoop, stopAll } from './lib/audio'
import { chordVoicing, diatonicChords } from './lib/theory'
import { SongSheet } from './components/SongSheet'
import { ReaperGuide } from './components/ReaperGuide'
import { MasterPanel } from './components/MasterPanel'
import { useMaster } from './agent/useMaster'
import { learnedFor } from './agent/mock'
import type { AgentAction } from './agent/types'
import { humStep } from './steps/Hum'
import { ideationStep } from './steps/Ideation'
import { lyricsStep } from './steps/Lyrics'
import { harmonyStep } from './steps/Harmony'
import { melodyStep } from './steps/Melody'
import { arrangementStep } from './steps/Arrangement'
import { recordingStep } from './steps/Recording'
import { mixStep } from './steps/Mix'
import { reviewStep } from './steps/Review'
import { RESULTS, demoAvailable, playDemo } from './steps/results'
import { GentleContext } from './components/ui'
import { useVersions } from './lib/versions'
import { InspirationHub } from './inspire/InspirationHub'
import { useInspirations } from './inspire/store'
import type { StepDef } from './steps/types'

// 工作室的三個階段（真實創作者的 Generate → Shape → Refine），每一檯都可以隨時進出
const STEPS: StepDef[] = [humStep, ideationStep, harmonyStep, melodyStep, lyricsStep, arrangementStep, recordingStep, mixStep, reviewStep]
const PHASES = [
  { name: '發想', hint: '先求有、不審查', keys: ['hum', 'idea'] },
  { name: '成形', hint: '把素材組起來', keys: ['harmony', 'melody', 'lyrics', 'arrange'] },
  { name: '打磨', hint: '試聽、改稿、敢說完成', keys: ['record', 'mix', 'review'] },
]
const phaseOf = (key: string) => PHASES.find((ph) => ph.keys.includes(key))!

export default function App() {
  const { project: p, setProject, update, reset } = useProject()
  const [cur, setCur] = useState(() => Math.min(p.unlocked, STEPS.length - 1))
  const [sheetOpen, setSheetOpen] = useState(false)
  const [justLearned, setJustLearned] = useState<{ step: string; text: string } | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const pRef = useRef(p)
  pRef.current = p
  const getProject = useCallback(() => pRef.current, [])
  const master = useMaster(getProject)
  const inspo = useInspirations()
  const [inspoOpen, setInspoOpen] = useState<null | 'capture' | 'library'>(null)
  const [inspoRec, setInspoRec] = useState(false)
  const skipEnter = useRef(false)
  const step = STEPS[cur]
  const reqs = step.requirements(p)
  const ready = reqs.every((r) => r.ok)
  const allDone = p.done.every(Boolean)
  const result = RESULTS[step.key]
  const firstUndone = p.done.findIndex((d) => !d)
  const phase = phaseOf(step.key)
  const versions = useVersions()
  const goKey = (k: string) => { const i = STEPS.findIndex((s) => s.key === k); if (i >= 0) go(i) }
  const saveDemo = () => {
    const note = prompt('這一版改了什麼？（可留空）', '') ?? null
    if (note === null) return
    const name = versions.save(p, note)
    setTimeout(() => alert(`已存成 ${name}。之後改壞了可以在「我的歌」裡回到這一版。`), 0)
  }
  const restore = (id: string) => {
    const v = versions.list.find((x) => x.id === id)
    if (v && confirm(`回到 ${v.name}？目前的內容會被取代（建議先把目前這版也存起來）。`)) setProject(structuredClone(v.project))
  }

  useEffect(() => {
    stopAll()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.querySelector('.node.cur')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    // 從靈感跳過來時，保留大師對那則靈感的旁白，不用章節開場白蓋掉
    if (skipEnter.current) skipEnter.current = false
    else master.notify(step.key, 'step.enter')
  }, [cur]) // eslint-disable-line react-hooks/exhaustive-deps

  const notify = useCallback((kind: string, detail: string) => master.notify(STEPS[cur].key, kind, detail), [master, cur])

  // 不鎖死：任何章節都能進入、回頭修改；只是提示建議順序
  const go = (i: number) => setCur(Math.max(0, Math.min(STEPS.length - 1, i)))
  const complete = () => {
    if (!ready) return
    const done = [...p.done]
    done[cur] = true
    setProject({ ...p, done, unlocked: Math.max(p.unlocked, Math.min(cur + 1, STEPS.length - 1)) })
    setJustLearned({ step: step.key, text: learnedFor(step.key, p) })
    master.notify(step.key, 'step.complete')
    if (result?.available(p)) result.play(p)
  }

  const onAction = (a: AgentAction, apply: boolean) => {
    if (a.type === 'goStep') { const i = STEPS.findIndex((s) => s.key === a.step); if (i >= 0) go(i); return }
    if (a.type === 'playResult') { if (result?.available(p)) result.play(p); return }
    const ch = diatonicChords(p.harmony.root, p.harmony.mode)
    stopAll()
    if (!apply) {
      playLoop({ bpm: p.idea.bpm, bars: a.degs.map((d) => chordVoicing(ch[d])), layers: { drums: false, bass: true, keys: true, pad: false, melody: false } })
      return
    }
    // 學生按「選這個」才寫進作品——由學生決定
    update('harmony', { ...p.harmony, [a.part]: a.degs })
    playChord(chordVoicing(ch[a.degs[0]]))
    master.notify('harmony', 'harmony.progression', a.part)
  }

  const Comp = step.Component
  const doneCount = p.done.filter(Boolean).length

  return (
    <div className="app" ref={topRef}>
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden>♪</span>
          <div>
            <div className="brand-name">Maglody 工作室</div>
            <div className="brand-sub">把靈感、哼唱、詞句拼在一起，邊做邊懂</div>
          </div>
          <button className="btn btn-ghost small sheet-toggle" onClick={() => setSheetOpen(!sheetOpen)}>我的歌</button>
        </div>
        <div className="phases" aria-hidden>
          {PHASES.map((ph) => <span key={ph.name} className={ph === phase ? 'on' : ''} style={{ flexGrow: ph.keys.length }}>{ph.name}</span>)}
        </div>
        <nav className="journey" aria-label="工作檯">
          <div className="journey-line"><div className="journey-fill" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} /></div>
          {STEPS.map((s, i) => (
            <button key={s.key} className={`node ${i === cur ? 'cur' : ''} ${p.done[i] ? 'done' : ''} ${i > p.unlocked ? 'ahead' : ''}`} onClick={() => go(i)} title={s.title}>
              <span className="node-glyph">{p.done[i] ? '✓' : s.glyph}</span>
              <span className="node-label">{s.title}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="layout">
        <main className="main">
          <div className="step-head">
            <div className="step-num">{phase.name} · {phase.hint}</div>
            <h1>{step.title}</h1>
            <p className="muted">{step.subtitle}</p>
          </div>

          {step.key === 'hum' && (
            <div className="start-paths">
              <div className="small muted">今天從哪裡開始？哪一種都行，之後可以東拼西湊。</div>
              <div className="start-row">
                <button className="start-card" onClick={() => document.querySelector('.card .btn-primary')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><strong>哼一段</strong><span>腦中有旋律</span></button>
                <button className="start-card" onClick={() => goKey('lyrics')}><strong>一句詞</strong><span>先有話想說</span></button>
                <button className="start-card" onClick={() => goKey('harmony')}><strong>和弦迴圈</strong><span>先找個氛圍</span></button>
                <button className="start-card" onClick={() => setInspoOpen('library')}><strong>翻本子</strong><span>拿舊靈感來拼</span></button>
              </div>
            </div>
          )}

          {firstUndone >= 0 && firstUndone < cur && !p.done[cur] && (
            <div className="notice">
              跳著做很好，工作室本來就不是直線。「{STEPS[firstUndone].title}」還空著，這一檯有些建議會用到它，想到時再回去就好。
              <button className="btn btn-ghost small" onClick={() => go(firstUndone)}>回到「{STEPS[firstUndone].title}」</button>
            </div>
          )}

          <GentleContext.Provider value={phase.name === '發想'}>
            <Comp p={p} update={update} notify={notify} />
          </GentleContext.Provider>
          <ReaperGuide step={step.key} p={p} />

          <section className="footer-card">
            {result && (
              <div className="result-row">
                <div>
                  <div className="footer-title">這一檯的聲音</div>
                  <div className="muted small">{result.available(p) ? `聽聽看：${result.label}` : '動手之後，這裡就聽得到。'}</div>
                </div>
                <button className="btn btn-primary" disabled={!result.available(p)} onClick={() => { stopAll(); result.play(p) }}>▶ 聽成果</button>
              </div>
            )}
            {justLearned && justLearned.step === step.key && (
              <div className="learned-card"><strong>剛剛你用到了：</strong>{justLearned.text}</div>
            )}
            <div className="footer-title">先有這些就能往下（之後都能改）</div>
            <ul className="reqs">
              {reqs.map((r, i) => (
                <li key={i} className={r.ok ? 'ok' : ''}><span className="tick">{r.ok ? '✓' : '○'}</span>{r.label}</li>
              ))}
            </ul>
            <div className="row wrap between">
              <button className="btn btn-ghost" disabled={cur === 0} onClick={() => go(cur - 1)}>← 上一檯</button>
              <div className="row wrap">
                {!ready && cur < STEPS.length - 1 && <button className="btn btn-ghost small" onClick={() => go(cur + 1)}>先跳過</button>}
                {cur < STEPS.length - 1 ? (
                  p.done[cur] ? (
                    <button className="btn btn-primary btn-lg" onClick={() => go(cur + 1)}>下一檯 →</button>
                  ) : (
                    <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>先這樣，聽聽看</button>
                  )
                ) : (
                  <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>{allDone ? '完成了（還是可以再改）' : '我敢說：完成了'}</button>
                )}
              </div>
            </div>
            {allDone && cur === STEPS.length - 1 && (
              <div className="celebrate">
                <strong>恭喜，你完成了《{p.idea.title || '你的歌'}》！</strong>
                <p>這是你自己寫、自己判斷的歌。回到任何一檯修改，作品面板會跟著更新。下一版會更好。</p>
              </div>
            )}
          </section>

          <div className="danger-zone">
            <button className="btn btn-ghost small" onClick={() => { if (confirm('確定要清除整個專案、從頭開始嗎？')) { reset(); setCur(0); setJustLearned(null) } }}>重新開始一首新歌</button>
            <span className="muted small">進度自動儲存在這台裝置的瀏覽器中。</span>
          </div>
        </main>

        <aside className={`aside ${sheetOpen ? 'open' : ''}`}>
          <div className="aside-inner">
            <div className="row between">
              <div className="aside-title">我的歌（一路長出來）</div>
              <button className="icon-btn sheet-close" onClick={() => setSheetOpen(false)} aria-label="關閉">✕</button>
            </div>
            <SongSheet p={p} />
            <div className="versions">
              <div className="row between">
                <strong className="small">Demo 版本</strong>
                <button className="btn btn-ghost small" onClick={saveDemo}>存成新的一版</button>
              </div>
              {versions.list.length === 0 && <p className="muted small">改稿前先存一版，改壞了就回來。</p>}
              {versions.list.map((v) => (
                <div key={v.id} className="version">
                  <div><strong>{v.name}</strong> <span className="muted small">{new Date(v.at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>{v.note && <div className="small">{v.note}</div>}</div>
                  <div className="row">
                    <button className="btn btn-ghost small" onClick={() => { stopAll(); playDemo(v.project) }}>▶</button>
                    <button className="btn btn-ghost small" onClick={() => restore(v.id)}>回到這版</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
        {sheetOpen && <div className="scrim" onClick={() => setSheetOpen(false)} />}
      </div>

      <InspirationHub api={inspo} p={p} update={update} step={step.key} stepTitle={step.title}
        onGo={(k) => { const i = STEPS.findIndex((s) => s.key === k); if (i >= 0 && i !== cur) { skipEnter.current = true; go(i) } }}
        onEvent={(kind, detail) => master.notify(step.key, kind, detail)}
        open={inspoOpen} setOpen={setInspoOpen} onRecordingChange={setInspoRec} />
      <MasterPanel step={step.key} messages={master.messages} busy={master.busy} onAsk={(q) => master.ask(step.key, q)} onAction={onAction}
        onPlayResult={demoAvailable(p) ? () => { stopAll(); playDemo(p) } : undefined}
        onInspire={() => setInspoOpen('capture')} recordingIdea={inspoRec} />
    </div>
  )
}
