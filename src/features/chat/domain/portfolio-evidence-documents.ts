import { blogCatalog } from "@/lib/content/blog"
import { certificationCatalog } from "@/lib/content/certifications"
import { educationCatalog } from "@/lib/content/education"
import { experienceCatalog } from "@/lib/content/experience"
import { profileCatalog } from "@/lib/content/profile"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import { recommendationCatalog } from "@/lib/content/recommendations"
import { skillCatalog } from "@/lib/content/skills"

import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"

export interface PortfolioEvidenceDocument {
  id: string
  source: string
  title: string
  content: string
  citation: PortfolioCitation
}

export function buildPortfolioEvidenceDocuments(): readonly PortfolioEvidenceDocument[] {
  const { profile } = profileCatalog
  const { workPreferences } = profile

  return [
    document(
      "profile",
      "Profile",
      profile.name,
      [
        `Name: ${profile.name}`,
        `Title: ${profile.title}`,
        `Location: ${profile.location}`,
        `Tagline: ${profile.tagline}`,
        `About: ${profile.about}`,
        `Availability: ${workPreferences.availability ?? "Not publicly specified"}`,
        `Preferred roles: ${workPreferences.preferredRoles.join(", ")}`,
        `Work arrangement: ${workPreferences.workArrangement ?? "Not publicly specified"}`,
        `Time zone: ${workPreferences.timeZone}`,
        `Team-hour overlap: ${workPreferences.timeZoneOverlap ?? "Not publicly specified"}`,
        `Relocation: ${workPreferences.relocation ?? "Not publicly specified"}`,
        `Visa status: ${workPreferences.visaStatus ?? "Not publicly specified"}`,
        `Earliest start date: ${workPreferences.earliestStartDate ?? "Not publicly specified"}`,
      ].join("\n"),
      pageCitation("View profile", "/#about")
    ),
    document(
      "career:measurable-impact",
      "Experience",
      "Strongest measurable professional outcomes and hiring evidence",
      [
        "Evidence type: measured professional impact and documented career achievements.",
        ...experienceCatalog.records.map(
          (record) =>
            `${record.role} at ${record.company}: ${record.description}`
        ),
        "Use only the metrics explicitly present in these experience records. Do not infer a comparison, ranking, or additional symptom.",
        "Evidence limitation: These portfolio claims are not presented with an independent audit and do not establish Montasim's rank relative to other engineers. When asked what the portfolio does not prove, use only this stated limitation.",
      ].join("\n"),
      pageCitation("View professional experience", "/experience")
    ),
    ...experienceCatalog.records.map((record) =>
      document(
        `experience:${record.id}`,
        "Experience",
        `${record.role} at ${record.company}`,
        [
          `Role: ${record.role}`,
          `Company: ${record.company}`,
          `Period: ${record.period}`,
          `Location: ${record.location}`,
          `Work: ${record.description}`,
          `Technologies: ${record.technologies.join(", ")}`,
          "Evidence boundary: The portfolio documents unstable React hooks and race conditions as a failure mode and deterministic state transitions with 99.9% reliability as the result. It does not document additional runtime symptoms.",
        ].join("\n"),
        {
          label: `View ${record.role} role`,
          href: `/experience#${record.id}`,
          kind: "experience",
        }
      )
    ),
    ...recommendationCatalog.records.map((record, index) =>
      document(
        `recommendation:${index}:${slug(record.name)}`,
        "Recommendations",
        `${record.name}, ${record.role}`,
        `${record.name}, ${record.role}, ${record.relationship}: ${record.text}`,
        pageCitation("View colleague recommendations", "/recommendations")
      )
    ),
    ...projectCatalog.records.map((project) =>
      document(
        `project:${project.id}`,
        "Projects",
        project.title,
        `${project.title}: ${project.description}\nType: ${project.type}\nTechnologies: ${project.technologies.join(", ")}\nTopics: ${project.topics.join(", ")}`,
        {
          label: `Open ${project.title.split(" - ")[0]}`,
          href: `/projects#${project.id}`,
          kind: "project",
        }
      )
    ),
    ...skillCatalog.records.map((group) =>
      document(
        `skills:${group.id}`,
        "Skills",
        group.category,
        `${group.category}: ${group.items.join(", ")}`,
        pageCitation("Explore technical skills", "/skills")
      )
    ),
    ...educationCatalog.records.map((record) =>
      document(
        `education:${record.id}`,
        "Education",
        `${record.degree}, ${record.institution}`,
        `${record.degree}, ${record.institution} (${record.period}). ${record.details} ${record.highlights.join(" ")}`,
        pageCitation("View education", "/education")
      )
    ),
    ...certificationCatalog.records.map((record) =>
      document(
        `certification:${record.id}`,
        "Certifications",
        record.title,
        `${record.title}, ${record.issuer} (${record.year}). ${record.description}`,
        pageCitation("View certifications", "/certifications")
      )
    ),
    ...blogCatalog.posts.flatMap((post) =>
      post.sections.map((section) =>
        document(
          `blog:${post.slug}:${section.id}`,
          "Blog",
          `${post.title}: ${section.title}`,
          [
            `Blog article: ${post.title}`,
            `Category: ${post.category}`,
            `Summary: ${post.excerpt}`,
            `${section.label}: ${section.title}`,
            ...section.paragraphs,
            section.callout ?? "",
          ]
            .filter(Boolean)
            .join("\n"),
          {
            label: `Read ${post.title}`,
            href: `/blog/${post.slug}`,
            kind: "blog",
          }
        )
      )
    ),
    ...projectCaseStudyCatalog.records.flatMap((caseStudy) => {
      const citation = {
        label: `Read ${caseStudy.project.title} case study`,
        href: `/projects/${caseStudy.slug}`,
        kind: "case-study" as const,
      }

      return [
        document(
          `case-study:${caseStudy.slug}:problem`,
          "Case studies",
          `${caseStudy.project.title}: problem and constraints`,
          [
            `Case study: ${caseStudy.project.title}`,
            `Summary: ${caseStudy.summary}`,
            `Role: ${caseStudy.role}`,
            `Scope: ${caseStudy.scope}`,
            `Problem: ${caseStudy.problem}`,
            `Constraints: ${caseStudy.constraints.join(" ")}`,
          ].join("\n"),
          citation
        ),
        document(
          `case-study:${caseStudy.slug}:architecture`,
          "Case studies",
          `${caseStudy.project.title}: architecture and decisions`,
          [
            `Case study: ${caseStudy.project.title}`,
            `Architecture: ${caseStudy.architecture.summary}`,
            ...caseStudy.architecture.layers.map(
              (layer) => `${layer.title}: ${layer.detail}`
            ),
            ...caseStudy.decisions.map(
              (decision) => `${decision.title}: ${decision.detail}`
            ),
          ].join("\n"),
          citation
        ),
        document(
          `case-study:${caseStudy.slug}:delivery`,
          "Case studies",
          `${caseStudy.project.title}: contribution and outcomes`,
          [
            `Case study: ${caseStudy.project.title}`,
            `Contribution: ${caseStudy.contribution.join(" ")}`,
            `Outcomes: ${caseStudy.outcomes.join(" ")}`,
          ].join("\n"),
          citation
        ),
      ]
    }),
  ]
}

function document(
  id: string,
  source: string,
  title: string,
  content: string,
  citation: PortfolioCitation
): PortfolioEvidenceDocument {
  return { id, source, title, content, citation }
}

function pageCitation(label: string, href: string): PortfolioCitation {
  return { label, href, kind: "page" }
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
