import { blogCatalog } from "@/lib/content/blog"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"

import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"

export interface PortfolioWritingEvidence {
  source: "Blog" | "Case studies"
  context: string
  citation: PortfolioCitation
  projectId?: string
}

type RankedWritingEvidence = PortfolioWritingEvidence & {
  score: number
  matchedTerms: number
  namedMatch: boolean
}

const MAX_WRITING_MATCHES = 2
const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "availability",
  "available",
  "but",
  "can",
  "could",
  "does",
  "engineer",
  "for",
  "from",
  "give",
  "have",
  "hire",
  "hiring",
  "him",
  "his",
  "how",
  "hybrid",
  "into",
  "montasim",
  "not",
  "only",
  "onsite",
  "our",
  "remote",
  "role",
  "roles",
  "senior",
  "should",
  "start",
  "that",
  "than",
  "the",
  "their",
  "then",
  "they",
  "this",
  "through",
  "what",
  "when",
  "where",
  "which",
  "with",
  "work",
  "would",
  "you",
  "your",
  "timezone",
  "visa",
])

export function selectPortfolioWritingEvidence(
  question: string
): readonly PortfolioWritingEvidence[] {
  const normalizedQuestion = normalize(question)
  const terms = meaningfulTerms(normalizedQuestion)
  const asksForBlog = includesAny(normalizedQuestion, [
    "blog about",
    "blogs about",
    "article about",
    "articles about",
    "show blog",
    "show blogs",
    "find article",
    "find articles",
    "wrote",
    "written",
    "writing",
  ])
  const asksForCaseStudy = includesAny(normalizedQuestion, [
    "case study",
    "case studies",
  ])

  const caseStudies = projectCaseStudyCatalog.records
    .map((caseStudy) => rankCaseStudy(caseStudy, terms, normalizedQuestion))
    .sort(byRelevance)
  const blogs = blogCatalog.posts
    .map((post) => rankBlogPost(post, terms, normalizedQuestion))
    .sort(byRelevance)
  const matches: RankedWritingEvidence[] = []

  const caseStudy = selectCandidate(caseStudies, asksForCaseStudy)
  if (caseStudy) matches.push(caseStudy)

  if (!caseStudy || asksForBlog) {
    const blog = selectCandidate(blogs, asksForBlog)
    if (blog) matches.push(blog)
  }

  return matches.slice(0, MAX_WRITING_MATCHES).map(toPublicEvidence)
}

function rankCaseStudy(
  caseStudy: (typeof projectCaseStudyCatalog.records)[number],
  terms: readonly string[],
  question: string
): RankedWritingEvidence {
  const title = `${caseStudy.project.title} ${caseStudy.slug}`
  const summary = `${caseStudy.summary} ${caseStudy.problem}`
  const details = [
    ...caseStudy.constraints,
    caseStudy.architecture.summary,
    ...caseStudy.architecture.layers.flatMap((layer) => [
      layer.title,
      layer.detail,
    ]),
    ...caseStudy.decisions.flatMap((decision) => [
      decision.title,
      decision.detail,
    ]),
    ...caseStudy.contribution,
    ...caseStudy.outcomes,
    ...caseStudy.project.technologies,
  ].join(" ")
  const relevance = scoreFields(terms, [
    [title, 6],
    [summary, 3],
    [details, 1],
  ])

  return {
    source: "Case studies",
    projectId: caseStudy.projectId,
    score: relevance.score,
    matchedTerms: relevance.matchedTerms,
    namedMatch: projectNameTerms(caseStudy.project.title, caseStudy.slug).some(
      (term) => containsPhrase(question, term)
    ),
    citation: {
      label: `Read ${caseStudy.project.title} case study`,
      href: `/projects/${caseStudy.slug}`,
      kind: "case-study",
    },
    context: clip(
      [
        `CASE STUDY: ${caseStudy.project.title}`,
        `Summary: ${caseStudy.summary}`,
        `Role and scope: ${caseStudy.role}; ${caseStudy.scope}.`,
        `Problem: ${caseStudy.problem}`,
        `Constraints: ${caseStudy.constraints.join(" ")}`,
        `Architecture: ${caseStudy.architecture.summary}`,
        `Key decisions: ${caseStudy.decisions
          .slice(0, 3)
          .map((decision) => `${decision.title}: ${decision.detail}`)
          .join(" ")}`,
        `Contribution: ${caseStudy.contribution.join(" ")}`,
        `Outcomes: ${caseStudy.outcomes.join(" ")}`,
        `Source URL: /projects/${caseStudy.slug}`,
      ].join("\n"),
      3_400
    ),
  }
}

function rankBlogPost(
  post: (typeof blogCatalog.posts)[number],
  terms: readonly string[],
  question: string
): RankedWritingEvidence {
  const sectionScores = post.sections
    .map((section) => ({
      section,
      ...scoreFields(terms, [
        [`${section.label} ${section.title}`, 4],
        [`${section.paragraphs.join(" ")} ${section.callout ?? ""}`, 1],
      ]),
    }))
    .sort(byRelevance)
  const relevantSections = sectionScores
    .filter((section) => section.matchedTerms > 0)
    .slice(0, 2)
  const selectedSections = relevantSections.length
    ? relevantSections
    : sectionScores.slice(0, 2)
  const body = post.sections
    .flatMap((section) => [
      section.label,
      section.title,
      ...section.paragraphs,
      section.callout ?? "",
    ])
    .join(" ")
  const relevance = scoreFields(terms, [
    [`${post.title} ${post.category} ${post.topic}`, 6],
    [post.excerpt, 3],
    [body, 1],
  ])

  return {
    source: "Blog",
    projectId: post.projectId,
    score: relevance.score,
    matchedTerms: relevance.matchedTerms,
    namedMatch:
      projectNameTerms(post.title, post.slug).some((term) =>
        containsPhrase(question, term)
      ) || false,
    citation: {
      label: `Read ${post.title}`,
      href: `/blog/${post.slug}`,
      kind: "blog",
    },
    context: clip(
      [
        `BLOG ARTICLE: ${post.title}`,
        `Category: ${post.category}`,
        `Summary: ${post.excerpt}`,
        ...selectedSections.map(
          ({ section }) =>
            `${section.title}: ${section.paragraphs.join(" ")}${
              section.callout ? ` ${section.callout}` : ""
            }`
        ),
        `Source URL: /blog/${post.slug}`,
      ].join("\n"),
      3_000
    ),
  }
}

function selectCandidate(
  candidates: readonly RankedWritingEvidence[],
  explicitlyRequested: boolean
) {
  const candidate = candidates[0]
  if (candidate.namedMatch || explicitlyRequested) return candidate
  return undefined
}

function toPublicEvidence({
  source,
  context,
  citation,
  projectId,
}: RankedWritingEvidence): PortfolioWritingEvidence {
  return { source, context, citation, projectId }
}

function scoreFields(
  terms: readonly string[],
  fields: ReadonlyArray<readonly [value: string, weight: number]>
) {
  const matched = new Set<string>()
  let score = 0

  for (const term of terms) {
    for (const [value, weight] of fields) {
      if (containsPhrase(normalize(value), term)) {
        matched.add(term)
        score += weight
        break
      }
    }
  }

  return { score, matchedTerms: matched.size }
}

function meaningfulTerms(question: string) {
  return Array.from(
    new Set(
      question
        .split(" ")
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !stopWords.has(term))
    )
  )
}

function byRelevance(
  left: { score: number; matchedTerms: number; namedMatch?: boolean },
  right: { score: number; matchedTerms: number; namedMatch?: boolean }
) {
  return (
    Number(right.namedMatch ?? false) - Number(left.namedMatch ?? false) ||
    right.score - left.score ||
    right.matchedTerms - left.matchedTerms
  )
}

function projectNameTerms(title: string, slug: string) {
  return Array.from(
    new Set([
      normalize(title),
      normalize(title.split(" - ")[0]),
      normalize(slug),
    ])
  ).filter((term) => term.length >= 4 && !stopWords.has(term))
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

function clip(value: string, maximum: number) {
  return value.length <= maximum
    ? value
    : `${value.slice(0, maximum).trim()}...`
}
