import type { RegExpMatcher } from "obscenity"

const MODERATION_ERROR =
  "Please revise your comment. Offensive or abusive language is not allowed."

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

export async function getCommentModerationError(message: string) {
  const matcher = await getMatcher()
  return matcher.hasMatch(message) ? MODERATION_ERROR : null
}

export { MODERATION_ERROR }
