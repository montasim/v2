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

function imageContentType(imageUrl: string) {
  const extension = new URL(imageUrl).pathname.split(".").at(-1)?.toLowerCase()

  if (extension === "jpg" || extension === "jpeg") return "image/jpeg"
  if (extension === "png") return "image/png"
  if (extension === "webp") return "image/webp"
  return undefined
}

function socialImageUrl(imagePath: string) {
  const imageUrl = new URL(imagePath, site.url)
  const siteOrigin = new URL(site.url).origin

  if (imageUrl.origin === siteOrigin && /\.webp$/i.test(imageUrl.pathname)) {
    imageUrl.pathname = imageUrl.pathname.replace(/\.webp$/i, ".png")
  }

  return imageUrl.toString()
}

export function createMeta(
  title: string,
  description: string,
  path = "/",
  options: MetaOptions = {}
) {
  const canonical = new URL(path, site.url).toString()
  const image = socialImageUrl(options.image ?? site.ogImage)
  const imageType = imageContentType(image)
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
      ...(imageType ? [{ property: "og:image:type", content: imageType }] : []),
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
