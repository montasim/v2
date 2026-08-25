import { writeFile } from "node:fs/promises"

import { encode } from "@toon-format/toon"

import { buildPortfolioExactAnswers } from "@/features/chat/knowledge/exact-answer-source"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"

const knowledge = getCompiledPortfolioKnowledge()
const records = buildPortfolioExactAnswers()
const output = encode({
  schemaVersion: "portfolio-exact-answers/v1",
  knowledgeHash: knowledge.hash,
  records,
})
const outputUrl = new URL(
  "../features/chat/knowledge/exact-answers.toon",
  import.meta.url
)

await writeFile(outputUrl, `${output}\n`, "utf8")

console.info(
  `Compiled ${records.length} exact chat answers for knowledge ${knowledge.hash}.`
)
