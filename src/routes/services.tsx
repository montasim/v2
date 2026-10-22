import { createFileRoute } from "@tanstack/react-router"
import { ServicesPage } from "@/components/portfolio/services-page"
import { descriptions } from "@/lib/content/descriptions"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/services")({
  head: () =>
    createMeta("Client services", descriptions.services, "/services", {
      imageAlt: "Montasim client services",
    }),
  component: ServicesPage,
})
