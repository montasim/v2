export type ChatRateLimitScope =
  | "all-10m"
  | "visitor-dynamic-10m"
  | "visitor-dynamic-day"
  | "openrouter-global-minute"
  | "openrouter-global-day"

export interface ChatRateLimitRequest {
  scope: ChatRateLimitScope
  subjectHash: string
  limit: number
  windowMs: number
  now?: Date
}

export interface ChatRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
  remaining: number
}

export interface ChatRequestLimiter {
  consume: (request: ChatRateLimitRequest) => Promise<ChatRateLimitResult>
}
