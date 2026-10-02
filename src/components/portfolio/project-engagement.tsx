import { projectCatalog } from "@/lib/content/projects"
import type { Project } from "@/lib/content/projects"

export function ProjectEngagement({ project }: { project: Project }) {
  const engagement = projectCatalog.engagementFor(project)
  if (!engagement) return null

  return (
    <p className="mt-3 text-sm text-muted-foreground">
      Client: {engagement.company}
      {" · "}
      <a
        href={`/experience?filter=client#${engagement.id}`}
        aria-label={`View client experience with ${engagement.company}`}
        className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        View client experience
      </a>
    </p>
  )
}
