// @vitest-environment jsdom
import * as React from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

import { ContentMediaGallery } from "./content-media-gallery"

const carouselApi = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  selectedScrollSnap: vi.fn(() => 0),
}))

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({
    setApi,
    children,
    ...props
  }: React.ComponentProps<"div"> & { setApi?: (api: unknown) => void }) => {
    React.useEffect(() => setApi?.(carouselApi), [setApi])
    return (
      <div role="region" {...props}>
        {children}
      </div>
    )
  },
  CarouselContent: (props: React.ComponentProps<"div">) => <div {...props} />,
  CarouselItem: (props: React.ComponentProps<"div">) => <div {...props} />,
}))

const media = [
  { src: "/one.webp", alt: "First screenshot" },
  { src: "/two.webp", alt: "Second screenshot" },
]

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

it("keeps one image static without unnecessary carousel controls", () => {
  render(<ContentMediaGallery media={[media[0]]} />)

  expect(screen.getByRole("img", { name: "First screenshot" })).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Next image" })).toBeNull()
})

it("provides pointer and keyboard navigation for multiple images", async () => {
  render(<ContentMediaGallery media={media} />)
  await act(async () => {})

  fireEvent.click(screen.getByRole("button", { name: "Next image" }))
  fireEvent.click(screen.getByRole("button", { name: "Previous image" }))
  expect(carouselApi.scrollNext).toHaveBeenCalledOnce()
  expect(carouselApi.scrollPrev).toHaveBeenCalledOnce()

  const gallery = screen.getByRole("region", { name: "Project image gallery" })
  fireEvent.keyDown(gallery, { key: "ArrowRight" })
  fireEvent.keyDown(gallery, { key: "ArrowLeft" })
  expect(carouselApi.scrollNext).toHaveBeenCalledTimes(2)
  expect(carouselApi.scrollPrev).toHaveBeenCalledTimes(2)
  expect(screen.getByText("1 / 2")).toBeTruthy()

  for (const name of ["Previous image", "Next image"]) {
    const button = screen.getByRole("button", { name })
    expect(button.className).not.toContain("-translate-y-1/2")
    expect(button.parentElement?.className).toContain("-translate-y-1/2")
    expect(button.className).toContain("motion-safe:hover:translate-y-0")
    expect(button.className).toContain("active:translate-y-0")
  }
})
