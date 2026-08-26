import {
  ArrowUpRightIcon,
  BookOpenTextIcon,
  GithubLogoIcon,
  PackageIcon,
  SquaresFourIcon,
} from "@/components/ui/icons"
import { Link } from "@tanstack/react-router"
import { ProjectTypeIcon } from "@/components/portfolio/project-type-icon"
import { BadgeList } from "@/components/shared/badge-list"
import {
  ExternalAction,
  ExternalLink,
} from "@/components/shared/navigation-action"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Project } from "@/lib/content/projects"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { optimizedImage } from "@/lib/assets"

function projectImage(project: Project) {
  if (!project.imageUrl) return null
  const name = project.imageUrl.split("/").at(-1)
  return name ? optimizedImage(`/images/projects/${name}`) : null
}
export function ProjectCard({ project }: { project: Project }) {
  const image = projectImage(project)
  const primaryUrl =
    project.liveUrl || project.npmUrl || project.releaseUrl || project.githubUrl
  const separateNpmUrl =
    project.npmUrl && project.npmUrl !== primaryUrl ? project.npmUrl : undefined
  let primaryActionLabel = "Live site"
  if (project.npmUrl && !project.liveUrl) primaryActionLabel = "Package"
  else if (project.type === "skill" && project.liveUrl)
    primaryActionLabel = "Get started"
  else if (project.type === "package" && project.liveUrl)
    primaryActionLabel = "Homepage"
  const caseStudy = projectCaseStudyCatalog.findByProjectId(project.id)
  const preview = image ? (
    <img
      src={image}
      alt={`${project.title} interface preview`}
      width="1600"
      height="1000"
      loading="lazy"
      className="h-full w-full rounded-lg border object-cover object-top grayscale transition-[filter,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015] group-hover:grayscale-0 motion-reduce:transition-none"
    />
  ) : null
  return (
    <Card
      asChild
      className="interactive-surface group grid overflow-hidden lg:grid-cols-[1.08fr_0.92fr]"
    >
      <article
        id={project.id}
        className="scroll-mt-20 target:ring-2 target:ring-primary/40"
      >
        <div className="relative min-h-64 overflow-hidden border-b bg-muted/35 p-3 sm:p-4 lg:border-r lg:border-b-0">
          {image ? (
            caseStudy ? (
              <Link
                to="/projects/$slug"
                params={{ slug: caseStudy.slug }}
                className="block h-full overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {preview}
              </Link>
            ) : (
              <ExternalLink
                href={primaryUrl || undefined}
                className="block h-full overflow-hidden rounded-lg"
              >
                {preview}
              </ExternalLink>
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <span className="flex flex-col items-center gap-3 text-sm">
                <SquaresFourIcon size={30} />
                Project preview unavailable
              </span>
            </div>
          )}
        </div>
        <CardContent className="flex min-w-0 flex-col p-5 sm:p-6">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ProjectTypeIcon type={project.type} className="size-[1em]" />
            {project.type}
          </p>
          <h2 className="mt-2 text-lg leading-snug font-semibold tracking-tight text-emphasis-foreground">
            {project.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
          <BadgeList
            items={project.topics}
            label={`GitHub topics for ${project.title}`}
            limit={5}
            className="mt-4"
            badgeClassName="bg-background dark:bg-transparent"
          />
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
            {caseStudy ? (
              <Button
                asChild
                variant="link"
                className="h-auto p-0 font-bold text-emphasis-foreground"
              >
                <Link to="/projects/$slug" params={{ slug: caseStudy.slug }}>
                  <BookOpenTextIcon />
                  Case study
                </Link>
              </Button>
            ) : null}
            {primaryUrl ? (
              <ExternalAction
                href={primaryUrl}
                variant="link"
                className="group/action h-auto p-0 font-bold text-emphasis-foreground"
              >
                {project.npmUrl && !project.liveUrl ? (
                  <PackageIcon />
                ) : (
                  <ArrowUpRightIcon className="group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
                )}
                {primaryActionLabel}
              </ExternalAction>
            ) : null}
            {separateNpmUrl ? (
              <ExternalAction
                href={separateNpmUrl}
                variant="link"
                className="group/action h-auto p-0 font-bold text-emphasis-foreground"
              >
                <PackageIcon className="group-hover/action:-translate-y-0.5" />
                npm
              </ExternalAction>
            ) : null}
            {project.githubUrl ? (
              <ExternalAction
                href={project.githubUrl}
                variant="link"
                className="group/action h-auto p-0 font-bold text-emphasis-foreground"
              >
                <GithubLogoIcon className="group-hover/action:-translate-y-0.5" />
                Source
              </ExternalAction>
            ) : null}
          </div>
        </CardContent>
      </article>
    </Card>
  )
}
