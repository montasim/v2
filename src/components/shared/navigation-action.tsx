import type { ComponentProps, ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

type ButtonStyle = Pick<
  ComponentProps<typeof Button>,
  "className" | "size" | "variant"
>

type ActionContent = ButtonStyle & {
  children: ReactNode
}

export type InternalPath =
  | "/"
  | "/experience"
  | "/projects"
  | "/skills"
  | "/education"
  | "/certifications"
  | "/recommendations"
  | "/resume"

export function InternalAction({
  to,
  children,
  ...buttonProps
}: ActionContent & { to: InternalPath }) {
  return (
    <Button asChild {...buttonProps}>
      <Link to={to}>{children}</Link>
    </Button>
  )
}

export function ExternalAction({
  href,
  children,
  ...buttonProps
}: ActionContent & { href: string }) {
  return (
    <Button asChild {...buttonProps}>
      <ExternalLink href={href}>{children}</ExternalLink>
    </Button>
  )
}

export function ExternalLink({ children, ...props }: ComponentProps<"a">) {
  return (
    <a {...props} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export function DownloadAction({
  href,
  children,
  ...buttonProps
}: ActionContent & { href: string }) {
  return (
    <Button asChild {...buttonProps}>
      <a href={href} download>
        {children}
      </a>
    </Button>
  )
}

export function MailAction({
  email,
  children,
  ...buttonProps
}: ActionContent & { email: string }) {
  return (
    <Button asChild {...buttonProps}>
      <a href={`mailto:${email}`}>{children}</a>
    </Button>
  )
}
