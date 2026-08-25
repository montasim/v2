import { createFileRoute } from "@tanstack/react-router"

import { handlePortfolioChatRequest } from "@/features/chat/application/portfolio-assistant.server"

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: ({ request }) => handlePortfolioChatRequest(request),
    },
  },
})
