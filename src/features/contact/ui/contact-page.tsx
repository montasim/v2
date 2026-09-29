import { useEffect, useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { useServerFn } from "@tanstack/react-start"
import { PageShell } from "@/components/shared/page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowUpRightIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
} from "@/components/ui/icons"
import { PortfolioAssistant } from "@/features/chat/ui/portfolio-assistant"
import { submitInquiry } from "@/features/chat/application/submit-inquiry"
import { getInquiryMessageModerationError } from "@/features/chat/domain/inquiry-moderation"
import { verifyVisitorEmail } from "@/features/email-verification/application/verify-visitor-email"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import { createInquiryId } from "@/features/chat/domain/inquiry"
import {
  contactSubmissionSchema,
  contactTopics,
  contactTopicLabels,
} from "@/features/contact/domain/contact"
import type {
  ContactSearch,
  ContactTopic,
} from "@/features/contact/domain/contact"
import type { loadContactContext } from "@/features/contact/application/contact-context.server"
import { profileCatalog } from "@/lib/content/profile"

type ContactContext = ReturnType<typeof loadContactContext>

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label
        className="block text-sm font-medium text-strong-foreground"
        htmlFor={`contact-${name}`}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`contact-${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function ContactPage({
  initial,
  onSelectionChange,
}: {
  initial: ContactContext
  onSelectionChange?: (search: ContactSearch) => void
}) {
  const submit = useServerFn(submitInquiry)
  const verifyEmail = useServerFn(verifyVisitorEmail)
  const [topic, setTopic] = useState<ContactTopic>(initial.topic)
  const [projectId, setProjectId] = useState(initial.projectId)
  const [related, setRelated] = useState(initial.related)
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submissionError, setSubmissionError] = useState("")
  const busy = useRef(false)
  const attempt = useRef<{ payload: string; id: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const selectedProject = initial.projects.find(
    (project) => project.id === projectId
  )
  const isSupport = topic === "support"
  const allowsProject =
    isSupport || topic === "feedback" || topic === "question"
  const [editingProject, setEditingProject] = useState(false)
  const [includeProject, setIncludeProject] = useState(
    Boolean(initial.projectId)
  )
  const showProject = allowsProject && (isSupport || includeProject)
  const appPresentation = showProject && selectedProject
  const heading = appPresentation
    ? `Contact ${selectedProject.title} support`
    : isSupport
      ? "Get help with an app or project"
      : "Get in touch with Montasim"

  useEffect(() => {
    setTopic(initial.topic)
    setProjectId(initial.projectId)
    setIncludeProject(Boolean(initial.projectId))
    setEditingProject(false)
    setErrors({})
  }, [initial.topic, initial.projectId])
  useEffect(() => {
    setRelated(initial.related)
  }, [initial.related])

  function syncSelection(
    nextTopic = topic,
    nextProject = projectId,
    nextInclude = includeProject,
    nextRelated = related
  ) {
    const projectRelevant =
      nextTopic === "support" ||
      ((nextTopic === "feedback" || nextTopic === "question") && nextInclude)
    onSelectionChange?.({
      topic: nextTopic,
      app:
        projectRelevant && nextProject
          ? nextProject.replace(/^project-/, "")
          : undefined,
      from: nextRelated?.path,
    })
  }

  const fieldProps = (name: string) => ({
    id: `contact-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  })

  useEffect(() => {
    if (Object.keys(errors).length) {
      formRef.current
        ?.querySelector<HTMLElement>("[aria-invalid='true']")
        ?.focus()
    }
  }, [errors])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current) return
    const fields: Record<string, FormDataEntryValue | undefined> =
      Object.fromEntries(new FormData(event.currentTarget))
    const candidate = {
      type: "contact" as const,
      topic,
      name: fields.name,
      email: fields.email,
      context: fields.context,
      projectId: showProject && projectId !== "other" ? projectId : undefined,
      unlistedProject:
        showProject && projectId === "other"
          ? fields.unlistedProject
          : undefined,
      relatedPath: related?.path,
      platform: isSupport ? fields.platform : undefined,
      appVersion: isSupport ? fields.appVersion : undefined,
    }
    const payload = JSON.stringify(candidate)
    if (!attempt.current || attempt.current.payload !== payload)
      attempt.current = { payload, id: createInquiryId() }
    const result = contactSubmissionSchema.safeParse({
      ...candidate,
      id: attempt.current.id,
    })
    if (
      !result.success ||
      (showProject &&
        projectId === "other" &&
        !String(fields.unlistedProject ?? "").trim())
    ) {
      const next: Record<string, string> = {}
      if (
        showProject &&
        projectId === "other" &&
        !String(fields.unlistedProject ?? "").trim()
      )
        next.unlistedProject = "Enter the app or project name."
      for (const issue of result.success ? [] : result.error.issues)
        next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      return
    }
    busy.current = true
    setErrors({})
    setSubmissionError("")
    setStatus("pending")
    try {
      const validationErrors: Record<string, string> = {}
      for (const field of [
        "context",
        "name",
        "unlistedProject",
        "platform",
        "appVersion",
      ] as const) {
        const value = result.data[field]
        if (!value) continue
        const error = await getInquiryMessageModerationError(value)
        if (error) validationErrors[field] = error
      }
      if (Object.keys(validationErrors).length) {
        setStatus("idle")
        setErrors(validationErrors)
        return
      }
      try {
        await verifyEmail({ data: result.data.email })
      } catch (error) {
        setStatus("idle")
        setErrors({
          email:
            getEmailVerificationError(error) ??
            "This email could not be verified. Try again.",
        })
        return
      }
      await submit({
        data: { inquiry: result.data, website: String(fields.website ?? "") },
      })
      setStatus("success")
      requestAnimationFrame(() => successRef.current?.focus())
    } catch (error) {
      setStatus("error")
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Your message could not be saved. Try again or email me directly."
      )
    } finally {
      busy.current = false
    }
  }

  return (
    <>
      <PageShell padded>
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-strong-foreground sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {appPresentation
              ? `Report a problem, suggest an improvement, or ask a question about ${selectedProject.title}.`
              : isSupport
                ? "Choose the app or project you need help with and tell me what happened."
                : "Have an opportunity to discuss, need help with one of my products, or want to share a question or idea? Send me a message."}
          </p>
        </header>
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <section aria-label="Send a message" className="min-w-0">
            {status === "success" ? (
              <div className="border-y py-10">
                <CheckIcon
                  className="size-6 text-strong-foreground"
                  aria-hidden="true"
                />
                <h2
                  ref={successRef}
                  tabIndex={-1}
                  className="mt-4 text-2xl font-semibold tracking-tight text-strong-foreground outline-none"
                >
                  Your message is saved.
                </h2>
                <p
                  role="status"
                  className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground"
                >
                  Thank you for reaching out. I’ll review your message and reply
                  to the email address you provided.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    attempt.current = null
                    setStatus("idle")
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                ref={formRef}
                noValidate
                onSubmit={handleSubmit}
                className="space-y-6"
                aria-busy={status === "pending"}
              >
                <fieldset
                  disabled={status === "pending"}
                  className="min-w-0 space-y-6 disabled:opacity-70"
                >
                  <legend className="sr-only">Message details</legend>
                  <div
                    className={
                      showProject ? "grid gap-6 sm:grid-cols-2" : "grid gap-6"
                    }
                  >
                    <Field
                      name="topic"
                      label="What would you like to discuss?"
                      error={errors.topic}
                    >
                      <Select
                        name="topic"
                        value={topic}
                        disabled={status === "pending"}
                        onValueChange={(value) => {
                          const nextTopic = value as ContactTopic
                          setTopic(nextTopic)
                          if (
                            nextTopic === "general" ||
                            nextTopic === "collaboration"
                          ) {
                            setProjectId("")
                            setIncludeProject(false)
                          }
                          syncSelection(nextTopic)
                          setErrors({})
                        }}
                      >
                        <SelectTrigger
                          {...fieldProps("topic")}
                          className="h-11 min-w-0 aria-invalid:border-destructive [&_[data-slot=select-value]]:truncate"
                        >
                          <SelectValue>
                            {appPresentation && topic === "support"
                              ? "Report a problem"
                              : appPresentation && topic === "question"
                                ? "Ask a question"
                                : contactTopicLabels[topic]}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {contactTopics.map((value) => (
                            <SelectItem key={value} value={value}>
                              {appPresentation && value === "support"
                                ? "Report a problem"
                                : appPresentation && value === "question"
                                  ? "Ask a question"
                                  : contactTopicLabels[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {showProject &&
                      (selectedProject && !editingProject ? (
                        <div className="min-w-0 space-y-2">
                          <p className="text-sm font-medium text-strong-foreground">
                            Selected app or project
                          </p>
                          <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-input px-3">
                            <span className="min-w-0 text-sm text-strong-foreground">
                              {selectedProject.title}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProject(true)}
                            >
                              Change app
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Field
                          name="projectId"
                          label={
                            isSupport
                              ? "Which app or project?"
                              : "Related app or project (optional)"
                          }
                          error={errors.projectId}
                        >
                          <Select
                            name="projectId"
                            value={projectId || "none"}
                            onValueChange={(value) => {
                              const nextProject = value === "none" ? "" : value
                              setProjectId(nextProject)
                              syncSelection(topic, nextProject)
                              setEditingProject(false)
                              setErrors({})
                            }}
                            disabled={status === "pending"}
                            required={isSupport}
                          >
                            <SelectTrigger
                              {...fieldProps("projectId")}
                              className="h-11 min-w-0 aria-invalid:border-destructive [&_[data-slot=select-value]]:truncate"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {isSupport
                                  ? "Choose an app or project"
                                  : "No specific project"}
                              </SelectItem>
                              {initial.projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.title}
                                </SelectItem>
                              ))}
                              <SelectItem value="other">
                                Other / not listed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      ))}
                  </div>
                  {allowsProject && !isSupport && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIncludeProject(!includeProject)
                        if (includeProject) setProjectId("")
                        syncSelection(
                          topic,
                          includeProject ? "" : projectId,
                          !includeProject
                        )
                      }}
                    >
                      {includeProject
                        ? "Remove project context"
                        : "Add an app or project (optional)"}
                    </Button>
                  )}
                  {initial.unknownApp && isSupport && !projectId ? (
                    <p className="text-sm leading-6 text-muted-foreground">
                      The app in this link wasn’t found. Choose it above, or
                      select “Other / not listed” and tell me its name.
                    </p>
                  ) : null}
                  {showProject && projectId === "other" ? (
                    <Field
                      name="unlistedProject"
                      label="App or project name"
                      error={errors.unlistedProject}
                    >
                      <Input
                        {...fieldProps("unlistedProject")}
                        maxLength={160}
                        required
                      />
                    </Field>
                  ) : null}
                  {related ? (
                    <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
                      <p className="min-w-0 leading-6 text-muted-foreground">
                        Regarding{" "}
                        <a
                          href={related.path}
                          className="font-medium text-strong-foreground underline underline-offset-4"
                        >
                          {related.title}
                        </a>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRelated(undefined)
                          onSelectionChange?.({
                            topic,
                            app:
                              showProject && projectId
                                ? projectId.replace(/^project-/, "")
                                : undefined,
                          })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                  <Field
                    name="context"
                    label="Your message"
                    error={errors.context}
                  >
                    <Textarea
                      {...fieldProps("context")}
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={7}
                      className="min-h-40 resize-y"
                      placeholder={
                        isSupport
                          ? "What happened, and what did you expect? Include any steps that help me understand the issue."
                          : "Share your question, suggestion, or what you have in mind."
                      }
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Up to 5,000 characters. Please leave out passwords and
                      other sensitive information.
                    </p>
                  </Field>
                  {isSupport ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        name="platform"
                        label="Device or platform (optional)"
                        error={errors.platform}
                      >
                        <Input
                          {...fieldProps("platform")}
                          maxLength={100}
                          placeholder="e.g. Android, iOS, Windows"
                        />
                      </Field>
                      <Field
                        name="appVersion"
                        label="App version (optional)"
                        error={errors.appVersion}
                      >
                        <Input
                          {...fieldProps("appVersion")}
                          maxLength={100}
                          placeholder="e.g. 1.2.0"
                        />
                      </Field>
                    </div>
                  ) : null}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field name="email" label="Your email" error={errors.email}>
                      <Input
                        {...fieldProps("email")}
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        required
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field
                      name="name"
                      label="Your name (optional)"
                      error={errors.name}
                    >
                      <Input
                        {...fieldProps("name")}
                        autoComplete="name"
                        maxLength={80}
                      />
                    </Field>
                  </div>
                  <div aria-hidden="true" className="hidden">
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Your email and message are used to respond to this inquiry.
                    Submitting won’t subscribe you to a newsletter.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
                  >
                    <EnvelopeSimpleIcon aria-hidden="true" />
                    {status === "pending"
                      ? "Sending…"
                      : status === "error"
                        ? "Try sending again"
                        : "Send message"}
                  </Button>
                </fieldset>
                {status === "pending" ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Checking and saving your message…
                  </p>
                ) : null}
                {submissionError ? (
                  <p
                    role="alert"
                    className="text-sm leading-6 text-destructive"
                  >
                    {submissionError} Your message is still here.
                  </p>
                ) : null}
                <noscript>
                  <p className="text-sm">
                    Enable JavaScript to use the form, or email{" "}
                    <a href={`mailto:${profileCatalog.profile.email}`}>
                      {profileCatalog.profile.email}
                    </a>
                    .
                  </p>
                </noscript>
              </form>
            )}
          </section>
          <aside
            aria-label="Other ways to connect"
            className="space-y-8 border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8"
          >
            {isSupport || appPresentation ? (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-strong-foreground">
                  {selectedProject?.title ?? "Product support"}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {selectedProject?.description ??
                    "Choose a product in the form, or select Other / not listed and enter its name."}
                </p>
                <p className="text-sm text-strong-foreground">
                  Built and supported by Montasim.
                </p>
                {selectedProject && (
                  <a
                    href={selectedProject.href}
                    className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4"
                  >
                    View product{" "}
                    <ArrowUpRightIcon aria-hidden="true" className="size-4" />
                  </a>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-base font-semibold text-strong-foreground">
                  A little about me
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  I’m Montasim, a software engineer based in{" "}
                  {profileCatalog.profile.location}. I build apps, websites, and
                  developer tools. You can reach out about engineering
                  opportunities, collaboration, or something I’ve built or
                  written.
                </p>
                <a
                  href="/experience"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-strong-foreground underline underline-offset-4"
                >
                  Explore my experience
                  <ArrowUpRightIcon aria-hidden="true" className="size-4" />
                </a>
                <a
                  href="/projects"
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-strong-foreground underline underline-offset-4"
                >
                  View my projects{" "}
                  <ArrowUpRightIcon aria-hidden="true" className="size-4" />
                </a>
              </div>
            )}
          </aside>
        </div>
      </PageShell>
      {!isSupport && !appPresentation && <PortfolioAssistant />}
    </>
  )
}
