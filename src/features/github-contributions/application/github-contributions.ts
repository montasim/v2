import { createServerFn } from "@tanstack/react-start"

import { snapshotContributions } from "@/features/github-contributions/domain/contributions"
import { loadGitHubContributions } from "@/features/github-contributions/infrastructure/github.server"

export const getGitHubContributions = createServerFn({ method: "GET" }).handler(
  () =>
    loadGitHubContributions(new Date().getUTCFullYear()).catch(() =>
      snapshotContributions()
    )
)

export const getGitHubContributionsForYear = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    if (
      typeof input !== "number" ||
      !Number.isInteger(input) ||
      input < 2008 ||
      input > new Date().getUTCFullYear()
    ) {
      throw new Error("Invalid contribution year")
    }
    return input
  })
  .handler(({ data }) => loadGitHubContributions(data))
