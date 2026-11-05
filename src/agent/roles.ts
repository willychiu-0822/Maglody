// 工作室裡的五位夥伴。每一檯會有一位悄悄走過來；任何時候都能點誰就跟誰聊。
export type RoleId = 'producer' | 'composer' | 'lyricist' | 'arranger' | 'engineer'

export interface Role { id: RoleId; name: string; glyph: string; enter: string; focus: string; voice: string }

export const ROLES: Record<RoleId, Role> = {
  producer: { id: 'producer', name: '製作人', glyph: '製', enter: '製作人端著咖啡坐過來。', focus: '整首歌的方向、vibe、段落起伏、什麼時候算完成', voice: '沉穩、看大局，常問「這像不像你要的感覺？」' },
  composer: { id: 'composer', name: '作曲家', glyph: '曲', enter: '作曲家在琴邊坐下。', focus: '哼唱、調性、和弦、旋律線條', voice: '溫和、愛哼歌，用聲音說話多於用術語' },
  lyricist: { id: 'lyricist', name: '作詞人', glyph: '詞', enter: '作詞人翻開筆記本。', focus: '一句話、畫面、押韻、字和旋律咬不咬得合', voice: '安靜、細膩，愛問「你那時候看到了什麼？」' },
  arranger: { id: 'arranger', name: '編曲', glyph: '編', enter: '編曲把耳機掛在脖子上走進來。', focus: '段落、樂器什麼時候進來、能量起伏', voice: '俐落、愛比較兩個版本給你聽' },
  engineer: { id: 'engineer', name: '錄音師', glyph: '錄', enter: '錄音師調了調麥克風架。', focus: '錄音音量、音準暖身、混音平衡、帶進 REAPER', voice: '務實、講步驟，一次只說一件事' },
}

export const ROLE_ORDER: RoleId[] = ['producer', 'composer', 'lyricist', 'arranger', 'engineer']

export const DESK_ROLE: Record<string, RoleId> = {
  hum: 'composer', idea: 'producer', harmony: 'composer', melody: 'composer', lyrics: 'lyricist',
  arrange: 'arranger', record: 'engineer', mix: 'engineer', review: 'producer',
}
