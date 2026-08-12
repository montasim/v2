import { createFileRoute } from "@tanstack/react-router"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content"

export const Route = createFileRoute("/experience")({
  head: () => createMeta("Experience", descriptions.experience, "/experience"),
  component: Page,
})
function Page() {
  return (
    <PageShell padded>
      <PageIntro title="Experience" description={descriptions.experience} />
      <section className="mt-10" aria-label="Professional experience">
        <ExperienceList card />
      </section>
      <FooterActions />
    </PageShell>
  )
}
