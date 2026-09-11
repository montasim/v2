import { Link } from "@tanstack/react-router"
import {
  ArrowUpRightIcon,
  BookOpenTextIcon,
  ChromeIcon,
  GithubLogoIcon,
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
import { cn } from "@/lib/utils"
import {
  ProjectReadmeDocument,
  type ProjectReadmeSource,
} from "@/components/portfolio/project-readme-document"

export function ProjectDetailPage({
  project,
  caseStudy,
  blogPost,
  readmeSource,
}: {
  project: Project
  caseStudy?: ProjectCaseStudy
  blogPost?: BlogPost
  readmeSource?: ProjectReadmeSource
}) {
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
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {project.chromeWebStoreUrl ? (
              <ExternalAction href={project.chromeWebStoreUrl} size="lg">
                <ChromeIcon />
                Chrome Web Store
              </ExternalAction>
            ) : null}
            {project.liveUrl ? (
              <ExternalAction
                href={project.liveUrl}
                size="lg"
                className={cn(
                  !project.chromeWebStoreUrl &&
                    "bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
                )}
                variant={project.chromeWebStoreUrl ? "outline" : "default"}
              >
                Open product
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

      <div className="mt-12 w-full">
        <section
          className="border-y py-6"
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

        <div className="mt-10">
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
      </div>
    </PageShell>
  )
}
