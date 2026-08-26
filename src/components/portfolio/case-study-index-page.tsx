import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"

import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import { PageShell } from "@/components/shared/page-shell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  BookOpenTextIcon,
  FunnelSimpleIcon,
  SearchIcon,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { optimizedImage } from "@/lib/assets"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import type {
  ProjectCaseStudy,
  ProjectCaseStudyFilter,
} from "@/lib/content/project-case-studies"
import { cn } from "@/lib/utils"

function projectImage(caseStudy: ProjectCaseStudy) {
  const source = caseStudy.project.imageUrl
  if (!source) return undefined
  const name = source.split("/").at(-1)
  return name ? optimizedImage(`/images/projects/${name}`) : undefined
}

function CaseStudyCard({ caseStudy }: { caseStudy: ProjectCaseStudy }) {
  const { project } = caseStudy
  const image = projectImage(caseStudy)

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card p-2 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-emphasis-foreground motion-reduce:transition-none">
      <Link
        to="/projects/$slug"
        params={{ slug: caseStudy.slug }}
        aria-label={`Read the ${project.title} case study`}
        className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {image ? (
          <img
            src={image}
            alt={`${project.title} interface preview`}
            width="720"
            height="450"
            loading="lazy"
            className="aspect-[16/10] w-full rounded-lg border object-cover object-top grayscale transition-[filter,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.012] group-hover:grayscale-0 motion-reduce:transition-none"
          />
        ) : (
          <div className="grid aspect-[16/10] place-items-center rounded-lg border bg-muted/35 text-muted-foreground">
            <span className="flex flex-col items-center gap-2 text-xs font-medium">
              <BookOpenTextIcon className="size-6" />
              Documentation-led case study
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col px-2.5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3 text-[0.6875rem]">
            <p className="flex items-center gap-1.5 font-bold tracking-[0.06em] text-strong-foreground uppercase">
              <ProjectTypeIcon type={project.type} className="size-[1em]" />
              {project.type}
            </p>
            <span className="truncate text-muted-foreground">
              {caseStudy.status}
            </span>
          </div>

          <h2 className="mt-3 text-lg leading-[1.375] font-semibold tracking-[-0.015em] text-balance text-strong-foreground">
            {project.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-[0.8125rem] leading-[1.55] text-muted-foreground">
            {caseStudy.summary}
          </p>

          <div className="mt-auto flex items-end justify-between gap-4 pt-5 text-xs">
            <p className="min-w-0 text-muted-foreground">
              <span className="block text-[0.625rem] font-bold tracking-[0.06em] uppercase">
                Role
              </span>
              <span className="mt-1 line-clamp-1 block">{caseStudy.role}</span>
            </p>
            <span className="flex shrink-0 items-center gap-1.5 font-semibold text-strong-foreground">
              Read
              <ArrowRightCompactIcon className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function FeaturedCaseStudy({ caseStudy }: { caseStudy: ProjectCaseStudy }) {
  const { project } = caseStudy
  const image = projectImage(caseStudy)

  return (
    <article>
      <Link
        to="/projects/$slug"
        params={{ slug: caseStudy.slug }}
        aria-label={`Read the ${project.title} case study`}
        className="group grid gap-0 overflow-hidden rounded-xl border bg-card p-1.5 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emphasis-foreground focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none lg:grid-cols-[13fr_7fr] lg:p-2.5"
      >
        <div className="min-h-57.5 overflow-hidden rounded-lg border bg-muted/35 sm:min-h-85 lg:min-h-100">
          {image ? (
            <img
              src={image}
              alt={`${project.title} interface preview`}
              width="1200"
              height="900"
              fetchPriority="high"
              className="h-full w-full object-cover object-top contrast-[1.02] grayscale transition-[transform,filter] duration-300 group-hover:scale-[1.012] group-hover:grayscale-0 motion-reduce:transition-none"
            />
          ) : (
            <div className="grid h-full min-h-57.5 place-items-center text-muted-foreground sm:min-h-85 lg:min-h-100">
              <span className="flex flex-col items-center gap-3 text-sm font-medium">
                <BookOpenTextIcon className="size-8" />
                Documentation-led case study
              </span>
            </div>
          )}
        </div>

        <div className="flex min-h-70 flex-col justify-between px-4.5 pt-6 pb-4.5 text-strong-foreground sm:p-6 lg:min-h-100 lg:p-8">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.06em] text-strong-foreground uppercase">
              <ProjectTypeIcon type={project.type} className="size-[1em]" />
              {project.type}
            </p>
            <h2 className="mt-3.5 text-[1.625rem] leading-tight font-bold tracking-[-0.025em] text-balance text-strong-foreground">
              {project.title}
            </h2>
            <p className="mt-4 max-w-[38ch] text-sm leading-[1.65] text-muted-foreground">
              {caseStudy.summary}
            </p>
          </div>

          <div className="mt-8">
            <dl className="grid grid-cols-2 gap-4 border-y py-4 text-xs">
              <div>
                <dt className="font-bold tracking-[0.06em] text-muted-foreground uppercase">
                  Role
                </dt>
                <dd className="mt-1.5 line-clamp-2 leading-5">
                  {caseStudy.role}
                </dd>
              </div>
              <div>
                <dt className="font-bold tracking-[0.06em] text-muted-foreground uppercase">
                  Status
                </dt>
                <dd className="mt-1.5 line-clamp-2 leading-5">
                  {caseStudy.status}
                </dd>
              </div>
            </dl>
            <span className="mt-5 flex items-center justify-end gap-1.5 text-xs font-semibold text-strong-foreground">
              Read case study
              <ArrowRightCompactIcon className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function FeaturedCaseStudyCarousel({
  caseStudies,
}: {
  caseStudies: readonly ProjectCaseStudy[]
}) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const pointerStartX = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [inViewport, setInViewport] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [dragging, setDragging] = useState(false)
  const interactionPaused = hovered || focusWithin || dragging

  useEffect(() => {
    const element = carouselRef.current
    if (!element) return
    if (!("IntersectionObserver" in window)) {
      setInViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (caseStudies.length < 2 || !inViewport || interactionPaused) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setSelectedIndex((index) => (index + 1) % caseStudies.length)
      }
    }, 6000)

    return () => window.clearInterval(timer)
  }, [caseStudies.length, inViewport, interactionPaused, selectedIndex])

  if (!caseStudies.length) return null

  const currentCaseStudy = caseStudies[selectedIndex] ?? caseStudies[0]
  const showPrevious = () =>
    setSelectedIndex(
      (index) => (index - 1 + caseStudies.length) % caseStudies.length
    )
  const showNext = () =>
    setSelectedIndex((index) => (index + 1) % caseStudies.length)

  return (
    <div
      ref={carouselRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured case studies"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX
        setDragging(true)
      }}
      onPointerUp={(event) => {
        const startX = pointerStartX.current
        pointerStartX.current = null
        setDragging(false)
        if (startX === null) return

        const distance = event.clientX - startX
        if (Math.abs(distance) < 48) return
        suppressClick.current = true
        event.preventDefault()
        if (distance > 0) showPrevious()
        else showNext()
        window.setTimeout(() => {
          suppressClick.current = false
        }, 0)
      }}
      onPointerCancel={() => {
        pointerStartX.current = null
        setDragging(false)
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <div className="mb-3.5 flex items-center justify-between gap-5">
        <h2
          id="featured-case-study-heading"
          className="text-sm font-semibold text-strong-foreground"
        >
          Featured case studies
        </h2>
        {caseStudies.length > 1 ? (
          <div className="flex min-h-7 items-center gap-2">
            <span className="inline-flex h-7 min-w-11 items-center justify-center font-mono text-xs leading-none text-muted-foreground tabular-nums">
              {String(selectedIndex + 1).padStart(2, "0")} /{" "}
              {String(caseStudies.length).padStart(2, "0")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={showPrevious}
              aria-label="Previous featured case study"
            >
              <ArrowLeftCompactIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={showNext}
              aria-label="Next featured case study"
            >
              <ArrowRightCompactIcon />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Featured</span>
        )}
      </div>

      <div className="relative">
        {caseStudies.length > 1 ? (
          <div
            className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px overflow-hidden"
            aria-hidden="true"
          >
            <div
              key={`featured-case-study-progress-${selectedIndex}-${inViewport}-${interactionPaused}`}
              className="featured-carousel-progress h-full bg-emphasis-foreground will-change-transform"
              style={{
                animationPlayState:
                  inViewport && !interactionPaused ? "running" : "paused",
              }}
            />
          </div>
        ) : null}
        <div
          key={currentCaseStudy.slug}
          role="group"
          aria-roledescription="slide"
          aria-label={`${selectedIndex + 1} of ${caseStudies.length}`}
          className="carousel-card-enter"
        >
          <FeaturedCaseStudy caseStudy={currentCaseStudy} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing featured case study {selectedIndex + 1} of {caseStudies.length}:{" "}
        {currentCaseStudy.project.title}
      </p>
    </div>
  )
}

export function CaseStudyIndexPage({
  filter,
  query,
  onQueryChange,
}: {
  filter: ProjectCaseStudyFilter
  query: string
  onQueryChange: (query: string) => void
}) {
  const caseStudies = projectCaseStudyCatalog.filter(filter, query)

  return (
    <PageShell className="pt-10 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Overview</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Case studies</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-8 border-b pb-8">
        <h1 className="text-xl leading-tight font-bold tracking-[-0.025em] text-balance text-strong-foreground sm:text-3xl">
          Case studies of software built to hold up.
        </h1>
        <p className="mt-4.5 max-w-[62ch] text-[1.0625rem] leading-[1.6] text-muted-foreground">
          Deep dives into the problems, architecture, tradeoffs, and outcomes
          behind my projects.
        </p>
      </header>

      <section
        aria-labelledby="featured-case-study-heading"
        className="border-b pt-8 pb-12"
      >
        <FeaturedCaseStudyCarousel
          caseStudies={projectCaseStudyCatalog.featured}
        />
      </section>

      <section
        aria-labelledby="browse-case-studies-heading"
        className="pt-13.5"
      >
        <div className="mb-6 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start max-md:gap-2">
          <h2
            id="browse-case-studies-heading"
            className="text-xl font-bold tracking-[-0.035em] text-strong-foreground sm:text-2xl"
          >
            Browse case studies
          </h2>
          <p className="text-[0.8125rem] leading-[1.55] text-muted-foreground md:text-right md:whitespace-nowrap">
            Search by project, decision, or technology, or narrow the archive by
            project type.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="case-study-search" className="sr-only">
            Search case studies
          </label>
          <input
            id="case-study-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by project, decision, or technology"
            className="min-h-10.5 w-full rounded-[0.625rem] border bg-card pr-3 pl-9.5 text-sm outline-none placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
          />
        </div>

        <nav
          aria-label="Filter case studies by project type"
          className="mt-4 flex [scrollbar-width:none] items-center gap-5 overflow-x-auto border-b sm:gap-7 [&::-webkit-scrollbar]:hidden"
        >
          <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
            <FunnelSimpleIcon className="size-3" aria-hidden="true" />
            Filter
          </span>
          {projectCaseStudyCatalog.filters.map((item) => {
            const isActive = item.value === filter
            return (
              <Link
                key={item.value}
                to="/case-studies"
                search={{ filter: item.value, q: query }}
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative shrink-0 rounded-sm pt-2 pb-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:after:transition-none",
                  isActive && "text-strong-foreground after:scale-x-100"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <p className="sr-only" aria-live="polite">
          {caseStudies.length}{" "}
          {caseStudies.length === 1 ? "case study" : "case studies"} found
        </p>

        {caseStudies.length ? (
          <div
            className={cn(
              "mt-3 grid gap-4",
              caseStudies.length === 1 && "max-w-95 grid-cols-1",
              caseStudies.length === 2 && "sm:grid-cols-2",
              caseStudies.length > 2 && "sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {caseStudies.map((caseStudy) => (
              <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed px-5 py-10 text-center text-muted-foreground">
            <h2 className="text-sm font-semibold text-strong-foreground">
              No matching case studies
            </h2>
            <p className="mt-1 text-[0.8125rem]">
              Try another project type or a broader search.
            </p>
            <Link
              to="/case-studies"
              search={{ filter: "all", q: "" }}
              className="mt-4 inline-flex rounded-md text-sm font-semibold text-strong-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  )
}
