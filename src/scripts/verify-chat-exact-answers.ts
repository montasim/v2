import { register } from "node:module"
import { isDeepStrictEqual } from "node:util"

register("./toon-raw-loader.ts", import.meta.url)

const [
  { getExactAnswerCatalog, getPortfolioExactAnswerCatalog },
  { buildPortfolioExactAnswers },
  { getCompiledPortfolioKnowledge },
] = await Promise.all([
  import("../features/chat/knowledge/exact-answer-catalog"),
  import("../features/chat/knowledge/exact-answer-source"),
  import("../features/chat/knowledge/portfolio-knowledge.server"),
])

const exactAnswers = getPortfolioExactAnswerCatalog()
const knowledge = getCompiledPortfolioKnowledge()

if (exactAnswers.knowledgeHash !== knowledge.hash) {
  throw new Error(
    `Exact chat answers are stale (${exactAnswers.knowledgeHash}); expected ${knowledge.hash}. Run pnpm chat:compile-exact.`
  )
}

if (!isDeepStrictEqual(getExactAnswerCatalog(), buildPortfolioExactAnswers())) {
  throw new Error(
    "Exact chat answers do not match their clean-room source. Run pnpm chat:compile-exact."
  )
}

console.info(
  `Verified exact chat answers against portfolio knowledge ${knowledge.hash}.`
)
