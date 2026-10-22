import { Link } from "@tanstack/react-router"

import { ArrowRightCompactIcon, CheckIcon } from "@/components/ui/icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PageSection } from "@/components/shared/page-section"
import { PageShell } from "@/components/shared/page-shell"
import { profileCatalog } from "@/lib/content/profile"
import { projectCatalog } from "@/lib/content/projects"

const capabilityGroups = [
  {
    eyebrow: "01 · Web and product engineering",
    title: "Frontend and full-stack products people can rely on",
    summary:
      "From the first workflow to a production release: responsive interfaces, backend services, data flows, validation, and the failure states real users encounter.",
    outcomes: [
      "New products that need a dependable first version",
      "SaaS workflows that need frontend and backend ownership",
    ],
    projects: ["postcraft", "formflow", "mmh-patient-portal"],
  },
  {
    eyebrow: "02 · Backend and APIs",
    title: "Services and APIs that make products easier to grow",
    summary:
      "Design or repair the routes, integrations, permissions, and data boundaries behind a product so the next release is easier to ship.",
    outcomes: [
      "A brittle API or integration slowing down the team",
      "A product that needs clearer data and service boundaries",
    ],
    projects: ["clm-api", "github-readme-counter", "school-management-backend"],
  },
  {
    eyebrow: "03 · AI, skills, and data",
    title: "AI workflows and data products with evidence and guardrails",
    summary:
      "Connect models, reusable AI skills, datasets, and automation to useful product behavior with bounded prompts, fallbacks, validation, and clear user feedback.",
    outcomes: [
      "An AI feature that needs to become useful and reviewable",
      "A dataset, agent skill, or automation workflow that needs structure and proof",
    ],
    projects: ["skillfoliox", "bangladesh-location-registry", "postcraft"],
  },
  {
    eyebrow: "04 · Extensions and client apps",
    title: "Chrome, Windows, and Android software people can install",
    summary:
      "Build focused browser extensions, Windows desktop tools, and Android/mobile experiences that turn a product idea into something people can install and use.",
    outcomes: [
      "A Chrome extension or side-panel workflow",
      "A Windows desktop or Android/mobile app that needs a practical first release",
    ],
    projects: ["bugreceipt", "thoughtline", "air-traffic-control"],
  },
] as const

const engagementModes = [
  [
    "Build",
    "Ship a defined product or workflow from idea to a useful first release.",
  ],
  [
    "Improve",
    "Untangle an existing frontend, API, or data flow around the highest-value seam.",
  ],
  [
    "Extend",
    "Add an AI workflow, browser extension, desktop app, mobile surface, or integration.",
  ],
] as const

const processSteps = [
  [
    "Fit call",
    "Clarify the user, constraint, current state, and the outcome worth paying for.",
  ],
  [
    "First milestone",
    "Turn the problem into a bounded plan with visible trade-offs and a concrete deliverable.",
  ],
  [
    "Build and hand off",
    "Ship working software, explain the important decisions, and leave a sensible next step.",
  ],
] as const

export function ServicesPage() {
  const { profile } = profileCatalog

  return (
    <PageShell padded>
      <header className="grid gap-10 border-b pb-10 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Services for product teams
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl leading-[1.08] font-bold tracking-[-0.035em] text-strong-foreground sm:text-5xl">
            Ship the product, not just the interface.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            I help teams turn product ideas, complex workflows, and aging
            systems into dependable software — across web apps, APIs, AI
            workflows, extensions, desktop tools, and mobile experiences.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
            >
              <Link
                to="/contact"
                search={{ topic: "collaboration", from: "/services" }}
              >
                Tell me what you are building
                <ArrowRightCompactIcon />
              </Link>
            </Button>
            <Link
              to="/projects"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-strong-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Browse the work
              <ArrowRightCompactIcon />
            </Link>
          </div>
        </div>
        <aside className="border-t pt-6 lg:border-t-0 lg:pt-2">
          <div className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Start here
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight">
              Choose the kind of movement you need.
            </p>
            <div className="mt-5 divide-y">
              {[
                ["Build", "A new product or workflow"],
                ["Improve", "An existing frontend, API, or data flow"],
                ["Extend", "AI, browser, desktop, or mobile delivery"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-emphasis-foreground" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
              {profile.location} · {profile.workPreferences.timeZone} · Remote,
              hybrid, or on-site
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 inline-block text-sm font-medium text-strong-foreground underline decoration-border underline-offset-4 hover:text-emphasis-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {profile.email}
            </a>
          </div>
        </aside>
      </header>

      <PageSection
        headingId="service-capabilities"
        title="What I can build"
        className="pt-12 sm:pt-16"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {capabilityGroups.map((group) => (
            <CapabilityCard key={group.title} group={group} />
          ))}
        </div>
      </PageSection>

      <PageSection headingId="service-engagements" title="Ways to engage">
        <div className="grid gap-4 md:grid-cols-3">
          {engagementModes.map(([title, description]) => (
            <Card key={title} className="bg-muted/20">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm font-semibold text-strong-foreground">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <section className="grid gap-4 border-y py-8 sm:grid-cols-3 sm:py-10">
        {[
          ["70%", "cloud infrastructure cost reduction"],
          ["40%", "application performance improvement"],
          ["99.9%", "reliability on a real-time vision pipeline"],
        ].map(([value, label]) => (
          <div
            key={value}
            className="border-l pl-4 first:border-l-0 first:pl-0 sm:px-5 sm:first:px-0"
          >
            <p className="text-2xl font-semibold tracking-tight text-strong-foreground sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </section>

      <PageSection headingId="service-process" title="How an engagement starts">
        <div className="grid gap-4 md:grid-cols-3">
          {processSteps.map(([title, description], index) => (
            <div key={title} className="border-t pt-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline">0{index + 1}</Badge>
                <p className="text-sm font-semibold text-strong-foreground">
                  {title}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </PageSection>

      <section className="relative overflow-hidden rounded-xl border bg-muted/35 px-5 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-emphasis-foreground/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Have a project in mind?
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-strong-foreground sm:text-3xl">
            Bring the rough version. We can find the sharp version together.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Tell me what you are trying to build, fix, or prove. A useful first
            message can be short.
          </p>
          <Button
            asChild
            className="mt-6 bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
            size="lg"
          >
            <Link
              to="/contact"
              search={{ topic: "collaboration", from: "/services" }}
            >
              Start a conversation
              <ArrowRightCompactIcon />
            </Link>
          </Button>
        </div>
      </section>
    </PageShell>
  )
}

function CapabilityCard({
  group,
}: {
  group: (typeof capabilityGroups)[number]
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {group.eyebrow}
        </p>
        <h3 className="mt-4 text-xl leading-tight font-semibold tracking-tight text-strong-foreground">
          {group.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {group.summary}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-5">
        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          A good fit when
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {group.outcomes.map((outcome) => (
            <li key={outcome} className="flex gap-2">
              <CheckIcon className="mt-1 size-4 shrink-0 text-emphasis-foreground" />
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t pt-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Representative work
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {group.projects.map((slug) => {
              const project = projectCatalog.findBySlug(slug)
              if (!project) return null
              return (
                <Link
                  key={project.id}
                  to="/projects/$slug"
                  params={{ slug }}
                  className="text-sm font-medium text-strong-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {project.title}
                </Link>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
