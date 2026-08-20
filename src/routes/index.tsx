import { createFileRoute } from "@tanstack/react-router"
import {
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  MapPinIcon,
} from "@phosphor-icons/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ExternalAction,
  MailAction,
} from "@/components/shared/navigation-action"
import { PageSection } from "@/components/shared/page-section"
import { PageShell } from "@/components/shared/page-shell"
import { RichText } from "@/components/shared/rich-text"
import { AffiliationList } from "@/components/portfolio/affiliation-list"
import { BackgroundSummary } from "@/components/portfolio/background-summary"
import { ContributionCalendar } from "@/components/portfolio/contribution-calendar"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { ProjectCard } from "@/components/portfolio/project-card"
import { RecommendationCarousel } from "@/components/portfolio/recommendations"
import { SkillGroups } from "@/components/portfolio/skill-groups"
import { affiliationCatalog } from "@/lib/content/affiliations"
import { profileCatalog } from "@/lib/content/profile"
import { projectCatalog } from "@/lib/content/projects"
import { createMeta, site } from "@/lib/site"

export const Route = createFileRoute("/")({
  head: () => createMeta(site.fullName, site.description),
  component: OverviewPage,
})
function OverviewPage() {
  const { profile } = profileCatalog
  return (
    <PageShell className="overview-page">
      <section
        className="overview-hero scroll-mt-14 py-14 sm:py-16 lg:py-20"
        aria-labelledby="profile-name"
      >
        <div className="grid items-center gap-10 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:gap-12 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-20">
          <div className="hero-portrait group/portrait relative mx-auto aspect-[10/11] w-[10.45rem] shrink-0 sm:order-2 sm:w-[95%]">
            <span
              className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-xl border-2 border-muted-foreground/80"
              aria-hidden="true"
            />
            <Avatar className="relative h-full w-full rounded-xl border bg-card ring-2 ring-foreground/10">
              <AvatarFallback className="rounded-xl">MS</AvatarFallback>
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                width="224"
                height="246"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover object-top grayscale transition-[filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/portrait:grayscale-0 motion-reduce:transition-none"
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
              />
            </Avatar>
          </div>
          <div className="hero-copy min-w-0 text-center sm:order-1 sm:text-left">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-medium text-emphasis-foreground sm:justify-start">
              <span>Senior Software Engineer</span>
              <span className="text-border" aria-hidden="true">
                /
              </span>
              <span className="inline-flex items-center gap-1.5 font-normal text-muted-foreground">
                <MapPinIcon className="size-3.5" />
                {profile.location}
              </span>
            </p>
            <h1
              id="profile-name"
              className="mx-auto mt-3 text-[clamp(0.875rem,4.5vw,1.875rem)] font-bold tracking-tight whitespace-nowrap sm:mx-0"
            >
              {profile.name}
            </h1>
            <p className="mx-auto mt-5 max-w-[56ch] text-base leading-7 text-muted-foreground sm:mx-0">
              {profile.tagline}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <ExternalAction href={profile.resumeUrl} variant="outline">
                <DownloadSimpleIcon />
                Download resume
              </ExternalAction>
              <ExternalAction
                href={profileCatalog.socialUrl("linkedin")}
                variant="ghost"
                size="icon"
                className="size-9 sm:size-8 xl:hidden [&_svg]:size-[18px] sm:[&_svg]:size-4"
              >
                <span className="sr-only">LinkedIn profile</span>
                <LinkedinLogoIcon />
              </ExternalAction>
              <ExternalAction
                href={profileCatalog.socialUrl("github")}
                variant="ghost"
                size="icon"
                className="size-9 sm:size-8 xl:hidden [&_svg]:size-[18px] sm:[&_svg]:size-4"
              >
                <span className="sr-only">GitHub profile</span>
                <GithubLogoIcon />
              </ExternalAction>
              <MailAction
                email={profile.email}
                variant="ghost"
                size="icon"
                className="size-9 sm:size-8 xl:hidden [&_svg]:size-[18px] sm:[&_svg]:size-4"
              >
                <span className="sr-only">Send email</span>
                <EnvelopeSimpleIcon />
              </MailAction>
            </div>
          </div>
        </div>
      </section>
      <PageSection id="about" headingId="about-heading" title="About">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          {profile.about.split("\n\n").map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </PageSection>
      <PageSection
        id="experience"
        headingId="experience-heading"
        title="Experience"
        to="/experience"
        label="View all experience"
      >
        <ExperienceList limit={2} card />
      </PageSection>
      <PageSection
        id="projects"
        headingId="projects-heading"
        title="Selected projects"
        to="/projects"
        label="View all projects"
      >
        <div className="grid gap-5">
          {projectCatalog.featured.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </PageSection>
      <PageSection
        id="skills"
        headingId="skills-heading"
        title="Skills"
        to="/skills"
        label="View all skills"
      >
        <SkillGroups limit={5} />
      </PageSection>
      <PageSection
        id="background"
        headingId="background-heading"
        title="Background"
      >
        <BackgroundSummary />
      </PageSection>
      <PageSection
        id="contributions"
        headingId="contributions-heading"
        title="Contributions"
      >
        <ContributionCalendar />
      </PageSection>
      <PageSection
        id="volunteering"
        headingId="volunteering-heading"
        title="Volunteering"
      >
        <AffiliationList items={affiliationCatalog.volunteering} />
      </PageSection>
      <PageSection
        id="organizations"
        headingId="organizations-heading"
        title="Organizations"
      >
        <AffiliationList items={affiliationCatalog.organizations} />
      </PageSection>
      <PageSection
        id="recommendations"
        headingId="recommendations-heading"
        title="Recommendations"
        to="/recommendations"
        label="View all recommendations"
      >
        <RecommendationCarousel />
      </PageSection>
    </PageShell>
  )
}
