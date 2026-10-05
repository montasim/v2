import { projectCatalog } from "@/lib/content/projects"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { Card, cardInsetClassName } from "@/components/ui/card"
import { BadgeList } from "@/components/shared/badge-list"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import { RichText } from "@/components/shared/rich-text"
import { experienceCatalog } from "@/lib/content/experience"
import type { Experience } from "@/lib/content/experience"

function RoleDetails({
  role,
  descriptionClassName = "mt-2",
  technologiesClassName = "mt-3",
}: {
  role: Experience
  descriptionClassName?: string
  technologiesClassName?: string
}) {
  const projects = projectCatalog.forEngagement(role.id)
  return (
    <>
      <p
        className={`${descriptionClassName} text-sm leading-relaxed text-muted-foreground`}
      >
        <RichText text={role.summary ?? role.description} />
      </p>
      {role.summary ? (
        <details className="mt-3 text-sm text-muted-foreground">
          <summary className="w-fit cursor-pointer rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">
            More about this engagement
          </summary>
          <p className="mt-3 leading-relaxed">
            <RichText text={role.description} />
          </p>
        </details>
      ) : null}
      {projects.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-strong-foreground">
            Related work
          </h3>
          <ul
            className="mt-2 list-disc space-y-3 pl-5"
            aria-label={`Related work for ${role.company}`}
          >
            {projects.map((project) => {
              const slug = project.id.replace(/^project-/, "")
              const caseStudy = projectCaseStudyCatalog.findBySlug(slug)
              return (
                <li key={project.id} className="text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <a
                      href={`/projects/${slug}`}
                      className="rounded-sm font-medium text-strong-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                    >
                      {project.title}
                    </a>
                    {caseStudy ? (
                      <a
                        href={`/case-studies/${caseStudy.slug}`}
                        aria-label={`Read ${project.title} case study`}
                        className="rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                      >
                        Read case study
                      </a>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      <BadgeList
        items={role.technologies}
        label={`Technologies used as ${role.role}`}
        className={technologiesClassName}
      />
    </>
  )
}

function CompanyPeriod({ roles }: { roles: Experience[] }) {
  return (
    <>
      {roles.at(-1)?.period?.split(" - ")[0]} -{" "}
      {roles[0]?.period?.split(" - ").at(-1)}
    </>
  )
}

function CompanyCard({
  company,
  roles,
}: {
  company: string
  roles: Experience[]
}) {
  const first = roles[0]

  if (roles.length === 1) {
    return (
      <Card asChild className={cardInsetClassName}>
        <article
          id={first.id}
          className="scroll-mt-20 target:ring-2 target:ring-primary/40"
        >
          <header className="flex items-start gap-3">
            {first.logoUrl && first.logo && (
              <EntityAvatar
                src={first.logoUrl}
                fallback={first.logo}
                className="mt-0.5 size-9 border-0"
                imageClassName="object-contain"
              />
            )}
            <div>
              <h2 className="text-sm font-semibold text-strong-foreground">
                {first.category === "independent" ? company : first.role}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  first.category === "independent" ? first.role : company,
                  first.period,
                  first.location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </header>
          <RoleDetails role={first} descriptionClassName="mt-4" />
        </article>
      </Card>
    )
  }

  return (
    <Card asChild className={cardInsetClassName}>
      <article>
        <header className="flex items-start gap-3">
          {first.logoUrl && first.logo && (
            <EntityAvatar
              src={first.logoUrl}
              fallback={first.logo}
              className="border-0"
              imageClassName="object-contain"
            />
          )}
          <div>
            <h2 className="font-semibold">{company}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <CompanyPeriod roles={roles} />
              {first.location && <> · {first.location}</>}
            </p>
          </div>
        </header>
        <ol
          className="relative mt-5 ml-6 space-y-5 before:absolute before:top-2 before:bottom-3 before:left-0 before:w-px before:bg-border"
          aria-label={`Roles at ${company}`}
        >
          {roles.map((role) => (
            <li
              key={role.id}
              id={role.id}
              className="relative scroll-mt-20 rounded-md pl-8 target:bg-muted/70 target:ring-2 target:ring-primary/40"
            >
              <span
                className="absolute top-1.5 -left-1 size-[0.5625rem] rounded-full bg-foreground"
                aria-hidden="true"
              />
              <h3 className="text-sm font-semibold text-strong-foreground">
                {role.role}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {role.period}
              </p>
              <RoleDetails role={role} />
            </li>
          ))}
        </ol>
      </article>
    </Card>
  )
}

function ExperienceRow({ role }: { role: Experience }) {
  return (
    <article
      id={role.id}
      className="grid scroll-mt-20 gap-4 border-b py-7 last:border-b-0 target:bg-muted/70 target:ring-2 target:ring-primary/40 sm:grid-cols-[11rem_minmax(0,1fr)]"
    >
      <div>
        <p className="text-sm font-medium">{role.period}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {role.location}
        </p>
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{role.role}</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {role.company}
        </p>
        <RoleDetails
          role={role}
          descriptionClassName="mt-4"
          technologiesClassName="mt-4"
        />
      </div>
    </article>
  )
}

export function ExperienceList({
  limit,
  card = false,
  records = experienceCatalog.records,
}: {
  limit?: number
  card?: boolean
  records?: readonly Experience[]
}) {
  if (card) {
    const companies = Array.from(
      new Set(records.map((role) => role.company))
    ).map((company) => ({
      company,
      roles: records.filter((role) => role.company === company),
    }))
    const groups = limit ? companies.slice(0, limit) : companies

    return (
      <div className="grid gap-5">
        {groups.map(({ company, roles }) => (
          <CompanyCard key={company} company={company} roles={roles} />
        ))}
      </div>
    )
  }

  const roles = limit ? records.slice(0, limit) : records

  return (
    <div className="grid gap-5">
      {roles.map((role) => (
        <ExperienceRow key={role.id} role={role} />
      ))}
    </div>
  )
}
