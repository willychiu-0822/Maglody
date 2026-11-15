// 名字都在這一個檔：九個檯叫什麼、五位夥伴叫什麼。想改名，只改這裡。
// 畫面、離線夥伴、送給線上夥伴的 prompt、測試（e2e/names.ts）都從這裡拿，不各寫各的。
// 放在 server/shared/ 是因為後端部署時只帶得走 server/，前端可以匯入這裡，反過來不行。
// 只改引號裡的字；左邊的代號（hum、producer…）是程式和存檔在用的，不要動。

export type DeskKey = 'hum' | 'idea' | 'harmony' | 'melody' | 'lyrics' | 'arrange' | 'record' | 'mix' | 'review'
export type PartnerId = 'producer' | 'composer' | 'lyricist' | 'arranger' | 'engineer'

/** 檯名：用「要做的那件事」當名字，主畫面、選單、前進鈕、夥伴嘴裡都是這一組。 */
export const DESK_NAMES: Record<DeskKey, string> = {
  hum: '哼一段',
  idea: '想一想',
  harmony: '挑和弦',
  melody: '寫旋律',
  lyrics: '填詞',
  arrange: '排段落',
  record: '試音',
  mix: '調音量',
  review: '聽一遍',
}

export const DESK_ORDER: DeskKey[] = ['hum', 'idea', 'harmony', 'melody', 'lyrics', 'arrange', 'record', 'mix', 'review']

/**
 * 夥伴：name 是大家叫他的名字；craft 是他做的事（當副標）；job 是完整職稱（只給線上夥伴的設定用）。
 * 畫面上寫成「阿澄・作曲」，句子裡只叫「阿澄」。
 */
export const PARTNER_NAMES: Record<PartnerId, { name: string; craft: string; job: string }> = {
  producer: { name: '大樹', craft: '製作', job: '製作人' },
  composer: { name: '阿澄', craft: '作曲', job: '作曲家' },
  lyricist: { name: '小滿', craft: '作詞', job: '作詞人' },
  arranger: { name: '阿凱', craft: '編曲', job: '編曲' },
  engineer: { name: '老周', craft: '錄音', job: '錄音師' },
}

/** 「阿澄・作曲」：登場、聊天視窗、選單上顯示的那一行 */
export const partnerLabel = (id: PartnerId) => `${PARTNER_NAMES[id].name}・${PARTNER_NAMES[id].craft}`

/** 句子裡提到某一檯：「挑和弦」那一檯 */
export const deskRef = (key: DeskKey) => `「${DESK_NAMES[key]}」那一檯`
