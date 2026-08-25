import {
  ArrowsClockwiseIcon,
  AtomIcon,
  BracketsCurlyIcon,
  CirclesThreePlusIcon,
  CircleDashedIcon,
  CloudIcon,
  CodeIcon,
  CubeIcon,
  DatabaseIcon,
  DevicesIcon,
  FigmaLogoIcon,
  FileCssIcon,
  FileDocIcon,
  FileHtmlIcon,
  FileJsIcon,
  FilePptIcon,
  FilesIcon,
  FileTsIcon,
  FileXlsIcon,
  FlaskIcon,
  GaugeIcon,
  GearIcon,
  GitBranchIcon,
  GithubLogoIcon,
  HandIcon,
  HardDrivesIcon,
  HexagonIcon,
  LeafIcon,
  LightbulbIcon,
  LightningIcon,
  ListChecksIcon,
  PlugsConnectedIcon,
  PolygonIcon,
  RulerIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TestTubeIcon,
  TreeStructureIcon,
  UsersThreeIcon,
  VideoCameraIcon,
  VideoIcon,
  WindIcon,
  WrenchIcon,
} from "@/components/ui/icons"
import type { Icon } from "@/components/ui/icons"
import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { skillEvidenceCatalog } from "@/lib/content/skill-evidence"
import type { SkillCategory } from "@/lib/content/skill-evidence"
import { skillCatalog } from "@/lib/content/skills"
import { cn } from "@/lib/utils"

const groupIcons: Record<string, Icon> = {
  "skills-frontend": CodeIcon,
  "skills-backend-apis": HardDrivesIcon,
  "skills-databases": DatabaseIcon,
  "skills-ai-agents": SparkleIcon,
  "skills-browser-extensions": DevicesIcon,
  "skills-cloud-devops": CloudIcon,
  "skills-testing-quality": WrenchIcon,
  "skills-design-collaboration": UsersThreeIcon,
  "skills-office-productivity": GearIcon,
  "skills-realtime-vision": VideoCameraIcon,
  "skills-architecture-security": ShieldCheckIcon,
}

const skillIcons: Record<string, Icon> = {
  "React.js": AtomIcon,
  "Next.js": CircleDashedIcon,
  TypeScript: FileTsIcon,
  JavaScript: FileJsIcon,
  HTML5: FileHtmlIcon,
  CSS: FileCssIcon,
  "Tailwind CSS": WindIcon,
  "Redux.js": TreeStructureIcon,
  Bootstrap: DevicesIcon,
  jQuery: CodeIcon,
  "Responsive Web Design": DevicesIcon,
  "Konva.js": PolygonIcon,
  "Node.js": HexagonIcon,
  "Express.js": HardDrivesIcon,
  "Socket.io": PlugsConnectedIcon,
  "REST APIs": BracketsCurlyIcon,
  PHP: GaugeIcon,
  PostgreSQL: DatabaseIcon,
  MongoDB: LeafIcon,
  Prisma: DatabaseIcon,
  PhpMyAdmin: DatabaseIcon,
  "Microsoft Azure": CloudIcon,
  Azure: CloudIcon,
  Docker: CubeIcon,
  "GitHub Actions": GithubLogoIcon,
  "CI/CD": ArrowsClockwiseIcon,
  Git: GitBranchIcon,
  "IT Operations": GearIcon,
  Jest: FlaskIcon,
  Vitest: LightningIcon,
  "React Testing Library": TestTubeIcon,
  Lighthouse: RulerIcon,
  Figma: FigmaLogoIcon,
  Scrum: UsersThreeIcon,
  "Agile Methodologies": ListChecksIcon,
  "Microsoft Word": FileDocIcon,
  "Microsoft Excel": FileXlsIcon,
  "Microsoft PowerPoint": FilePptIcon,
  "Microsoft Office": FilesIcon,
  WebRTC: VideoCameraIcon,
  Opentok: VideoIcon,
  MediaPipe: HandIcon,
  "Gemini API": SparkleIcon,
  "System Design": LightbulbIcon,
  Microservices: CirclesThreePlusIcon,
  SSO: ShieldCheckIcon,
}

export function SkillGroups({
  limit,
  selectedSkill,
}: {
  limit?: number
  selectedSkill?: string
}) {
  const groups = limit
    ? skillCatalog.records.slice(0, limit)
    : skillCatalog.records

  return (
    <div className="grid gap-y-6 text-sm">
      {groups.map((group) => {
        const GroupIcon = groupIcons[group.id] ?? CodeIcon

        return (
          <section key={group.id} aria-labelledby={`${group.id}-heading`}>
            <h2
              id={`${group.id}-heading`}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <GroupIcon className="size-5 shrink-0" aria-hidden="true" />
              {group.category}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                return (
                  <li key={item}>
                    <SkillLink skill={item} selectedSkill={selectedSkill} />
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export function SkillLink({
  skill,
  selectedSkill,
  category,
}: {
  skill: string
  selectedSkill?: string
  category?: SkillCategory
}) {
  const SkillIcon = skillIcons[skill] ?? CodeIcon
  const evidence = skillEvidenceCatalog.forSkill(skill)

  return (
    <Badge
      asChild
      className={cn(
        "gap-1.5 bg-card px-2.5 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring hover:border-foreground/40 hover:text-foreground",
        selectedSkill === evidence?.slug &&
          "border-primary bg-primary text-primary-foreground hover:text-primary-foreground"
      )}
    >
      <Link
        to="/skills"
        search={{ category, skill: evidence?.slug }}
        hash="evidence"
        aria-current={selectedSkill === evidence?.slug ? "true" : undefined}
      >
        <SkillIcon className="size-4 shrink-0" aria-hidden="true" />
        {skill}
        {evidence && evidence.total > 0 ? (
          <span
            className={cn(
              "ml-0.5 text-[0.6875rem] text-muted-foreground",
              selectedSkill === evidence.slug && "text-primary-foreground/75"
            )}
            aria-label={`${evidence.total} supporting ${evidence.total === 1 ? "record" : "records"}`}
          >
            {evidence.total}
          </span>
        ) : null}
      </Link>
    </Badge>
  )
}
