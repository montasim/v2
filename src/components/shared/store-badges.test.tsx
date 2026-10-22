import { renderToStaticMarkup } from "react-dom/server"
import { expect, it } from "vitest"
import { StoreBadges } from "./store-badges"
import { projectCatalog, extensionReleaseUrl } from "@/lib/content/projects"

const extension = {
  title: "Example",
  type: "extension" as const,
  releaseUrl: "https://github.com/example/extension/releases",
}

it("offers GitHub releases when an extension has no Chrome listing", () => {
  const markup = renderToStaticMarkup(<StoreBadges project={extension} />)
  expect(extensionReleaseUrl(extension)).toBe(extension.releaseUrl)
  expect(markup).toContain(`href="${extension.releaseUrl}"`)
  expect(markup).toContain("Download from GitHub")
  expect(markup).not.toContain("<img")
})

it("prefers Chrome over GitHub releases for a published extension", () => {
  const project = {
    ...extension,
    chromeWebStoreUrl: "https://chromewebstore.google.com/detail/example",
  }
  const markup = renderToStaticMarkup(<StoreBadges project={project} />)
  expect(extensionReleaseUrl(project)).toBeUndefined()
  expect(markup).toContain("chrome-web-store.png")
  expect(markup).not.toContain("Download from GitHub")
})

it("does not offer the extension fallback without a release or for other project types", () => {
  expect(extensionReleaseUrl({ type: "extension" })).toBeUndefined()
  expect(extensionReleaseUrl({ ...extension, type: "package" })).toBeUndefined()
})

it("lists Google Play before Microsoft and Snap for Air Traffic Control", () => {
  const project = projectCatalog.findBySlug("air-traffic-control")!
  const markup = renderToStaticMarkup(<StoreBadges project={project} />)
  expect(markup).toContain(`href="${project.googlePlayUrl}"`)
  expect(markup).toContain("Get Air Traffic Control for Android on Google Play")
  expect(markup.indexOf("google-play.svg")).toBeLessThan(
    markup.indexOf("microsoft-store.svg")
  )
  expect(markup.indexOf("microsoft-store.svg")).toBeLessThan(
    markup.indexOf("snap-store.svg")
  )
})
