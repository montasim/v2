import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowClockwiseIcon, WarningCircleIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export type ProjectReadmeSource =
  | { kind: "local"; markdown: string }
  | {
      kind: "remote"
      readmeUrl: string
      sourceBaseUrl: string
      rawBaseUrl: string
      branch: string
    }

type ReadmeState =
  | { status: "loading" }
  | { status: "ready"; markdown: string }
  | { status: "error"; message: string }

function resolveUrl(
  value: string | undefined,
  source: ProjectReadmeSource,
  image = false
) {
  if (
    !value ||
    source.kind === "local" ||
    /^(https?:|mailto:|data:)/i.test(value) ||
    value.startsWith("#")
  ) {
    return value
  }
  const path = value.replace(/^\.?\//, "")
  return `${image ? source.rawBaseUrl : source.sourceBaseUrl}/${path}`
}

function markdownComponents(source: ProjectReadmeSource): Components {
  return {
    a: ({ href, children }) => (
      <a
        href={resolveUrl(href, source)}
        target={href?.startsWith("#") ? undefined : "_blank"}
        rel={href?.startsWith("#") ? undefined : "noreferrer"}
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => (
      <img src={resolveUrl(src, source, true)} alt={alt ?? ""} loading="lazy" />
    ),
  }
}

function ReadmeSkeleton() {
  return (
    <div className="space-y-5 p-6 sm:p-8" aria-label="Loading README">
      <Skeleton className="h-9 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-8 h-7 w-2/5" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export function ProjectReadmeDocument({
  source,
}: {
  source: ProjectReadmeSource
}) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ReadmeState>(() =>
    source.kind === "local"
      ? { status: "ready", markdown: source.markdown }
      : { status: "loading" }
  )
  const components = useMemo(() => markdownComponents(source), [source])

  useEffect(() => {
    if (source.kind === "local") {
      setState({ status: "ready", markdown: source.markdown })
      return
    }
    const controller = new AbortController()
    setState({ status: "loading" })
    fetch(source.readmeUrl, {
      headers: { Accept: "text/plain" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
        return response.text()
      })
      .then((markdown) => setState({ status: "ready", markdown }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return
        setState({
          status: "error",
          message:
            reason instanceof Error
              ? reason.message
              : "The README could not be loaded",
        })
      })
    return () => controller.abort()
  }, [attempt, source])

  return (
    <section className="min-w-0">
      {state.status === "loading" ? <ReadmeSkeleton /> : null}
      {state.status === "error" ? (
        <div className="flex min-h-80 flex-col items-center justify-center px-6 py-14 text-center">
          <WarningCircleIcon className="size-7 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">README unavailable</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {state.message}. Check the connection and try again.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <ArrowClockwiseIcon />
            Retry
          </Button>
        </div>
      ) : null}
      {state.status === "ready" ? (
        <article className="project-readme min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
            skipHtml
          >
            {state.markdown}
          </ReactMarkdown>
        </article>
      ) : null}
    </section>
  )
}
