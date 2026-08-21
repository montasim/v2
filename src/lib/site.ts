import { z } from "zod"

const siteSchema = z.object({
  name: z.string().min(1),
  fullName: z.string().min(1),
  description: z.string().min(50),
  url: z.url(),
  ogImage: z.string().startsWith("/"),
})

export const site = siteSchema.parse({
  name: "Montasim",
  fullName: "Mohammad Montasim Al Mamun Shuvo",
  description:
    "Senior Software Engineer building deterministic, high-performance web platforms for real-time and AI-driven applications.",
  url: "https://montasim.dev",
  ogImage: "/images/social-preview.png",
})

export const landingNavigation = [
  { label: "About", sectionId: "about" },
  { label: "Experience", sectionId: "experience" },
  { label: "Projects", sectionId: "projects" },
  { label: "Skills", sectionId: "skills" },
] as const

export const landingSectionIds = [
  "about",
  "availability",
  "experience",
  "projects",
  "skills",
  "background",
  "contributions",
  "volunteering",
  "organizations",
  "recommendations",
] as const

type MetaOptions = {
  type?: "website" | "article"
  image?: string
  imageAlt?: string
  publishedTime?: string
  author?: string
  section?: string
}

export function createMeta(
  title: string,
  description: string,
  path = "/",
  options: MetaOptions = {}
) {
  const canonical = new URL(path, site.url).toString()
  const image = new URL(options.image ?? site.ogImage, site.url).toString()
  const imageAlt = options.imageAlt ?? `${site.fullName} portfolio preview`
  const pageTitle = title === site.fullName ? title : `${title} | ${site.name}`
  const isArticle = options.type === "article"

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: description },
      { name: "author", content: site.fullName },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: options.type ?? "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:site_name", content: site.name },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:alt", content: imageAlt },
      ...(!options.image
        ? [
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      ...(isArticle && options.publishedTime
        ? [
            {
              property: "article:published_time",
              content: options.publishedTime,
            },
          ]
        : []),
      ...(isArticle && options.author
        ? [{ property: "article:author", content: options.author }]
        : []),
      ...(isArticle && options.section
        ? [{ property: "article:section", content: options.section }]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [{ rel: "canonical", href: canonical }],
  }
}
