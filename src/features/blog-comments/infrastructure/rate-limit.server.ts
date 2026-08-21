const WINDOW_MS = 15 * 60 * 1_000
const MAX_COMMENTS_PER_WINDOW = 5

interface RateLimitEntry {
  count: number
  resetAt: number
}

const entries = new Map<string, RateLimitEntry>()

export function checkBlogCommentRateLimit(email: string, now = Date.now()) {
  const key = email.trim().toLowerCase()
  const current = entries.get(key)

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  if (current.count >= MAX_COMMENTS_PER_WINDOW) {
    throw new Error("Too many comments. Please try again later.")
  }

  current.count += 1
}

export function resetBlogCommentRateLimitsForTests() {
  entries.clear()
}
