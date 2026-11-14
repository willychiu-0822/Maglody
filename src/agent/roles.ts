// 工作室裡的五位夥伴。每一檯會有一位悄悄走過來；任何時候都能點誰就跟誰聊。
import { PERSONAS, type RoleId } from '../../server/shared/personas.ts'
export type { RoleId }

export interface Role { id: RoleId; name: string; glyph: string; enter: string; focus: string; voice: string }

// 名字、專長、口吻在 server/shared/personas.ts（後端也要用）；這裡只補畫面用的字。
const LOOKS: Record<RoleId, { glyph: string; enter: string }> = {
  producer: { glyph: '製', enter: '製作人端著咖啡坐過來。' },
  composer: { glyph: '曲', enter: '作曲家在琴邊坐下。' },
  lyricist: { glyph: '詞', enter: '作詞人翻開筆記本。' },
  arranger: { glyph: '編', enter: '編曲把耳機掛在脖子上走進來。' },
  engineer: { glyph: '錄', enter: '錄音師調了調麥克風架。' },
}

export const ROLES = Object.fromEntries(
  (Object.keys(PERSONAS) as RoleId[]).map((id) => [id, { id, ...PERSONAS[id], ...LOOKS[id] }]),
) as Record<RoleId, Role>

export const ROLE_ORDER: RoleId[] = ['producer', 'composer', 'lyricist', 'arranger', 'engineer']

export const DESK_ROLE: Record<string, RoleId> = {
  hum: 'composer', idea: 'producer', harmony: 'composer', melody: 'composer', lyrics: 'lyricist',
  arrange: 'arranger', record: 'engineer', mix: 'engineer', review: 'producer',
}
