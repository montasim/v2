import * as React from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const markdownComponents: Components = {
  h1: createHeading("h1", "text-lg"),
  h2: createHeading("h2", "text-base"),
  h3: createHeading("h3", "text-sm"),
  h4: createHeading("h4", "text-sm"),
  h5: createHeading("h5", "text-sm"),
  h6: createHeading("h6", "text-sm"),
  p: ({ node: _node, className, ...props }) => (
    <p className={cn("mt-3 first:mt-0", className)} {...props} />
  ),
  strong: ({ node: _node, className, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  em: ({ node: _node, className, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
  ul: ({ node: _node, className, ...props }) => (
    <ul
      className={cn("mt-3 list-disc space-y-1 pl-5 first:mt-0", className)}
      {...props}
    />
  ),
  ol: ({ node: _node, className, ...props }) => (
    <ol
      className={cn("mt-3 list-decimal space-y-1 pl-5 first:mt-0", className)}
      {...props}
    />
  ),
  li: ({ node: _node, className, ...props }) => (
    <li className={cn("pl-0.5", className)} {...props} />
  ),
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote
      className={cn(
        "mt-3 border-l-2 border-border pl-3 text-muted-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  table: ({ node: _node, className, ...props }) => (
    <Table
      className={cn(
        "mt-3 border-collapse text-left text-xs first:mt-0",
        className
      )}
      {...props}
    />
  ),
  thead: ({ node: _node, className, ...props }) => (
    <TableHeader className={className} {...props} />
  ),
  tbody: ({ node: _node, className, ...props }) => (
    <TableBody className={className} {...props} />
  ),
  tr: ({ node: _node, className, ...props }) => (
    <TableRow className={className} {...props} />
  ),
  th: ({ node: _node, className, ...props }) => (
    <TableHead
      className={cn(
        "border-b border-border px-2 py-1.5 font-semibold",
        className
      )}
      {...props}
    />
  ),
  td: ({ node: _node, className, ...props }) => (
    <TableCell
      className={cn("border-b border-border px-2 py-1.5 align-top", className)}
      {...props}
    />
  ),
  a: ChatMarkdownLink,
  code: ({ node: _node, className, ...props }) => (
    <code
      className={cn(
        "rounded bg-background px-1 py-0.5 font-mono text-[0.8em]",
        className
      )}
      {...props}
    />
  ),
  pre: ({ node: _node, className, ...props }) => (
    <pre
      className={cn(
        "mt-3 overflow-x-auto rounded-lg bg-primary p-3 font-mono text-xs leading-5 text-primary-foreground first:mt-0 [&>code]:bg-transparent [&>code]:p-0",
        className
      )}
      {...props}
    />
  ),
  hr: ({ node: _node, className, ...props }) => (
    <Separator className={cn("my-4", className)} {...props} />
  ),
  img: ({ node: _node, alt }) =>
    alt ? <span className="text-muted-foreground">{alt}</span> : null,
}

export function ChatMarkdown({ source }: { source: string }) {
  return (
    <div className="min-w-0 wrap-break-word">
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}

function createHeading(
  element: "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
  sizeClassName: string
) {
  return function ChatMarkdownHeading({
    node: _node,
    className,
    ...props
  }: React.ComponentProps<typeof element> & { node?: unknown }) {
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
  node: _node,
  href,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { node?: unknown }) {
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
  return /^(?:https?:\/\/|mailto:|#|\/(?![\\/]))/i.test(href)
}
