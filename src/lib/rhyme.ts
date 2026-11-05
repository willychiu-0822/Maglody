// 簡化版「十三轍」韻部表：收錄常見的句尾字。查不到的字請學生自己唸唸看。
const GROUPS: [string, string, string][] = [
  ['發花', 'a', '啊媽家花他她下話嗎吧怕達沙拉涯霞牙茶畫掛化華大爸塔擦灑雅價架瓜誇抓髮法刷'],
  ['梭波', 'o / e', '我說過做多火落歌河了錯破坡波磨默墨喝合樂客色個和得熱刻渴窩握活鍋果國惑播托朵躲魔脫奪颯哥車者'],
  ['乜斜', 'ie / üe', '夜月雪謝學別街姐葉鞋些寫斜血結解節滅蝶絕決缺覺約越悅爺野也切貼歇界借蝴'],
  ['一七', 'i / ü', '你裡起地氣已記意期衣米雨去曲語區綠旅序遇聚居句許局劇雞西力離迷比息際戲習奇依一底低題體提李細惜稀系義避祈禮'],
  ['姑蘇', 'u', '路哭苦書樹住處步度福部初出數母無霧舞武故獨讀補圖途土入如主夫父孤鼓古呼湖虎訴束速幕目物'],
  ['懷來', 'ai', '來愛在海開白再帶外待台才彩材改害買賣菜該孩懷拜派排塞災哀戴態蓋快壞'],
  ['灰堆', 'ei / ui', '誰美對會淚飛回為水杯黑給累背悲歸碎醉堆推追吹嘴最味位隨睡貴雷輩配被費微圍灰揮鬼歲退墜'],
  ['遙條', 'ao / iao', '好到跑笑老少早找道掉抱高腦草跳鳥橋要搖島腳遙寶包號毛套刀腰消小照叫料繞擾靠逃燒聊'],
  ['由求', 'ou / iu', '手走有後久留頭口就夠愁秋遊流求守首酒友又舊透柔油救休湊偷樓收漏狗候瘦夠周'],
  ['言前', 'an / ian', '天年邊見間看遠眼面前言片山戀晚伴線甜點變遍現煙岸然完散臉寒南慢半帆轉暖願圓怨船站千難乾單盼'],
  ['人辰', 'en / in / un', '人心身真雲門根深林新尋音陰信近吻魂分聞問溫輪準痕很本恨陳晨春群運印今金親進盡認忍品冰鎮'],
  ['江陽', 'ang', '光方望唱鄉場上長想樣傷亮忘浪狂窗牆涼香航陽像響揚放房糖床江慌黃霜往港創量藏讓強張章忙膀芒'],
  ['中東', 'eng / ing / ong', '夢風中痛空等聲生明情星停名晴輕行冷城燈東紅衝用同懂動種送弄重鐘冬宮從聽定影靜清醒境命平病成能層洞永請經'],
]

const MAP = new Map<string, { group: string; sound: string; idx: number }>()
GROUPS.forEach(([group, sound, chars], idx) => {
  for (const ch of chars) if (!MAP.has(ch)) MAP.set(ch, { group, sound, idx })
})

export const RHYME_GROUPS = GROUPS.map(([g, s, chars]) => ({ group: g, sound: s, sample: chars.slice(0, 12) }))

export function rhymeOf(ch: string) {
  return MAP.get(ch) ?? null
}

const PUNCT = /[\s，。、！？!?,.;；：:「」『』（）()…—\-~～"'“”‘’]/g

export const cleanLine = (l: string) => l.replace(PUNCT, '')

export function lastChar(line: string) {
  const c = cleanLine(line)
  return c ? c[c.length - 1] : ''
}

// 抽象詞：太多會讓歌詞「說」而不「演」
export const ABSTRACT_WORDS = ['愛', '心', '夢', '永遠', '寂寞', '幸福', '未來', '回憶', '孤單', '快樂', '悲傷', '思念', '希望', '感覺', '自由', '勇敢', '溫柔', '痛']
// 具體詞：看得見、摸得到的東西
export const CONCRETE_HINTS = ['窗', '雨', '街', '燈', '車', '杯', '咖啡', '門', '手', '鞋', '傘', '床', '海', '風', '路', '樹', '牆', '鏡', '信', '照片', '月台', '公車', '捷運', '巷', '貓', '狗', '花', '衣', '書', '桌', '鐘', '星', '雲', '山', '河', '火', '雪', '夜市', '便利商店', '機車', '外套', '耳機', '電話', '訊息']

export function countHits(text: string, words: string[]) {
  return words.reduce((n, w) => n + (text.split(w).length - 1), 0)
}
