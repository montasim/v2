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
  url: "https://montasim.vercel.app",
  ogImage: "/images/social-preview.png",
})

export const landingNavigation = [
  { label: "About", sectionId: "about" },
  { label: "Experience", sectionId: "experience" },
  { label: "Projects", sectionId: "projects" },
  { label: "Skills", sectionId: "skills" },
] as const

export function createMeta(title: string, description: string, path = "/") {
  const canonical = new URL(path, site.url).toString()
  const image = new URL(site.ogImage, site.url).toString()
  const pageTitle = title === site.fullName ? title : `${title} | ${site.name}`
  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: description },
      { name: "author", content: site.fullName },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: `${site.fullName} portfolio preview`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: canonical }],
  }
}
