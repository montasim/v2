import { describe, expect, it } from "vitest"

import { blogCatalog } from "./blog"
import { projectCatalog } from "./projects"
import { createMeta, site } from "../site"

describe("blog catalog", () => {
  it("provides routable featured articles", () => {
    expect(blogCatalog.featured.featured).toBe(true)
    expect(blogCatalog.featuredPosts.map((post) => post.slug)).toEqual([
      "the-linkedin-page-is-untrusted-input",
      "company-research-without-a-fake-score",
      "scheduled-publishing-cannot-depend-on-an-open-tab",
    ])
    expect(blogCatalog.featuredPosts.every((post) => post.featured)).toBe(true)
    expect(blogCatalog.featured.sections.length).toBeGreaterThan(0)
    expect(blogCatalog.find(blogCatalog.featured.slug)).toBe(
      blogCatalog.featured
    )
  })

  it("filters by topic and search query", () => {
    expect(
      blogCatalog.filter("tools", "video q&a").map((post) => post.slug)
    ).toEqual(["video-qa-without-processing-video"])
    expect(blogCatalog.filter("career", "publishing")).toHaveLength(0)
    expect(
      blogCatalog
        .filter("all", "publishing")
        .some(
          (post) =>
            post.slug === "scheduled-publishing-cannot-depend-on-an-open-tab"
        )
    ).toBe(true)
  })

  it("covers every project with a dedicated article", () => {
    const coveredProjectIds = blogCatalog.posts.flatMap((post) =>
      post.projectId ? [post.projectId] : []
    )

    expect(coveredProjectIds).toHaveLength(projectCatalog.records.length)
    expect(new Set(coveredProjectIds)).toEqual(
      new Set(projectCatalog.records.map((project) => project.id))
    )
  })

  it("cycles to another article", () => {
    expect(blogCatalog.next(blogCatalog.featured.slug).slug).not.toBe(
      blogCatalog.featured.slug
    )
  })

  it("builds article-specific social preview metadata", () => {
    const post = blogCatalog.featured
    const metadata = createMeta(
      post.title,
      post.excerpt,
      `/blog/${post.slug}`,
      {
        type: "article",
        image: post.image.src,
        imageAlt: post.image.alt,
        publishedTime: `${post.publishedAt}T00:00:00.000Z`,
        author: blogCatalog.author.name,
        section: post.category,
      }
    )

    expect(metadata.meta).toContainEqual({
      property: "og:type",
      content: "article",
    })
    expect(metadata.meta).toContainEqual({
      property: "og:image",
      content: new URL(post.image.src, site.url).toString(),
    })
    expect(metadata.meta).toContainEqual({
      property: "article:published_time",
      content: `${post.publishedAt}T00:00:00.000Z`,
    })
    expect(metadata.meta).toContainEqual({
      name: "twitter:image:alt",
      content: post.image.alt,
    })
  })
})
