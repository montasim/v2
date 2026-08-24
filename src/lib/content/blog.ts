import { z } from "zod"

import blogJson from "@/data/blog.json"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"

export const blogTopicSchema = z.enum(["all", "product", "career", "tools"])
export const blogPostSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const sectionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  callout: z.string().min(1).optional(),
})

const resolvedPostSchema = z.object({
  kind: z.enum(["authored", "case-study-derived"]),
  slug: blogPostSlugSchema,
  projectId: z.string().min(1).optional(),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  featureSummary: z.string().min(1).optional(),
  category: z.string().min(1),
  topic: blogTopicSchema.exclude(["all"]),
  publishedAt: z.iso.date().optional(),
  readingMinutes: z.number().int().positive(),
  featured: z.boolean(),
  image: z.object({
    src: z.string().startsWith("/"),
    alt: z.string().min(1),
  }),
  sections: z.array(sectionSchema).min(1),
})

const authoredPostSchema = resolvedPostSchema
  .extend({
    kind: z.literal("authored"),
    publishedAt: z.iso.date(),
  })
  .strict()

const caseStudyDerivedPostSchema = z
  .object({
    kind: z.literal("case-study-derived"),
    projectId: z.string().min(1),
    slug: blogPostSlugSchema,
    title: z.string().min(1),
    category: z.string().min(1),
    topic: blogTopicSchema.exclude(["all"]),
    featured: z.boolean(),
  })
  .strict()

const blogSourceSchema = z.object({
  author: z.object({
    name: z.string().min(1),
    avatarUrl: z.string().startsWith("/"),
  }),
  caseStudyPublishedAt: z.iso.date(),
  posts: z
    .array(
      z.discriminatedUnion("kind", [
        authoredPostSchema,
        caseStudyDerivedPostSchema,
      ])
    )
    .min(1),
})

const blogSchema = blogSourceSchema.extend({
  posts: z.array(resolvedPostSchema).min(1),
})

const blogSource = blogSourceSchema.parse(blogJson)

function projectImagePath(imageUrl: string | null | undefined, type: string) {
  if (imageUrl) return `/images/${imageUrl.replace(/^assets\//, "")}`
  if (type === "skill") return "/images/projects/skillfoliox.webp"
  return "/images/projects/devtools.webp"
}

function estimateReadingMinutes(
  title: string,
  excerpt: string,
  sections: ReadonlyArray<z.infer<typeof sectionSchema>>
) {
  const text = [
    title,
    excerpt,
    ...sections.flatMap((section) => [
      section.label,
      section.title,
      ...section.paragraphs,
      section.callout ?? "",
    ]),
  ].join(" ")
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return Math.max(1, Math.ceil(wordCount / 200))
}

function resolveCaseStudyPost(
  metadata: z.infer<typeof caseStudyDerivedPostSchema>,
  publishedAt: string
) {
  const caseStudy = projectCaseStudyCatalog.findByProjectId(metadata.projectId)

  if (!caseStudy) {
    throw new Error(`Unknown project blog source: ${metadata.projectId}`)
  }

  const excerpt = caseStudy.summary
  const sections = [
    {
      id: "problem",
      label: "The real problem",
      title: "The visible feature was only the surface",
      paragraphs: [
        caseStudy.problem,
        `The system also had to respect concrete constraints. ${caseStudy.constraints.join(" ")}`,
        `My role covered ${caseStudy.role.toLocaleLowerCase()}, with responsibility for ${caseStudy.scope.toLocaleLowerCase()}.`,
      ],
    },
    {
      id: "architecture",
      label: "Architecture",
      title: "I turned the constraints into boundaries",
      paragraphs: [
        caseStudy.architecture.summary,
        ...caseStudy.decisions.map((decision) => decision.detail),
      ],
      callout: `The key decision: ${caseStudy.decisions[0].title}.`,
    },
    {
      id: "delivery",
      label: "Delivery",
      title: "The implementation had to prove the model",
      paragraphs: [
        `I delivered the work across the full path: ${caseStudy.contribution.join(" ")}`,
        `The result is concrete: ${caseStudy.outcomes.join(" ")}`,
        "The senior engineering lesson was that solving the visible workflow is only half the job. The architecture must also make constraints, failure modes, evidence, and ownership explicit enough for the next change to remain safe.",
      ],
    },
  ] satisfies Array<z.infer<typeof sectionSchema>>

  return resolvedPostSchema.parse({
    ...metadata,
    excerpt,
    publishedAt,
    readingMinutes: estimateReadingMinutes(metadata.title, excerpt, sections),
    image: {
      src: projectImagePath(caseStudy.project.imageUrl, caseStudy.project.type),
      alt: caseStudy.screenshot?.alt ?? `${caseStudy.project.title} project`,
    },
    sections,
  })
}

const blog = blogSchema.parse({
  author: blogSource.author,
  caseStudyPublishedAt: blogSource.caseStudyPublishedAt,
  posts: blogSource.posts.map((post) =>
    post.kind === "authored"
      ? post
      : resolveCaseStudyPost(post, blogSource.caseStudyPublishedAt)
  ),
})
type ResolvedBlogPost = z.infer<typeof resolvedPostSchema>
type DatedBlogPost = ResolvedBlogPost & { publishedAt: string }
type AuthoredBlogPost = DatedBlogPost & { kind: "authored" }

function assertBlogCatalogIntegrity(posts: readonly ResolvedBlogPost[]) {
  const slugs = posts.map((post) => post.slug)
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("The blog catalog contains duplicate slugs")
  }

  const projectIds = posts.flatMap((post) =>
    post.projectId ? [post.projectId] : []
  )
  const expectedProjectIds = projectCaseStudyCatalog.records.map(
    (caseStudy) => caseStudy.projectId
  )
  if (
    projectIds.length !== new Set(projectIds).size ||
    projectIds.length !== expectedProjectIds.length ||
    expectedProjectIds.some((projectId) => !projectIds.includes(projectId))
  ) {
    throw new Error(
      "The blog catalog must link exactly one article to every project"
    )
  }
}

assertBlogCatalogIntegrity(blog.posts)

function isAuthoredBlogPost(post: ResolvedBlogPost): post is AuthoredBlogPost {
  return post.kind === "authored" && Boolean(post.publishedAt)
}

function isDatedBlogPost(post: ResolvedBlogPost): post is DatedBlogPost {
  return Boolean(post.publishedAt)
}

const authoredPosts = blog.posts.filter(isAuthoredBlogPost)
const caseStudyDerivedPosts = blog.posts.filter(
  (post) => post.kind === "case-study-derived"
)
const datedPosts = blog.posts.filter(isDatedBlogPost)
if (!datedPosts.length) {
  throw new Error("The blog catalog requires at least one dated article")
}
const newestPublishedAt = datedPosts.reduce(
  (newest, post) => (post.publishedAt > newest ? post.publishedAt : newest),
  datedPosts[0].publishedAt
)
const latestDatedPosts = datedPosts.filter(
  (post) => post.publishedAt === newestPublishedAt
)
const primaryFeatured =
  blog.posts.find((post) => post.featured) ?? blog.posts[0]
const featuredPosts = blog.posts.filter((post) => post.featured)

export const blogTopicNavigation = [
  { label: "All", value: "all" },
  { label: "Product", value: "product" },
  { label: "Career", value: "career" },
  { label: "Tools", value: "tools" },
] as const satisfies ReadonlyArray<{
  label: string
  value: BlogTopic
}>

export const blogCatalog = {
  ...blog,
  authoredPosts,
  caseStudyDerivedPosts,
  datedPosts,
  latestDatedPosts,
  newestPublishedAt,
  featured: primaryFeatured,
  featuredPosts: featuredPosts.length ? featuredPosts : [primaryFeatured],
  find(slug: string) {
    return blog.posts.find((post) => post.slug === slug)
  },
  next(slug: string) {
    const index = blog.posts.findIndex((post) => post.slug === slug)
    return blog.posts[(index + 1) % blog.posts.length]
  },
  filter(topic: BlogTopic, query: string) {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return blog.posts.filter((post) => {
      const matchesTopic = topic === "all" || post.topic === topic
      const matchesQuery =
        !normalizedQuery ||
        [post.title, post.excerpt, post.category].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery)
        )

      return matchesTopic && matchesQuery
    })
  },
} as const

export type BlogPost = ResolvedBlogPost
export type BlogTopic = z.infer<typeof blogTopicSchema>
