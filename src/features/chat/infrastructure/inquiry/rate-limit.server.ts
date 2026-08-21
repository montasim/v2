const WINDOW_MS = 15 * 60 * 1_000
const MAX_INQUIRIES_PER_WINDOW = 3

interface RateLimitEntry {
  count: number
  resetAt: number
}

const entries = new Map<string, RateLimitEntry>()

export function checkInquiryRateLimit(email: string, now = Date.now()) {
  const key = email.trim().toLowerCase()
  const current = entries.get(key)

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  if (current.count >= MAX_INQUIRIES_PER_WINDOW) {
    throw new Error("Too many inquiry attempts. Please try again later.")
  }

  current.count += 1
}

export function resetInquiryRateLimitsForTests() {
  entries.clear()
}
