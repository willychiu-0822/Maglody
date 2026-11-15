import { useState } from 'react'
import { LAYERS, energy, songSeconds, fmtTime, arrangedAudio, arrangementFeedback } from '../rules/arrangement'
import { Coach, DeskActions, FeedbackList, Toolbox, Why } from '../components/ui'
import { playLoop, type Player } from '../lib/audio'
import { uid, type ArrSection, type LayerId, type SectionKind } from '../lib/store'
import { KIND_ZH } from '../rules/lyrics'
import type { StepDef, StepProps } from './types'
import { arrangementRequirements } from '../rules/requirements'
import { DESK_NAMES } from '../../server/shared/names.ts'


const DEFAULT_LAYERS: Record<SectionKind, Record<LayerId, boolean>> = {
  intro: { drums: false, bass: false, keys: true, pad: false, melody: false },
  verse: { drums: false, bass: false, keys: true, pad: false, melody: true },
  pre: { drums: false, bass: false, keys: true, pad: false, melody: true },
  chorus: { drums: false, bass: false, keys: true, pad: false, melody: true },
  bridge: { drums: false, bass: false, keys: true, pad: false, melody: true },
  inter: { drums: false, bass: false, keys: true, pad: false, melody: false },
  outro: { drums: false, bass: false, keys: true, pad: false, melody: false },
}





function ArrangementStep({ p, update, notify, next }: StepProps) {
  const a = p.arrangement
  const [sel, setSel] = useState<string | null>(a[0]?.id ?? null)
  const [player, setPlayer] = useState<Player | null>(null)
  // M-15：骨架排好後，要先試聽、再自己動一次（拿掉或加一樣，或按「就這樣」），前進鈕才會出現。進來時已達標（回頭看、讀檔）就不再卡。
  const [heard, setHeard] = useState(() => arrangementRequirements(p).every((r) => r.ok))
  const [picked, setPicked] = useState(heard)
  const set = (id: string, patch: Partial<ArrSection>) => { setPicked(true); update('arrangement', a.map((s) => (s.id === id ? { ...s, ...patch } : s))); notify('arrange.change', '') }
  const add = (kind: SectionKind) => {
    const s: ArrSection = { id: uid(), kind, bars: kind === 'intro' || kind === 'outro' || kind === 'inter' ? 4 : 8, layers: { ...DEFAULT_LAYERS[kind] } }
    update('arrangement', [...a, s])
    setSel(s.id)
  }
  const move = (i: number, d: number) => {
    const n = [...a]
    const j = i + d
    if (j < 0 || j >= n.length) return
    ;[n[i], n[j]] = [n[j], n[i]]
    update('arrangement', n)
  }
  const preview = (s: ArrSection) => {
    player?.stop()
    const { bars, melody } = arrangedAudio(p, s)
    setPlayer(playLoop({ bpm: p.idea.bpm, bars, melody, layers: s.layers, onStep: (x) => x < 0 && setPlayer(null) }))
    setHeard(true)
    notify('arrange.preview', s.kind)
  }
  const cur = a.find((s) => s.id === sel)
  const maxE = LAYERS.reduce((x, l) => x + l.w, 0)
  const fb = arrangementFeedback(p)

  const sketch = () => {
    // 只排「骨架」：前奏 → 主歌 → 副歌 → 主歌 → 副歌 → 尾奏，全部只有鋼琴與主唱；誰要加進來，由你決定
    const kinds: SectionKind[] = ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro']
    const list = kinds.map((k) => ({ id: uid(), kind: k, bars: k === 'intro' || k === 'outro' ? 4 : 8, layers: { ...DEFAULT_LAYERS[k] } }))
    update('arrangement', list)
    setSel(list[2].id)
    notify('arrange.change', '')
  }
  const ready = arrangementStep.requirements(p).every((r) => r.ok)
  const say = a.length === 0 ? '先排出段落，再決定每一段誰上場。'
    : !ready ? '點一段，決定誰上場。也試試讓主歌和副歌有點不同。'
    : !heard ? '骨架排好了。先聽一段，再決定誰上場。'
    : !picked ? '聽完了。挑一段，拿掉一樣或加一樣；覺得剛好就按「就這樣」。'
    : '能量有起伏了。聽聽看。'
  return (
    <>
      <Coach short={say} />

      {a.length > 0 && (
        <div className="energy">
          {a.map((s) => (
            <button key={s.id} className={`energy-col ${sel === s.id ? 'on' : ''} k-${s.kind}`} style={{ flexGrow: s.bars }} onClick={() => setSel(s.id)}>
              <div className="energy-bar" style={{ height: `${(energy(s) / maxE) * 100}%` }} />
              <span className="energy-label">{KIND_ZH[s.kind]}</span>
            </button>
          ))}
        </div>
      )}

      {cur && (
        <div className="layer-grid">
          {LAYERS.map((l) => (
            <button key={l.id} className={`layer ${cur.layers[l.id] ? 'on' : ''}`} onClick={() => set(cur.id, { layers: { ...cur.layers, [l.id]: !cur.layers[l.id] } })}>{l.name}</button>
          ))}
        </div>
      )}

      {player ? (
        <DeskActions primary={{ label: '■ 停', onClick: () => { player.stop(); setPlayer(null) } }} />
      ) : a.length === 0 ? (
        <DeskActions primary={{ label: '排一個常見的骨架', onClick: sketch }} />
      ) : ready && !(heard && picked) && cur ? (
        !heard
          ? <DeskActions primary={{ label: `▶ 試聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) }} />
          : <DeskActions primary={{ label: '就這樣', onClick: () => setPicked(true) }} secondary={{ label: `▶ 再聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) }} />
      ) : ready && next ? (
        <DeskActions primary={{ label: <>編好了，去{next.label} →</>, onClick: next.go }} secondary={cur ? { label: `▶ 試聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) } : undefined} />
      ) : cur ? (
        <DeskActions primary={{ label: `▶ 試聽${KIND_ZH[cur.kind]}`, onClick: () => preview(cur) }} />
      ) : null}

      <Toolbox>
        <div className="row wrap">
          {(['intro', 'verse', 'pre', 'chorus', 'bridge', 'inter', 'outro'] as SectionKind[]).map((k) => (
            <button key={k} className="btn small" onClick={() => add(k)}>＋ {KIND_ZH[k]}</button>
          ))}
        </div>
        {cur && (
          <div className="row wrap">
            <label className="row small">{KIND_ZH[cur.kind]} 小節數
              <select value={cur.bars} onChange={(e) => set(cur.id, { bars: +e.target.value })}>
                {[2, 4, 8, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn small" onClick={() => move(a.indexOf(cur), -1)}>往前</button>
            <button className="btn small" onClick={() => move(a.indexOf(cur), 1)}>往後</button>
            <button className="btn small" onClick={() => { update('arrangement', a.filter((s) => s.id !== cur.id)); setSel(null) }}>刪掉</button>
          </div>
        )}
        {a.length > 0 && <p className="muted small">長條越高越熱鬧，越寬越長。全長約 {fmtTime(songSeconds(p))}。</p>}
        <FeedbackList items={fb} />
        <Why ready={a.length >= 3} title="主歌收一點，會是什麼感覺？">
          <p>試試讓主歌安靜一點，副歌再多加個聲音。兩段聽起來有什麼不同？</p>
        </Why>
      </Toolbox>
    </>
  )
}

export const arrangementStep: StepDef = {
  key: 'arrange',
  title: DESK_NAMES.arrange,
  subtitle: '決定什麼時候加、什麼時候減',
  glyph: '編',
  Component: ArrangementStep,
  requirements: arrangementRequirements,
}
