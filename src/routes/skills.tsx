import { createFileRoute } from "@tanstack/react-router"
import { SkillGroups } from "@/components/portfolio/skill-groups"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content"

export const Route = createFileRoute("/skills")({
  head: () => createMeta("Skills", descriptions.skills, "/skills"),
  component: Page,
})
function Page() {
  return (
    <PageShell padded>
      <PageIntro title="Skills" description={descriptions.skills} />
      <div className="mt-10">
        <SkillGroups />
      </div>
      <FooterActions />
    </PageShell>
  )
}
