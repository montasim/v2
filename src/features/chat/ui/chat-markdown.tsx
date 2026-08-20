import * as React from "react"
import { MDXViewer, MDXViewerProvider } from "mdx-craft"
import type { ComponentRegistry } from "mdx-craft"

import { cn } from "@/lib/utils"

const markdownComponents: ComponentRegistry = {
  h1: createHeading("h1", "text-lg"),
  h2: createHeading("h2", "text-base"),
  h3: createHeading("h3", "text-sm"),
  h4: createHeading("h4", "text-sm"),
  h5: createHeading("h5", "text-sm"),
  h6: createHeading("h6", "text-sm"),
  p: ({ className, ...props }: React.ComponentProps<"p">) => (
    <p className={cn("mt-3 first:mt-0", className)} {...props} />
  ),
  strong: ({ className, ...props }: React.ComponentProps<"strong">) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  em: ({ className, ...props }: React.ComponentProps<"em">) => (
    <em className={cn("italic", className)} {...props} />
  ),
  ul: ({ className, ...props }: React.ComponentProps<"ul">) => (
    <ul
      className={cn("mt-3 list-disc space-y-1 pl-5 first:mt-0", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.ComponentProps<"ol">) => (
    <ol
      className={cn("mt-3 list-decimal space-y-1 pl-5 first:mt-0", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.ComponentProps<"li">) => (
    <li className={cn("pl-0.5", className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.ComponentProps<"blockquote">) => (
    <blockquote
      className={cn(
        "mt-3 border-l-2 border-border pl-3 text-muted-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.ComponentProps<"table">) => (
    <table
      className={cn(
        "mt-3 block w-full border-collapse overflow-x-auto text-left text-xs first:mt-0",
        className
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: React.ComponentProps<"th">) => (
    <th
      className={cn(
        "border-b border-border px-2 py-1.5 font-semibold",
        className
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.ComponentProps<"td">) => (
    <td
      className={cn("border-b border-border px-2 py-1.5 align-top", className)}
      {...props}
    />
  ),
  a: ChatMarkdownLink,
  code: ({ className, ...props }: React.ComponentProps<"code">) => (
    <code
      className={cn(
        "rounded bg-background px-1 py-0.5 font-mono text-[0.8em]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: React.ComponentProps<"pre">) => (
    <pre
      className={cn(
        "mt-3 overflow-x-auto rounded-lg bg-primary p-3 font-mono text-xs leading-5 text-primary-foreground first:mt-0 [&>code]:bg-transparent [&>code]:p-0",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }: React.ComponentProps<"hr">) => (
    <hr className={cn("my-4 border-border", className)} {...props} />
  ),
  img: ({ alt }: React.ComponentProps<"img">) =>
    alt ? <span className="text-muted-foreground">{alt}</span> : null,
}

export function ChatMarkdown({ source }: { source: string }) {
  return (
    <MDXViewerProvider cache={{ enabled: true, maxSize: 24 }}>
      <div className="min-w-0 wrap-break-word">
        <MDXViewer
          source={toSafeMarkdown(source)}
          components={markdownComponents}
          loadingComponent={() => <PlainTextFallback source={source} />}
          errorComponent={() => <PlainTextFallback source={source} />}
        />
      </div>
    </MDXViewerProvider>
  )
}

function toSafeMarkdown(source: string) {
  let codeFence: string | undefined

  return source
    .split("\n")
    .map((line) => {
      const fence = line.match(/^\s*(`{3,}|~{3,})/)?.[1]

      if (fence) {
        if (!codeFence) codeFence = fence[0]
        else if (fence[0] === codeFence) codeFence = undefined
        return line
      }

      if (codeFence) return line

      return line
        .replace(/<(?!https?:\/\/|mailto:)(\/?[a-z][^>]*)>/gi, "&lt;$1&gt;")
        .replaceAll("{", "&#123;")
        .replaceAll("}", "&#125;")
    })
    .join("\n")
}

function createHeading(
  element: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  sizeClassName: string
) {
  return function ChatMarkdownHeading({
    className,
    ...props
  }: React.ComponentProps<typeof element>) {
    return React.createElement(element, {
      ...props,
      className: cn(
        "mt-4 leading-6 font-semibold first:mt-0",
        sizeClassName,
        className
      ),
    })
  }
}

function ChatMarkdownLink({
  href,
  className,
  children,
  ...props
}: React.ComponentProps<"a">) {
  if (!href || !isSafeLink(href)) {
    return <span className={className}>{children}</span>
  }

  const isExternal = href.startsWith("https://") || href.startsWith("http://")

  return (
    <a
      {...props}
      href={href}
      className={cn(
        "font-medium underline decoration-border underline-offset-2 hover:decoration-current",
        className
      )}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      {children}
    </a>
  )
}

function isSafeLink(href: string) {
  return /^(https?:\/\/|mailto:|\/|#)/i.test(href)
}

function PlainTextFallback({ source }: { source: string }) {
  return source
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p
        key={`${index}-${paragraph.slice(0, 24)}`}
        className="mt-3 whitespace-pre-wrap first:mt-0"
      >
        {paragraph}
      </p>
    ))
}
