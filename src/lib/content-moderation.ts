import type { RegExpMatcher } from "obscenity"

let matcherPromise: Promise<RegExpMatcher> | undefined

async function loadMatcher() {
  const { RegExpMatcher, englishDataset, englishRecommendedTransformers } =
    await import("obscenity")

  return new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
  })
}

async function getMatcher() {
  matcherPromise ??= loadMatcher()
  return matcherPromise
}

export async function containsOffensiveLanguage(message: string) {
  const matcher = await getMatcher()
  return matcher.hasMatch(message)
}
