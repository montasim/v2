import { experienceCatalog } from "@/lib/content/experience"
import { projectCatalog } from "@/lib/content/projects"
import { skillEvidenceCatalog } from "@/lib/content/skill-evidence"

export interface PortfolioCitation {
  label: string
  href: string
  kind: "project" | "experience" | "skill" | "page"
}

const MAX_CITATIONS = 3

export function selectPortfolioCitations(
  question: string,
  source: string
): readonly PortfolioCitation[] {
  const normalizedQuestion = normalize(question)
  const normalizedSource = normalize(source)
  const citations: PortfolioCitation[] = []

  const add = (citation: PortfolioCitation) => {
    if (
      citations.length < MAX_CITATIONS &&
      !citations.some((existing) => existing.href === citation.href)
    ) {
      citations.push(citation)
    }
  }

  const matchingProjects = projectCatalog.records.filter((project) =>
    projectTerms(project.title).some((term) =>
      containsPhrase(normalizedQuestion, term)
    )
  )
  matchingProjects.forEach((project) => add(projectCitation(project)))

  const matchingSkills = skillEvidenceCatalog.records.filter((record) =>
    skillTerms(record.skill).some((term) =>
      containsPhrase(normalizedQuestion, term)
    )
  )
  matchingSkills.slice(0, 2).forEach((record) =>
    add({
      label: `Explore ${record.skill} evidence`,
      href: `/skills?skill=${record.slug}#evidence`,
      kind: "skill",
    })
  )

  if (normalizedSource.includes("experience")) {
    add(roleCitation(selectRelevantRole(normalizedQuestion)))
  }

  if (normalizedSource.includes("projects") && matchingProjects.length === 0) {
    projectCatalog.featured
      .slice(0, 2)
      .forEach((project) => add(projectCitation(project)))
  }

  if (normalizedSource.includes("skills") && matchingSkills.length === 0) {
    add({ label: "Explore technical skills", href: "/skills", kind: "page" })
  }
  if (normalizedSource.includes("recommendations")) {
    add({
      label: "View colleague recommendations",
      href: "/recommendations",
      kind: "page",
    })
  }
  if (normalizedSource.includes("education")) {
    add({ label: "View education", href: "/education", kind: "page" })
  }
  if (normalizedSource.includes("certifications")) {
    add({
      label: "View certifications",
      href: "/certifications",
      kind: "page",
    })
  }
  if (
    citations.length === 0 &&
    normalizedSource.includes("profile") &&
    !normalizedSource.includes("contact")
  ) {
    add({ label: "View profile", href: "/#about", kind: "page" })
  }

  return citations
}

function selectRelevantRole(question: string) {
  const directMatch = experienceCatalog.records.find((role) =>
    containsPhrase(question, normalize(role.role))
  )
  if (directMatch) return directMatch

  if (
    includesAny(question, [
      "azure",
      "cloud",
      "infrastructure",
      "cost",
      "performance",
      "docker",
      "ci cd",
    ])
  ) {
    return experienceCatalog.records[1] ?? experienceCatalog.records[0]
  }
  if (includesAny(question, ["webrtc", "opentok", "video", "diagnosis"])) {
    return experienceCatalog.records[2] ?? experienceCatalog.records[0]
  }
  return experienceCatalog.records[0]
}

function projectCitation(project: (typeof projectCatalog.records)[number]) {
  return {
    label: `Open ${project.title.split(" - ")[0]}`,
    href: `/projects#${project.id}`,
    kind: "project" as const,
  }
}

function roleCitation(role: (typeof experienceCatalog.records)[number]) {
  return {
    label: `View ${role.role} role`,
    href: `/experience#${role.id}`,
    kind: "experience" as const,
  }
}

function projectTerms(title: string) {
  return Array.from(
    new Set([normalize(title), normalize(title.split(" - ")[0])])
  )
}

function skillTerms(skill: string) {
  return Array.from(
    new Set([normalize(skill), normalize(skill.replace(/\.js$/i, ""))])
  )
}

function containsPhrase(value: string, phrase: string) {
  return (
    value === phrase ||
    value.startsWith(`${phrase} `) ||
    value.endsWith(` ${phrase}`) ||
    value.includes(` ${phrase} `)
  )
}

function includesAny(value: string, terms: readonly string[]) {
  return terms.some((term) => containsPhrase(value, term))
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
