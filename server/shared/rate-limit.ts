// 很小的記憶體限流：每個來源每分鐘 N 次，加上整個服務每日總量。
// 計數存在這個程序的記憶體裡：多開幾台、或冷啟動就歸零，所以只是第一道牆，最後一道防線仍是供應商的預算上限。
export interface RateLimitOptions {
  perMinute: number
  /** 整個服務每 24 小時的總量（所有來源加總）；0 代表不限制 */
  perDay: number
  now?: () => number
}

export type RateDecision = { ok: true } | { ok: false; retryAfterSeconds: number }

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const MAX_KEYS = 10_000

export function createRateLimiter({ perMinute, perDay, now = Date.now }: RateLimitOptions) {
  const buckets = new Map<string, { start: number; count: number }>()
  let day = { start: now(), count: 0 }
  return {
    check(key: string): RateDecision {
      const t = now()
      if (t - day.start >= DAY) day = { start: t, count: 0 }
      if (perDay > 0 && day.count >= perDay) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((day.start + DAY - t) / 1000)) }
      let bucket = buckets.get(key)
      if (!bucket || t - bucket.start >= MINUTE) {
        if (buckets.size >= MAX_KEYS) for (const [k, b] of buckets) if (t - b.start >= MINUTE) buckets.delete(k)
        bucket = { start: t, count: 0 }
        buckets.set(key, bucket)
      }
      if (bucket.count >= perMinute) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.start + MINUTE - t) / 1000)) }
      bucket.count++
      day.count++
      return { ok: true }
    },
  }
}

/**
 * 取來源 IP。放在 Cloud Run／Render 後面時，socket 看到的是代理，要信任 X-Forwarded-For；
 * 但最左邊那段可以被使用者偽造，所以只信「自己代理加上的最後 N 段」：trustedHops=1 取最後一段。
 */
export function clientKey(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, trustedHops: number): string {
  const forwarded = req.headers['x-forwarded-for']
  if (trustedHops > 0 && typeof forwarded === 'string') {
    const parts = forwarded.split(',').map((x) => x.trim()).filter(Boolean)
    const ip = parts[parts.length - trustedHops]
    if (ip) return ip
  }
  return req.socket?.remoteAddress ?? 'unknown'
}
