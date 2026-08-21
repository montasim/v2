import {
  BracketsCurlyIcon,
  DatabaseIcon,
  DevicesIcon,
  FilesIcon,
  PackageIcon,
  PlugsConnectedIcon,
  SparkleIcon,
  WrenchIcon,
} from "@/components/ui/icons"
import type { Icon } from "@/components/ui/icons"
import type { Project } from "@/lib/content/projects"

const projectTypeIcons: Record<Project["type"], Icon> = {
  website: DevicesIcon,
  extension: PlugsConnectedIcon,
  package: PackageIcon,
  skill: SparkleIcon,
  dataset: DatabaseIcon,
  tool: WrenchIcon,
  api: BracketsCurlyIcon,
  template: FilesIcon,
}

export function ProjectTypeIcon({
  type,
  className,
}: {
  type: Project["type"]
  className?: string
}) {
  const TypeIcon = projectTypeIcons[type]

  return <TypeIcon className={className} />
}
