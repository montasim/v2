import { handleAuthProxyRequest } from "@neondatabase/auth/server"
import { createFileRoute } from "@tanstack/react-router"

import { getNeonAuthProxyConfiguration } from "@/features/owner-auth/infrastructure/neon-auth.server"
import {
  isGoogleAuthRequest,
  isOwnerAuthPath,
} from "@/features/owner-auth/domain/owner"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: proxyAuthRequest,
      POST: proxyAuthRequest,
    },
  },
})

async function proxyAuthRequest({ request }: { request: Request }) {
  const pathname = new URL(request.url).pathname
  const path = pathname.replace(/^\/api\/auth\/?/, "")

  if (!isOwnerAuthPath(path)) {
    return Response.json(
      { error: "Authentication route not found." },
      { status: 404 }
    )
  }

  if (request.method === "POST" && !isSameOrigin(request)) {
    return Response.json(
      { error: "Cross-site requests are not allowed." },
      { status: 403 }
    )
  }

  if (path === "sign-in/social") {
    const input: unknown = await request
      .clone()
      .json()
      .catch(() => null)
    if (!isGoogleAuthRequest(input)) {
      return Response.json(
        { error: "Only Google sign-in is available." },
        { status: 403 }
      )
    }
  }

  const { baseUrl, cookieSecret } = getNeonAuthProxyConfiguration()

  return handleAuthProxyRequest({
    request,
    path,
    baseUrl,
    cookieSecret,
    sameSite: "lax",
  })
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}
