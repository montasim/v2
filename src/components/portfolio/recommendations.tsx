import * as React from "react"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  QuotesIcon,
  UsersThreeIcon,
} from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { Card, cardInsetClassName } from "@/components/ui/card"
import { ExternalAction } from "@/components/shared/navigation-action"
import type { Recommendation } from "@/lib/content/recommendations"
import {
  linkedInRecommendationsUrl,
  recommendationCatalog,
} from "@/lib/content/recommendations"

function RecommendationParagraphs({
  text,
  quoted = false,
}: {
  text: string
  quoted?: boolean
}) {
  const paragraphs = text.split("\n\n")

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split("\n")

    return (
      <p key={paragraphIndex}>
        {quoted && paragraphIndex === 0 ? "“" : null}
        {lines.map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {line}
          </React.Fragment>
        ))}
        {quoted && paragraphIndex === paragraphs.length - 1 ? "”" : null}
      </p>
    )
  })
}

export function RecommendationDetails({
  item,
  index,
}: {
  item: Recommendation
  index: number
}) {
  return (
    <Card asChild className={cardInsetClassName}>
      <article>
        <header>
          <div className="flex items-start justify-between gap-4">
            <h2 className="leading-snug font-semibold text-emphasis-foreground">
              {item.name}
            </h2>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="font-medium">
                {item.hiringSignal}
              </Badge>
              <span aria-label={`Recommendation ${index + 1}`}>
                #{index + 1}
              </span>
            </span>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <UsersThreeIcon className="size-4" aria-hidden="true" />
              {item.relationship}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlankIcon className="size-4" aria-hidden="true" />
              {item.date}
            </span>
          </p>
        </header>
        <div className="mt-5 grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
          <div className="pt-0.5">
            <p className="text-xs font-medium text-muted-foreground">Role</p>
            <p className="mt-1 text-sm leading-relaxed font-semibold text-muted-foreground">
              {item.role}
            </p>
          </div>
          <blockquote className="space-y-4 border-l-2 border-muted-foreground/40 pl-4 text-sm leading-relaxed text-muted-foreground">
            <RecommendationParagraphs text={item.text} quoted />
          </blockquote>
        </div>
        <div className="mt-5 flex justify-end">
          <ExternalAction
            href={linkedInRecommendationsUrl}
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs font-medium text-emphasis-foreground"
          >
            View on LinkedIn
            <ArrowUpRightIcon />
          </ExternalAction>
        </div>
      </article>
    </Card>
  )
}

function FeaturedRecommendation({
  item,
  index,
  isActive,
  progressPaused,
}: {
  item: Recommendation
  index: number
  isActive: boolean
  progressPaused: boolean
}) {
  return (
    <Card
      asChild
      className={`${cardInsetClassName} relative flex h-full w-full flex-col overflow-hidden`}
    >
      <figure>
        {isActive ? (
          <div
            className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px overflow-hidden"
            aria-hidden="true"
          >
            <div
              key={`recommendation-progress-${index}-${progressPaused}`}
              className="recommendation-carousel-progress h-full bg-emphasis-foreground will-change-transform"
              style={{
                animationPlayState: progressPaused ? "paused" : "running",
              }}
            />
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <QuotesIcon />
          <span className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {item.hiringSignal}
            </Badge>
            <span aria-label={`Recommendation ${index + 1}`}>#{index + 1}</span>
          </span>
        </div>
        <blockquote className="mt-3 flex-1 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <RecommendationParagraphs text={item.text} />
        </blockquote>
        <figcaption className="mt-auto pt-4 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-semibold text-emphasis-foreground">
              {item.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.date} · {item.relationship}
            </p>
          </div>
          <ExternalAction
            href={linkedInRecommendationsUrl}
            variant="link"
            size="sm"
            className="mt-3 h-auto shrink-0 p-0 text-xs font-medium text-emphasis-foreground sm:mt-0"
          >
            View on LinkedIn
            <ArrowUpRightIcon />
          </ExternalAction>
        </figcaption>
      </figure>
    </Card>
  )
}

export function RecommendationCarousel() {
  const carouselRef = React.useRef<HTMLDivElement>(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [paused, setPaused] = React.useState(false)
  const [inViewport, setInViewport] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [canScrollPrevious, setCanScrollPrevious] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const updateControls = () => {
      setCanScrollPrevious(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
      setSelectedIndex(api.selectedScrollSnap())
    }
    updateControls()
    api.on("select", updateControls)
    api.on("reInit", updateControls)
    return () => {
      api.off("select", updateControls)
      api.off("reInit", updateControls)
    }
  }, [api])

  React.useEffect(() => {
    const element = carouselRef.current
    if (!element || !("IntersectionObserver" in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0.01 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!api || paused || !inViewport) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") api.scrollPrev()
    }, 7000)
    return () => window.clearInterval(timer)
  }, [api, inViewport, paused])

  return (
    <Carousel
      ref={carouselRef}
      setApi={setApi}
      options={{ align: "start", loop: true }}
      aria-label="Recommendations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
    >
      <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => api?.scrollNext()}
          className="size-10 rounded-full bg-card/95 shadow-sm"
          aria-label="Move recommendations left"
          disabled={!canScrollPrevious}
        >
          <ArrowLeftCompactIcon />
        </Button>
      </div>
      <CarouselContent className="-ml-4 pb-1">
        {recommendationCatalog.featured.map((item, index) => (
          <CarouselItem
            key={`${item.name}-${item.date}`}
            className="flex basis-4/5 pl-4"
          >
            <FeaturedRecommendation
              item={item}
              index={index}
              isActive={index === selectedIndex}
              progressPaused={paused || !inViewport}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => api?.scrollPrev()}
          className="size-10 rounded-full bg-card/95 shadow-sm"
          aria-label="Move recommendations right"
          disabled={!canScrollNext}
        >
          <ArrowRightCompactIcon />
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {recommendationCatalog.featured.length} featured recommendations
      </p>
    </Carousel>
  )
}
