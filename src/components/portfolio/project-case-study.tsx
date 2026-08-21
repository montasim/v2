import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  GitCommitIcon,
} from "@phosphor-icons/react"
import { BadgeList } from "@/components/shared/badge-list"
import {
  ExternalAction,
  ExternalLink,
} from "@/components/shared/navigation-action"
import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { optimizedImage } from "@/lib/assets"
import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import { profileCatalog } from "@/lib/content/profile"
import { cn } from "@/lib/utils"

const coreSectionLinks = [
  ["problem", "Problem"],
  ["constraints", "Constraints"],
  ["architecture", "Architecture"],
  ["decisions", "Decisions"],
  ["contribution", "Contribution"],
  ["outcomes", "Outcomes"],
] as const
const screenshotSectionLink = ["screenshots", "Screenshot"] as const

type SectionId =
  (typeof coreSectionLinks)[number][0] | (typeof screenshotSectionLink)[0]

function SectionHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2
      id={`${id}-heading`}
      className="text-2xl font-semibold tracking-tight text-emphasis-foreground"
    >
      {children}
    </h2>
  )
}

function githubRepositoryPath(githubUrl: string) {
  return new URL(githubUrl).pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/, "")
}

function CaseStudyFeedback({ caseStudy }: { caseStudy: ProjectCaseStudy }) {
  const projectTitle = caseStudy.project.title
  const emailSubject = `A similar problem to ${projectTitle}`
  const emailBody = `I read the ${projectTitle} case study and would like to discuss a similar problem.`
  const emailHref = `mailto:${profileCatalog.profile.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  return (
    <section
      aria-labelledby="case-study-feedback-heading"
      className="mt-12 border-y py-8 sm:py-10"
    >
      <h2
        id="case-study-feedback-heading"
        className="text-2xl font-semibold tracking-tight text-emphasis-foreground"
      >
        Was this relevant to your role?
      </h2>
      <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
        Share a similar challenge and start a focused conversation.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          asChild
          className="bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80"
        >
          <a href={emailHref}>
            <EnvelopeSimpleIcon />
            Discuss similar problem
          </a>
        </Button>
      </div>
    </section>
  )
}

export function ProjectCaseStudyPage({
  caseStudy,
  nextCaseStudy,
}: {
  caseStudy: ProjectCaseStudy
  nextCaseStudy: ProjectCaseStudy
}) {
  const { project } = caseStudy
  const repositoryPath = githubRepositoryPath(project.githubUrl)
  const lastCommitBadgeUrl = `https://img.shields.io/github/last-commit/${repositoryPath}?style=flat&label=last%20commit`
  const imageName = project.imageUrl?.split("/").at(-1)
  const image =
    imageName && caseStudy.screenshot
      ? optimizedImage(`/images/projects/${imageName}`)
      : undefined
  const sectionLinks = image
    ? [...coreSectionLinks, screenshotSectionLink]
    : coreSectionLinks
  const commitUrl = `${project.githubUrl}/tree/${caseStudy.verifiedCommit}`
  const [activeSection, setActiveSection] = useState<SectionId>(
    coreSectionLinks[0][0]
  )

  useEffect(() => {
    let animationFrame = 0

    const updateActiveSection = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const readingLine = window.innerWidth >= 1024 ? 112 : 96
        let currentSection: SectionId = coreSectionLinks[0][0]

        for (const [sectionId] of sectionLinks) {
          const section = document.getElementById(sectionId)
          if (!section || section.getBoundingClientRect().top > readingLine) {
            break
          }
          currentSection = sectionId
        }

        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
        ) {
          currentSection = sectionLinks.at(-1)?.[0] ?? currentSection
        }

        setActiveSection(currentSection)
      })
    }

    setActiveSection(coreSectionLinks[0][0])
    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [caseStudy.slug, image])

  return (
    <PageShell padded className="pb-20">
      <header>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Overview</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Project case study</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="w-auto max-w-[80%] text-3xl leading-tight font-bold tracking-tight text-balance text-emphasis-foreground">
                {project.title}
              </h1>
              <Badge variant="secondary" className="font-medium">
                {project.type}
              </Badge>
              <ExternalLink
                href={`${project.githubUrl}/commits/${caseStudy.verifiedBranch}`}
                aria-label={`View the latest commits for ${project.title}`}
                className="shrink-0 leading-none"
              >
                <img
                  src={lastCommitBadgeUrl}
                  alt="Last commit"
                  width="118"
                  height="20"
                  loading="lazy"
                  className="h-5 w-auto"
                />
              </ExternalLink>
            </div>
            <p className="mt-5 max-w-[62ch] text-base leading-7 text-muted-foreground sm:text-lg">
              {caseStudy.summary}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {project.liveUrl ? (
              <ExternalAction
                href={project.liveUrl}
                size="lg"
                className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
              >
                Open product
                <ArrowUpRightIcon />
              </ExternalAction>
            ) : null}
            <ExternalAction
              href={project.githubUrl}
              variant="outline"
              size="lg"
            >
              <GithubLogoIcon />
              Source
            </ExternalAction>
          </div>
        </div>

        <dl className="mt-10 grid border-y sm:grid-cols-3 sm:divide-x">
          {[
            ["Role", caseStudy.role],
            ["Scope", caseStudy.scope],
            ["Status", caseStudy.status],
          ].map(([label, value]) => (
            <div key={label} className="py-5 sm:px-5 sm:first:pl-0">
              <dt className="text-xs font-medium text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1.5 text-sm leading-6 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      {image && caseStudy.screenshot ? (
        <figure className="mt-10 overflow-hidden rounded-xl border bg-card p-2 sm:p-3">
          <img
            src={image}
            alt={caseStudy.screenshot.alt}
            width="1600"
            height="1000"
            fetchPriority="high"
            className="aspect-[16/10] w-full rounded-lg border object-cover object-top"
          />
        </figure>
      ) : null}

      <div className="mt-14 grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium text-muted-foreground">
            On this page
          </p>
          <nav aria-label="Case study sections" className="mt-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm lg:block lg:space-y-2">
              {sectionLinks.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "location" : undefined}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "block rounded-sm border-l-2 py-0.5 pl-3 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none",
                      activeSection === id
                        ? "border-emphasis-foreground font-semibold text-emphasis-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ExternalLink
            href={commitUrl}
            className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <GitCommitIcon className="size-4" />
            {caseStudy.verifiedBranch} @ {caseStudy.verifiedCommit.slice(0, 7)}
          </ExternalLink>
        </aside>

        <div className="min-w-0 border-t">
          <section
            id="problem"
            aria-labelledby="problem-heading"
            className="scroll-mt-24 py-10"
          >
            <SectionHeading id="problem">Problem</SectionHeading>
            <p className="mt-5 max-w-[68ch] text-base leading-7 text-muted-foreground">
              {caseStudy.problem}
            </p>
          </section>

          <section
            id="constraints"
            aria-labelledby="constraints-heading"
            className="scroll-mt-24 border-t py-10"
          >
            <SectionHeading id="constraints">Constraints</SectionHeading>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
              {caseStudy.constraints.map((constraint, index) => (
                <li key={constraint} className="bg-card p-5">
                  <span className="font-mono text-xs text-muted-foreground">
                    C{index + 1}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-emphasis-foreground">
                    {constraint}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="architecture"
            aria-labelledby="architecture-heading"
            className="scroll-mt-24 border-t py-10"
          >
            <SectionHeading id="architecture">Architecture</SectionHeading>
            <p className="mt-5 max-w-[68ch] text-base leading-7 text-muted-foreground">
              {caseStudy.architecture.summary}
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {caseStudy.architecture.layers.map((layer, index) => (
                <div
                  key={layer.title}
                  className="relative rounded-lg border bg-card p-5"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-semibold text-emphasis-foreground">
                    {layer.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {layer.detail}
                  </p>
                  {index % 2 === 0 &&
                  index < caseStudy.architecture.layers.length - 1 ? (
                    <ArrowRightIcon
                      className="absolute -right-2.5 bottom-5 z-10 hidden size-5 rounded-full border bg-background p-1 text-muted-foreground md:block"
                      aria-hidden
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section
            id="decisions"
            aria-labelledby="decisions-heading"
            className="scroll-mt-24 border-t py-10"
          >
            <SectionHeading id="decisions">Decisions</SectionHeading>
            <div className="mt-6 divide-y border-y">
              {caseStudy.decisions.map((decision, index) => (
                <article
                  key={decision.title}
                  className="grid gap-2 py-5 sm:grid-cols-[2rem_15rem_minmax(0,1fr)] sm:gap-4"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    D{index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-emphasis-foreground">
                    {decision.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {decision.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid border-t md:grid-cols-2 md:divide-x">
            <section
              id="contribution"
              aria-labelledby="contribution-heading"
              className="scroll-mt-24 py-10 md:pr-8"
            >
              <SectionHeading id="contribution">Contribution</SectionHeading>
              <ul className="mt-6 space-y-4">
                {caseStudy.contribution.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <CheckCircleIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section
              id="outcomes"
              aria-labelledby="outcomes-heading"
              className="scroll-mt-24 border-t py-10 md:border-t-0 md:pl-8"
            >
              <SectionHeading id="outcomes">Outcomes</SectionHeading>
              <ul className="mt-6 space-y-4">
                {caseStudy.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <CheckCircleIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {image && caseStudy.screenshot ? (
            <section
              id="screenshots"
              aria-labelledby="screenshots-heading"
              className="scroll-mt-24 border-t py-10"
            >
              <SectionHeading id="screenshots">
                Product screenshot
              </SectionHeading>
              <figure className="mt-6">
                <div className="overflow-hidden rounded-lg border bg-card p-2">
                  <img
                    src={image}
                    alt={caseStudy.screenshot.alt}
                    width="1600"
                    height="1000"
                    loading="lazy"
                    className="aspect-[16/10] w-full rounded-md border object-cover object-top"
                  />
                </div>
                <figcaption className="mt-3 max-w-[68ch] text-sm leading-6 text-muted-foreground">
                  {caseStudy.screenshot.caption}
                </figcaption>
              </figure>
            </section>
          ) : null}

          <section className="border-t py-10" aria-labelledby="stack-heading">
            <h2 id="stack-heading" className="text-lg font-semibold">
              Verified stack
            </h2>
            <BadgeList
              items={project.technologies}
              label={`Verified technologies used by ${project.title}`}
              className="mt-4"
            />
          </section>
        </div>
      </div>

      <CaseStudyFeedback caseStudy={caseStudy} />

      <footer className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg" className="w-auto">
          <Link to="/projects">
            <ArrowLeftIcon />
            All projects
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="ml-auto w-auto">
          <Link to="/projects/$slug" params={{ slug: nextCaseStudy.slug }}>
            Next: {nextCaseStudy.project.title}
            <ArrowRightIcon />
          </Link>
        </Button>
      </footer>
    </PageShell>
  )
}
