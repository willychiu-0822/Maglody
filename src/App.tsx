import { useEffect, useRef, useState } from 'react'
import { useProject } from './lib/store'
import { stopAll } from './lib/audio'
import { SongSheet } from './components/SongSheet'
import { humStep } from './steps/Hum'
import { ideationStep } from './steps/Ideation'
import { lyricsStep } from './steps/Lyrics'
import { harmonyStep } from './steps/Harmony'
import { melodyStep } from './steps/Melody'
import { arrangementStep } from './steps/Arrangement'
import { recordingStep } from './steps/Recording'
import { mixStep } from './steps/Mix'
import { reviewStep } from './steps/Review'
import type { StepDef } from './steps/types'

const STEPS: StepDef[] = [humStep, ideationStep, lyricsStep, harmonyStep, melodyStep, arrangementStep, recordingStep, mixStep, reviewStep]

export default function App() {
  const { project: p, setProject, update, reset } = useProject()
  const [cur, setCur] = useState(() => Math.min(p.unlocked, STEPS.length - 1))
  const [sheetOpen, setSheetOpen] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const step = STEPS[cur]
  const reqs = step.requirements(p)
  const ready = reqs.every((r) => r.ok)
  const allDone = p.done.every(Boolean)

  useEffect(() => {
    stopAll()
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [cur])

  const go = (i: number) => { if (i <= p.unlocked) setCur(i) }
  const complete = () => {
    if (!ready) return
    const done = [...p.done]
    done[cur] = true
    setProject({ ...p, done, unlocked: Math.max(p.unlocked, Math.min(cur + 1, STEPS.length - 1)) })
    if (cur < STEPS.length - 1) setCur(cur + 1)
  }
  const Comp = step.Component
  const doneCount = p.done.filter(Boolean).length

  return (
    <div className="app" ref={topRef}>
      <header className="top">
        <div className="brand">
          <span className="logo" aria-hidden>♪</span>
          <div>
            <div className="brand-name">Music Lab 新手音樂工作室</div>
            <div className="brand-sub">跟著老師，從一段哼唱完成你的第一首歌</div>
          </div>
          <button className="btn btn-ghost small sheet-toggle" onClick={() => setSheetOpen(!sheetOpen)}>我的歌</button>
        </div>
        <nav className="journey" aria-label="創作旅程">
          <div className="journey-line"><div className="journey-fill" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} /></div>
          {STEPS.map((s, i) => {
            const locked = i > p.unlocked
            return (
              <button
                key={s.key}
                className={`node ${i === cur ? 'cur' : ''} ${p.done[i] ? 'done' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => go(i)}
                disabled={locked}
                title={locked ? '完成上一章後解鎖' : s.title}
              >
                <span className="node-glyph">{locked ? '鎖' : s.glyph}</span>
                <span className="node-label">{s.title}</span>
              </button>
            )
          })}
        </nav>
      </header>

      <div className="layout">
        <main className="main">
          <div className="step-head">
            <div className="step-num">第 {cur + 1} 章 / {STEPS.length}</div>
            <h1>{step.title}</h1>
            <p className="muted">{step.subtitle}</p>
          </div>
          <Comp p={p} update={update} />

          <section className="footer-card">
            <div className="footer-title">本章完成條件</div>
            <ul className="reqs">
              {reqs.map((r, i) => (
                <li key={i} className={r.ok ? 'ok' : ''}><span className="tick">{r.ok ? '✓' : '○'}</span>{r.label}</li>
              ))}
            </ul>
            <div className="row wrap between">
              <button className="btn btn-ghost" disabled={cur === 0} onClick={() => go(cur - 1)}>← 上一章</button>
              {cur < STEPS.length - 1 ? (
                <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>
                  {p.done[cur] ? '前往下一章 →' : '完成本章，繼續旅程 →'}
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" disabled={!ready} onClick={complete}>{allDone ? '已完成！可以繼續修改' : '完成我的第一首歌'}</button>
              )}
            </div>
            {allDone && cur === STEPS.length - 1 && (
              <div className="celebrate">
                <strong>恭喜，你完成了《{p.idea.title || '你的歌'}》！</strong>
                <p>這是你自己寫、自己判斷的歌。回到任何一章修改，作品面板會跟著更新。下一版會更好。</p>
              </div>
            )}
          </section>

          <div className="danger-zone">
            <button className="btn btn-ghost small" onClick={() => { if (confirm('確定要清除整個專案、從頭開始嗎？')) { reset(); setCur(0) } }}>重新開始一首新歌</button>
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
    </div>
  )
}
