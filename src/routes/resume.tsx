import { createFileRoute } from "@tanstack/react-router"
import { DownloadSimpleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ExperienceList } from "@/components/portfolio/experience-list"
import { SkillGroups } from "@/components/portfolio/skill-groups"
import { FooterActions, PageIntro } from "@/components/shared/page-intro"
import { PageShell } from "@/components/shared/page-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { descriptions, profile } from "@/lib/content"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/resume")({
  head: () => createMeta("Resume", descriptions.resume, "/resume"),
  component: Page,
})
function Page() {
  return (
    <PageShell padded>
      <PageIntro title="Resume" description={descriptions.resume} />
      <section className="mt-10 border-y py-6">
        <h2 className="text-xl font-semibold">{profile.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{profile.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.location} | {profile.email}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
            <DownloadSimpleIcon />
            Download resume
          </a>
        </Button>
      </section>
      <section className="mt-12" aria-labelledby="resume-experience-heading">
        <SectionHeading id="resume-experience-heading" title="Experience" />
        <ExperienceList />
      </section>
      <section className="mt-12" aria-labelledby="resume-skills-heading">
        <SectionHeading id="resume-skills-heading" title="Skills" />
        <SkillGroups />
      </section>
      <FooterActions />
    </PageShell>
  )
}
