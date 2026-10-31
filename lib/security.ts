const globalSecurity = globalThis as typeof globalThis & { plugRateLimit?: Map<string, number[]> }
const requestLog = globalSecurity.plugRateLimit ?? (globalSecurity.plugRateLimit = new Map())

export function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function isRateLimited(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now()
  const recent = (requestLog.get(key) || ([] as number[])).filter((timestamp: number) => now - timestamp < windowMs)
  recent.push(now)
  requestLog.set(key, recent)
  if (requestLog.size > 5000) for (const [storedKey, timestamps] of requestLog) if (!timestamps.some((timestamp: number) => now - timestamp < windowMs)) requestLog.delete(storedKey)
  return recent.length > limit
}

export function isTrustedMutation(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!origin || !host) return true
  try { return new URL(origin).host === host } catch { return false }
}
