import { createFileRoute } from "@tanstack/react-router"

import { createPortfolioAssistantResponse } from "@/features/chat/application/portfolio-assistant.server"
import { InvalidChatRequestError } from "@/features/chat/domain/chat"

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOrigin(request)) {
          return Response.json(
            { error: "Cross-site requests are not allowed." },
            { status: 403 }
          )
        }

        try {
          const input: unknown = await request.json()
          return await createPortfolioAssistantResponse(input, request.signal)
        } catch (error) {
          if (
            error instanceof InvalidChatRequestError ||
            error instanceof SyntaxError
          ) {
            return Response.json(
              { error: "The chat request is invalid." },
              { status: 400 }
            )
          }
          return Response.json(
            { error: "The assistant is temporarily unavailable." },
            { status: 503 }
          )
        }
      },
    },
  },
})

function isSameOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site")
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
    return false

  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}
