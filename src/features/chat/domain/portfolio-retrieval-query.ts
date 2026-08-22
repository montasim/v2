import type { PortfolioUIMessage } from "@/features/chat/domain/chat"

const MAX_PREVIOUS_QUESTION_CHARACTERS = 500

export function buildPortfolioRetrievalQuery(
  messages: readonly PortfolioUIMessage[],
  currentQuestion: string
) {
  const previousQuestion = messages
    .slice(0, -1)
    .reverse()
    .find((message) => message.role === "user")
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim()

  if (!previousQuestion) return reduceIdentityBias(currentQuestion)

  return reduceIdentityBias(
    `Previous question: ${previousQuestion.slice(
      0,
      MAX_PREVIOUS_QUESTION_CHARACTERS
    )}\nCurrent follow-up: ${currentQuestion}`
  )
}

function reduceIdentityBias(question: string) {
  const withoutName = question
    .replace(
      /\b(?:mohammad\s+)?montasim(?:\s+al[ -]mamun(?:\s+shuvo)?)?\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
  const meaningfulWords = withoutName.match(/[a-z]{3,}/gi) ?? []

  return meaningfulWords.length >= 3 ? withoutName : question
}
