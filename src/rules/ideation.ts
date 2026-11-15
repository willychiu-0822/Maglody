export const MOODS = [
  { id: 'happy', name: '開心雀躍', mode: 'major', bpm: [110, 130], why: '大調 + 快速度：明亮的和弦配上像心跳加速的節奏。' },
  { id: 'warm', name: '溫暖療癒', mode: 'major', bpm: [75, 95], why: '大調 + 中慢速度：像走路的速度，讓人放鬆。' },
  { id: 'sad', name: '憂傷失落', mode: 'minor', bpm: [60, 80], why: '小調 + 慢速度：小三度讓和弦帶陰影，慢速度給情緒呼吸空間。' },
  { id: 'miss', name: '思念懷舊', mode: 'major', bpm: [65, 85], why: '大調但多用 vi（憂傷的家），甜中帶酸。' },
  { id: 'fire', name: '熱血衝刺', mode: 'minor', bpm: [130, 160], why: '小調 + 快速度：緊張感與能量並存，常見於動漫歌、搖滾。' },
  { id: 'dream', name: '夢幻漂浮', mode: 'major', bpm: [70, 90], why: '大調 + 長音鋪底，留白多，像飄在空中。' },
] as const
