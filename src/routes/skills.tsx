import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { SkillEvidence } from "@/components/portfolio/skill-evidence"
import { SkillExplorer } from "@/components/portfolio/skill-explorer"
import { DetailPage } from "@/components/shared/detail-page"
import { createMeta } from "@/lib/site"
import { descriptions } from "@/lib/content/descriptions"
import { skillEvidenceCatalog } from "@/lib/content/skill-evidence"

export const Route = createFileRoute("/skills")({
  head: () => createMeta("Skills", descriptions.skills, "/skills"),
  validateSearch: z.object({
    category: skillEvidenceCatalog.categorySchema.optional().catch(undefined),
    skill: skillEvidenceCatalog.skillSchema,
  }),
  component: Page,
})
function Page() {
  const { category = "all", skill } = Route.useSearch()
  const navigate = Route.useNavigate()
  const evidence = skillEvidenceCatalog.forSlug(skill)

  return (
    <DetailPage title="Skills" description={descriptions.skills}>
      <div id="skill-list" className="mt-10 scroll-mt-20">
        <SkillExplorer
          category={category}
          selectedSkill={skill}
          onCategoryChange={(nextCategory) =>
            navigate({
              search: {
                category: nextCategory === "all" ? undefined : nextCategory,
                skill: undefined,
              },
              replace: true,
            })
          }
        />
      </div>
      <div className="mt-10">
        <SkillEvidence evidence={evidence} />
      </div>
    </DetailPage>
  )
}
