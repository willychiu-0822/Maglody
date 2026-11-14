import type { Project } from '../lib/store'
import type { RoleId } from './roles'
import { hasSound } from './mock'

/** 聊天視窗的開場句：只列「現在問得出答案」的。還沒排和弦就不出「為什麼這和弦？」。 */
export function quickPrompts(role: RoleId, p: Project): string[] {
  const chords = [...p.harmony.verse, ...p.harmony.chorus].some((n) => n != null)
  switch (role) {
    case 'producer': return [hasSound(p) ? '這首歌像我要的感覺嗎？' : '這個要怎麼用？', '接下來做什麼？']
    case 'composer': return [chords ? '為什麼這和弦？' : '什麼是和弦？', '換一個更哀傷的走向', '我不會唱歌可以嗎？']
    case 'lyricist': return ['押韻怎麼找？', '卡住了，怎麼開頭？']
    case 'arranger': return ['主歌和副歌差在哪？', '副歌怎麼更有爆發力？']
    case 'engineer': return ['我做錯了嗎？', '太高唱不上去']
  }
}
