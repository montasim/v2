import {
  ArrowUpIcon,
  BriefcaseIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { ProjectCard } from "@/components/portfolio/project-card"
import type { SkillEvidence as SkillEvidenceRecord } from "@/lib/content/skill-evidence"

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function SkillEvidence({
  evidence,
}: {
  evidence: SkillEvidenceRecord | undefined
}) {
  if (!evidence) {
    return (
      <section
        id="evidence"
        className="scroll-mt-20 rounded-xl border bg-muted/35 p-5 sm:p-6"
        aria-labelledby="evidence-heading"
      >
        <h2 id="evidence-heading" className="text-base font-semibold">
          Explore skills with evidence
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Select a skill to see the projects and professional roles where it
          appears in the portfolio data.
        </p>
      </section>
    )
  }

  return (
    <section
      id="evidence"
      className="scroll-mt-20"
      aria-labelledby="evidence-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border bg-muted/35 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Skill evidence
          </p>
          <h2 id="evidence-heading" className="mt-1 text-xl font-semibold">
            {evidence.skill}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Supported by {countLabel(evidence.projects.length, "project")} and{" "}
            {countLabel(evidence.experience.length, "professional role")} in
            this portfolio.
          </p>
        </div>
        <a
          href="#skill-list"
          className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowUpIcon aria-hidden="true" />
          Choose another skill
        </a>
      </div>

      {evidence.total === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          No project or experience record is explicitly tagged with this skill
          yet.
        </p>
      ) : null}

      {evidence.experience.length > 0 ? (
        <section className="mt-8" aria-labelledby="role-evidence-heading">
          <h3
            id="role-evidence-heading"
            className="mb-4 flex items-center gap-2 text-sm font-semibold"
          >
            <BriefcaseIcon aria-hidden="true" />
            Professional experience
          </h3>
          <ExperienceList records={evidence.experience} card />
        </section>
      ) : null}

      {evidence.projects.length > 0 ? (
        <section className="mt-8" aria-labelledby="project-evidence-heading">
          <h3
            id="project-evidence-heading"
            className="mb-4 flex items-center gap-2 text-sm font-semibold"
          >
            <SquaresFourIcon aria-hidden="true" />
            Projects
          </h3>
          <div className="grid gap-5">
            {evidence.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
