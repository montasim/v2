import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import {
  DEFAULT_AUTH_SKIP_ROUTES,
  processAuthMiddleware,
} from "@neondatabase/auth/server"

import { getOptionalNeonAuthConfiguration } from "@/features/owner-auth/infrastructure/neon-auth.server"
import { isOwnerOAuthCallbackRequest } from "@/features/owner-auth/infrastructure/oauth-callback"
import { logger } from "@/lib/logger.server"

export default createServerEntry({
  async fetch(request) {
    const startedAt = performance.now()
    try {
      const authResult = await processOwnerOAuthCallback(request)
      const response =
        authResult?.response ??
        (await handler.fetch(authResult?.request ?? request))
      const responseWithCookies = appendCookies(
        response,
        authResult?.cookies ?? []
      )
      logger.info(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: responseWithCookies.status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "request completed"
      )
      return responseWithCookies
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

async function processOwnerOAuthCallback(request: Request) {
  const configuration = getOptionalNeonAuthConfiguration()

  if (!isOwnerOAuthCallbackRequest(request) || !configuration) {
    return null
  }

  const url = new URL(request.url)

  const result = await processAuthMiddleware({
    request,
    pathname: url.pathname,
    skipRoutes: [...DEFAULT_AUTH_SKIP_ROUTES, "/root", "/blog"],
    loginUrl: "/root",
    baseUrl: configuration.baseUrl,
    cookieSecret: configuration.cookieSecret,
    sameSite: "lax",
  })

  if (result.action === "allow") {
    const headers = new Headers(request.headers)
    for (const [name, value] of Object.entries(result.headers ?? {})) {
      headers.set(name, value)
    }

    return {
      request: new Request(request, { headers }),
      response: null,
      cookies: result.cookies ?? [],
    }
  }

  const headers = new Headers({ location: result.redirectUrl.toString() })
  for (const cookie of result.cookies ?? [])
    headers.append("set-cookie", cookie)

  return {
    request,
    response: new Response(null, { status: 302, headers }),
    cookies: [],
  }
}

function appendCookies(response: Response, cookies: string[]) {
  if (!cookies.length) return response

  const headers = new Headers(response.headers)
  for (const cookie of cookies) headers.append("set-cookie", cookie)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
