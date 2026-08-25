export class InquiryDeadlineError extends Error {}

/**
 * Bounds a server-owned inquiry operation and propagates cancellation to
 * abort-aware delivery adapters. The raced operation remains observed so a
 * late rejection cannot become an unhandled promise rejection.
 */
export async function runInquiryWithDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
) {
  const controller = new AbortController()
  const timeoutError = new InquiryDeadlineError(
    `Inquiry operation timed out after ${timeoutMs}ms.`
  )
  let timeout: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(timeoutError)
      controller.abort(timeoutError)
    }, timeoutMs)
  })

  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      deadline,
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
