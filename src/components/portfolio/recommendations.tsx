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
import { Card, cardInsetClassName } from "@/components/ui/card"
import type { recommendations } from "@/lib/content"
import { recommendations as recommendationData } from "@/lib/content"

type Recommendation = (typeof recommendations)[number]

const linkedInRecommendationsUrl =
  "https://www.linkedin.com/in/montasim/details/recommendations/"

export function RecommendationDetails({ item }: { item: Recommendation }) {
  return (
    <Card asChild className={cardInsetClassName}>
      <article>
        <header>
          <h2 className="leading-snug font-semibold text-emphasis-foreground">
            {item.name}
          </h2>
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
  copy,
  duplicate = false,
}: {
  item: Recommendation
  index: number
  copy?: number
  duplicate?: boolean
}) {
  return (
    <Card
      asChild
      className={`shrink-0 basis-4/5 ${cardInsetClassName} ${duplicate ? "motion-reduce:hidden" : ""}`}
    >
      <figure
        aria-hidden={duplicate || undefined}
        data-recommendation-copy={index === 0 ? copy : undefined}
      >
        <div
          className="flex items-center justify-between text-sm text-muted-foreground"
          aria-hidden="true"
        >
          <QuotesIcon />
          <span>#{index + 1}</span>
        </div>
        <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {item.text}
        </blockquote>
        <figcaption className="mt-4 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-semibold text-emphasis-foreground">
              {item.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.date} · {item.relationship}
            </p>
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="mt-3 h-auto shrink-0 p-0 text-xs font-medium text-emphasis-foreground sm:mt-0"
          >
            <a
              href={linkedInRecommendationsUrl}
              target="_blank"
              rel="noreferrer"
              tabIndex={duplicate ? -1 : undefined}
            >
              View on LinkedIn
              <ArrowUpRightIcon />
            </a>
          </Button>
        </figcaption>
      </figure>
    </Card>
  )
}

export function RecommendationCarousel() {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const pausedRef = React.useRef(false)
  const pauseUntilRef = React.useRef(0)
  const segmentWidthRef = React.useRef(0)

  React.useEffect(() => {
    const track = trackRef.current
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!track || reduceMotion.matches) return

    let animationFrame = 0
    let autoPosition = 0
    let previousTime = performance.now()
    let wasPaused = true

    function measureAndPosition() {
      const firstCopy = track?.querySelector<HTMLElement>(
        '[data-recommendation-copy="0"]'
      )
      const secondCopy = track?.querySelector<HTMLElement>(
        '[data-recommendation-copy="1"]'
      )
      if (!track || !firstCopy || !secondCopy) return

      const previousWidth = segmentWidthRef.current
      const nextWidth = secondCopy.offsetLeft - firstCopy.offsetLeft
      if (nextWidth <= 0) return

      const progress = previousWidth
        ? ((track.scrollLeft - previousWidth) % previousWidth) / previousWidth
        : 0
      segmentWidthRef.current = nextWidth
      track.scrollLeft = nextWidth + Math.max(0, progress) * nextWidth
      autoPosition = track.scrollLeft
    }

    function wrappedPosition(position: number) {
      const segmentWidth = segmentWidthRef.current
      if (!segmentWidth) return position

      if (position >= segmentWidth * 2) {
        return position - segmentWidth
      }
      if (position < segmentWidth) return position + segmentWidth
      return position
    }

    function animate(time: number) {
      const paused =
        track &&
        (pausedRef.current ||
          time < pauseUntilRef.current ||
          document.visibilityState !== "visible")

      if (track && !paused) {
        if (wasPaused) autoPosition = track.scrollLeft
        const elapsed = Math.min(time - previousTime, 50)
        autoPosition = wrappedPosition(autoPosition - (elapsed / 1000) * 23.12)
        track.scrollLeft = autoPosition
      }
      wasPaused = Boolean(paused)
      previousTime = time
      animationFrame = requestAnimationFrame(animate)
    }

    measureAndPosition()
    const resizeObserver = new ResizeObserver(measureAndPosition)
    resizeObserver.observe(track)
    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [])

  function move(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return

    pauseUntilRef.current = performance.now() + 900
    track.scrollBy({
      left: track.clientWidth * 0.8 * direction,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => move(1)}
        className="absolute top-1/2 left-2 z-10 size-10 -translate-y-1/2 rounded-full bg-card/95 shadow-sm"
        aria-label="Move recommendations left"
        aria-controls="recommendation-track"
      >
        <ArrowLeftIcon />
      </Button>
      <div
        ref={trackRef}
        id="recommendation-track"
        className="flex [scrollbar-width:none] gap-4 overflow-x-auto pb-1 [overscroll-behavior-inline:contain] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Recommendations"
        onFocus={() => {
          pausedRef.current = true
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            pausedRef.current = false
          }
        }}
        onPointerDown={() => {
          pausedRef.current = true
        }}
        onPointerUp={() => {
          pausedRef.current = false
          pauseUntilRef.current = performance.now() + 900
        }}
        onPointerCancel={() => {
          pausedRef.current = false
        }}
      >
        {[0, 1, 2].flatMap((copy) =>
          recommendationData.map((item, index) => (
            <FeaturedRecommendation
              key={`${copy}-${item.name}-${item.date}`}
              item={item}
              index={index}
              copy={copy}
              duplicate={copy !== 1}
            />
          ))
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => move(-1)}
        className="absolute top-1/2 right-2 z-10 size-10 -translate-y-1/2 rounded-full bg-card/95 shadow-sm"
        aria-label="Move recommendations right"
        aria-controls="recommendation-track"
      >
        <ArrowRightIcon />
      </Button>
      <p className="sr-only" aria-live="polite">
        {recommendationData.length} recommendations
      </p>
    </div>
  )
}

export { linkedInRecommendationsUrl }
