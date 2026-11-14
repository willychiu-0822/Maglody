// 前端送出前先裁到這些長度，後端用同一組數字檢查。
// 數字依「最長的正常請求」估：歌曲摘要 8,000 字＋8 則歷史各 1,600 字，UTF-8 中文每字 3 bytes，約 62 KB，所以上限抓 80 KB。
export const MASTER_LIMITS = {
  songContext: 8_000,
  question: 1_000,
  eventDetail: 600,
  historyTurns: 8,
  historyTurn: 1_600,
  bodyBytes: 80_000,
} as const

export const clip = (text: string, max: number) => text.length > max ? text.slice(0, max) : text
