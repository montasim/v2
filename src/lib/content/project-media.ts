import { optimizedImage } from "@/lib/assets"
import type { Project } from "@/lib/content/projects"

export type ContentMedia = {
  src: string
  alt: string
}

export function getProjectMedia(
  project: Project,
  primaryAlt = `${project.title} interface preview`
): ContentMedia[] {
  const primaryName = project.imageUrl?.split("/").at(-1)
  const media = [
    ...(primaryName
      ? [
          {
            src: optimizedImage(`/images/projects/${primaryName}`),
            alt: primaryAlt,
          },
        ]
      : []),
    ...(project.gallery ?? []),
  ]

  return media.filter(
    (item, index) =>
      media.findIndex((entry) => entry.src === item.src) === index
  )
}
