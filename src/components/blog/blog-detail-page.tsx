import { useEffect, useId, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { PageShell } from "@/components/shared/page-shell"
import { VisitorCountBadge } from "@/components/shared/visitor-count-badge"
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
  CircleDashedIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import {
  deleteBlogComment,
  getBlogComments,
  postBlogComment,
} from "@/features/blog-comments/application/comments"
import {
  getBlogPostViewCount,
  recordBlogPostView,
} from "@/features/blog-views/application/blog-views"
import { blogCommentMessageSchema } from "@/features/blog-comments/domain/comment"
import type { BlogComment } from "@/features/blog-comments/domain/comment"
import { getCommentModerationError } from "@/features/blog-comments/domain/moderation"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import { requestPortfolioInquiry } from "@/features/chat/ui/assistant-request"
import { getPortfolioOwnerAuth } from "@/features/owner-auth/application/owner-auth"
import { blogCatalog } from "@/lib/content/blog"
import type { BlogPost } from "@/lib/content/blog"
import { cn } from "@/lib/utils"
import { useVisitorCount } from "@/features/visitor-count/use-visitor-count"

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
  const messageErrorId = useId()
  const getComments = useServerFn(getBlogComments)
  const createComment = useServerFn(postBlogComment)
  const removeComment = useServerFn(deleteBlogComment)
  const getOwnerAuth = useServerFn(getPortfolioOwnerAuth)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [replyTo, setReplyTo] = useState<BlogComment | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [submissionError, setSubmissionError] = useState("")
  const [messageError, setMessageError] = useState("")
  const [canManageComments, setCanManageComments] = useState(false)
  const [pendingDeletionId, setPendingDeletionId] = useState<string | null>(
    null
  )
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletionError, setDeletionError] = useState("")

  useEffect(() => {
    let active = true
    setComments([])
    setReplyTo(null)
    setLoadError("")
    setIsLoading(true)

    void getComments({ data: post.slug })
      .then((loadedComments) => {
        if (active) setComments(loadedComments)
      })
      .catch(() => {
        if (active) {
          setLoadError("Comments are unavailable for this article right now.")
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [getComments, post.slug])

  useEffect(() => {
    let active = true
    setCanManageComments(false)

    void getOwnerAuth()
      .then((state) => {
        if (active) setCanManageComments(state.status === "owner")
      })
      .catch(() => {
        if (active) setCanManageComments(false)
      })

    return () => {
      active = false
    }
  }, [getOwnerAuth, post.slug])

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

  async function confirmCommentDeletion(comment: BlogComment) {
    setDeletingId(comment.id)
    setDeletionError("")

    try {
      await removeComment({
        data: { id: comment.id, postSlug: post.slug },
      })
      const loadedComments = await getComments({ data: post.slug })
      setComments(loadedComments)
      setPendingDeletionId(null)
      if (replyTo?.id === comment.id || replyTo?.replyTo === comment.id) {
        setReplyTo(null)
      }
    } catch {
      setDeletionError("The comment could not be deleted. Try again.")
    } finally {
      setDeletingId(null)
    }
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
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
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
            {canManageComments && pendingDeletionId !== comment.id ? (
              <button
                type="button"
                aria-label={`Delete comment by ${comment.name}`}
                title={`Delete comment by ${comment.name}`}
                onClick={() => {
                  setDeletionError("")
                  setPendingDeletionId(comment.id)
                }}
                className="-mt-1 grid size-7 shrink-0 place-items-center rounded-md text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive/80 focus-visible:text-destructive/80 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <TrashIcon className="size-3.5" />
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-[1.65] text-muted-foreground">
            {comment.message}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {!nested ? (
              <button
                type="button"
                onClick={() => focusComposer(comment)}
                className="rounded-sm text-xs font-semibold text-emphasis-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                Reply
              </button>
            ) : null}
            {canManageComments && pendingDeletionId === comment.id ? (
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Delete this comment?
                <button
                  type="button"
                  disabled={deletingId === comment.id}
                  onClick={() => setPendingDeletionId(null)}
                  className="rounded-sm font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingId === comment.id}
                  onClick={() => confirmCommentDeletion(comment)}
                  className="rounded-sm font-semibold text-destructive hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-wait disabled:opacity-60"
                >
                  {deletingId === comment.id ? "Deleting" : "Delete"}
                </button>
              </span>
            ) : null}
          </div>
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

        <div className="divide-y" aria-live="polite" aria-busy={isSubmitting}>
          {isLoading ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-emphasis-foreground">
                Loading discussion
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fetching the latest comments.
              </p>
            </div>
          ) : loadError ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-emphasis-foreground">
                No discussion available
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
            </div>
          ) : (
            <>
              {commentThreads.length
                ? commentThreads.map(({ comment, replies }) => (
                    <div key={comment.id}>
                      {renderComment(comment)}
                      {replies.map((reply) => renderComment(reply, true))}
                    </div>
                  ))
                : !isSubmitting && (
                    <div className="px-5 py-10 text-center">
                      <p className="text-sm font-semibold text-emphasis-foreground">
                        Start the discussion
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Share a question, observation, or useful counterexample.
                      </p>
                    </div>
                  )}
              {isSubmitting ? (
                <article className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3.5 px-4 py-5 sm:px-6">
                  <span className="sr-only" role="status">
                    Saving your comment
                  </span>
                  <div aria-hidden="true" className="contents">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-12" />
                      </div>
                      <Skeleton className="mt-3 h-3 w-[min(100%,34rem)]" />
                      <Skeleton className="mt-2 h-3 w-[min(72%,24rem)]" />
                    </div>
                  </div>
                </article>
              ) : null}
            </>
          )}
        </div>
        {deletionError ? (
          <p
            className="border-t px-4 py-3 text-xs text-destructive sm:px-6"
            role="alert"
          >
            {deletionError}
          </p>
        ) : null}
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
          aria-busy={isSubmitting}
          className="grid gap-4 px-4 pt-5 pb-6 sm:px-6"
          onSubmit={async (event) => {
            event.preventDefault()
            setSubmissionError("")
            setMessageError("")

            const messageResult = blogCommentMessageSchema.safeParse(message)
            if (!messageResult.success) {
              setMessageError(
                messageResult.error.issues[0]?.message ??
                  "Please revise your comment before posting."
              )
              document.getElementById(messageId)?.focus()
              return
            }

            setIsSubmitting(true)

            try {
              const moderationError = await getCommentModerationError(message)
              if (moderationError) {
                setMessageError(moderationError)
                document.getElementById(messageId)?.focus()
                return
              }

              const nextComment = await createComment({
                data: {
                  comment: {
                    postSlug: post.slug,
                    name,
                    email,
                    message,
                    replyTo: replyTo?.id ?? null,
                  },
                  website,
                },
              })

              if (nextComment) {
                setComments((current) => [...current, nextComment])
              }
              setMessage("")
              setReplyTo(null)
            } catch (error) {
              setSubmissionError(
                getEmailVerificationError(error) ??
                  "Your comment could not be posted. Your draft is still here."
              )
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <div className="hidden" aria-hidden="true">
            <label htmlFor={`${nameId}-website`}>Website</label>
            <input
              id={`${nameId}-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
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
                disabled={isSubmitting}
                maxLength={80}
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
                disabled={isSubmitting}
                maxLength={320}
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
          <div
            className={cn(
              "flex items-end gap-2 rounded-xl border bg-card p-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ring",
              messageError &&
                "border-destructive focus-within:outline-destructive"
            )}
          >
            <textarea
              id={messageId}
              required
              disabled={isSubmitting}
              maxLength={2_000}
              rows={1}
              value={message}
              aria-invalid={Boolean(messageError)}
              aria-describedby={messageError ? messageErrorId : undefined}
              onChange={(event) => {
                setMessage(event.target.value)
                if (messageError) setMessageError("")
              }}
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
              disabled={isSubmitting}
              aria-label={
                isSubmitting
                  ? "Saving comment"
                  : replyTo
                    ? `Reply to ${replyTo.name}`
                    : "Post comment"
              }
              className="grid size-9 shrink-0 place-items-center rounded-[0.625rem] border border-emphasis-foreground bg-emphasis-foreground text-lg text-background hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-75"
            >
              {isSubmitting ? (
                <CircleDashedIcon className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <ArrowUpCompactIcon className="size-4" />
              )}
            </button>
          </div>
          {messageError ? (
            <p
              id={messageErrorId}
              className="text-xs text-destructive"
              role="alert"
            >
              {messageError}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Your email stays private. Comments are stored securely.
          </p>
          {submissionError ? (
            <p className="text-xs text-destructive" role="alert">
              {submissionError}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}

function BlogProjectInquiry() {
  return (
    <section
      aria-labelledby="blog-project-inquiry-heading"
      className="mt-4 border-y py-8 sm:py-10"
    >
      <h2
        id="blog-project-inquiry-heading"
        className="text-2xl font-semibold tracking-tight text-emphasis-foreground"
      >
        Working through a similar challenge?
      </h2>
      <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
        Share your context, constraints, and timeline to start a focused
        conversation.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="bg-emphasis-foreground px-[0.65625rem] text-background hover:bg-emphasis-foreground/80"
          onClick={() => requestPortfolioInquiry({ inquiryType: "project" })}
        >
          <EnvelopeSimpleIcon />
          Discuss a project
        </Button>
      </div>
    </section>
  )
}

export function BlogDetailPage({
  post,
  nextPost,
}: {
  post: BlogPost
  nextPost: BlogPost
}) {
  const getViewCount = useServerFn(getBlogPostViewCount)
  const recordView = useServerFn(recordBlogPostView)
  const sectionLinks = useMemo(
    () => [
      ...post.sections.map((section) => [section.id, section.label] as const),
      ["discussion", "Discussion"] as const,
    ],
    [post.sections]
  )
  const [activeSection, setActiveSection] = useState(sectionLinks[0][0])
  const [shareStatus, setShareStatus] = useState("")
  const [commentCount, setCommentCount] = useState(0)
  const viewCount = useVisitorCount({
    resourceKey: "blog",
    slug: post.slug,
    getCount: getViewCount,
    recordView,
  })

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
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {post.publishedAt ? (
                <Badge
                  variant="secondary"
                  className="gap-1.5 font-medium tabular-nums"
                >
                  <ClockIcon className="size-3.5" />
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </Badge>
              ) : null}
              <Badge variant="secondary" className="font-medium">
                {post.category}
              </Badge>
              <VisitorCountBadge count={viewCount} />
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
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
          <h1 className="w-full max-w-none text-3xl leading-tight font-bold tracking-[-0.025em] text-emphasis-foreground">
            {post.title}
          </h1>
        </div>
        <p className="mt-4.5 w-full max-w-none text-[1.0625rem] leading-[1.6] text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b pb-6 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={blogCatalog.author.avatarUrl}
              alt=""
              width="32"
              height="32"
              className="size-8 rounded-full object-cover"
            />
            <span>
              Written by{" "}
              <Link
                to="/"
                className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {blogCatalog.author.name}
              </Link>
            </span>
          </div>
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <span className="font-medium text-foreground">
            {post.readingMinutes} min read
          </span>
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

          <BlogProjectInquiry />

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
