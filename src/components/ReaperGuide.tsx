import { useState } from 'react'
import type { Project } from '../lib/store'
import { downloadMidi } from '../lib/midi'

/** 在 REAPER 裡接著做：每章對應的實際操作與「為什麼」 */
const GUIDES: Record<string, { title: string; steps: string[]; why: string }> = {
  arrange: {
    title: '把編曲帶進 REAPER',
    steps: [
      '按下方「下載 MIDI」，得到含 主旋律／和弦／貝斯 三軌的 .mid 檔。',
      '開 REAPER → 把 .mid 拖進編輯視窗 → 選「Multiple tracks」（每軌一個）。',
      '每軌點 FX → 加 ReaSynth（內建合成器）就能出聲；之後可換成免費的鋼琴、貝斯外掛。',
      '速度會跟著 MIDI 檔設好；在頂端 BPM 欄確認是你的速度。',
    ],
    why: '網頁裡的聲音是草稿。DAW 讓你換真實音色、精修每個音，也是錄音和混音的地方——Maglody 負責「學會怎麼做決定」，REAPER 負責「把決定做到好聽」。',
  },
  record: {
    title: '在 REAPER 錄人聲',
    steps: [
      'Options → Preferences → Audio → Device：選你的錄音介面或麥克風；手機錄音可先用 Voice Memo 再拖進來。',
      '新增一軌 → 點紅色「錄音預備」(Record Arm) → 輸入選 Mono / Input 1。',
      '打開 Record Monitoring（喇叭圖示）並戴耳機，跟著和弦軌唱。',
      '看軌道音量表：最大聲時停在 -12 到 -6 dB，碰到紅色就把介面增益調小。',
      '按 Ctrl+R 錄音；同一段錄 3 次以上，REAPER 會自動把 take 疊起來，之後在 take 上右鍵選最好的。',
      'Project Settings 設 48 kHz、24 bit：比 16 bit 有更多 headroom。',
    ],
    why: '你在 Maglody 練的「峰值不碰紅」「留 headroom」，在 REAPER 裡就是看那條音量表。觀念一樣，只是換了一個工具。',
  },
  mix: {
    title: '在 REAPER 做你剛學的混音',
    steps: [
      '音量：每軌的推桿（Fader）先把人聲調到最清楚，再把伴奏往下拉。',
      '聲像：推桿上方的 Pan 旋鈕；貝斯、大鼓、人聲放中間，和弦往左或右 20–50%。',
      '低頻切除：在人聲與和弦軌點 FX → ReaEQ → 把第一個頻段改成 High Pass，頻率約 120–180 Hz。',
      '總輸出（Master）的音量表不要碰到 0 dB；不夠大聲時先降各軌，不要推 Master。',
      'A/B 比較：FX 視窗左上的勾勾可以暫時關掉效果器，比較前後差別。',
      'File → Render：輸出 WAV（保存）或 MP3（分享給朋友聽）。',
    ],
    why: 'Maglody 的每一個混音滑桿，在 REAPER 都有一模一樣的對應：推桿、Pan、ReaEQ 的 High Pass、Master 表。你已經懂原理，現在只是換成專業工具。',
  },
}

export function ReaperGuide({ step, p }: { step: string; p: Project }) {
  const [open, setOpen] = useState(false)
  const g = GUIDES[step]
  if (!g) return null
  return (
    <section className="card reaper">
      <button className="why-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="why-q reaper-q">REAPER</span>
        <span className="why-title">{g.title}</span>
        <span className="why-caret">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="why-body">
          <ol className="reaper-steps">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <p className="muted small"><strong>為什麼：</strong>{g.why}</p>
          <div className="row wrap">
            <button className="btn" onClick={() => downloadMidi(p)}>下載 MIDI（給 REAPER）</button>
            <a className="btn btn-ghost" href="https://www.reaper.fm/download.php" target="_blank" rel="noreferrer">下載 REAPER</a>
          </div>
        </div>
      )}
    </section>
  )
}
