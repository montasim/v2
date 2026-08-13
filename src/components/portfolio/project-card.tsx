import {
  ArrowUpRightIcon,
  GithubLogoIcon,
  PackageIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"
import { BadgeList } from "@/components/shared/badge-list"
import {
  ExternalAction,
  ExternalLink,
} from "@/components/shared/navigation-action"
import { Card, CardContent } from "@/components/ui/card"
import type { Project } from "@/lib/content/projects"
import { optimizedImage } from "@/lib/assets"

function projectImage(project: Project) {
  if (!project.imageUrl) return null
  const name = project.imageUrl.split("/").at(-1)
  return name ? optimizedImage(`/images/projects/${name}`) : null
}
export function ProjectCard({
  project,
  compact = false,
}: {
  project: Project
  compact?: boolean
}) {
  const image = projectImage(project)
  const primaryUrl =
    project.liveUrl || project.npmUrl || project.releaseUrl || project.githubUrl
  return (
    <Card
      asChild
      className={`interactive-surface group grid overflow-hidden ${compact ? "sm:grid-cols-[15rem_1fr]" : "lg:grid-cols-[1.08fr_0.92fr]"}`}
    >
      <article>
        <div
          className={`relative overflow-hidden border-b bg-muted p-3 sm:p-4 ${compact ? "min-h-36 sm:border-r sm:border-b-0" : "min-h-64 lg:border-r lg:border-b-0"}`}
        >
          {image ? (
            <ExternalLink
              href={primaryUrl || undefined}
              className="block h-full overflow-hidden rounded-lg"
            >
              <img
                src={image}
                alt={`${project.title} interface preview`}
                width="1600"
                height="1000"
                loading="lazy"
                className="h-full w-full rounded-lg border object-cover object-top grayscale transition-[filter,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015] group-hover:grayscale-0 motion-reduce:transition-none"
              />
            </ExternalLink>
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
            <SquaresFourIcon />
            {project.type}
          </p>
          <h2 className="mt-2 text-lg leading-snug font-semibold tracking-tight text-emphasis-foreground">
            {project.title}
          </h2>
          <p
            className={`mt-3 text-sm leading-relaxed text-muted-foreground ${compact ? "line-clamp-2" : ""}`}
          >
            {project.description}
          </p>
          <BadgeList
            items={project.technologies}
            label={`Technologies used for ${project.title}`}
            limit={5}
            className="mt-4"
            badgeClassName="bg-background dark:bg-transparent"
          />
          <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
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
                {project.npmUrl && !project.liveUrl ? "Package" : "Live site"}
              </ExternalAction>
            ) : null}
            {project.githubUrl ? (
              <ExternalAction
                href={project.githubUrl}
                variant="link"
                className="group/action h-auto p-0 font-bold text-emphasis-foreground"
              >
                Source
                <GithubLogoIcon className="group-hover/action:-translate-y-0.5" />
              </ExternalAction>
            ) : null}
          </div>
        </CardContent>
      </article>
    </Card>
  )
}
