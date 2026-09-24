import { Link } from "@tanstack/react-router"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  ArrowUpRightIcon,
  BookOpenTextIcon,
  ChromeIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  MicrosoftStoreIcon,
  PackageIcon,
  PencilSimpleIcon,
} from "@/components/ui/icons"
import { BadgeList } from "@/components/shared/badge-list"
import { ExternalAction } from "@/components/shared/navigation-action"
import { PageShell } from "@/components/shared/page-shell"
import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { Project } from "@/lib/content/projects"
import type { ProjectCaseStudy } from "@/lib/content/project-case-studies"
import type { BlogPost } from "@/lib/content/blog"
import { optimizedImage } from "@/lib/assets"
import { requestPortfolioInquiry } from "@/features/chat/ui/assistant-request"
import {
  ProjectReadmeDocument,
  type ProjectReadmeSource,
} from "@/components/portfolio/project-readme-document"
import { YouTubeVideo } from "@/components/shared/youtube-video"

export function ProjectDetailPage({
  project,
  nextProject,
  caseStudy,
  blogPost,
  readmeSource,
}: {
  project: Project
  nextProject: Project
  caseStudy?: ProjectCaseStudy
  blogPost?: BlogPost
  readmeSource?: ProjectReadmeSource
}) {
  const imageName = project.imageUrl?.split("/").at(-1)
  const image =
    imageName && caseStudy?.screenshot
      ? optimizedImage(`/images/projects/${imageName}`)
      : undefined

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
                <Link to="/projects" search={{ filter: "all" }}>
                  Projects
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.title} details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-strong-foreground sm:text-4xl">
                {project.title}
              </h1>
              <Badge variant="secondary" className="font-medium">
                <ProjectTypeIcon type={project.type} className="size-[1em]" />
                {project.type === "desktop" ? "desktop app" : project.type}
              </Badge>
            </div>
            <p className="mt-5 max-w-[65ch] text-base leading-7 text-muted-foreground sm:text-lg">
              {project.description}
            </p>
          </div>
          <div
            className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end"
            role="group"
            aria-label={`${project.title} actions`}
          >
            {project.chromeWebStoreUrl ? (
              <ExternalAction
                href={project.chromeWebStoreUrl}
                size="lg"
                className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
              >
                <ChromeIcon />
                Chrome Web Store
              </ExternalAction>
            ) : null}
            {project.snapcraftUrl ? (
              <ExternalAction
                href={project.snapcraftUrl}
                size="lg"
                variant="outline"
              >
                <PackageIcon />
                Snap Store
              </ExternalAction>
            ) : null}
            {project.microsoftStoreUrl ? (
              <ExternalAction
                href={project.microsoftStoreUrl}
                size="lg"
                variant="outline"
              >
                <MicrosoftStoreIcon />
                Microsoft Store
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
            {!project.githubRepositoryPrivate && project.githubUrl ? (
              <ExternalAction
                href={project.githubUrl}
                variant="outline"
                size="lg"
              >
                <GithubLogoIcon />
                Source
              </ExternalAction>
            ) : null}
          </div>
        </div>
      </header>

      {project.youtubeVideoId ? (
        <figure className="mt-10 overflow-hidden rounded-xl border bg-card p-2 sm:p-3">
          <YouTubeVideo
            videoId={project.youtubeVideoId}
            title={`${project.title} product demonstration`}
            loading="eager"
            className="rounded-lg"
          />
        </figure>
      ) : image && caseStudy?.screenshot ? (
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
      ) : project.snapcraftUrl ? (
        <iframe
          src={`${project.snapcraftUrl}/embedded?button=black`}
          title={`${project.title} on the Snap Store`}
          loading="eager"
          className="mt-10 h-[380px] w-full rounded-xl border bg-card"
        />
      ) : null}

      <div className="mt-12 w-full">
        <div>
          {readmeSource ? (
            <ProjectReadmeDocument source={readmeSource} />
          ) : (
            <section className="border-t py-10">
              <h2 className="text-xl font-semibold">README unavailable</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A README has not been connected to this project yet.
              </p>
            </section>
          )}
        </div>

        <section
          className="mt-12 border-t py-6"
          aria-labelledby="project-stack-heading"
        >
          <h2
            id="project-stack-heading"
            className="text-sm font-semibold text-strong-foreground"
          >
            Project stack
          </h2>
          <BadgeList
            items={project.technologies}
            label={`Technologies used by ${project.title}`}
            className="mt-4"
          />
          {caseStudy || blogPost ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {caseStudy ? (
                <Button asChild variant="outline">
                  <Link
                    to="/case-studies/$slug"
                    params={{ slug: caseStudy.slug }}
                  >
                    <BookOpenTextIcon />
                    Read case study
                  </Link>
                </Button>
              ) : null}
              {blogPost ? (
                <Button asChild variant="outline">
                  <Link to="/blog/$slug" params={{ slug: blogPost.slug }}>
                    <PencilSimpleIcon />
                    Read blog post
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="project-feedback-heading"
          className="mt-12 border-y py-8 sm:py-10"
        >
          <h2
            id="project-feedback-heading"
            className="text-xl font-semibold tracking-tight text-strong-foreground sm:text-2xl"
          >
            Working through something similar?
          </h2>
          <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
            Share your challenge, scope, and timeline to start a focused
            conversation.
          </p>
          <Button
            className="mt-6 bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80"
            onClick={() => requestPortfolioInquiry({ inquiryType: "project" })}
          >
            <EnvelopeSimpleIcon />
            Discuss a project
          </Button>
        </section>

        <footer className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="lg" className="w-auto">
            <Link to="/projects" search={{ filter: "all" }}>
              <ArrowLeftCompactIcon />
              All projects
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="ml-auto w-auto"
          >
            <Link
              to="/projects/$slug"
              params={{ slug: nextProject.id.replace(/^project-/, "") }}
            >
              Next: {nextProject.title}
              <ArrowRightCompactIcon />
            </Link>
          </Button>
        </footer>
      </div>
    </PageShell>
  )
}
