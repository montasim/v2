import { useEffect, useId, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  CheckIcon,
  CircleDashedIcon,
  FunnelSimpleIcon,
  SearchIcon,
} from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { InputGroup } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import { subscribeToNewsletter } from "@/features/newsletter/application/subscribe"
import { getNewsletterSubscriptionError } from "@/features/newsletter/domain/subscriber"
import { blogCatalog, blogTopicNavigation } from "@/lib/content/blog"
import type { BlogPost, BlogTopic } from "@/lib/content/blog"
import { cn } from "@/lib/utils"

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Card asChild>
      <article className="group flex min-w-0 flex-col overflow-hidden p-2 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-emphasis-foreground motion-reduce:transition-none">
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          aria-label={`Read ${post.title}`}
          className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <img
            src={post.image.src}
            alt={post.image.alt}
            width="720"
            height="450"
            loading="lazy"
            className="aspect-[16/10] w-full rounded-lg object-cover"
          />
          <div className="flex flex-1 flex-col px-2.5 pt-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.6875rem] font-bold tracking-[0.06em] text-strong-foreground uppercase">
                {post.category}
              </p>
              <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                {post.publishedAt
                  ? formatShortDate(post.publishedAt)
                  : "Project case study"}{" "}
                · {post.readingMinutes} min read
              </span>
            </div>
            <h3 className="mt-3 text-lg leading-[1.375] font-semibold tracking-[-0.015em] text-balance text-strong-foreground">
              {post.title}
            </h3>
            <p className="mt-2 text-[0.8125rem] leading-[1.55] text-muted-foreground">
              {post.excerpt}
            </p>
          </div>
        </Link>
      </article>
    </Card>
  )
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article>
      <Card asChild>
        <Link
          to="/blog/$slug"
          params={{ slug: post.slug }}
          className="group grid gap-0 overflow-hidden p-1.5 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emphasis-foreground focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none lg:grid-cols-[13fr_7fr] lg:p-2.5"
          aria-label={`Read ${post.title}`}
        >
          <div className="min-h-57.5 overflow-hidden rounded-lg sm:min-h-85 lg:min-h-100">
            <img
              src={post.image.src}
              alt={post.image.alt}
              width="1200"
              height="900"
              fetchPriority="high"
              className="h-full w-full object-cover contrast-[1.02] saturate-[0.84] transition-[transform,filter] duration-300 group-hover:scale-[1.012] group-hover:saturate-100"
            />
          </div>
          <div className="flex min-h-70 flex-col justify-between px-4.5 pt-6 pb-4.5 text-strong-foreground sm:p-6 lg:min-h-100 lg:p-8">
            <div>
              <p className="text-xs font-bold tracking-[0.06em] text-strong-foreground uppercase">
                {post.category}
              </p>
              <h2 className="mt-3.5 text-[1.625rem] leading-tight font-bold tracking-[-0.025em] text-balance text-strong-foreground">
                {post.title}
              </h2>
              <p className="mt-4 max-w-[38ch] text-sm leading-[1.65] text-muted-foreground">
                {post.featureSummary ?? post.excerpt}
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span>
                {post.publishedAt
                  ? formatShortDate(post.publishedAt)
                  : "Project case study"}{" "}
                · {post.readingMinutes} min
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-strong-foreground">
                Read article
                <ArrowRightCompactIcon />
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </article>
  )
}

function FeaturedCarousel({ posts }: { posts: BlogPost[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [inViewport, setInViewport] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const interactionPaused = hovered || focusWithin

  useEffect(() => {
    const element = carouselRef.current
    if (!element) return
    if (!("IntersectionObserver" in window)) {
      setInViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!api) return
    const syncSelection = () => setSelectedIndex(api.selectedScrollSnap())
    syncSelection()
    api.on("select", syncSelection)
    api.on("reInit", syncSelection)
    return () => {
      api.off("select", syncSelection)
      api.off("reInit", syncSelection)
    }
  }, [api])

  useEffect(() => {
    if (!api || posts.length < 2 || !inViewport || interactionPaused) {
      return
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        api.scrollNext()
      }
    }, 6000)

    return () => window.clearInterval(timer)
  }, [api, inViewport, interactionPaused, posts.length])

  if (!posts.length) return null

  const currentPost = posts[selectedIndex] ?? posts[0]

  return (
    <Carousel
      ref={carouselRef}
      setApi={setApi}
      options={{ loop: true }}
      aria-roledescription="carousel"
      aria-label="Featured articles"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusWithin(false)
        }
      }}
    >
      <div className="mb-3.5 flex items-center justify-between gap-5">
        <h2
          id="featured-article-heading"
          className="text-sm font-semibold text-strong-foreground"
        >
          Featured articles
        </h2>
        {posts.length > 1 ? (
          <div className="flex min-h-7 items-center gap-2">
            <span className="inline-flex h-7 min-w-11 items-center justify-center font-mono text-xs leading-none text-muted-foreground tabular-nums">
              {String(selectedIndex + 1).padStart(2, "0")} /{" "}
              {String(posts.length).padStart(2, "0")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => api?.scrollPrev()}
              aria-label="Previous featured article"
            >
              <ArrowLeftCompactIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => api?.scrollNext()}
              aria-label="Next featured article"
            >
              <ArrowRightCompactIcon />
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Latest</span>
        )}
      </div>
      <div className="relative">
        {posts.length > 1 ? (
          <div
            className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px overflow-hidden"
            aria-hidden="true"
          >
            <div
              key={`featured-progress-${selectedIndex}-${inViewport}-${interactionPaused}`}
              className="featured-carousel-progress h-full bg-emphasis-foreground will-change-transform"
              style={{
                animationPlayState:
                  inViewport && !interactionPaused ? "running" : "paused",
              }}
            />
          </div>
        ) : null}
        <CarouselContent>
          {posts.map((post, index) => (
            <CarouselItem
              key={post.slug}
              aria-label={`${index + 1} of ${posts.length}`}
            >
              <FeaturedArticle post={post} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing featured article {selectedIndex + 1} of {posts.length}:{" "}
        {currentPost.title}
      </p>
    </Carousel>
  )
}

function SubscriptionCard() {
  const fieldId = useId()
  const subscribe = useServerFn(subscribeToNewsletter)
  const [email, setEmail] = useState("")
  const [saved, setSaved] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState("")

  return (
    <Card asChild className="mt-8 overflow-hidden rounded-2xl bg-background">
      <aside aria-labelledby="blog-subscribe-heading">
        <header className="min-h-18 border-b px-4 py-4.5 sm:px-6">
          <h2
            id="blog-subscribe-heading"
            className="text-sm font-semibold text-strong-foreground"
          >
            Get new articles by email
          </h2>
          <p className="mt-0.5 max-w-[48ch] text-xs leading-[1.55] text-muted-foreground">
            Occasional engineering notes. No tracking or filler.
          </p>
        </header>
        <form
          className="grid w-full max-w-180 gap-2.5 px-4 pt-5 pb-6 sm:px-6"
          onSubmit={async (event) => {
            event.preventDefault()
            setError("")
            setIsChecking(true)

            try {
              const website = String(
                new FormData(event.currentTarget).get("website") ?? ""
              )
              await subscribe({ data: { email, website } })
              setSaved(true)
            } catch (verificationError) {
              setError(
                getEmailVerificationError(verificationError) ??
                  getNewsletterSubscriptionError(verificationError) ??
                  "The subscription could not be completed. Try again."
              )
            } finally {
              setIsChecking(false)
            }
          }}
        >
          <Input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <Label htmlFor={fieldId} className="text-xs font-semibold">
            Email address
          </Label>
          <InputGroup className="gap-1.5 p-1.5 max-sm:flex-col max-sm:items-stretch">
            <Input
              id={fieldId}
              type="email"
              autoComplete="email"
              required
              disabled={isChecking}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setSaved(false)
                setError("")
              }}
              placeholder="you@example.com"
              className="min-h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <Button
              type="submit"
              disabled={isChecking}
              className="min-h-9 bg-emphasis-foreground px-4.5 text-background"
            >
              {isChecking ? (
                <CircleDashedIcon className="animate-spin motion-reduce:animate-none" />
              ) : saved ? (
                <CheckIcon />
              ) : null}
              {isChecking ? "Subscribing" : saved ? "Subscribed" : "Subscribe"}
            </Button>
          </InputGroup>
          <p
            className={cn(
              "min-h-4.5 text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
            role={error ? "alert" : "status"}
          >
            {error ||
              (saved
                ? "Subscription confirmed. Check your inbox for a welcome email."
                : "A confirmation email will be sent after subscribing.")}
          </p>
        </form>
      </aside>
    </Card>
  )
}

export function BlogIndexPage({
  topic,
  query,
  onQueryChange,
}: {
  topic: BlogTopic
  query: string
  onQueryChange: (query: string) => void
}) {
  const posts = blogCatalog.filter(topic, query)

  return (
    <PageShell className="pt-10 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Overview</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Blog</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-8 border-b pb-8">
        <h1 className="text-xl leading-tight font-bold tracking-[-0.025em] text-balance text-strong-foreground sm:text-3xl">
          Writing about software that has to work.
        </h1>
        <p className="mt-4.5 max-w-[62ch] text-[1.0625rem] leading-[1.6] text-muted-foreground">
          Practical notes on reliable systems, frontend architecture, AI
          workflows, and engineering decisions.
        </p>
      </header>

      <section
        aria-labelledby="featured-article-heading"
        className="border-b pt-8 pb-12"
      >
        <FeaturedCarousel posts={blogCatalog.featuredPosts} />
      </section>

      <section aria-labelledby="browse-writing-heading" className="pt-13.5">
        <div className="mb-6 flex items-end justify-between gap-8 max-sm:flex-col max-sm:items-start max-sm:gap-2">
          <h2
            id="browse-writing-heading"
            className="text-xl font-bold tracking-[-0.035em] text-strong-foreground sm:text-2xl"
          >
            Browse writing
          </h2>
          <p className="text-[0.8125rem] leading-[1.55] whitespace-nowrap text-muted-foreground max-sm:whitespace-normal">
            Search the archive or choose a topic to find the most useful note
            for what you are working on.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Label htmlFor="blog-search" className="sr-only">
            Search articles
          </Label>
          <Input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by title or idea"
            className="min-h-10.5 rounded-[0.625rem] bg-card pr-3 pl-9.5"
          />
        </div>

        <nav
          aria-label="Filter articles by topic"
          className="mt-4 flex [scrollbar-width:none] items-center gap-5 overflow-x-auto border-b sm:gap-7 [&::-webkit-scrollbar]:hidden"
        >
          <span className="hidden shrink-0 items-center gap-1.5 pt-2 pb-3 text-xs font-medium text-muted-foreground sm:inline-flex">
            <FunnelSimpleIcon className="size-3" />
            Filter
          </span>
          {blogTopicNavigation.map((item) => {
            const isActive = item.value === topic
            return (
              <Link
                key={item.value}
                to="/blog"
                search={{ topic: item.value, q: query }}
                resetScroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative shrink-0 rounded-sm pt-2 pb-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring motion-reduce:transition-none motion-reduce:after:transition-none",
                  isActive && "text-strong-foreground after:scale-x-100"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <p className="sr-only" aria-live="polite">
          {posts.length} {posts.length === 1 ? "article" : "articles"} found
        </p>

        {posts.length ? (
          <div
            className={cn(
              "mt-3 grid gap-4",
              posts.length === 1 && "max-w-95 grid-cols-1",
              posts.length === 2 && "sm:grid-cols-2",
              posts.length > 2 && "sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <Card className="mt-3 border-dashed px-5 py-10 text-center text-muted-foreground">
            <h3 className="text-sm font-semibold text-strong-foreground">
              No matching articles
            </h3>
            <p className="mt-1 text-[0.8125rem]">
              Try another topic or a broader search.
            </p>
          </Card>
        )}
      </section>

      <SubscriptionCard />
    </PageShell>
  )
}
