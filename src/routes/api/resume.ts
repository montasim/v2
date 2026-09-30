import { createFileRoute } from "@tanstack/react-router"
import { downloadResume } from "@/features/resume/download.server"

export const Route = createFileRoute("/api/resume")({
  server: { handlers: { GET: () => downloadResume() } },
})
