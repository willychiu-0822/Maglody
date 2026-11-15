// 測試用的名字全部從 server/shared/names.ts 拿，改名時 e2e 不用跟著改。
import { DESK_NAMES, DESK_ORDER } from '../server/shared/names'
/** 九個檯名，依選單順序 */
export const desks = DESK_ORDER.map((k) => DESK_NAMES[k])
