import {
  NEON_AUTH_COOKIE_PREFIX,
  createAuthServer,
  extractNeonAuthCookies,
} from "@neondatabase/auth/server"
import type { RequestContext } from "@neondatabase/auth/server"
import {
  getRequest,
  getRequestHeader,
  setCookie,
} from "@tanstack/react-start/server"

import { isPortfolioOwnerEmail } from "@/features/owner-auth/domain/owner"

type OwnerAuthState =
  | { status: "owner"; user: { email: string; name: string } }
  | { status: "signed-out" }
  | { status: "forbidden"; email: string }
  | { status: "unconfigured" }

export function getOptionalNeonAuthConfiguration() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim()
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim()

  if (!baseUrl || !cookieSecret || cookieSecret.length < 32) return null
  return { baseUrl, cookieSecret }
}

function createRequestContext(): RequestContext {
  const request = getRequest()

  return {
    getCookies: () => extractNeonAuthCookies(request.headers),
    setCookie: (name, value, options) => setCookie(name, value, options),
    getHeader: (name) => request.headers.get(name),
    getOrigin: () =>
      request.headers.get("origin") ?? new URL(request.url).origin,
    getFramework: () => "tanstack-start",
  }
}

function createOwnerAuthServer() {
  const configuration = getOptionalNeonAuthConfiguration()
  if (!configuration) {
    throw new Error("Neon Auth is not configured.")
  }

  return createAuthServer({
    baseUrl: configuration.baseUrl,
    context: createRequestContext,
    cookieSecret: configuration.cookieSecret,
    sameSite: "lax",
  })
}

export function getNeonAuthProxyConfiguration() {
  const configuration = getOptionalNeonAuthConfiguration()
  if (!configuration) {
    throw new Error("Neon Auth is not configured.")
  }
  return configuration
}

export async function getOwnerAuthState(): Promise<OwnerAuthState> {
  const ownerEmail = process.env.OWNER_EMAIL?.trim()
  if (!getOptionalNeonAuthConfiguration() || !ownerEmail) {
    return { status: "unconfigured" }
  }

  const cookies = getRequestHeader("cookie") ?? ""
  if (!cookies.includes(NEON_AUTH_COOKIE_PREFIX)) {
    return { status: "signed-out" }
  }

  const auth = createOwnerAuthServer()
  const { data, error } = await auth.getSession()
  if (error) throw new Error("The owner session could not be verified.")
  if (!data?.user) return { status: "signed-out" }

  if (!isPortfolioOwnerEmail(data.user.email, ownerEmail)) {
    await auth.signOut().catch(() => undefined)
    return { status: "forbidden", email: data.user.email }
  }

  return {
    status: "owner",
    user: {
      email: data.user.email,
      name: data.user.name,
    },
  }
}

export async function requirePortfolioOwner() {
  const state = await getOwnerAuthState()
  if (state.status !== "owner") {
    throw new Error("You are not authorized to manage comments.")
  }
  return state.user
}
