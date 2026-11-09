import type { Project } from '../lib/store'

/** One observation from the actual song, after doing; explanation stays optional. */
export function KnowledgeSpark({ step, p }: { step: string; p: Project }) {
  const noteCount = (notes: (number | null)[]) => notes.filter(n => n != null && n >= 0).length
  const sparks: Record<string, { ready: boolean; line: string; detail: string }> = {
    hum: { ready: (p.hum?.notes.length ?? 0) >= 3, line: `剛才的 ${p.hum?.notes.length ?? 0} 個音，已經是一顆旋律種子。`, detail: '先記住你喜歡的那一小句就好。旋律可以從短句重複，再輕輕改一個結尾長出來；不必一次哼完整首。' },
    idea: { ready: !!p.idea.mood, line: '同一句話，換個速度就有不同心情。', detail: `你選了每分鐘 ${p.idea.bpm} 拍。慢一點讓字句有呼吸，快一點帶來推進感；想比較時，工具箱裡可以調速度。` },
    harmony: { ready: p.harmony.verse.some(n=>n!=null)||p.harmony.chorus.some(n=>n!=null), line: '和弦像地板，托住你要唱的那句話。', detail: '先用耳朵挑喜歡的顏色，再聽它接到下一個時的感覺。沒有一定要選的答案；想往下挖，工具箱有你這段和弦的觀察。' },
    melody: { ready: noteCount(p.melody.verse)+noteCount(p.melody.chorus)>0, line: '音之間的空白，也是旋律的一部分。', detail: '試著留一格空白，讓自己有地方換氣。重複短句再換結尾，聽眾就更容易跟著哼。' },
    lyrics: { ready: p.lyrics.some(s=>s.text.trim()), line: '你寫下的畫面，就是這首歌的聲音。', detail: '先唸一遍，再跟著旋律唱。字太擠時刪掉一個形容詞；一句詞不必第一次就寫好。' },
    arrange: { ready: p.arrangement.length>0, line: '留一點空位，副歌進來才會更有感覺。', detail: '把主歌的一件樂器拿掉，再聽副歌進來的差別。工具箱裡可以調每段的長度與配器。' },
    record: { ready: p.recording.levelPeakDb != null, line: '音量留一點空間，情緒就能放心唱。', detail: '最大聲的一句也要留在上限之下。若完全沒收到聲音，先檢查麥克風；有聲音後，再調整距離。' },
    mix: { ready: p.mix.listened, line: '主旋律站前面，其他聲音一起托住它。', detail: '先把伴奏輕輕拉低，再聽旋律是否清楚。調整一次後，和原本的版本比較，耳朵會更容易分辨。' },
    review: { ready: !!p.review.verdict.trim(), line: '你說得出想改哪裡，就已經在製作自己的歌。', detail: '先存一版，再只改一件事。回頭比較兩版，用你最初想傳達的感覺來決定。' },
  }
  const spark = sparks[step]
  if (!spark?.ready) return null
  return <details className="knowledge-spark"><summary><span aria-hidden="true">◦ </span>{spark.line}<span className="spark-invite">想知道？</span></summary><div className="spark-body"><p>{spark.detail}</p><details><summary>再深一點</summary><p>打開下方工具箱的「想知道？」可以看原理，並用這首歌的聲音再試一次。</p></details></div></details>
}
