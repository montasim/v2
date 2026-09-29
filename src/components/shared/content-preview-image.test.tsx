// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"

import { ContentPreviewImage } from "./content-preview-image"

afterEach(cleanup)

it("preserves the complete content image regardless of its frame", () => {
  render(
    <ContentPreviewImage
      src="/images/projects/example.webp"
      alt="Complete project preview"
      className="aspect-[16/10] w-full"
    />
  )

  const image = screen.getByRole("img", { name: "Complete project preview" })
  expect(image.className).toContain("object-contain")
  expect(image.className).not.toContain("object-cover")
})
