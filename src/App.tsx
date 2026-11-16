import { SongMaterials } from './components/SongMaterials'
import type { ProjectDecision } from './components/ProjectDialog'
import { Modal } from './components/Modal'
import { StudioPresence } from './components/StudioPresence'
import { KnowledgeSpark } from './components/KnowledgeSpark'
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { useProject } from './lib/store'
import { useMidiLab } from './lib/lab'
import { playChord, playLoop, stopAll } from './lib/audio'
import { chordVoicing, diatonicChords } from './lib/theory'
import { useVersions } from './lib/versions'
import { GentleContext, WhisperContext } from './components/ui'
import { useMaster } from './agent/useMaster'
import { DESK_ROLE, ROLES, type RoleId } from './agent/roles'
import type { AgentAction } from './agent/types'
import { downloadBackup, parseBackup } from './lib/backup'
import { agentMode } from './agent/client'
import { STEPS } from './steps/registry'

// 少用的面板：用到才下載，縮小首包
const InspirationHub = lazy(() => import('./inspire/InspirationHub').then(m => ({ default: m.InspirationHub })))
const ProjectDialog = lazy(() => import('./components/ProjectDialog').then(m => ({ default: m.ProjectDialog })))
const SongSheet = lazy(() => import('./components/SongSheet').then(m => ({ default: m.SongSheet })))
const ReaperGuide = lazy(() => import('./components/ReaperGuide').then(m => ({ default: m.ReaperGuide })))
const MasterPanel = lazy(() => import('./components/MasterPanel').then(m => ({ default: m.MasterPanel })))
import { demoAvailable, playDemo } from './steps/results'
import { asset } from './lib/asset'
import { useInspirations } from './inspire/store'
import { deskPrerequisite } from './rules/requirements'
import type { DeskKey } from '../server/shared/names.ts'

const SAVE_NOTE_KEY = 'maglody-save-note-seen'
const DESK_KEY = 'maglody-current-desk'

/**
 * 重新整理後回到剛才那一檯（記在這個分頁的 sessionStorage）。
 * 只在存檔進度（unlocked）沒變的時候採用；進度被別處改過（換分頁、還原備份），就照存檔的進度走。
 */
function startDesk(unlocked: number): number {
  const fallback = Math.min(unlocked, STEPS.length - 1)
  try {
    const saved = JSON.parse(sessionStorage.getItem(DESK_KEY) ?? 'null') as { desk?: unknown; unlocked?: unknown } | null
    if (saved && saved.unlocked === unlocked && Number.isInteger(saved.desk) && (saved.desk as number) >= 0 && (saved.desk as number) < STEPS.length) return saved.desk as number
  } catch { /* 讀不到就照進度走 */ }
  return fallback
}

// 工作室：發想 → 成形 → 打磨。每一檯都能隨時進出，沒有關卡。
const PHASES = [
  { name: '發想', note: '找到一顆歌的種子', keys: ['hum', 'idea'] },
  { name: '成形', note: '讓聲音長出形狀', keys: ['harmony', 'melody', 'lyrics', 'arrange'] },
  { name: '打磨', note: '留下自己的第一版', keys: ['record', 'mix', 'review'] },
]

export default function App() {
  const { project: p, setProject, update, reset, storageError } = useProject()
  // 一進工作室就記住實驗開關，不必先走到旋律檯或總檢討。
  useMidiLab()
  const [cur, setCur] = useState(() => startDesk(p.unlocked))
  const [menu, setMenu] = useState(false)
  const [chat, setChat] = useState<RoleId | null>(null)
  const [chatRole, setChatRole] = useState<RoleId>('producer')
  const [chatSeen, setChatSeen] = useState(false)
  const [inspoSeen, setInspoSeen] = useState(false)
  if (chat && !chatSeen) setChatSeen(true)
  const [inspoOpen, setInspoOpen] = useState<null | 'capture' | 'library'>(null)
  if (inspoOpen && !inspoSeen) setInspoSeen(true)
  // 快捷鍵：Alt + I 隨時記靈感（桌面）；靈感面板第一次打開才下載，所以快捷鍵放在這裡
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); setInspoOpen('capture') } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
  const [inspoRec, setInspoRec] = useState(false)
  const pRef = useRef(p)
  pRef.current = p
  const getProject = useCallback(() => pRef.current, [])
  const master = useMaster(getProject)
  const inspo = useInspirations()
  const versions = useVersions()
  const [projectDecision, setProjectDecision] = useState<ProjectDecision | null>(null)
  const importInput = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')
  const [saveNote, setSaveNote] = useState(false)
  const step = STEPS[cur]
  const [entry, setEntry] = useState(() => ({ step: step.key, messageIds: new Set<string>() }))
  const role = ROLES[DESK_ROLE[step.key as DeskKey]]
  const requirements = step.requirements(p)
  const unfinished = requirements.find((r) => !r.ok)
  const ready = !unfinished
  const phase = PHASES.find((ph) => ph.keys.includes(step.key))!
  const missionPrerequisite = deskPrerequisite(step.key, p)

  useEffect(() => {
    try { sessionStorage.setItem(DESK_KEY, JSON.stringify({ desk: cur, unlocked: pRef.current.unlocked })) } catch { /* 沒有就算了 */ }
    stopAll()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // History drops old messages once full; array offsets cannot mark a desk entry.
    setEntry({ step: step.key, messageIds: new Set(master.messages.map(m => m.id)) })
  }, [cur]) // eslint-disable-line react-hooks/exhaustive-deps

  // 這一檯的夥伴最近說的一句話（只取進入這一檯之後的）
  // 夥伴的話留到你做下一個動作（有新的回應）或離開這一檯為止，不會自己消失
  const latest = entry.step === step.key ? master.messages.filter((m) => !entry.messageIds.has(m.id) && m.role === 'master' && m.step === step.key && m.role_id === role.id).pop() : undefined
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
      master.notify(step.key, 'step.complete')
      setCur(cur + 1)
      // 第一次走到下一檯，歌已經存下來了：用夥伴的口吻說一次存在哪裡
      try { if (!storageError && !localStorage.getItem(SAVE_NOTE_KEY)) setSaveNote(true) } catch { /* 讀不到就不說 */ }
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

  const onPickBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    const result = parseBackup(await file.text().catch(() => ''))
    if (!result.ok) { setImportError(result.reason); return }
    setProjectDecision({ kind: 'import', project: result.project, fileName: file.name })
  }

  const openChat = (r: RoleId) => { setChatRole(r); setChat(r) }
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

      {inspoSeen && <Suspense fallback={null}><InspirationHub api={inspo} p={p} update={update} step={step.key} stepTitle={step.title}
        onGo={(k) => { const i = STEPS.findIndex((s) => s.key === k); if (i >= 0 && i !== cur) go(i) }}
        onEvent={(kind, detail) => master.notify(step.key, kind, detail)}
        open={inspoOpen} setOpen={setInspoOpen} onRecordingChange={setInspoRec} /></Suspense>}

      {storageError && <div className="storage-notice" role="status"><span>這首歌還沒存好，先別離開這頁。騰出瀏覽器的儲存空間，再按「再存一次」。</span><button className="btn" onClick={() => setProject({ ...p })}>再存一次</button></div>}
      {saveNote && !storageError && <div className="toast" role="status"><span>{role.name}：歌是存在這支手機的瀏覽器裡的。換手機或清掉瀏覽資料就沒了，想保險的話，到選單「更多」存一份備份。</span><button className="btn notice-ack" onClick={() => { try { localStorage.setItem(SAVE_NOTE_KEY, '1') } catch { /* 存不進去，下次再說一次也無妨 */ } setSaveNote(false) }}>好</button></div>}
      <main className="desk" key={step.key}>
        <div className="studio-corner">
        <StudioPresence role={role} whisper={whisper ? `${speaker.id !== role.id ? speaker.name + '：' : ''}${whisper}` : null} busy={master.isBusy(step.key, role.id)} onChat={() => openChat(role.id)} />
        <div className="song-trail" aria-label="歌曲手記">
          <p className="trail-title">{p.idea.title ? `《${p.idea.title}》的手記` : '我們的第一首歌'}</p>
          <div className="desk-mission" role="status" aria-label="當下的小任務" data-ready={ready && !missionPrerequisite}>
            <span className="mission-kicker">現在的小任務 · {role.name}陪你</span>
            <strong>{missionPrerequisite ?? (unfinished ? unfinished.label : nextStep ? `這一頁準備好了，可以去${nextStep.title}` : '留下了自己的判斷，這一版由你決定')}</strong>
          </div>
          <ul>{[
            { name: '一句話', kept: !!p.idea.hook.trim() },
            { name: '和弦', kept: [...p.harmony.verse, ...p.harmony.chorus].some(n => n != null) },
            { name: '旋律', kept: [...p.melody.verse, ...p.melody.chorus].some(n => n != null && n >= 0) },
            { name: '歌詞', kept: p.lyrics.some(s => s.text.trim()) },
          ].map(item => <li key={item.name} data-kept={item.kept}><span aria-hidden="true">{item.kept ? '✓' : '◦'}</span> {item.name}<span className="sr-only">{item.kept ? '已留下' : '還在醞釀'}</span></li>)}</ul>
          <SongMaterials p={p} />
        </div>
        </div>
        <section className="workpage" aria-label={`「${step.title}」的紙頁`}>
        <div className="page-caption"><span>工作室 · {phase.name}篇</span><span>第 {cur + 1} 頁</span></div>
        <WhisperContext.Provider value={whisper}>
          <GentleContext.Provider value={phase.name === '發想'}>
            <Suspense fallback={<p className="desk-loading" role="status">桌面攤開中……</p>}><Comp goTo={goKey} p={p} update={update} notify={notify} next={next} /></Suspense>
            <KnowledgeSpark step={step.key} p={p} role={role} />
          </GentleContext.Provider>
        </WhisperContext.Provider>
        </section>
      </main>


      {menu && (
        <Modal label="工作室" className="menu-sheet" onClose={() => setMenu(false)}>
            <div className="row between"><strong className="menu-title">工作室</strong><button className="link-btn modal-capture" onClick={() => setInspoOpen('capture')}>✎ 記一下</button><button className="icon-btn" onClick={() => setMenu(false)} aria-label="關閉">✕</button></div>
            <button className="primary-action menu-return" onClick={() => setMenu(false)}>回到{step.title}，繼續創作</button>
            <nav className="studio-map" aria-label="創作地圖">
            <div className="map-intro"><p>一首歌的工作室地圖</p><span>可以跳著走，隨時回來。每一檯，都有人陪你。</span></div>
            <div className="map-regions">
            {PHASES.map((ph, phaseIndex) => (
              <div key={ph.name} className="map-region" data-phase={phaseIndex}>
                <div className="map-region-heading"><span aria-hidden="true">0{phaseIndex + 1}</span><div><strong>{ph.name}</strong><small>{ph.note}</small></div></div>
                <div className="map-stops">
                {ph.keys.map((k) => {
                  const i = STEPS.findIndex((s) => s.key === k)
                  const companion = ROLES[DESK_ROLE[k as DeskKey]]
                  return (
                    <button key={k} className={`menu-desk map-stop ${i === cur ? 'on' : ''}`} aria-current={i === cur ? 'location' : undefined} onClick={() => go(i)}>
                      <img src={asset(`/studio/roles/${companion.id}.webp`)} alt="" width="40" height="48" />
                      <span className="map-stop-copy"><span>{STEPS[i].title}</span><small>{companion.label}</small></span>
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
                <Suspense fallback={null}><SongSheet p={p} /></Suspense>
                <div className="versions">
                  <div className="row wrap">
                    <button className="btn small" onClick={() => downloadBackup(p)}>存一份備份</button>
                    <button className="btn btn-ghost small" onClick={() => importInput.current?.click()}>打開備份檔</button>
                    <input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="選擇備份檔" onChange={onPickBackup} />
                  </div>
                  {importError && <p className="small" role="status">{importError}</p>}
                  <button className="btn small" onClick={() => setProjectDecision({ kind: 'save' })}>存成新的一版</button>
                  {versions.list.map((v) => (
                    <div key={v.id} className="version">
                      <span><strong>{v.name}</strong> <span className="muted small">{v.note}</span></span>
                      <span className="row">
                        <button className="btn btn-ghost small" aria-label={`試聽 ${v.name}`} onClick={() => { stopAll(); playDemo(v.project) }}>▶</button>
                        <button className="btn btn-ghost small" onClick={() => setProjectDecision({ kind: 'restore', version: v })}>回到這版</button>
                        <button className="btn btn-ghost small" aria-label={`刪掉 ${v.name}`} onClick={() => setProjectDecision({ kind: 'remove', version: v })}>刪掉</button>
                      </span>
                    </div>
                  ))}
                </div>
                <details className="data-note">
                  <summary>你的東西放在哪</summary>
                  <p>歌、靈感和錄音都存在這支裝置的瀏覽器裡，沒有放到網路上。換手機、或清掉瀏覽資料，它們就不見了，想保險就先存一份備份。</p>
                  <p>用「說」記靈感時，是請瀏覽器的語音辨識幫忙打成字，聲音可能會經過瀏覽器供應商的語音服務。想完全留在手機裡，選「只錄音」就好。</p>
                  <p>{agentMode() === 'llm' ? '這個版本接了線上夥伴：跟夥伴聊天時，歌的文字摘要（和弦、旋律、你寫的詞和問的話）會送到夥伴的伺服器和模型供應商；錄音和照片不會。' : '夥伴現在是離線的，聊天內容不會送到任何地方。'}</p>
                </details>
                <Suspense fallback={null}><ReaperGuide step={['arrange', 'record', 'mix'].includes(step.key) ? step.key : 'arrange'} p={p} /></Suspense>
                <button className="btn btn-ghost small" onClick={() => setProjectDecision({ kind: 'reset' })}>重新開始一首新歌</button>
              </details>
            </div>
        </Modal>
      )}



      {projectDecision && <Suspense fallback={null}><ProjectDialog decision={projectDecision} project={p} full={versions.list.length >= 20 ? versions.list[versions.list.length - 1].name : null} onRemove={v => versions.remove(v.id)} onSave={note => versions.save(p, note)}
        onRestore={v => { stopAll(); master.clear(); setProject(structuredClone(v.project)) }}
        onReset={() => { stopAll(); master.clear(); reset(); setCur(0); setMenu(false) }}
        onImport={imported => { versions.save(p, '打開備份前'); stopAll(); master.clear(); setProject(imported); setCur(Math.min(imported.unlocked, STEPS.length - 1)); setMenu(false) }}
        onCapture={() => setInspoOpen('capture')} onClose={() => setProjectDecision(null)} /></Suspense>}

      {chatSeen && <Suspense fallback={null}><MasterPanel key={master.session} p={p} open={!!chat} roleId={chatRole} setRoleId={setChatRole} onCapture={() => setInspoOpen('capture')} onClose={() => setChat(null)} step={step.key}
        messages={master.messages} busy={master.isBusy(step.key, chatRole)} onAsk={(q, r) => master.ask(step.key, q, r)} onAction={onAction} /></Suspense>}
    </div>
  )
}
