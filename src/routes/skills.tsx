import { createFileRoute } from "@tanstack/react-router"
import { SkillGroups } from "@/components/portfolio/skill-groups"
import { DetailPage } from "@/components/shared/detail-page"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content/descriptions"

export const Route = createFileRoute("/skills")({
  head: () => createMeta("Skills", descriptions.skills, "/skills"),
  component: Page,
})
function Page() {
  return (
    <DetailPage title="Skills" description={descriptions.skills}>
      <div className="mt-10">
        <SkillGroups />
      </div>
    </DetailPage>
  )
}
