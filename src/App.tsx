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
import { RESULTS } from './steps/results'
import type { StepDef } from './steps/types'

// 一條龍：哼唱 → 構想 → 和弦 → 旋律 → 詞 → 編曲 → 錄音 → 混音 → 檢討
const STEPS: StepDef[] = [humStep, ideationStep, harmonyStep, melodyStep, lyricsStep, arrangementStep, recordingStep, mixStep, reviewStep]

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
  const step = STEPS[cur]
  const reqs = step.requirements(p)
  const ready = reqs.every((r) => r.ok)
  const allDone = p.done.every(Boolean)
  const result = RESULTS[step.key]
  const firstUndone = p.done.findIndex((d) => !d)

  useEffect(() => {
    stopAll()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.querySelector('.node.cur')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    master.notify(step.key, 'step.enter')
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
            <div className="brand-name">Maglody 新手音樂工作室</div>
            <div className="brand-sub">跟著大師，從一段哼唱完成你的第一首歌</div>
          </div>
          <button className="btn btn-ghost small sheet-toggle" onClick={() => setSheetOpen(!sheetOpen)}>我的歌</button>
        </div>
        <nav className="journey" aria-label="創作旅程">
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
            <div className="step-num">第 {cur + 1} 章 / {STEPS.length}</div>
            <h1>{step.title}</h1>
            <p className="muted">{step.subtitle}</p>
          </div>

          {firstUndone >= 0 && firstUndone < cur && !p.done[cur] && (
            <div className="notice">
              你先跳來看看「{step.title}」也沒關係，創作本來就不是直線。不過「{STEPS[firstUndone].title}」還沒完成，這章的一些建議會用到它。
              <button className="btn btn-ghost small" onClick={() => go(firstUndone)}>回到「{STEPS[firstUndone].title}」</button>
            </div>
          )}

          <Comp p={p} update={update} notify={notify} />
          <ReaperGuide step={step.key} p={p} />

          <section className="footer-card">
            {result && (
              <div className="result-row">
                <div>
                  <div className="footer-title">本章成果</div>
                  <div className="muted small">{result.available(p) ? `聽聽看：${result.label}` : '動手之後，這裡就能聽到你的歌長到哪裡了。'}</div>
                </div>
                <button className="btn btn-primary" disabled={!result.available(p)} onClick={() => { stopAll(); result.play(p) }}>▶ 聽成果</button>
              </div>
            )}
            {justLearned && justLearned.step === step.key && (
              <div className="learned-card"><strong>這一章你學到：</strong>{justLearned.text}</div>
            )}
            <div className="footer-title">本章完成條件</div>
            <ul className="reqs">
              {reqs.map((r, i) => (
                <li key={i} className={r.ok ? 'ok' : ''}><span className="tick">{r.ok ? '✓' : '○'}</span>{r.label}</li>
              ))}
            </ul>
            <div className="row wrap between">
              <button className="btn btn-ghost" disabled={cur === 0} onClick={() => go(cur - 1)}>← 上一章</button>
              <div className="row wrap">
                {!ready && cur < STEPS.length - 1 && <button className="btn btn-ghost small" onClick={() => go(cur + 1)}>先跳過，之後回來</button>}
                {cur < STEPS.length - 1 ? (
                  p.done[cur] ? (
                    <button className="btn btn-primary btn-lg" onClick={() => go(cur + 1)}>前往下一章 →</button>
                  ) : (
                    <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>完成本章，聽聽成果</button>
                  )
                ) : (
                  <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>{allDone ? '已完成！可以繼續修改' : '完成我的第一首歌'}</button>
                )}
              </div>
            </div>
            {allDone && cur === STEPS.length - 1 && (
              <div className="celebrate">
                <strong>恭喜，你完成了《{p.idea.title || '你的歌'}》！</strong>
                <p>這是你自己寫、自己判斷的歌。回到任何一章修改，作品面板會跟著更新。下一版會更好。</p>
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
          </div>
        </aside>
        {sheetOpen && <div className="scrim" onClick={() => setSheetOpen(false)} />}
      </div>

      <MasterPanel step={step.key} messages={master.messages} busy={master.busy} onAsk={(q) => master.ask(step.key, q)} onAction={onAction}
        onPlayResult={result?.available(p) ? () => { stopAll(); result.play(p) } : undefined} />
    </div>
  )
}
