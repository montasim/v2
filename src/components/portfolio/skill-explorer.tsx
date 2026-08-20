import { FunnelSimpleIcon } from "@phosphor-icons/react"
import { SkillLink } from "@/components/portfolio/skill-groups"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { skillEvidenceCatalog } from "@/lib/content/skill-evidence"
import type { SkillCategory } from "@/lib/content/skill-evidence"

export function SkillExplorer({
  category,
  selectedSkill,
  onCategoryChange,
}: {
  category: SkillCategory
  selectedSkill?: string
  onCategoryChange: (category: SkillCategory) => void
}) {
  const skills = skillEvidenceCatalog.forCategory(category)

  return (
    <section aria-labelledby="skill-list-heading">
      <h2 id="skill-list-heading" className="sr-only">
        Technical skills
      </h2>
      <Tabs
        value={category}
        onValueChange={(value) => onCategoryChange(value as SkillCategory)}
      >
        <TabsList aria-label="Filter skills by category">
          <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
            <FunnelSimpleIcon className="size-3" aria-hidden="true" />
            Filter
          </span>
          {skillEvidenceCatalog.filters.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <p className="sr-only" aria-live="polite">
          {skills.length} skills shown
        </p>
        <TabsContent value={category}>
          <ul className="flex flex-wrap gap-2" aria-label="Skills">
            {skills.map((record) => (
              <li key={record.slug}>
                <SkillLink
                  skill={record.skill}
                  selectedSkill={selectedSkill}
                  category={category === "all" ? undefined : category}
                />
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </section>
  )
}
