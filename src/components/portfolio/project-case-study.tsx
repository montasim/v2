import {
  getPageScrollEventTarget,
  isPageScrolledToEnd,
} from "@/lib/page-scroll"
import { ProjectEngagement } from "@/components/portfolio/project-engagement"
import { StoreBadges } from "@/components/shared/store-badges"
import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  GitCommitIcon,
} from "@/components/ui/icons"
import { BadgeList } from "@/components/shared/badge-list"
import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import { CaseStudySwitcher } from "@/components/portfolio/project-switcher"
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
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { YouTubeVideo } from "@/components/shared/youtube-video"
import {
  getProjectViewCount,
  recordProjectView,
} from "@/features/project-views/application/project-views"
import { contactHref } from "@/features/contact/domain/contact"
import { useVisitorCount } from "@/features/visitor-count/use-visitor-count"
import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import { cn } from "@/lib/utils"
import { ContentMediaGallery } from "@/components/shared/content-media-gallery"
import { ContentPreviewImage } from "@/components/shared/content-preview-image"
import { blogCatalog } from "@/lib/content/blog"
import { getProjectMedia } from "@/lib/content/project-media"
import { LanguageSwitch } from "@/components/shared/language-switch"
import type { ContentLanguage } from "@/lib/content/content-language"
import {
  hasCaseStudyTranslation,
  localizeCaseStudy,
} from "@/lib/content/project-case-studies"

const coreSectionIds = [
  "problem",
  "constraints",
  "architecture",
  "decisions",
  "contribution",
  "outcomes",
] as const

type SectionId = (typeof coreSectionIds)[number] | "screenshots"

const caseStudyLabels = {
  en: {
    problem: "Problem",
    constraints: "Constraints",
    architecture: "Architecture",
    decisions: "Decisions",
    contribution: "Contribution",
    outcomes: "Outcomes",
    screenshots: "Screenshot",
    role: "Role",
    scope: "Scope",
    status: "Status",
  },
  bn: {
    problem: "সমস্যা",
    constraints: "সীমাবদ্ধতা",
    architecture: "Architecture",
    decisions: "সিদ্ধান্ত",
    contribution: "অবদান",
    outcomes: "ফলাফল",
    screenshots: "Screenshot",
    role: "ভূমিকা",
    scope: "পরিসর",
    status: "অবস্থা",
  },
} as const satisfies Record<
  ContentLanguage,
  Record<SectionId | "role" | "scope" | "status", string>
>

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
      className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl"
    >
      {children}
    </h2>
  )
}

function CaseStudyFeedback({ slug }: { slug: string }) {
  return (
    <section
      aria-labelledby="case-study-feedback-heading"
      className="border-y py-10"
    >
      <h2
        id="case-study-feedback-heading"
        className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl"
      >
        Working through something similar?
      </h2>
      <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
        Share your challenge, scope, and timeline to start a focused
        conversation.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80"
          asChild
        >
          <a
            href={contactHref({
              topic: "collaboration",
              from: `/case-studies/${slug}`,
            })}
          >
            <EnvelopeSimpleIcon />
            Discuss a project
          </a>
        </Button>
      </div>
    </section>
  )
}

export function ProjectCaseStudyPage({
  caseStudy,
  nextCaseStudy,
  language = "en",
  onLanguageChange,
}: {
  caseStudy: ProjectCaseStudy
  nextCaseStudy: ProjectCaseStudy
  language?: ContentLanguage
  onLanguageChange?: (language: ContentLanguage) => void
}) {
  const content = localizeCaseStudy(caseStudy, language)
  const labels = caseStudyLabels[content.language]
  const getViewCount = useServerFn(getProjectViewCount)
  const recordView = useServerFn(recordProjectView)
  const { project } = caseStudy
  const publicGithubUrl =
    !project.clientWork && !project.githubRepositoryPrivate
      ? project.githubUrl
      : undefined
  const media = getProjectMedia(project, content.screenshot?.alt)
  // Projects without a demo or screenshots fall back to their article illustration.
  const illustration = blogCatalog.findByProjectId(project.id)?.image
  const sectionLinks = [
    ...coreSectionIds,
    ...(media.length > 0 ? (["screenshots"] as const) : []),
  ].map((id) => [id, labels[id]] as const)
  const commitUrl = `${project.githubUrl}/tree/${caseStudy.verifiedCommit}`
  const [activeSection, setActiveSection] = useState<SectionId>(
    coreSectionIds[0]
  )
  // Views are still recorded for analytics; the count is no longer shown.
  useVisitorCount({
    resourceKey: "project-case-study",
    slug: caseStudy.slug,
    getCount: getViewCount,
    recordView,
  })

  useEffect(() => {
    let animationFrame = 0

    const updateActiveSection = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const readingLine = window.innerWidth >= 1024 ? 112 : 96
        let currentSection: SectionId = coreSectionIds[0]

        for (const [sectionId] of sectionLinks) {
          const section = document.getElementById(sectionId)
          if (!section || section.getBoundingClientRect().top > readingLine) {
            break
          }
          currentSection = sectionId
        }

        if (
          isPageScrolledToEnd()
        ) {
          currentSection = sectionLinks.at(-1)?.[0] ?? currentSection
        }

        setActiveSection(currentSection)
      })
    }

    setActiveSection(coreSectionIds[0])
    updateActiveSection()
    const scrollTarget = getPageScrollEventTarget()
    scrollTarget.addEventListener("scroll", updateActiveSection, {
      passive: true,
    })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      scrollTarget.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [caseStudy.slug, media.length])

  return (
    <PageShell className="pt-10 pb-6">
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
                <Link to="/case-studies" search={{ filter: "all", q: "" }}>
                  Case studies
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <CaseStudySwitcher
                current={caseStudy}
                label={`${project.title} case study`}
              />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="w-auto max-w-[80%] text-xl leading-tight font-bold tracking-tight text-balance text-strong-foreground sm:text-3xl">
                {project.title}
              </h1>
              <Badge variant="secondary" className="font-medium">
                <ProjectTypeIcon type={project.type} className="size-[1em]" />
                {project.type === "desktop" ? "desktop app" : project.type}
              </Badge>
              {hasCaseStudyTranslation(caseStudy.slug) && onLanguageChange ? (
                <div className="sm:ml-auto">
                  <LanguageSwitch
                    label="Case study language"
                    language={content.language}
                    onChange={onLanguageChange}
                  />
                </div>
              ) : null}
            </div>
            <p
              lang={content.language}
              className="mt-4.5 text-base leading-7 text-muted-foreground sm:text-lg"
            >
              {content.summary}
            </p>
            <ProjectEngagement project={project} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 sm:justify-between">
            <StoreBadges project={project} />
            <div
              className="flex flex-wrap items-center gap-2 sm:ml-auto"
              role="group"
              aria-label={`${project.title} actions`}
            >
              {publicGithubUrl ? (
                <ExternalAction
                  href={publicGithubUrl}
                  variant="outline"
                  size="lg"
                >
                  <GithubLogoIcon />
                  Source
                </ExternalAction>
              ) : null}
              {project.liveUrl ? (
                <ExternalAction
                  href={project.liveUrl}
                  size="lg"
                  className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
                >
                  Website
                  <ArrowUpRightIcon />
                </ExternalAction>
              ) : null}
            </div>
          </div>
        </div>

        <dl
          lang={content.language}
          className="mt-10 grid border-y sm:grid-cols-3 sm:divide-x"
        >
          {[
            [labels.role, content.role],
            [labels.scope, content.scope],
            [labels.status, content.status],
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

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-[clamp(2.5rem,5.5vw,4rem)]">
        <aside className="sticky top-14 z-30 flex items-center gap-2.5 overflow-x-auto rounded-xl border bg-background/95 px-2.5 py-2 backdrop-blur-sm lg:top-24 lg:grid lg:gap-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="mr-1 shrink-0 text-xs font-medium text-muted-foreground lg:mb-2.5">
            On this page
          </p>
          <nav aria-label="Case study sections">
            <ul className="flex text-[0.8125rem] lg:grid">
              {sectionLinks.map(([id, label]) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "location" : undefined}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:rounded-none lg:border-l lg:px-0 lg:py-1.75 lg:pl-3",
                      activeSection === id
                        ? "bg-muted font-semibold text-strong-foreground lg:border-emphasis-foreground lg:bg-transparent"
                        : "border-transparent hover:bg-muted hover:text-foreground lg:hover:bg-transparent"
                    )}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {publicGithubUrl ? (
            <ExternalLink
              href={commitUrl}
              className="mt-6 hidden items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:underline lg:inline-flex"
            >
              <GitCommitIcon className="size-4" />
              {caseStudy.verifiedBranch} @{" "}
              {caseStudy.verifiedCommit.slice(0, 7)}
            </ExternalLink>
          ) : null}
        </aside>

        <div className="min-w-0" lang={content.language}>
          {project.youtubeVideoId ? (
            <figure className="mb-10 overflow-hidden rounded-xl border bg-card p-2 sm:p-3">
              <YouTubeVideo
                videoId={project.youtubeVideoId}
                title={`${project.title} product demonstration`}
                loading="eager"
                className="rounded-lg"
              />
            </figure>
          ) : media.length > 0 ? (
            <figure className="mb-10 overflow-hidden rounded-xl border bg-card p-2 sm:p-3">
              <ContentMediaGallery media={media} priority />
            </figure>
          ) : illustration ? (
            <figure className="mb-10 overflow-hidden rounded-xl border bg-card p-2 sm:p-3">
              <ContentPreviewImage
                src={illustration.src}
                alt={illustration.alt}
                width="1600"
                height="1000"
                fetchPriority="high"
                className="h-auto w-full rounded-lg border"
              />
            </figure>
          ) : null}
          <section
            id="problem"
            aria-labelledby="problem-heading"
            className="scroll-mt-24 pb-10"
          >
            <SectionHeading id="problem">{labels.problem}</SectionHeading>
            <p className="mt-5 max-w-[68ch] text-base leading-7 text-muted-foreground">
              {content.problem}
            </p>
          </section>

          <section
            id="constraints"
            aria-labelledby="constraints-heading"
            className="scroll-mt-24 border-t py-10"
          >
            <SectionHeading id="constraints">
              {labels.constraints}
            </SectionHeading>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-background md:grid-cols-3">
              {content.constraints.map((constraint, index) => (
                <li key={constraint} className="bg-card p-5">
                  <span className="font-mono text-xs text-muted-foreground">
                    C{index + 1}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-strong-foreground">
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
            <SectionHeading id="architecture">
              {labels.architecture}
            </SectionHeading>
            <p className="mt-5 max-w-[68ch] text-base leading-7 text-muted-foreground">
              {content.architecture.summary}
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-2">
              {content.architecture.layers.map((layer, index) => (
                <div
                  key={layer.title}
                  className="relative rounded-lg border bg-card p-5"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-semibold text-strong-foreground">
                    {layer.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {layer.detail}
                  </p>
                  {index % 2 === 0 &&
                  index < content.architecture.layers.length - 1 ? (
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
            <SectionHeading id="decisions">{labels.decisions}</SectionHeading>
            <div className="mt-6 divide-y border-y">
              {content.decisions.map((decision, index) => (
                <article
                  key={decision.title}
                  className="grid gap-2 py-5 sm:grid-cols-[2rem_15rem_minmax(0,1fr)] sm:gap-4"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    D{index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-strong-foreground">
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
              <SectionHeading id="contribution">
                {labels.contribution}
              </SectionHeading>
              <ul className="mt-6 space-y-4">
                {content.contribution.map((item) => (
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
              <SectionHeading id="outcomes">{labels.outcomes}</SectionHeading>
              <ul className="mt-6 space-y-4">
                {content.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <CheckCircleIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {media.length > 0 && content.screenshot ? (
            <section
              id="screenshots"
              aria-labelledby="screenshots-heading"
              className="scroll-mt-24 border-t py-10"
            >
              <SectionHeading id="screenshots">
                {content.language === "bn"
                  ? "Product screenshot"
                  : `Product ${media.length > 1 ? "screenshots" : "screenshot"}`}
              </SectionHeading>
              <figure className="mt-6">
                <div className="overflow-hidden rounded-lg border bg-card p-2">
                  <ContentMediaGallery media={media} />
                </div>
                <figcaption className="mt-3 max-w-[68ch] text-sm leading-6 text-muted-foreground">
                  {content.screenshot.caption}
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

          <CaseStudyFeedback slug={caseStudy.slug} />

          <footer className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg" className="w-auto">
              <Link to="/case-studies" search={{ filter: "all", q: "" }}>
                <ArrowLeftCompactIcon />
                All case studies
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="ml-auto w-auto"
            >
              <Link
                to="/case-studies/$slug"
                params={{ slug: nextCaseStudy.slug }}
              >
                Next: {nextCaseStudy.project.title}
                <ArrowRightCompactIcon />
              </Link>
            </Button>
          </footer>
        </div>
      </div>
    </PageShell>
  )
}
