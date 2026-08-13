import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"

export function createInitialScrollRestorationPolicy({
  isClient = () => typeof window !== "undefined",
  getScrollY = () => window.scrollY,
  registerDocumentScroll = () =>
    document.dispatchEvent(new Event("scroll", { bubbles: true })),
}: {
  isClient?: () => boolean
  getScrollY?: () => number
  registerDocumentScroll?: () => void
} = {}) {
  let isFirstClientRender = true

  return () => {
    if (!isClient()) return true
    if (!isFirstClientRender) return true

    isFirstClientRender = false

    if (getScrollY() === 0) return true

    registerDocumentScroll()
    return false
  }
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: createInitialScrollRestorationPolicy(),
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
