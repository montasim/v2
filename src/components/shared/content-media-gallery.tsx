import { useCallback, useEffect, useState } from "react"

import { ContentPreviewImage } from "@/components/shared/content-preview-image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
} from "@/components/ui/icons"
import type { ContentMedia } from "@/lib/content/project-media"
import { cn } from "@/lib/utils"

export function ContentMediaGallery({
  media,
  className,
  priority = false,
}: {
  media: readonly ContentMedia[]
  className?: string
  priority?: boolean
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({})

  const updateSelection = useCallback(() => {
    setSelectedIndex(api?.selectedScrollSnap() ?? 0)
  }, [api])

  useEffect(() => {
    if (!api) return
    updateSelection()
    api.on("select", updateSelection)
    api.on("reInit", updateSelection)
    return () => {
      api.off("select", updateSelection)
      api.off("reInit", updateSelection)
    }
  }, [api, updateSelection])

  if (media.length === 0) return null

  if (media.length === 1) {
    return (
      <ContentPreviewImage
        src={media[0].src}
        alt={media[0].alt}
        width="1600"
        height="1000"
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-auto w-full rounded-lg border", className)}
      />
    )
  }

  return (
    <Carousel
      setApi={setApi}
      options={{ loop: true }}
      aria-roledescription="carousel"
      aria-label="Project image gallery"
      tabIndex={0}
      className={cn("group/gallery", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          api?.scrollPrev()
        }
        if (event.key === "ArrowRight") {
          event.preventDefault()
          api?.scrollNext()
        }
      }}
    >
      <CarouselContent
        className="min-h-0 items-start"
        style={{
          aspectRatio: String(
            imageRatios[media[selectedIndex]?.src] ?? 16 / 10
          ),
        }}
      >
        {media.map((item, index) => (
          <CarouselItem
            key={item.src}
            aria-label={`${index + 1} of ${media.length}`}
          >
            <ContentPreviewImage
              src={item.src}
              alt={item.alt}
              width="1600"
              height="1000"
              fetchPriority={priority && index === 0 ? "high" : undefined}
              loading={priority && index === 0 ? "eager" : "lazy"}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget
                if (!naturalWidth || !naturalHeight) return
                const ratio = naturalWidth / naturalHeight
                setImageRatios((current) =>
                  current[item.src] === ratio
                    ? current
                    : { ...current, [item.src]: ratio }
                )
              }}
              className="h-auto w-full rounded-lg border"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="absolute top-1/2 left-3 -translate-y-1/2 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/gallery:opacity-100 sm:group-hover/gallery:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Previous image"
          onClick={() => api?.scrollPrev()}
          className="shadow-md active:translate-y-0 motion-safe:hover:translate-y-0"
        >
          <ArrowLeftCompactIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-3 -translate-y-1/2 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/gallery:opacity-100 sm:group-hover/gallery:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Next image"
          onClick={() => api?.scrollNext()}
          className="shadow-md active:translate-y-0 motion-safe:hover:translate-y-0"
        >
          <ArrowRightCompactIcon aria-hidden="true" />
        </Button>
      </div>
      <p
        className="absolute right-3 bottom-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-strong-foreground tabular-nums shadow-sm"
        aria-live="polite"
      >
        {selectedIndex + 1} / {media.length}
      </p>
    </Carousel>
  )
}
