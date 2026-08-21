import { useEffect, useId, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"

import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
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
  FunnelSimpleIcon,
  SearchIcon,
} from "@/components/ui/icons"
import { blogCatalog, blogTopicNavigation } from "@/lib/content/blog"
import type { BlogPost, BlogTopic } from "@/lib/content/blog"
import { cn } from "@/lib/utils"

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card p-2 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-emphasis-foreground motion-reduce:transition-none">
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
            <p className="text-[0.6875rem] font-bold tracking-[0.06em] text-emphasis-foreground uppercase">
              {post.category}
            </p>
            <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
              {post.readingMinutes} min read
            </span>
          </div>
          <h3 className="mt-3 text-lg leading-[1.375] font-semibold tracking-[-0.015em] text-balance text-emphasis-foreground">
            {post.title}
          </h3>
          <p className="mt-2 text-[0.8125rem] leading-[1.55] text-muted-foreground">
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  )
}

function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <article>
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="group grid gap-0 overflow-hidden rounded-xl border bg-card p-1.5 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-emphasis-foreground focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none lg:grid-cols-[13fr_7fr] lg:p-2.5"
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
        <div className="flex min-h-70 flex-col justify-between px-4.5 pt-6 pb-4.5 text-emphasis-foreground sm:p-6 lg:min-h-100 lg:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.06em] text-emphasis-foreground uppercase">
              {post.category}
            </p>
            <h2 className="mt-3.5 text-[1.625rem] leading-tight font-bold tracking-[-0.025em] text-balance text-emphasis-foreground">
              {post.title}
            </h2>
            <p className="mt-4 max-w-[38ch] text-sm leading-[1.65] text-muted-foreground">
              {post.featureSummary ?? post.excerpt}
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>
              {formatShortDate(post.publishedAt)} · {post.readingMinutes} min
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emphasis-foreground">
              Read article
              <ArrowRightCompactIcon />
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

function FeaturedCarousel({ posts }: { posts: BlogPost[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const pointerStartX = useRef<number | null>(null)
  const suppressClick = useRef(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [inViewport, setInViewport] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [dragging, setDragging] = useState(false)
  const interactionPaused = hovered || focusWithin || dragging

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
    if (posts.length < 2 || !inViewport || interactionPaused) {
      return
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduceMotion.matches) return

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setSelectedIndex((index) => (index + 1) % posts.length)
      }
    }, 6000)

    return () => window.clearInterval(timer)
  }, [inViewport, interactionPaused, posts.length, selectedIndex])

  if (!posts.length) return null

  const currentPost = posts[selectedIndex] ?? posts[0]
  const showPrevious = () =>
    setSelectedIndex((index) => (index - 1 + posts.length) % posts.length)
  const showNext = () => setSelectedIndex((index) => (index + 1) % posts.length)

  return (
    <div
      ref={carouselRef}
      role="region"
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
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX
        setDragging(true)
      }}
      onPointerUp={(event) => {
        const startX = pointerStartX.current
        pointerStartX.current = null
        setDragging(false)
        if (startX === null) return

        const distance = event.clientX - startX
        if (Math.abs(distance) < 48) return
        suppressClick.current = true
        event.preventDefault()
        if (distance > 0) showPrevious()
        else showNext()
        window.setTimeout(() => {
          suppressClick.current = false
        }, 0)
      }}
      onPointerCancel={() => {
        pointerStartX.current = null
        setDragging(false)
      }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <div className="mb-3.5 flex items-center justify-between gap-5">
        <h2
          id="featured-article-heading"
          className="text-sm font-semibold text-emphasis-foreground"
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
              onClick={showPrevious}
              aria-label="Previous featured article"
            >
              <ArrowLeftCompactIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={showNext}
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
        <div
          key={currentPost.slug}
          role="group"
          aria-roledescription="slide"
          aria-label={`${selectedIndex + 1} of ${posts.length}`}
          className="carousel-card-enter"
        >
          <FeaturedArticle post={currentPost} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing featured article {selectedIndex + 1} of {posts.length}:{" "}
        {currentPost.title}
      </p>
    </div>
  )
}

function SubscriptionCard() {
  const fieldId = useId()
  const [email, setEmail] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("blog-subscription-email")
    if (storedEmail) {
      setEmail(storedEmail)
      setSaved(true)
    }
  }, [])

  return (
    <aside
      aria-labelledby="blog-subscribe-heading"
      className="mt-8 overflow-hidden rounded-2xl border bg-background"
    >
      <header className="min-h-18 border-b px-4 py-4.5 sm:px-6">
        <h2
          id="blog-subscribe-heading"
          className="text-sm font-semibold text-emphasis-foreground"
        >
          Get new articles by email
        </h2>
        <p className="mt-0.5 max-w-[48ch] text-xs leading-[1.55] text-muted-foreground">
          Occasional engineering notes. No tracking or filler.
        </p>
      </header>
      <form
        className="grid w-full max-w-180 gap-2.5 px-4 pt-5 pb-6 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault()
          window.localStorage.setItem("blog-subscription-email", email)
          setSaved(true)
        }}
      >
        <label htmlFor={fieldId} className="text-xs font-semibold">
          Email address
        </label>
        <div className="flex items-center gap-1.5 rounded-xl border bg-card p-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring max-sm:flex-col max-sm:items-stretch">
          <input
            id={fieldId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setSaved(false)
            }}
            placeholder="you@example.com"
            className="min-h-9 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            className="min-h-9 bg-emphasis-foreground px-4.5 text-background"
          >
            {saved ? <CheckIcon /> : null}
            {saved ? "Saved" : "Subscribe"}
          </Button>
        </div>
        <p className="min-h-4.5 text-xs text-muted-foreground" role="status">
          {saved
            ? "Preference saved on this device."
            : "Prototype only. No email will be sent."}
        </p>
      </form>
    </aside>
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
        <h1 className="text-3xl leading-tight font-bold tracking-[-0.025em] text-balance text-emphasis-foreground">
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
            className="text-2xl font-bold tracking-[-0.035em] text-emphasis-foreground"
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
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by title or idea"
            className="min-h-10.5 w-full rounded-[0.625rem] border bg-card pr-3 pl-9.5 text-sm outline-none placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
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
                  isActive && "text-foreground after:scale-x-100"
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
          <div className="mt-3 rounded-xl border border-dashed px-5 py-10 text-center text-muted-foreground">
            <h3 className="text-sm font-semibold text-emphasis-foreground">
              No matching articles
            </h3>
            <p className="mt-1 text-[0.8125rem]">
              Try another topic or a broader search.
            </p>
          </div>
        )}
      </section>

      <SubscriptionCard />
    </PageShell>
  )
}
