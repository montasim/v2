import { createFileRoute } from "@tanstack/react-router"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { DetailPage } from "@/components/shared/detail-page"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content/descriptions"

export const Route = createFileRoute("/experience")({
  head: () => createMeta("Experience", descriptions.experience, "/experience"),
  component: Page,
})
function Page() {
  return (
    <DetailPage title="Experience" description={descriptions.experience}>
      <section className="mt-10" aria-label="Professional experience">
        <ExperienceList card />
      </section>
    </DetailPage>
  )
}
