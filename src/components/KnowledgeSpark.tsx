import type { Project } from '../lib/store'

/** One observation from the actual song, after doing; explanation stays optional. */
export function KnowledgeSpark({ step, p }: { step: string; p: Project }) {
  const noteCount = (notes: (number | null)[]) => notes.filter(n => n != null && n >= 0).length
  const sparks: Record<string, { ready: boolean; line: string; detail: string }> = {
    hum: { ready: (p.hum?.notes.length ?? 0) >= 3, line: `這段有 ${p.hum?.notes.length ?? 0} 個音。哪一句想留下來？`, detail: '挑一句喜歡的，哼兩遍看看。第二遍可以換個結尾，不用急著哼完整首。' },
    idea: { ready: !!p.idea.mood, line: '同一句話，快一點、慢一點，感覺會一樣嗎？', detail: `你選了每分鐘 ${p.idea.bpm} 拍。想比較快慢的感覺，可以到工具箱調調看。` },
    harmony: { ready: p.harmony.verse.some(n=>n!=null)||p.harmony.chorus.some(n=>n!=null), line: '和弦像地板，托住你要唱的那句話。', detail: '先用耳朵挑喜歡的顏色，再聽它接到下一個和弦的感覺。沒有一定要選的答案；想往下挖，工具箱有你這段和弦的觀察。' },
    melody: { ready: noteCount(p.melody.verse)+noteCount(p.melody.chorus)>0, line: '音之間的空白，也是旋律的一部分。', detail: '試著留一格空白，讓自己有地方換氣。也可以重複短句，再換個結尾聽聽。' },
    lyrics: { ready: p.lyrics.some(s=>s.text.trim()), line: '把剛寫下的那句唸出來，聽聽看。', detail: '先唸一遍，再跟著旋律唱。字唱起來太擠的話，可以試著少放一個字。不急，慢慢改。' },
    arrange: { ready: p.arrangement.length>0, line: '主歌少一點聲音，副歌進來會是什麼感覺？', detail: '把主歌的一件樂器拿掉，再聽副歌進來的差別。工具箱裡可以調每段的長度與配器。' },
    record: { ready: p.recording.levelPeakDb != null, line: '唱大聲一點時，音量還有空間嗎？', detail: '最大聲的那句也別碰到紅區。如果完全沒收到聲音，先檢查麥克風；有聲音了，再調整距離。' },
    mix: { ready: p.mix.listened, line: '想讓旋律更清楚？試試把伴奏調小一點。', detail: '先把伴奏輕輕拉低，再聽旋律是否清楚。調整一次後，和原本的版本比較，耳朵會更容易分辨。' },
    review: { ready: !!p.review.verdict.trim(), line: '想試著改一點什麼？先留住現在這一版吧。', detail: '先存一版，再只改一件事。回頭比較兩版，用你最初想傳達的感覺來決定。' },
  }
  const spark = sparks[step]
  if (!spark?.ready) return null
  return <details className="knowledge-spark"><summary><span className="spark-kicker">小火花</span><span className="spark-line">{spark.line}</span><span className="spark-invite">想知道？<span className="spark-toggle" aria-hidden="true" /></span></summary><div className="spark-body"><p>{spark.detail}</p><details><summary>多看看</summary><p>打開下方工具箱的「想知道？」可以看原理，並用這首歌的聲音再試一次。</p></details></div></details>
}
