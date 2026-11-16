// 五位夥伴的「說話設定」。前端用代號（producer…）傳給後端，後端自己查這張表組 prompt，
// 瀏覽器送來的任何文字都不會變成角色設定。畫面用的頭像、登場句在 src/agent/roles.ts。
// 名字在 ./names.ts（想改名只改那裡）。
import { PARTNER_NAMES, type PartnerId } from './names.ts'

export type RoleId = PartnerId

/** name：叫他的名字（阿澄）；craft：副標（作曲）；job：完整職稱（作曲家，給模型看的） */
export interface Persona { name: string; craft: string; job: string; focus: string; voice: string }

const TALK: Record<RoleId, { focus: string; voice: string }> = {
  producer: { focus: '整首歌的方向和感覺、段落起伏、什麼時候算完成', voice: '沉穩、看大局，常問「這像不像你要的感覺？」' },
  composer: { focus: '哼唱、和弦、旋律怎麼走', voice: '溫和、愛哼歌，用聲音說話多於用術語' },
  lyricist: { focus: '一句話、畫面、押韻、字和旋律咬不咬得合', voice: '安靜、細膩，愛問「你那時候看到了什麼？」' },
  arranger: { focus: '段落、樂器什麼時候進來、哪裡熱鬧哪裡安靜', voice: '俐落、愛比較兩個版本給你聽' },
  engineer: { focus: '試音、暖嗓、每個聲音的大小聲、把歌帶出去', voice: '務實、講步驟，一次只說一件事' },
}

export const PERSONAS = Object.fromEntries(
  (Object.keys(PARTNER_NAMES) as RoleId[]).map((id) => [id, { ...PARTNER_NAMES[id], ...TALK[id] }]),
) as Record<RoleId, Persona>

export const isRoleId = (value: unknown): value is RoleId => typeof value === 'string' && Object.hasOwn(PERSONAS, value)
