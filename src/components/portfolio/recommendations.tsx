import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  QuotesIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"

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

export function RecommendationDetails({ item }: { item: Recommendation }) {
  return (
    <Card asChild className={cardInsetClassName}>
      <article>
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="leading-snug font-semibold text-emphasis-foreground">
              {item.name}
            </h2>
            <Badge variant="secondary" className="font-medium">
              {item.hiringSignal}
            </Badge>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <UsersThreeIcon aria-hidden="true" />
              {item.relationship}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlankIcon aria-hidden="true" />
              {item.date}
            </span>
          </p>
        </header>
        <div className="mt-5 grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8">
          <div className="pt-0.5">
            <p className="text-xs font-medium text-muted-foreground">Role</p>
            <p className="mt-1 text-sm leading-relaxed font-semibold text-emphasis-foreground">
              {item.role}
            </p>
          </div>
          <blockquote className="border-l-2 border-muted-foreground pl-4 text-sm leading-relaxed text-muted-foreground">
            “{item.text}”
          </blockquote>
        </div>
      </article>
    </Card>
  )
}

function FeaturedRecommendation({
  item,
  index,
}: {
  item: Recommendation
  index: number
}) {
  return (
    <Card
      asChild
      className={`${cardInsetClassName} flex h-full w-full flex-col`}
    >
      <figure>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <QuotesIcon />
          <span className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {item.hiringSignal}
            </Badge>
            <span aria-label={`Recommendation ${index + 1}`}>#{index + 1}</span>
          </span>
        </div>
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {item.text}
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
  const [api, setApi] = React.useState<CarouselApi>()
  const [paused, setPaused] = React.useState(false)
  const [canScrollPrevious, setCanScrollPrevious] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const updateControls = () => {
      setCanScrollPrevious(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
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
    if (!api || paused) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") api.scrollPrev()
    }, 7000)
    return () => window.clearInterval(timer)
  }, [api, paused])

  return (
    <Carousel
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
          <ArrowLeftIcon />
        </Button>
      </div>
      <CarouselContent className="-ml-4 pb-1">
        {recommendationCatalog.featured.map((item, index) => (
          <CarouselItem
            key={`${item.name}-${item.date}`}
            className="flex basis-4/5 pl-4"
          >
            <FeaturedRecommendation item={item} index={index} />
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
          <ArrowRightIcon />
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {recommendationCatalog.featured.length} featured recommendations
      </p>
    </Carousel>
  )
}
