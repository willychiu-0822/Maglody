import { Modal } from './components/Modal'
import { StudioPresence } from './components/StudioPresence'
import { KnowledgeSpark } from './components/KnowledgeSpark'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useProject } from './lib/store'
import { playChord, playLoop, stopAll } from './lib/audio'
import { chordVoicing, diatonicChords } from './lib/theory'
import { useVersions } from './lib/versions'
import { SongSheet } from './components/SongSheet'
import { ReaperGuide } from './components/ReaperGuide'
import { MasterPanel } from './components/MasterPanel'
import { GentleContext, WhisperContext } from './components/ui'
import { useMaster } from './agent/useMaster'
import { DESK_ROLE, ROLES, type RoleId } from './agent/roles'
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
import { demoAvailable, playDemo } from './steps/results'
import { InspirationHub } from './inspire/InspirationHub'
import { useInspirations } from './inspire/store'
import type { StepDef } from './steps/types'

// 工作室：發想 → 成形 → 打磨。每一檯都能隨時進出，沒有關卡。
const STEPS: StepDef[] = [humStep, ideationStep, harmonyStep, melodyStep, lyricsStep, arrangementStep, recordingStep, mixStep, reviewStep]
const PHASES = [
  { name: '發想', note: '找到一顆歌的種子', keys: ['hum', 'idea'] },
  { name: '成形', note: '讓聲音長出形狀', keys: ['harmony', 'melody', 'lyrics', 'arrange'] },
  { name: '打磨', note: '留下自己的第一版', keys: ['record', 'mix', 'review'] },
]

export default function App() {
  const { project: p, setProject, update, reset, storageError } = useProject()
  const [cur, setCur] = useState(() => Math.min(p.unlocked, STEPS.length - 1))
  const [menu, setMenu] = useState(false)
  const [chat, setChat] = useState<RoleId | null>(null)
  const [chatRole, setChatRole] = useState<RoleId>('producer')
  const [inspoOpen, setInspoOpen] = useState<null | 'capture' | 'library'>(null)
  const [inspoRec, setInspoRec] = useState(false)
  const pRef = useRef(p)
  pRef.current = p
  const getProject = useCallback(() => pRef.current, [])
  const master = useMaster(getProject)
  const inspo = useInspirations()
  const versions = useVersions()
  const skipEnter = useRef(false)
  const step = STEPS[cur]
  const [entry, setEntry] = useState(() => ({ step: step.key, messageIds: new Set<string>() }))
  const role = ROLES[DESK_ROLE[step.key]]
  const requirements = step.requirements(p)
  const unfinished = requirements.find((r) => !r.ok)
  const ready = !unfinished
  const phase = PHASES.find((ph) => ph.keys.includes(step.key))!

  useEffect(() => {
    stopAll()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // History drops old messages once full; array offsets cannot mark a desk entry.
    setEntry({ step: step.key, messageIds: new Set(master.messages.map(m => m.id)) })
    // 進場不再說開場白：角色登場那一句＋這一檯自己的一句話就夠了
    skipEnter.current = false
  }, [cur]) // eslint-disable-line react-hooks/exhaustive-deps

  // 這一檯的夥伴最近說的一句話（只取進入這一檯之後的）
  // 夥伴的話只停留 14 秒，之後讓位給這一檯當下該做的事
  const [, tick] = useState(0)
  const latestRaw = entry.step === step.key ? master.messages.filter((m) => !entry.messageIds.has(m.id) && m.role === 'master' && m.step === step.key && m.role_id === role.id).pop() : undefined
  const latest = latestRaw && Date.now() - (latestRaw.at ?? 0) < 14000 ? latestRaw : undefined
  useEffect(() => {
    if (!latest) return
    const t = window.setTimeout(() => tick((x) => x + 1), 14000 - (Date.now() - (latest.at ?? 0)))
    return () => clearTimeout(t)
  }, [latest])
  const whisper = latest ? latest.text || latest.reply?.learned || null : null
  const speaker = latest?.role_id ? ROLES[latest.role_id as RoleId] : role

  const notify = useCallback((kind: string, detail: string) => master.notify(STEPS[cur].key, kind, detail), [master, cur])
  const go = (i: number) => { setMenu(false); setCur(Math.max(0, Math.min(STEPS.length - 1, i))) }
  const goKey = (k: string) => { const i = STEPS.findIndex((s) => s.key === k); if (i >= 0) go(i) }

  // 前進按鈕只在這一檯「做完」時才出現（由各檯放在主動作的位置）
  const nextStep = STEPS[cur + 1]
  const next = ready && nextStep ? {
    label: nextStep.title,
    go: () => {
      const done = [...p.done]
      done[cur] = true
      setProject({ ...p, done, unlocked: Math.max(p.unlocked, cur + 1) })
      skipEnter.current = true
      master.notify(step.key, 'step.complete')
      setCur(cur + 1)
    },
  } : null

  const onAction = (a: AgentAction, apply: boolean) => {
    if (a.type === 'goStep') { setChat(null); goKey(a.step); return }
    if (a.type === 'playResult') { stopAll(); playDemo(p); return }
    const ch = diatonicChords(p.harmony.root, p.harmony.mode)
    stopAll()
    if (!apply) {
      playLoop({ bpm: p.idea.bpm, bars: a.degs.map((d) => chordVoicing(ch[d])), layers: { drums: false, bass: true, keys: true, pad: false, melody: false } })
      return
    }
    update('harmony', { ...p.harmony, [a.part]: a.degs })
    playChord(chordVoicing(ch[a.degs[0]]))
  }

  const openChat = (r: RoleId) => { setChatRole(r); setChat(r) }
  const saveDemo = () => {
    const note = prompt('這一版改了什麼？（可留空）', '')
    if (note === null) return
    try { const name = versions.save(p, note); setTimeout(() => alert(`存好了：${name}`), 0) }
    catch { alert('這版還沒存好，作品仍留在這頁。請釋出瀏覽器空間後再試。') }
  }
  const Comp = step.Component

  return (
    <div className="app studio">
      <header className="top-min">
        <button className="desk-name" onClick={() => setMenu(true)} aria-label="打開工作室選單">
          <span className="brand-mark">Maglody</span>　{step.title} <span aria-hidden>▾</span>
        </button>
        <button className={`sticker ${inspoRec ? 'rec' : ''}`} onClick={() => setInspoOpen('capture')} aria-label="記一下靈感">
        <span className="sticker-label"><span aria-hidden>✎</span> {inspoRec ? '錄音中' : '記一下'}</span>
        <small>{inspoRec ? '靈感先留在這裡' : '文字 · 哼唱'}</small>
      </button>
      </header>

      {storageError && <p className="storage-notice" role="status">這首歌還沒存進瀏覽器，請先留在這頁。釋出儲存空間後，再改一個字就會重試。</p>}
      <main className="desk" key={step.key}>
        <div className="studio-corner">
        <StudioPresence role={role} whisper={whisper ? `${speaker.id !== role.id ? speaker.name + '：' : ''}${whisper}` : null} busy={master.isBusy(step.key, role.id)} onChat={() => openChat(role.id)} />
        <div className="song-trail" aria-label="歌曲手記">
          <p className="trail-title">{p.idea.title ? `《${p.idea.title}》的手記` : '我們的第一首歌'}</p>
          <div className="desk-mission" role="status" aria-label="當下的小任務" data-ready={ready}>
            <span className="mission-kicker">現在的小任務 · {role.name}陪你</span>
            <strong>{unfinished ? unfinished.label : nextStep ? `這一頁準備好了，可以去${nextStep.title}` : '留下了自己的判斷，這一版由你決定'}</strong>
          </div>
          <ul>{[
            { name: '一句靈感', kept: !!p.idea.hook.trim() },
            { name: '和弦', kept: [...p.harmony.verse, ...p.harmony.chorus].some(n => n != null) },
            { name: '旋律', kept: [...p.melody.verse, ...p.melody.chorus].some(n => n != null && n >= 0) },
            { name: '歌詞', kept: p.lyrics.some(s => s.text.trim()) },
          ].map(item => <li key={item.name} data-kept={item.kept}><span aria-hidden="true">{item.kept ? '✓' : '◦'}</span> {item.name}<span className="sr-only">{item.kept ? '已留下' : '還在醞釀'}</span></li>)}</ul>
        </div>
        </div>
        <section className="workpage" aria-label={`${step.title}創作紙頁`}>
        <div className="page-caption"><span>冒險手記 · {phase.name}篇</span><span>第 {cur + 1} 頁</span></div>
        <WhisperContext.Provider value={whisper}>
          <GentleContext.Provider value={phase.name === '發想'}>
            <Comp goTo={goKey} p={p} update={update} notify={notify} next={next} />
            <KnowledgeSpark step={step.key} p={p} />
          </GentleContext.Provider>
        </WhisperContext.Provider>
        </section>
      </main>


      {menu && (
        <Modal label="工作室" className="menu-sheet" onClose={() => setMenu(false)}>
            <div className="row between"><strong className="menu-title">工作室</strong><button className="link-btn modal-capture" onClick={() => setInspoOpen('capture')}>✎ 記一下</button><button className="icon-btn" onClick={() => setMenu(false)} aria-label="關閉">✕</button></div>
            <nav className="studio-map" aria-label="創作地圖">
            <div className="map-intro"><p>一首歌的探險地圖</p><span>可以跳著走，隨時回來。每一檯，都有人陪你。</span></div>
            <div className="map-regions">
            {PHASES.map((ph, phaseIndex) => (
              <div key={ph.name} className="map-region" data-phase={phaseIndex}>
                <div className="map-region-heading"><span aria-hidden="true">0{phaseIndex + 1}</span><div><strong>{ph.name}</strong><small>{ph.note}</small></div></div>
                <div className="map-stops">
                {ph.keys.map((k) => {
                  const i = STEPS.findIndex((s) => s.key === k)
                  const companion = ROLES[DESK_ROLE[k]]
                  return (
                    <button key={k} className={`menu-desk map-stop ${i === cur ? 'on' : ''}`} aria-current={i === cur ? 'location' : undefined} onClick={() => go(i)}>
                      <img src={`/studio/roles/${companion.id}.webp`} alt="" width="40" height="48" />
                      <span className="map-stop-copy"><span>{STEPS[i].title}</span><small>{companion.name}陪你</small></span>
                      <span className="map-stop-mark">{i === cur ? '你在這裡' : p.done[i] ? '留過足跡' : '隨時來坐'}</span>
                    </button>
                  )
                })}
                </div>
              </div>
            ))}
            </div>
            </nav>
            <div className="menu-phase">
              <div className="menu-phase-name">我的歌</div>
              {demoAvailable(p) && <button className="menu-desk" onClick={() => { setMenu(false); stopAll(); playDemo(p) }}><span>▶ 聽目前的 Demo</span></button>}
              <button className="menu-desk" onClick={() => { setMenu(false); setInspoOpen('library') }}><span>翻翻靈感本子</span><span className="muted small">{inspo.list.length}</span></button>
              <button className="menu-desk" onClick={() => { setMenu(false); openChat(role.id) }}><span>跟夥伴聊聊</span></button>
              <details className="menu-more">
                <summary>更多</summary>
                <SongSheet p={p} />
                <div className="versions">
                  <button className="btn small" onClick={saveDemo}>存成新的一版</button>
                  {versions.list.map((v) => (
                    <div key={v.id} className="version">
                      <span><strong>{v.name}</strong> <span className="muted small">{v.note}</span></span>
                      <span className="row">
                        <button className="btn btn-ghost small" onClick={() => { stopAll(); playDemo(v.project) }}>▶</button>
                        <button className="btn btn-ghost small" onClick={() => { if (confirm(`回到 ${v.name}？`)) setProject(structuredClone(v.project)) }}>回到這版</button>
                      </span>
                    </div>
                  ))}
                </div>
                <ReaperGuide step={['arrange', 'record', 'mix'].includes(step.key) ? step.key : 'arrange'} p={p} />
                <button className="btn btn-ghost small" onClick={() => { if (confirm('清掉這首歌、重新開始？（靈感本子會保留）')) { master.clear(); reset(); setCur(0); setMenu(false) } }}>重新開始一首新歌</button>
              </details>
            </div>
        </Modal>
      )}

      <InspirationHub api={inspo} p={p} update={update} step={step.key} stepTitle={step.title}
        onGo={(k) => { const i = STEPS.findIndex((s) => s.key === k); if (i >= 0 && i !== cur) { skipEnter.current = true; go(i) } }}
        onEvent={(kind, detail) => master.notify(step.key, kind, detail)}
        open={inspoOpen} setOpen={setInspoOpen} onRecordingChange={setInspoRec} />

      <MasterPanel key={master.session} open={!!chat} roleId={chatRole} setRoleId={setChatRole} onCapture={() => setInspoOpen('capture')} onClose={() => setChat(null)} step={step.key}
        messages={master.messages} busy={master.isBusy(step.key, chatRole)} onAsk={(q, r) => master.ask(step.key, q, r)} onAction={onAction} />
    </div>
  )
}
