import { z } from "zod"

import blogJson from "@/data/blog.json"
import projectBlogJson from "@/data/project-blog.json"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"

export const blogTopicSchema = z.enum(["all", "product", "career", "tools"])
export const blogPostSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const postSchema = z.object({
  slug: blogPostSlugSchema,
  projectId: z.string().min(1).optional(),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  featureSummary: z.string().min(1).optional(),
  category: z.string().min(1),
  topic: blogTopicSchema.exclude(["all"]),
  publishedAt: z.iso.date(),
  readingMinutes: z.number().int().positive(),
  featured: z.boolean(),
  image: z.object({
    src: z.string().startsWith("/"),
    alt: z.string().min(1),
  }),
  sections: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        title: z.string().min(1),
        paragraphs: z.array(z.string().min(1)).min(1),
        callout: z.string().min(1).optional(),
      })
    )
    .min(1),
})

const blogSchema = z.object({
  author: z.object({
    name: z.string().min(1),
    avatarUrl: z.string().startsWith("/"),
  }),
  posts: z.array(postSchema).min(1),
})

const projectBlogMetadataSchema = z.array(
  z.object({
    projectId: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    category: z.string().min(1),
    topic: blogTopicSchema.exclude(["all"]),
    featured: z.boolean().optional(),
  })
)

const baseBlog = blogSchema.parse(blogJson)
const projectBlogMetadata = projectBlogMetadataSchema.parse(projectBlogJson)

function projectImagePath(imageUrl: string | null | undefined, type: string) {
  if (imageUrl) return `/images/${imageUrl.replace(/^assets\//, "")}`
  if (type === "skill") return "/images/projects/skillfoliox.webp"
  return "/images/projects/devtools.webp"
}

const projectPosts = projectBlogMetadata.map((metadata) => {
  const caseStudy = projectCaseStudyCatalog.findByProjectId(metadata.projectId)

  if (!caseStudy) {
    throw new Error(`Unknown project blog source: ${metadata.projectId}`)
  }

  return postSchema.parse({
    ...metadata,
    excerpt: caseStudy.summary,
    publishedAt: "2026-08-22",
    readingMinutes: 6,
    featured: metadata.featured ?? false,
    image: {
      src: projectImagePath(caseStudy.project.imageUrl, caseStudy.project.type),
      alt: caseStudy.screenshot?.alt ?? `${caseStudy.project.title} project`,
    },
    sections: [
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
    ],
  })
})

const blog = blogSchema.parse({
  ...baseBlog,
  posts: [...baseBlog.posts, ...projectPosts],
})
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

export type BlogPost = z.infer<typeof postSchema>
export type BlogTopic = z.infer<typeof blogTopicSchema>
