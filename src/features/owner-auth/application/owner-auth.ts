import { createServerFn } from "@tanstack/react-start"

import { getOwnerAuthState } from "@/features/owner-auth/infrastructure/neon-auth.server"

export const getPortfolioOwnerAuth = createServerFn({ method: "GET" }).handler(
  () => getOwnerAuthState()
)
