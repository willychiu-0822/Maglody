// 規則層共用的型別：沒有 JSX、沒有樣式，測試和離線教練可以直接載入。
export type Level = 'good' | 'warn' | 'bad'
export interface Feedback { level: Level; text: string; tip?: string }
export interface Requirement { label: string; ok: boolean }
