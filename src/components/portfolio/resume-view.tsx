import {
  ArrowUpRightIcon,
  CertificateIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  GraduationCapIcon,
  LinkedinLogoIcon,
  MapPinIcon,
} from "@phosphor-icons/react"
import { BadgeList } from "@/components/shared/badge-list"
import {
  DownloadAction,
  ExternalAction,
  ExternalLink,
  MailAction,
} from "@/components/shared/navigation-action"
import { RichText } from "@/components/shared/rich-text"
import { certificationCatalog } from "@/lib/content/certifications"
import { educationCatalog } from "@/lib/content/education"
import { experienceCatalog } from "@/lib/content/experience"
import { profileCatalog } from "@/lib/content/profile"
import { projectCatalog } from "@/lib/content/projects"
import { skillCatalog } from "@/lib/content/skills"

const impact = [
  { value: "3+ years", label: "Product engineering" },
  { value: "70%", label: "Cloud cost reduction" },
  { value: "60 FPS", label: "Real-time AI pipeline" },
  { value: "99.9%", label: "Biometric engine reliability" },
] as const

const resumeSkillGroups = [
  "skills-frontend",
  "skills-backend-apis",
  "skills-databases",
  "skills-cloud-devops",
  "skills-testing-quality",
  "skills-realtime-vision",
  "skills-architecture-security",
]

function SectionHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2
      id={id}
      className="border-b pb-3 text-lg font-semibold tracking-tight text-foreground"
    >
      {children}
    </h2>
  )
}

function ResumeHeader() {
  const { profile } = profileCatalog

  return (
    <header className="grid items-center gap-8 border-b pb-10 md:grid-cols-[minmax(0,1fr)_10rem] md:gap-12">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">
          Senior Software Engineer
        </p>
        <h1 className="mt-2 max-w-[24ch] text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl">
          {profile.name}
        </h1>
        <p className="mt-4 max-w-[62ch] text-base leading-7 text-muted-foreground">
          I build deterministic, high-performance web platforms for real-time
          and AI-driven products that stay predictable in production.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <DownloadAction
            href={profile.resumeDownloadUrl}
            size="lg"
            className="px-4"
          >
            <DownloadSimpleIcon />
            Download PDF
          </DownloadAction>
          <MailAction email={profile.email} variant="outline" size="lg">
            <EnvelopeSimpleIcon />
            Email me
          </MailAction>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon aria-hidden="true" />
            {profile.location}
          </span>
          <ExternalLink
            href={profileCatalog.socialUrl("linkedin")}
            className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <LinkedinLogoIcon aria-hidden="true" />
            LinkedIn
          </ExternalLink>
          <ExternalLink
            href={profileCatalog.socialUrl("github")}
            className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <GithubLogoIcon aria-hidden="true" />
            GitHub
          </ExternalLink>
        </div>
      </div>

      <div className="relative mx-auto aspect-[4/5] w-32 md:w-full">
        <span
          className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border border-muted-foreground/50"
          aria-hidden="true"
        />
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          width="320"
          height="400"
          className="relative h-full w-full rounded-lg border bg-card object-cover object-top grayscale"
        />
      </div>
    </header>
  )
}

function ImpactSummary() {
  return (
    <section
      aria-label="Career impact"
      className="grid grid-cols-2 border-b md:grid-cols-4"
    >
      {impact.map((item) => (
        <div
          key={item.label}
          className="border-border px-0 py-6 even:border-l max-md:nth-[n+3]:border-t md:border-l md:px-5 md:first:border-l-0"
        >
          <p className="text-xl font-semibold tracking-tight text-foreground">
            {item.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </section>
  )
}

function ExperienceTimeline() {
  return (
    <section aria-labelledby="resume-experience-heading">
      <SectionHeading id="resume-experience-heading">Experience</SectionHeading>
      <div className="mt-2">
        {experienceCatalog.records.map((role) => (
          <article
            key={role.id}
            className="grid gap-3 border-b py-6 last:border-b-0 sm:grid-cols-[8.75rem_minmax(0,1fr)] sm:gap-6"
          >
            <div className="text-xs leading-5 text-muted-foreground">
              <p className="font-medium text-emphasis-foreground">
                {role.period}
              </p>
              <p className="mt-1">{role.location}</p>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight">
                {role.role}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {role.company}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <RichText text={role.description} />
              </p>
              <BadgeList
                items={role.technologies}
                label={`Technologies used as ${role.role}`}
                className="mt-4"
                badgeClassName="bg-background dark:bg-transparent"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ResumeSidebar() {
  const skills = skillCatalog.records.filter((group) =>
    resumeSkillGroups.includes(group.id)
  )
  const education = educationCatalog.featured

  return (
    <aside className="space-y-10" aria-label="Resume details">
      <section aria-labelledby="resume-skills-heading">
        <SectionHeading id="resume-skills-heading">Core skills</SectionHeading>
        <dl className="mt-5 space-y-5">
          {skills.map((group) => (
            <div key={group.id}>
              <dt className="text-xs font-semibold text-foreground">
                {group.category}
              </dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {group.items.join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="resume-education-heading">
        <SectionHeading id="resume-education-heading">Education</SectionHeading>
        <div className="mt-5 flex items-start gap-3">
          <GraduationCapIcon
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm leading-5 font-semibold">
              {education.degree}
            </h3>
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
              {education.institution}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {education.period}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="resume-credentials-heading">
        <SectionHeading id="resume-credentials-heading">
          Credentials
        </SectionHeading>
        <ul className="mt-5 space-y-4">
          {certificationCatalog.featured.map((credential) => (
            <li key={credential.id} className="flex items-start gap-3">
              <CertificateIcon
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <ExternalLink
                  href={credential.url || undefined}
                  className="text-sm leading-5 font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {credential.title}
                </ExternalLink>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {credential.issuer}, {credential.year}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

function SelectedWork() {
  return (
    <section className="mt-14" aria-labelledby="resume-projects-heading">
      <SectionHeading id="resume-projects-heading">
        Selected work
      </SectionHeading>
      <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        {projectCatalog.featured.map((project) => {
          const projectUrl = project.liveUrl || project.githubUrl

          return (
            <article key={project.id} className="border-b py-6 md:border-b-0">
              <h3 className="text-base font-semibold tracking-tight">
                {project.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {project.description}
              </p>
              <BadgeList
                items={project.technologies}
                label={`Technologies used for ${project.title}`}
                limit={3}
                className="mt-4"
                badgeClassName="bg-background dark:bg-transparent"
              />
              {projectUrl ? (
                <ExternalAction
                  href={projectUrl}
                  variant="link"
                  className="mt-4 h-auto p-0 font-semibold"
                >
                  View project
                  <ArrowUpRightIcon />
                </ExternalAction>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function ResumeView() {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border bg-card px-5 py-7 shadow-[0_1.25rem_3rem_-2.5rem_color-mix(in_oklch,var(--foreground)_22%,transparent)] sm:px-8 sm:py-10 lg:px-10">
      <ResumeHeader />
      <ImpactSummary />
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.75fr)_minmax(15rem,0.75fr)] lg:gap-14">
        <ExperienceTimeline />
        <ResumeSidebar />
      </div>
      <SelectedWork />
    </div>
  )
}
