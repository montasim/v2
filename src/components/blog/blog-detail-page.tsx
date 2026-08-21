import { useEffect, useId, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"

import { PageShell } from "@/components/shared/page-shell"
import { Badge } from "@/components/ui/badge"
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
  ArrowUpCompactIcon,
  ChatCenteredDotsIcon,
  CheckIcon,
  ShareIcon,
} from "@/components/ui/icons"
import { blogCatalog, blogCommentListSchema } from "@/lib/content/blog"
import type { BlogComment, BlogPost } from "@/lib/content/blog"
import { cn } from "@/lib/utils"

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(date.length === 10 ? `${date}T00:00:00.000Z` : date))
}

function formatCommentDate(date: string) {
  const then = new Date(date)
  const now = new Date()
  const day = 86_400_000
  const elapsed = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(then.getUTCFullYear(), then.getUTCMonth(), then.getUTCDate())) /
      day
  )

  if (elapsed === 0) return "Today"
  if (elapsed === 1) return "Yesterday"
  if (elapsed > 1 && elapsed < 7) return `${elapsed} days ago`
  return formatDate(date)
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase()
}

function BlogDiscussion({
  post,
  onCommentCountChange,
}: {
  post: BlogPost
  onCommentCountChange: (count: number) => void
}) {
  const nameId = useId()
  const emailId = useId()
  const messageId = useId()
  const storageKey = `blog-comments:${post.slug}`
  const [comments, setComments] = useState<BlogComment[]>(post.comments)
  const [replyTo, setReplyTo] = useState<BlogComment | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const storedComments = window.localStorage.getItem(storageKey)
    if (!storedComments) {
      setComments(post.comments)
      return
    }

    try {
      const parsed = blogCommentListSchema.safeParse(JSON.parse(storedComments))
      setComments(parsed.success ? parsed.data : post.comments)
    } catch {
      setComments(post.comments)
    }
  }, [post.comments, storageKey])

  useEffect(() => {
    onCommentCountChange(comments.length)
  }, [comments.length, onCommentCountChange])

  const commentThreads = useMemo(
    () =>
      comments
        .filter((comment) => !comment.replyTo)
        .map((comment) => ({
          comment,
          replies: comments.filter((reply) => reply.replyTo === comment.id),
        })),
    [comments]
  )

  function focusComposer(comment: BlogComment) {
    setReplyTo(comment)
    window.requestAnimationFrame(() => {
      document.getElementById(messageId)?.focus()
      document
        .getElementById("reply-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }

  function renderComment(comment: BlogComment, nested = false) {
    const parent = comments.find((item) => item.id === comment.replyTo)

    return (
      <article
        key={comment.id}
        className={cn(
          "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3.5 px-4 py-5 sm:px-6",
          nested && "bg-muted/40 pl-10 sm:pl-19.5"
        )}
      >
        <div className="grid size-10 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
          {initials(comment.name)}
        </div>
        <div className="min-w-0">
          {nested && parent ? (
            <p className="mb-0.5 text-[0.6875rem] text-muted-foreground">
              Replying to {parent.name}
            </p>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {comment.name}
            </h3>
            <time
              dateTime={comment.createdAt}
              className="text-[0.6875rem] text-muted-foreground"
            >
              {formatCommentDate(comment.createdAt)}
            </time>
          </div>
          <p className="mt-1.5 text-sm leading-[1.65] text-muted-foreground">
            {comment.message}
          </p>
          {!nested ? (
            <button
              type="button"
              onClick={() => focusComposer(comment)}
              className="mt-2 rounded-sm text-xs font-semibold text-emphasis-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Reply
            </button>
          ) : null}
        </div>
      </article>
    )
  }

  return (
    <div id="discussion" className="scroll-mt-24">
      <section
        aria-labelledby="discussion-heading"
        className="mt-4 overflow-hidden rounded-2xl border bg-background"
      >
        <header className="flex items-center gap-4 border-b px-4 py-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="discussion-heading"
              className="text-lg leading-[1.4] font-semibold tracking-[-0.015em] text-emphasis-foreground"
            >
              Discussion
            </h2>
            <p className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              Join the conversation about this article
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </header>

        <div className="divide-y" aria-live="polite">
          {commentThreads.length ? (
            commentThreads.map(({ comment, replies }) => (
              <div key={comment.id}>
                {renderComment(comment)}
                {replies.map((reply) => renderComment(reply, true))}
              </div>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-emphasis-foreground">
                Start the discussion
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Share a question, observation, or useful counterexample.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        aria-labelledby="reply-heading"
        className="mt-4 overflow-hidden rounded-2xl border bg-background"
      >
        <header className="min-h-18 border-b px-4 py-4.5 sm:px-6">
          <h2
            id="reply-heading"
            className="text-sm font-semibold text-emphasis-foreground"
          >
            Leave a reply
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Respond to the article or continue the discussion.
          </p>
        </header>
        <form
          id="reply-composer"
          className="grid gap-4 px-4 pt-5 pb-6 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault()
            const nextComment: BlogComment = {
              id: `${Date.now()}-${name.trim().toLocaleLowerCase().replace(/\s+/g, "-")}`,
              name: name.trim(),
              createdAt: new Date().toISOString(),
              message: message.trim(),
              replyTo: replyTo?.id ?? null,
            }
            const nextComments = [...comments, nextComment]
            setComments(nextComments)
            window.localStorage.setItem(
              storageKey,
              JSON.stringify(nextComments)
            )
            setMessage("")
            setReplyTo(null)
          }}
        >
          {replyTo ? (
            <div className="flex items-center justify-between gap-4 rounded-[0.625rem] bg-muted px-3 py-2.5 text-xs text-muted-foreground">
              <span>
                Replying to{" "}
                <strong className="text-emphasis-foreground">
                  {replyTo.name}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-semibold text-emphasis-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label
                htmlFor={nameId}
                className="text-xs font-semibold text-emphasis-foreground"
              >
                Name
              </label>
              <input
                id={nameId}
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="min-h-9 w-full rounded-xl border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor={emailId}
                className="text-xs font-semibold text-emphasis-foreground"
              >
                Email
              </label>
              <input
                id={emailId}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-h-9 w-full rounded-xl border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor={messageId}
              className="text-xs font-semibold text-emphasis-foreground"
            >
              Message
            </label>
            <span className="text-xs text-muted-foreground">
              Ctrl + Enter to post
            </span>
          </div>
          <div className="flex items-end gap-2 rounded-xl border bg-card p-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring">
            <textarea
              id={messageId}
              required
              rows={1}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.ctrlKey && event.key === "Enter") {
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="Add to the discussion"
              className="max-h-28 min-h-9 min-w-0 flex-1 resize-y bg-transparent p-2 text-sm leading-[1.4] outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label={replyTo ? `Reply to ${replyTo.name}` : "Post comment"}
              className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] border border-emphasis-foreground bg-emphasis-foreground text-lg text-background hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowUpCompactIcon className="size-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your email stays private. Comments are saved on this device.
          </p>
        </form>
      </section>
    </div>
  )
}

export function BlogDetailPage({
  post,
  nextPost,
}: {
  post: BlogPost
  nextPost: BlogPost
}) {
  const sectionLinks = useMemo(
    () => [
      ...post.sections.map((section) => [section.id, section.label] as const),
      ["discussion", "Discussion"] as const,
    ],
    [post.sections]
  )
  const [activeSection, setActiveSection] = useState(sectionLinks[0][0])
  const [shareStatus, setShareStatus] = useState("")
  const [commentCount, setCommentCount] = useState(post.comments.length)

  useEffect(() => {
    let animationFrame = 0

    const updateActiveSection = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const readingLine = window.innerWidth >= 1024 ? 112 : 96
        let currentSection = sectionLinks[0][0]

        for (const [sectionId] of sectionLinks) {
          const section = document.getElementById(sectionId)
          if (!section || section.getBoundingClientRect().top > readingLine)
            break
          currentSection = sectionId
        }

        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
        ) {
          currentSection = sectionLinks[sectionLinks.length - 1][0]
        }

        setActiveSection(currentSection)
      })
    }

    setActiveSection(sectionLinks[0][0])
    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [post.slug, sectionLinks])

  useEffect(() => {
    setCommentCount(post.comments.length)
  }, [post.comments.length])

  async function shareArticle() {
    const shareData = {
      title: post.title,
      text: post.excerpt,
      url: window.location.href,
    }

    try {
      await navigator.share(shareData)
      setShareStatus("Article shared")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return

      try {
        await navigator.clipboard.writeText(shareData.url)
        setShareStatus("Link copied")
      } catch {
        setShareStatus("Could not share this article")
      }
    }
  }

  return (
    <PageShell className="pt-11 pb-27">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Overview</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/blog" search={{ topic: "all", q: "" }}>
                Blog
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-8.5">
        <div className="flex flex-col items-start gap-3">
          <Badge variant="secondary" className="font-medium">
            {post.category}
          </Badge>
          <h1 className="w-full max-w-none text-3xl leading-tight font-bold tracking-[-0.025em] text-emphasis-foreground">
            {post.title}
          </h1>
        </div>
        <p className="mt-4.5 w-full max-w-none text-[1.0625rem] leading-[1.6] text-muted-foreground">
          {post.excerpt}
        </p>

        <div className="mt-9.5 grid grid-cols-2 border-y sm:grid-cols-[minmax(230px,1.4fr)_minmax(130px,.7fr)_minmax(120px,.65fr)_auto]">
          <div className="col-span-2 flex min-w-0 flex-col justify-center py-4 sm:col-span-1 sm:px-5 sm:py-4.5 sm:pl-0">
            <span className="mb-1.5 text-xs font-medium text-muted-foreground">
              Written by
            </span>
            <div className="flex min-w-0 items-center gap-3 text-[0.8125rem] text-muted-foreground">
              <img
                src={blogCatalog.author.avatarUrl}
                alt=""
                width="38"
                height="38"
                className="size-9.5 rounded-full object-cover"
              />
              <strong className="block text-foreground">
                {blogCatalog.author.name}
              </strong>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center py-4 pr-5 sm:border-l sm:px-5 sm:py-4.5">
            <span className="mb-1.5 text-xs font-medium text-muted-foreground">
              Published
            </span>
            <time
              dateTime={post.publishedAt}
              className="text-sm font-semibold text-foreground"
            >
              {formatDate(post.publishedAt)}
            </time>
          </div>
          <div className="flex min-w-0 flex-col justify-center border-l py-4 pl-5 sm:px-5 sm:py-4.5">
            <span className="mb-1.5 text-xs font-medium text-muted-foreground">
              Reading time
            </span>
            <span className="text-sm font-semibold text-foreground">
              {post.readingMinutes} minutes
            </span>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-2 border-t py-4 sm:col-span-1 sm:justify-end sm:border-t-0 sm:border-l sm:pl-5">
            <Button
              type="button"
              onClick={shareArticle}
              className="bg-emphasis-foreground text-background"
            >
              {shareStatus === "Link copied" ? <CheckIcon /> : <ShareIcon />}
              {shareStatus === "Link copied" ? "Copied" : "Share article"}
            </Button>
            <Button asChild variant="outline">
              <a href="#discussion">
                <ChatCenteredDotsIcon />
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </a>
            </Button>
          </div>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {shareStatus}
        </p>
      </header>

      <figure className="mt-10 overflow-hidden rounded-xl border bg-card p-1.5 sm:p-3">
        <img
          src={post.image.src}
          alt={post.image.alt}
          width="1600"
          height="1000"
          fetchPriority="high"
          className="aspect-[16/10] w-full rounded-lg border object-cover"
        />
      </figure>

      <div className="mt-14 grid items-start gap-7 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-[clamp(2.5rem,5.5vw,4rem)]">
        <aside className="sticky top-14 z-30 flex items-center gap-2.5 overflow-x-auto rounded-xl border bg-background/95 px-2.5 py-2 backdrop-blur-sm lg:top-24 lg:grid lg:gap-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <p className="mr-1 shrink-0 text-xs font-medium text-muted-foreground lg:mb-2.5">
            On this page
          </p>
          <nav aria-label="Article sections">
            <ul className="flex text-[0.8125rem] lg:grid">
              {sectionLinks.map(([id, label]) => (
                <li key={id} className="shrink-0">
                  <a
                    href={`#${id}`}
                    aria-current={activeSection === id ? "location" : undefined}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:rounded-none lg:border-l-2 lg:px-0 lg:py-1.75 lg:pl-3",
                      activeSection === id
                        ? "bg-muted font-semibold text-foreground lg:border-emphasis-foreground lg:bg-transparent"
                        : "border-transparent hover:bg-muted hover:text-foreground lg:hover:bg-transparent"
                    )}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <article className="border-t">
            {post.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className={cn("scroll-mt-24 py-10", index > 0 && "border-t")}
              >
                <h2
                  id={`${section.id}-heading`}
                  className="mb-5 text-2xl leading-[1.35] font-semibold tracking-[-0.02em] text-emphasis-foreground"
                >
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraph}
                    className={cn(
                      "text-base leading-7 text-muted-foreground",
                      paragraphIndex > 0 && "mt-5.5"
                    )}
                  >
                    {paragraph}
                  </p>
                ))}
                {section.callout ? (
                  <blockquote className="my-9 border-l-3 border-emphasis-foreground py-1.5 pl-5.5 text-base leading-7 text-foreground">
                    {section.callout}
                  </blockquote>
                ) : null}
              </section>
            ))}
          </article>

          <BlogDiscussion post={post} onCommentCountChange={setCommentCount} />

          <nav
            aria-label="Article navigation"
            className="mt-8 grid gap-3 sm:grid-cols-2"
          >
            <Link
              to="/blog"
              search={{ topic: "all", q: "" }}
              className="group flex min-h-18.5 items-center gap-3 rounded-xl border bg-background p-4 hover:-translate-y-px hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ArrowLeftCompactIcon className="group-hover:-translate-x-0.5" />
              <span>
                <span className="block text-[0.6875rem] text-muted-foreground">
                  Back
                </span>
                <strong className="mt-0.5 block text-sm text-emphasis-foreground">
                  All writing
                </strong>
              </span>
            </Link>
            <Link
              to="/blog/$slug"
              params={{ slug: nextPost.slug }}
              className="group flex min-h-18.5 items-center justify-end gap-3 rounded-xl border bg-background p-4 text-right hover:-translate-y-px hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:justify-start max-sm:text-left"
            >
              <span>
                <span className="block text-[0.6875rem] text-muted-foreground">
                  Read next
                </span>
                <strong className="mt-0.5 block text-sm text-emphasis-foreground">
                  {nextPost.title}
                </strong>
              </span>
              <ArrowRightCompactIcon className="group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      </div>
    </PageShell>
  )
}
