import { lazy, Suspense, useState } from "react"
import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CaretRightIcon,
  CircleDashedIcon,
  EnvelopeSimpleIcon,
  TrashIcon,
} from "@/components/ui/icons"
import { deleteBlogComment } from "@/features/blog-comments/application/comments"
import {
  contactTopicLabels,
  contactTopicSchema,
} from "@/features/contact/domain/contact"
import {
  formatConversationProviderRoute,
  formatConversationResponseMetadata,
} from "@/features/owner-dashboard/domain/conversation-metadata"
import type { OwnerDashboardData } from "@/features/owner-dashboard/infrastructure/dashboard.server"
import { blogCatalog } from "@/lib/content/blog"

const LazyChatMarkdown = lazy(async () => {
  const module = await import("@/features/chat/ui/chat-markdown")
  return { default: module.ChatMarkdown }
})

function RecordRow({
  title,
  preview,
  date,
  badge,
  children,
}: {
  title: string
  preview: string
  date: string
  badge?: string
  children: ReactNode
}) {
  return (
    <details className="group border-b last:border-b-0">
      <summary className="flex min-h-19 cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold"
          aria-hidden="true"
        >
          {initials(title)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2 leading-5">
            <span className="truncate text-sm leading-5 font-medium text-strong-foreground">
              {title}
            </span>
            {badge ? (
              <Badge
                variant="secondary"
                className="h-5 shrink-0 rounded-md py-0"
              >
                {badge}
              </Badge>
            ) : null}
          </span>
          <span className="mt-1 block truncate text-sm leading-5 text-muted-foreground">
            {preview}
          </span>
        </span>
        <time
          dateTime={date}
          className="hidden shrink-0 text-xs text-muted-foreground sm:block"
        >
          {new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
          }).format(new Date(date))}
        </time>
        <CaretRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-4 border-t bg-background px-4 py-5 sm:pr-5 sm:pl-15">
        {children}
      </div>
    </details>
  )
}

export function Inquiries({ data }: { data: OwnerDashboardData["inquiries"] }) {
  if (!data.length) return <Empty label="No inquiries yet." />
  return (
    <section
      aria-label="Inquiry records"
      className="overflow-hidden rounded-xl border bg-card"
    >
      {data.map((item) => {
        const topic = contactTopicSchema.safeParse(item.topic)
        const fields =
          item.type === "contact"
            ? [
                [
                  "Topic",
                  topic.success ? contactTopicLabels[topic.data] : item.topic,
                ],
                ["App/project", item.projectTitle || item.unlistedProject],
                [
                  "Related page",
                  item.relatedTitle
                    ? `${item.relatedTitle} (${item.relatedPath})`
                    : item.relatedPath,
                ],
                ["Platform", item.platform],
                ["App version", item.appVersion],
              ]
            : item.type === "hire"
              ? [
                  ["Role", item.role ?? "—"],
                  ["Arrangement", item.arrangement ?? "—"],
                ]
              : item.type === "project"
                ? [
                    ["Project type", item.projectType ?? "—"],
                    ["Timeline", item.timeline ?? "—"],
                  ]
                : []
        return (
          <RecordRow
            key={item.id}
            title={item.name || "Unnamed visitor"}
            badge={inquiryTypeLabel(item.type)}
            date={item.createdAt}
            preview={[
              item.role ||
                item.projectType ||
                (topic.success ? contactTopicLabels[topic.data] : item.topic),
              item.context || item.email,
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <h2 className="text-sm font-medium break-words">
              {item.name || "Unnamed visitor"}
            </h2>
            <a
              href={`mailto:${item.email}`}
              className="block w-fit max-w-full text-sm break-all underline underline-offset-4"
            >
              {item.email}
            </a>
            {fields.some(([, value]) => value) ? (
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {fields
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm break-words">{value}</dd>
                    </div>
                  ))}
              </dl>
            ) : null}
            {item.context ? (
              <div>
                <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                  Message
                </h2>
                <p className="max-w-3xl text-sm leading-6 break-words whitespace-pre-wrap">
                  {item.context}
                </p>
              </div>
            ) : null}
            <footer className="flex flex-wrap items-center gap-3 border-t pt-3">
              <time
                dateTime={item.createdAt}
                className="text-xs text-muted-foreground"
              >
                Received {formatDate(item.createdAt)}
              </time>
              <Button variant="outline" className="ml-auto min-h-10" asChild>
                <a href={`mailto:${item.email}`}>
                  <EnvelopeSimpleIcon />
                  Reply
                </a>
              </Button>
            </footer>
          </RecordRow>
        )
      })}
    </section>
  )
}

export function Conversations({
  data,
}: {
  data: OwnerDashboardData["conversations"]
}) {
  if (!data.length) return <Empty label="No generated chat exchanges yet." />
  return (
    <section
      aria-label="Chat records"
      className="overflow-hidden rounded-xl border bg-card"
    >
      {data.map((item) => {
        const providerRoute = formatConversationProviderRoute(
          item.providerAttempts
        )
        return (
          <RecordRow
            key={item.id}
            title={item.question}
            preview={formatConversationResponseMetadata(item)}
            date={item.createdAt}
          >
            <div>
              <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                Visitor question
              </h2>
              <p className="max-w-3xl text-sm leading-6 break-words whitespace-pre-wrap">
                {item.question}
              </p>
            </div>
            <div>
              <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                Assistant response
              </h2>
              <div className="max-w-3xl text-sm leading-6 break-words">
                <Suspense
                  fallback={
                    <p className="whitespace-pre-wrap">{item.answer}</p>
                  }
                >
                  <LazyChatMarkdown source={item.answer} />
                </Suspense>
              </div>
            </div>
            <div className="space-y-1 border-t pt-3 text-xs break-words text-muted-foreground">
              <p>{formatConversationResponseMetadata(item)}</p>
              {item.model ? <p>Requested model: {item.model}</p> : null}
              {item.servedModel ? (
                <p>Served model: {item.servedModel}</p>
              ) : null}
              {providerRoute ? <p>{providerRoute}</p> : null}
              <time dateTime={item.createdAt} className="block">
                {formatDate(item.createdAt)}
              </time>
            </div>
          </RecordRow>
        )
      })}
    </section>
  )
}

export function Comments({
  data,
  refresh,
}: {
  data: OwnerDashboardData["comments"]
  refresh: () => Promise<unknown>
}) {
  const remove = useServerFn(deleteBlogComment)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState("")
  async function deleteComment(id: string, postSlug: string) {
    setPending(id)
    setError("")
    try {
      await remove({ data: { id, postSlug } })
      await refresh()
      setConfirming(null)
    } catch {
      setError("The comment could not be deleted. Try again.")
    } finally {
      setPending(null)
    }
  }
  return (
    <div className="space-y-3">
      {data.length ? (
        <section
          aria-label="Comment records"
          className="overflow-hidden rounded-xl border bg-card"
        >
          {data.map((item) => {
            const name = item.name || "Unnamed visitor"
            const postTitle =
              blogCatalog.find(item.postSlug)?.title ?? item.postSlug
            return (
              <RecordRow
                key={item.id}
                title={name}
                date={item.createdAt}
                preview={`On “${postTitle}” · ${item.message}`}
              >
                <h2 className="text-sm font-medium break-words">{name}</h2>
                <p className="max-w-3xl text-sm leading-6 break-words whitespace-pre-wrap">
                  {item.message}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <a
                    href={`mailto:${item.email}`}
                    className="break-all underline underline-offset-4"
                  >
                    {item.email}
                  </a>
                  <time dateTime={item.createdAt}>
                    {formatDate(item.createdAt)}
                  </time>
                </div>
                <Link
                  to="/blog/$slug"
                  params={{ slug: item.postSlug }}
                  className="block w-fit max-w-full text-sm break-words underline underline-offset-4"
                >
                  {postTitle}
                </Link>
                <div className="border-t pt-3">
                  {confirming === item.id ? (
                    <div
                      role="group"
                      aria-label={`Confirm deletion of comment by ${name}`}
                    >
                      <p className="mb-3 text-sm">
                        Remove this comment from the public article? This cannot
                        be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="min-h-10"
                          disabled={pending !== null}
                          onClick={() => setConfirming(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="min-h-10"
                          disabled={pending !== null}
                          onClick={() => deleteComment(item.id, item.postSlug)}
                        >
                          {pending === item.id ? (
                            <CircleDashedIcon className="animate-spin motion-reduce:animate-none" />
                          ) : (
                            <TrashIcon />
                          )}
                          {pending === item.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="min-h-10 text-destructive hover:text-destructive"
                      disabled={pending !== null}
                      aria-label={`Delete comment by ${name}`}
                      onClick={() => {
                        setError("")
                        setConfirming(item.id)
                      }}
                    >
                      <TrashIcon />
                      Delete comment
                    </Button>
                  )}
                </div>
              </RecordRow>
            )
          })}
        </section>
      ) : (
        <Empty label="No blog comments yet." />
      )}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function inquiryTypeLabel(type: string) {
  return type === "contact"
    ? "Contact"
    : type === "hire"
      ? "Role"
      : type === "project"
        ? "Project"
        : "General"
}
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
function Empty({ label }: { label: string }) {
  return (
    <p className="p-6 text-center text-sm text-muted-foreground">{label}</p>
  )
}
