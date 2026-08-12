import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { logger } from "@/lib/logger.server"

export default createServerEntry({
  async fetch(request) {
    const startedAt = performance.now()
    try {
      const response = await handler.fetch(request)
      logger.info(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "request completed"
      )
      return response
    } catch (error) {
      logger.error(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          error,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "request failed"
      )
      throw error
    }
  },
})
