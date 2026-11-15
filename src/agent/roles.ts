// 工作室裡的五位夥伴。每一檯會有一位悄悄走過來；任何時候都能點誰就跟誰聊。
import { PERSONAS, type RoleId } from '../../server/shared/personas.ts'
import { partnerLabel, type DeskKey } from '../../server/shared/names.ts'
export type { RoleId }

/** name：叫他的名字；label：「名字・做的事」，登場、聊天、選單都顯示這一行 */
export interface Role { id: RoleId; name: string; craft: string; label: string; glyph: string; enter: string; focus: string; voice: string }

// 名字在 server/shared/names.ts，專長與口吻在 server/shared/personas.ts（後端也要用）；這裡只補畫面用的字。
const LOOKS: Record<RoleId, { glyph: string; enter: (name: string) => string }> = {
  producer: { glyph: '製', enter: (n) => `${n}端著咖啡坐過來。` },
  composer: { glyph: '曲', enter: (n) => `${n}在琴邊坐下。` },
  lyricist: { glyph: '詞', enter: (n) => `${n}翻開筆記本。` },
  arranger: { glyph: '編', enter: (n) => `${n}把耳機掛在脖子上走進來。` },
  engineer: { glyph: '錄', enter: (n) => `${n}調了調麥克風架。` },
}

export const ROLES = Object.fromEntries(
  (Object.keys(PERSONAS) as RoleId[]).map((id) => {
    const { name, craft, focus, voice } = PERSONAS[id]
    return [id, { id, name, craft, focus, voice, label: partnerLabel(id), glyph: LOOKS[id].glyph, enter: LOOKS[id].enter(name) }]
  }),
) as Record<RoleId, Role>

export const ROLE_ORDER: RoleId[] = ['producer', 'composer', 'lyricist', 'arranger', 'engineer']

export const DESK_ROLE: Record<DeskKey, RoleId> = {
  hum: 'composer', idea: 'producer', harmony: 'composer', melody: 'composer', lyrics: 'lyricist',
  arrange: 'arranger', record: 'engineer', mix: 'engineer', review: 'producer',
}
