import { createServerFn } from "@tanstack/react-start"

import { loadGitHubContributions } from "@/features/github-contributions/infrastructure/github.server"

export const getGitHubContributions = createServerFn({ method: "GET" }).handler(
  () => loadGitHubContributions()
)
