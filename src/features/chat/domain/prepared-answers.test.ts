import { describe, expect, it } from "vitest"

import { getPreparedAnswer } from "@/features/chat/domain/prepared-answers"
import type { PreparedAnswerId } from "@/features/chat/domain/prepared-answers"

describe("prepared answers", () => {
  it.each<PreparedAnswerId>(["hiring", "impact", "expertise"])(
    "provides a substantial grounded %s answer",
    (id) => {
      const prepared = getPreparedAnswer(id)

      expect(prepared.question.length).toBeGreaterThan(20)
      expect(prepared.answer.length).toBeGreaterThan(300)
      expect(prepared.source).toBeTruthy()
    }
  )
})
