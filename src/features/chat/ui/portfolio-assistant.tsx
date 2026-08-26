import * as React from "react"
import { useChat } from "@ai-sdk/react"
import {
  ArrowClockwiseIcon,
  ArrowLeftCompactIcon,
  ArrowRightCompactIcon,
  ArrowUpIcon,
  BracketsCurlyIcon,
  BriefcaseIcon,
  CaretLeftIcon,
  ChatCenteredDotsIcon,
  ChatCircleDotsIcon,
  CheckIcon,
  CircleDashedIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  HeartStraightIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  SquaresFourIcon,
  UserFocusIcon,
  WarningCircleIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@/components/ui/icons"
import { useServerFn } from "@tanstack/react-start"
import { DefaultChatTransport } from "ai"
import { Dialog } from "radix-ui"

import { Button } from "@/components/ui/button"
import { submitInquiry } from "@/features/chat/application/submit-inquiry"
import { getInquiryMessageModerationError } from "@/features/chat/domain/inquiry-moderation"
import { verifyVisitorEmail } from "@/features/email-verification/application/verify-visitor-email"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import type {
  PortfolioContactAction,
  PortfolioUIMessage,
} from "@/features/chat/domain/chat"
import {
  CHAT_MODERATION_ERROR,
  getChatModerationError,
} from "@/features/chat/domain/chat-moderation"
import { formatChatResponseProvenance } from "@/features/chat/domain/chat-response-provenance"
import type { PortfolioCitation } from "@/features/chat/domain/portfolio-citations"
import { PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE } from "@/features/chat/domain/portfolio-chat"
import {
  createInquiryState,
  inquiryReducer,
  inquirySteps,
  toInquirySubmission,
} from "@/features/chat/domain/inquiry"
import type { InquiryState, InquiryType } from "@/features/chat/domain/inquiry"
import {
  isPortfolioAssistantInquiryRequest,
  portfolioAssistantInquiryEvent,
} from "@/features/chat/ui/assistant-request"
import { profileCatalog } from "@/lib/content/profile"
import { cn } from "@/lib/utils"

const LazyChatMarkdown = React.lazy(async () => {
  const module = await import("@/features/chat/ui/chat-markdown")
  return { default: module.ChatMarkdown }
})

type AssistantMode = "home" | "chat" | "inquiry"

interface AssistantHeaderContent {
  title: string
  description: string
}

const defaultHeader: AssistantHeaderContent = {
  title: "Ask about Montasim",
  description: "AI assistant using this portfolio",
}

const inquiryPresentation: Record<
  InquiryType,
  { title: string; sentTitle: string; confirmationSubject: string }
> = {
  hire: {
    title: "Discuss a role",
    sentTitle: "Role inquiry sent",
    confirmationSubject: "role inquiry",
  },
  project: {
    title: "Discuss a project",
    sentTitle: "Project inquiry sent",
    confirmationSubject: "project inquiry",
  },
  general: {
    title: "Send a query",
    sentTitle: "Query sent",
    confirmationSubject: "message",
  },
}

type SuggestedQuestionId = "hiring" | "impact" | "expertise"

const suggestedQuestions = [
  {
    answerId: "hiring",
    question:
      "Why should a hiring manager consider Montasim for a senior engineering role?",
    title: "Why hire him?",
    description: "Strengths and working style",
    icon: UserFocusIcon,
  },
  {
    answerId: "impact",
    question:
      "Which small set of outcomes best represents Montasim's career impact?",
    title: "Project impact",
    description: "Relevant shipped work",
    icon: BriefcaseIcon,
  },
  {
    answerId: "expertise",
    question: "What is Montasim's core engineering stack?",
    title: "Technical expertise",
    description: "Stack, architecture, and specialties",
    icon: BracketsCurlyIcon,
  },
] as const satisfies ReadonlyArray<{
  answerId: SuggestedQuestionId
  question: string
  title: string
  description: string
  icon: typeof UserFocusIcon
}>

export function PortfolioAssistant() {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<AssistantMode>("home")
  const [inquiryType, setInquiryType] = React.useState<InquiryType>("hire")
  const [inquiryKey, setInquiryKey] = React.useState(0)
  const [inquiryHeader, setInquiryHeader] =
    React.useState<AssistantHeaderContent>({
      title: "Discuss a role",
      description: "Question 1 of 4",
    })
  const preparedMessageSequence = React.useRef(0)
  const transport = React.useMemo(
    () => new DefaultChatTransport<PortfolioUIMessage>({ api: "/api/chat" }),
    []
  )
  const chat = useChat<PortfolioUIMessage>({ transport })

  const startInquiry = React.useCallback((type: InquiryType) => {
    setInquiryType(type)
    setInquiryHeader({
      title: inquiryPresentation[type].title,
      description: `Question 1 of ${inquirySteps[type].length}`,
    })
    setInquiryKey((value) => value + 1)
    setMode("inquiry")
  }, [])

  React.useEffect(() => {
    function handleInquiryRequest(event: Event) {
      const request = (event as CustomEvent<unknown>).detail
      if (!isPortfolioAssistantInquiryRequest(request)) return

      startInquiry(request.inquiryType)
      setOpen(true)
    }

    window.addEventListener(
      portfolioAssistantInquiryEvent,
      handleInquiryRequest
    )
    return () =>
      window.removeEventListener(
        portfolioAssistantInquiryEvent,
        handleInquiryRequest
      )
  }, [startInquiry])

  function ask(question: string) {
    setMode("chat")
    void chat.sendMessage({ text: question })
  }

  function openPreparedAnswer(answerId: SuggestedQuestionId) {
    const question = suggestedQuestions.find(
      (item) => item.answerId === answerId
    )?.question
    if (!question) return
    setMode("chat")
    void chat.sendMessage({ text: question })
  }

  function returnToAssistant() {
    setMode("home")
  }

  function cancelInquiry() {
    setMode(chat.messages.length ? "chat" : "home")
  }

  function continueAfterInquiry(type: InquiryType) {
    preparedMessageSequence.current += 1
    const sequence = preparedMessageSequence.current
    chat.setMessages((messages) => [
      ...messages,
      {
        id: `inquiry-confirmation-${sequence}`,
        role: "assistant",
        metadata: { source: "Inquiry confirmation" },
        parts: [
          {
            type: "text",
            text: `Your ${inquiryPresentation[type].confirmationSubject} is sent. Your contact details remain separate from this conversation. What else would you like to know?`,
          },
        ],
      },
    ])
    setMode("chat")
  }

  function resetAssistant() {
    chat.setMessages([])
    setMode("home")
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
      <div className="chat-launcher-enter fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
        <Dialog.Trigger asChild>
          <Button
            size="icon"
            className="size-14 rounded-full bg-emphasis-foreground text-background shadow-lg hover:bg-emphasis-foreground/80"
            aria-label="Ask about Montasim"
            title="Ask about Montasim"
          >
            <ChatCenteredDotsIcon className="size-5" />
          </Button>
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="motion-overlay fixed inset-0 z-50 bg-foreground/15 backdrop-blur-[2px] sm:hidden" />
        <Dialog.Content className="motion-dialog fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-background outline-none sm:inset-auto sm:right-6 sm:bottom-2 sm:h-[min(720px,calc(100dvh-1rem))] sm:w-[440px] sm:rounded-2xl sm:border sm:shadow-2xl">
          <AssistantHeader
            content={mode === "inquiry" ? inquiryHeader : defaultHeader}
          />
          {mode !== "home" && (
            <div className="shrink-0 px-4 py-4">
              <button
                type="button"
                onClick={returnToAssistant}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg pr-2 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ArrowLeftCompactIcon className="size-[15px]" />
                Back to assistant
              </button>
            </div>
          )}

          {mode === "home" && (
            <AssistantHome
              ask={ask}
              openPreparedAnswer={openPreparedAnswer}
              startInquiry={startInquiry}
            />
          )}
          {mode === "chat" && (
            <ChatView
              chat={chat}
              ask={ask}
              startInquiry={startInquiry}
              onCitationNavigate={() => setOpen(false)}
            />
          )}
          {mode === "inquiry" && (
            <InquiryFlow
              key={inquiryKey}
              type={inquiryType}
              onCancel={cancelInquiry}
              onContinue={continueAfterInquiry}
              onRestart={resetAssistant}
              onHeaderChange={setInquiryHeader}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function AssistantHeader({ content }: { content: AssistantHeaderContent }) {
  return (
    <header className="flex min-h-16 shrink-0 items-center gap-3 border-b px-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emphasis-foreground text-background">
        <ChatCircleDotsIcon className="size-[19px]" />
      </span>
      <div className="min-w-0 flex-1">
        <Dialog.Title className="truncate text-sm font-semibold text-strong-foreground">
          {content.title}
        </Dialog.Title>
        <Dialog.Description className="truncate text-xs text-muted-foreground">
          {content.description}
        </Dialog.Description>
      </div>
      <Dialog.Close asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 text-muted-foreground"
          aria-label="Close assistant"
        >
          <XIcon className="size-5" />
        </Button>
      </Dialog.Close>
    </header>
  )
}

function AssistantHome({
  ask,
  openPreparedAnswer,
  startInquiry,
}: {
  ask: (question: string) => void
  openPreparedAnswer: (answerId: SuggestedQuestionId) => void
  startInquiry: (type: InquiryType) => void
}) {
  return (
    <div className="motion-view flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <h2 className="text-sm font-semibold text-strong-foreground">
          Explore his background
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {suggestedQuestions.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => openPreparedAnswer(item.answerId)}
                className={cn(
                  "min-h-14 rounded-xl border bg-card p-3 text-left transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none dark:bg-muted",
                  index === 2 && "col-span-2"
                )}
              >
                <span className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-[19px] text-strong-foreground" />
                  <span>
                    <span className="block text-sm font-medium text-strong-foreground">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-semibold text-strong-foreground">
            Contact Montasim
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Send the details he needs to reply.
          </p>
          <div className="mt-3 space-y-2">
            <InquiryEntry primary onClick={() => startInquiry("hire")}>
              <BriefcaseIcon className="size-[19px]" /> Discuss a role
            </InquiryEntry>
            <InquiryEntry onClick={() => startInquiry("project")}>
              <SquaresFourIcon className="size-[19px]" /> Discuss a project
            </InquiryEntry>
            <InquiryEntry onClick={() => startInquiry("general")}>
              <ChatCircleDotsIcon className="size-[19px]" /> Something else
            </InquiryEntry>
          </div>
        </div>
      </div>
      <QuickComposer
        onSend={ask}
        placeholder="Ask about skills, projects, or experience"
      />
    </div>
  )
}

function InquiryEntry({
  children,
  onClick,
  primary = false,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px motion-reduce:transition-none",
        primary
          ? "border-emphasis-foreground bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
          : "bg-card text-strong-foreground hover:bg-muted dark:bg-muted/60"
      )}
    >
      {children}
      <ArrowRightCompactIcon className="ml-auto size-[18px]" />
    </button>
  )
}

function ChatView({
  chat,
  ask,
  startInquiry,
  onCitationNavigate,
}: {
  chat: ReturnType<typeof useChat<PortfolioUIMessage>>
  ask: (question: string) => void
  startInquiry: (type: InquiryType) => void
  onCitationNavigate: () => void
}) {
  const feedRef = React.useRef<HTMLDivElement>(null)
  const latestMessageRef = React.useRef<HTMLElement>(null)
  const endRef = React.useRef<HTMLDivElement>(null)
  const composerRef = React.useRef<HTMLTextAreaElement>(null)
  const wasGeneratingRef = React.useRef(
    chat.status === "submitted" || chat.status === "streaming"
  )

  React.useEffect(() => {
    const isGenerating =
      chat.status === "submitted" || chat.status === "streaming"

    if (isGenerating) {
      wasGeneratingRef.current = true
      return
    }

    if (chat.status === "ready" && wasGeneratingRef.current) {
      wasGeneratingRef.current = false
      composerRef.current?.focus({ preventScroll: true })
    }
  }, [chat.status])

  React.useEffect(() => {
    const feed = feedRef.current
    const latestMessage = latestMessageRef.current
    const latestChatMessage = chat.messages.at(-1)
    const answerNeedsItsOwnViewport =
      chat.status === "ready" &&
      latestChatMessage?.role === "assistant" &&
      feed &&
      latestMessage &&
      latestMessage.offsetHeight > feed.clientHeight - 32

    if (answerNeedsItsOwnViewport) {
      latestMessage.scrollIntoView({ block: "start" })
      return
    }

    endRef.current?.scrollIntoView({ block: "end" })
  }, [chat.messages, chat.status])

  return (
    <div className="motion-view flex min-h-0 flex-1 flex-col">
      <div
        ref={feedRef}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {chat.messages.map((message, index) => {
          const text = getMessageText(message)
          if (!text) return null
          const contactAction =
            message.role === "assistant"
              ? message.metadata?.contactAction
              : undefined
          return (
            <article
              ref={
                index === chat.messages.length - 1
                  ? latestMessageRef
                  : undefined
              }
              key={message.id}
              className={cn(
                "motion-view scroll-mt-4 rounded-2xl px-4 py-4 text-sm leading-6",
                message.role === "user"
                  ? "ml-auto max-w-[84%] rounded-br-md bg-emphasis-foreground text-background"
                  : "max-w-[92%] rounded-bl-md bg-muted"
              )}
            >
              {message.role === "assistant" ? (
                <React.Suspense fallback={<MessageParagraphs text={text} />}>
                  <LazyChatMarkdown source={text} />
                </React.Suspense>
              ) : (
                <MessageParagraphs text={text} />
              )}
              {message.role === "assistant" &&
              message.metadata?.citations?.length ? (
                <MessageCitations
                  citations={message.metadata.citations}
                  onNavigate={onCitationNavigate}
                />
              ) : null}
              {contactAction && (
                <MessageContactAction
                  intent={contactAction}
                  startInquiry={startInquiry}
                />
              )}
              {message.role === "assistant" && (
                <div className="mt-4 flex items-center gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">
                    {formatChatResponseProvenance(message.metadata)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(text)}
                    className="grid size-8 place-items-center rounded-lg hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Copy answer"
                  >
                    <CopyIcon className="size-[15px]" />
                  </button>
                </div>
              )}
            </article>
          )
        })}
        {chat.status === "submitted" && (
          <div
            className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted p-4"
            aria-label="Thinking"
          >
            <div className="h-3 w-4/5 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
            <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
          </div>
        )}
        {chat.error && (
          <article
            role="alert"
            className="max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-4 py-4 text-sm leading-6"
          >
            <MessageParagraphs text={PORTFOLIO_CHAT_UNAVAILABLE_MESSAGE} />
            <MessageContactAction
              intent="general"
              startInquiry={startInquiry}
            />
          </article>
        )}
        <div ref={endRef} />
      </div>
      <QuickComposer
        inputRef={composerRef}
        onSend={ask}
        placeholder="Ask a follow-up question"
        disabled={chat.status === "submitted" || chat.status === "streaming"}
      />
    </div>
  )
}

function MessageCitations({
  citations,
  onNavigate,
}: {
  citations: readonly PortfolioCitation[]
  onNavigate: () => void
}) {
  return (
    <nav className="mt-4 border-t pt-3" aria-label="Supporting evidence">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        Supporting evidence
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {citations.map((citation) => (
          <a
            key={citation.href}
            href={citation.href}
            onClick={onNavigate}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs leading-4 font-medium text-strong-foreground hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {citation.label}
            <ArrowRightCompactIcon className="size-3.5" aria-hidden="true" />
          </a>
        ))}
      </div>
    </nav>
  )
}

function QuickComposer({
  inputRef,
  onSend,
  placeholder,
  disabled = false,
}: {
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  onSend: (text: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState("")
  const [isChecking, setIsChecking] = React.useState(false)
  const errorId = React.useId()
  const localTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef ?? localTextareaRef

  async function submitQuestion() {
    const question = value.trim()
    if (!question || disabled || isChecking) return

    setError("")
    setIsChecking(true)
    try {
      if (await getChatModerationError(question)) {
        setError(CHAT_MODERATION_ERROR)
        textareaRef.current?.focus()
        return
      }
      onSend(question)
      setValue("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <form
      className="border-t px-4 py-3"
      onSubmit={(event) => {
        event.preventDefault()
        void submitQuestion()
      }}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <label
          htmlFor="assistant-message"
          className="font-semibold text-strong-foreground"
        >
          Message
        </label>
        <span className="text-muted-foreground">Enter to send</span>
      </div>
      <div
        className={cn(
          "mt-2 flex items-end gap-2 rounded-xl border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring",
          error && "border-destructive focus-within:ring-destructive"
        )}
      >
        <textarea
          ref={textareaRef}
          id="assistant-message"
          rows={1}
          maxLength={500}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError("")
          }}
          onInput={(event) => {
            const textarea = event.currentTarget
            textarea.style.height = "auto"
            textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void submitQuestion()
            }
          }}
          placeholder={placeholder}
          disabled={disabled || isChecking}
          className="max-h-28 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-5 outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        <Button
          type="submit"
          size="icon-lg"
          className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80"
          disabled={!value.trim() || disabled || isChecking}
          aria-label={isChecking ? "Checking message" : "Send message"}
        >
          {isChecking ? (
            <CircleDashedIcon className="size-[18px] animate-spin motion-reduce:animate-none" />
          ) : (
            <ArrowUpIcon className="size-[18px]" />
          )}
        </Button>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

function MessageContactAction({
  intent,
  startInquiry,
}: {
  intent: PortfolioContactAction
  startInquiry: (type: InquiryType) => void
}) {
  if (intent === "funding") {
    return (
      <section className="mt-4 border-t pt-4">
        <p className="font-semibold text-strong-foreground">
          Want to support Montasim's work?
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Support his independent projects directly through SupportKori.
        </p>
        <a
          href={profileCatalog.profile.supportUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-xl border border-emphasis-foreground bg-emphasis-foreground px-4 text-background hover:bg-emphasis-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HeartStraightIcon className="size-[19px] shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              Support on SupportKori
            </span>
            <span className="block truncate text-[11px] opacity-75">
              supportkori.com/montasim
            </span>
          </span>
          <ArrowRightCompactIcon className="size-[18px] shrink-0" />
        </a>
      </section>
    )
  }

  const isRole = intent === "hire"
  const emailUrl = `mailto:${profileCatalog.profile.email}`
  const whatsappUrl = profileCatalog.socialUrl("whatsapp")

  if (intent === "general") {
    return (
      <section className="mt-4 border-t pt-4">
        <p className="font-semibold text-strong-foreground">
          Need a verified detail?
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Contact Montasim directly for information that is not published in
          this portfolio.
        </p>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <a
            href={emailUrl}
            className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border bg-background px-3 text-xs font-medium text-strong-foreground hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <EnvelopeSimpleIcon className="size-[17px] shrink-0" />
            <span className="truncate">{profileCatalog.profile.email}</span>
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-10 items-center gap-2 rounded-xl border bg-background px-3 text-xs font-medium text-strong-foreground hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <WhatsappLogoIcon className="size-[17px]" />
            WhatsApp
          </a>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-4 border-t pt-4">
      <p className="font-semibold text-strong-foreground">
        {isRole
          ? "Interested in hiring Montasim?"
          : "Have a project for Montasim?"}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {isRole
          ? "Share the role and work arrangement so he can reply with context."
          : "Share the project and preferred timeline so he can review the fit."}
      </p>
      <div className="mt-3">
        <InquiryEntry primary onClick={() => startInquiry(intent)}>
          {isRole ? (
            <BriefcaseIcon className="size-[19px]" />
          ) : (
            <SquaresFourIcon className="size-[19px]" />
          )}
          {isRole ? "Discuss a role" : "Discuss a project"}
        </InquiryEntry>
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <a
          href={emailUrl}
          className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border bg-background px-3 text-xs font-medium text-strong-foreground hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <EnvelopeSimpleIcon className="size-[17px] shrink-0" />
          <span className="truncate">{profileCatalog.profile.email}</span>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-10 items-center gap-2 rounded-xl border bg-background px-3 text-xs font-medium text-strong-foreground hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <WhatsappLogoIcon className="size-[17px]" />
          WhatsApp
        </a>
      </div>
    </section>
  )
}

function getMessageText(message: PortfolioUIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function MessageParagraphs({ text }: { text: string }) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p
        key={`${index}-${paragraph.slice(0, 24)}`}
        className="mt-4 whitespace-pre-wrap first:mt-0"
      >
        {paragraph}
      </p>
    ))
}

function InquiryFlow({
  type,
  onCancel,
  onContinue,
  onRestart,
  onHeaderChange,
}: {
  type: InquiryType
  onCancel: () => void
  onContinue: (type: InquiryType) => void
  onRestart: () => void
  onHeaderChange: React.Dispatch<React.SetStateAction<AssistantHeaderContent>>
}) {
  const [state, dispatch] = React.useReducer(
    inquiryReducer,
    type,
    createInquiryState
  )
  const submit = useServerFn(submitInquiry)
  const steps = inquirySteps[state.type]
  const inquiryTitle = inquiryPresentation[state.type].title

  React.useEffect(() => {
    if (state.status !== "submitting") return
    let active = true
    void submit({
      data: {
        inquiry: toInquirySubmission(state),
        website: state.website,
      },
    })
      .then(() => active && dispatch({ type: "submission-succeeded" }))
      .catch(
        (error) =>
          active &&
          dispatch({
            type: "submission-failed",
            message:
              getEmailVerificationError(error) ??
              "The connection failed. Your answers are still here, so you can retry without starting over.",
          })
      )
    return () => {
      active = false
    }
  }, [state, submit])

  React.useEffect(() => {
    let header: AssistantHeaderContent
    if (state.status === "success") {
      header = {
        title: inquiryPresentation[state.type].sentTitle,
        description: "Confirmation",
      }
    } else if (state.status === "error") {
      header = {
        title: "Could not send inquiry",
        description: "Your answers are still saved",
      }
    } else if (state.status === "submitting") {
      header = { title: inquiryTitle, description: "Sending inquiry" }
    } else {
      const step = steps[state.stepIndex]
      header = {
        title: inquiryTitle,
        description:
          state.editReturnStep !== null
            ? `Editing ${step.label}`
            : `Question ${state.stepIndex + 1} of ${steps.length}`,
      }
    }
    onHeaderChange((current) =>
      current.title === header.title &&
      current.description === header.description
        ? current
        : header
    )
  }, [inquiryTitle, onHeaderChange, state, steps])

  if (state.status === "success") {
    return (
      <InquirySuccess
        state={state}
        onContinue={() => onContinue(state.type)}
        onRestart={onRestart}
      />
    )
  }
  if (state.status === "error") {
    return (
      <InquiryError
        message={state.submissionError}
        onRetry={() => dispatch({ type: "retry-submission" })}
        onEditEmail={() => dispatch({ type: "edit-email" })}
      />
    )
  }
  if (state.status === "submitting") {
    return (
      <div
        className="motion-view flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-5 text-center"
        aria-live="polite"
      >
        <div className="w-full max-w-xs py-12">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-muted text-primary">
            <PaperPlaneTiltIcon className="size-[22px]" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Sending your inquiry</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Please keep this window open for a moment.
          </p>
          <div className="mt-5 space-y-2" aria-label="Submitting">
            <div className="mx-auto h-3 w-4/5 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
            <div className="mx-auto h-3 w-3/5 animate-pulse rounded bg-foreground/10 motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <InquiryQuestion state={state} dispatch={dispatch} onCancel={onCancel} />
  )
}

function InquiryQuestion({
  state,
  dispatch,
  onCancel,
}: {
  state: InquiryState
  dispatch: React.Dispatch<Parameters<typeof inquiryReducer>[1]>
  onCancel: () => void
}) {
  const steps = inquirySteps[state.type]
  const step = steps[state.stepIndex]
  const [value, setValue] = React.useState(state.answers[step.key] ?? "")
  const [context, setContext] = React.useState(state.context)
  const [website, setWebsite] = React.useState(state.website)
  const [isCustomOption, setIsCustomOption] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(false)
  const [fieldError, setFieldError] = React.useState("")
  const [contextError, setContextError] = React.useState("")
  const verifyEmail = useServerFn(verifyVisitorEmail)
  React.useEffect(() => {
    setValue(state.answers[step.key] ?? "")
    setContext(state.context)
    setWebsite(state.website)
    setIsCustomOption(false)
    setIsChecking(false)
    setFieldError("")
    setContextError("")
  }, [state.stepIndex, step.key, state.answers])
  const title = inquiryPresentation[state.type].title
  const isEditing = state.editReturnStep !== null
  const progressStep = state.editReturnStep ?? state.stepIndex
  const isEmailValid =
    step.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const canContinue =
    value.trim().length >=
      ("minLength" in step ? step.minLength : step.type === "email" ? 3 : 2) &&
    isEmailValid

  function answer(answerValue: string) {
    dispatch({
      type: "answer",
      value: answerValue,
      context: step.type === "email" ? context : undefined,
      website: step.type === "email" ? website : undefined,
    })
  }

  const customChoice =
    step.type === "options" &&
    (step.key === "role" || step.key === "projectType")

  return (
    <div className="motion-view flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <div className="flex items-end justify-between text-xs">
          <span className="font-semibold text-strong-foreground">
            {title}
          </span>
          <span className="text-muted-foreground">
            {progressStep + 1} of {steps.length}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full origin-left rounded-full bg-emphasis-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{
              transform: `scaleX(${(progressStep + 1) / steps.length})`,
            }}
          />
        </div>

        {isEditing && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">
            <PencilSimpleIcon className="size-[15px]" />
            Editing an earlier answer
          </div>
        )}

        <section className="mt-5 rounded-2xl bg-muted p-5">
          <h2 className="text-base leading-6 font-semibold tracking-tight">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {step.help}
          </p>
        </section>

        {step.type === "options" && !isCustomOption ? (
          <div className="mt-5 space-y-2">
            {step.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  if (
                    customChoice &&
                    (option === "Another role" || option === "Something else")
                  ) {
                    setValue("")
                    setIsCustomOption(true)
                    return
                  }
                  answer(option)
                }}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border bg-card px-4 text-left text-sm font-medium text-strong-foreground transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px motion-reduce:transition-none dark:bg-muted"
              >
                {option}
                <ArrowRightCompactIcon className="ml-auto size-[17px] text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-5"
            aria-busy={isChecking}
            onSubmit={async (event) => {
              event.preventDefault()
              if (!canContinue || isChecking) return
              setFieldError("")
              setIsChecking(true)
              try {
                if (
                  step.type === "textarea" ||
                  step.type === "text" ||
                  isCustomOption
                ) {
                  const moderationError =
                    await getInquiryMessageModerationError(value)
                  if (moderationError) {
                    setFieldError(moderationError)
                    return
                  }
                }
                if (step.type === "email") {
                  if (context.trim()) {
                    const moderationError =
                      await getInquiryMessageModerationError(context)
                    if (moderationError) {
                      setContextError(moderationError)
                      return
                    }
                  }
                  await verifyEmail({ data: value })
                }
                answer(value)
              } catch (error) {
                setFieldError(
                  getEmailVerificationError(error) ??
                    "This value could not be verified. Try again."
                )
              } finally {
                setIsChecking(false)
              }
            }}
          >
            <label
              htmlFor={`inquiry-${step.key}`}
              className="text-sm font-semibold text-strong-foreground"
            >
              {isCustomOption
                ? step.key === "role"
                  ? "Role title"
                  : "Project type"
                : step.label}
            </label>
            {step.type === "textarea" ? (
              <textarea
                id={`inquiry-${step.key}`}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setFieldError("")
                }}
                placeholder={step.placeholder}
                minLength={step.minLength}
                maxLength={1_000}
                rows={5}
                className="mt-2 w-full resize-y rounded-xl border bg-card px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring sm:text-sm"
              />
            ) : (
              <input
                id={`inquiry-${step.key}`}
                type={isCustomOption ? "text" : step.type}
                autoComplete={step.type === "email" ? "email" : "name"}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setFieldError("")
                }}
                placeholder={
                  isCustomOption
                    ? step.key === "role"
                      ? "e.g. Staff Software Engineer"
                      : "e.g. Design system modernization"
                    : "placeholder" in step
                      ? step.placeholder
                      : undefined
                }
                className="mt-2 min-h-12 w-full rounded-xl border bg-card px-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring sm:text-sm"
              />
            )}
            <p className="mt-2 min-h-5 text-xs font-medium text-destructive">
              {fieldError
                ? fieldError
                : step.type === "email" && value && !isEmailValid
                  ? "Enter a valid email address."
                  : step.type === "textarea" &&
                      value &&
                      value.trim().length < step.minLength
                    ? `Enter at least ${step.minLength} characters.`
                    : ""}
            </p>
            {step.type === "email" && (
              <>
                {state.type !== "general" ? (
                  <>
                    <label
                      htmlFor="inquiry-context"
                      className="mt-3 block text-sm font-semibold text-strong-foreground"
                    >
                      {state.type === "hire"
                        ? "Company or job link"
                        : "Project brief or link"}{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="inquiry-context"
                      value={context}
                      aria-invalid={Boolean(contextError)}
                      aria-describedby={
                        contextError ? "inquiry-context-error" : undefined
                      }
                      onChange={(event) => {
                        setContext(event.target.value)
                        setContextError("")
                      }}
                      maxLength={1_000}
                      rows={3}
                      placeholder={
                        state.type === "hire"
                          ? "Paste a job link or share brief context"
                          : "Share a short brief or existing product link"
                      }
                      className="mt-2 w-full resize-y rounded-xl border bg-card px-3 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring sm:text-sm"
                    />
                    {contextError ? (
                      <p
                        id="inquiry-context-error"
                        className="mt-2 text-xs font-medium text-destructive"
                        role="alert"
                      >
                        {contextError}
                      </p>
                    ) : null}
                  </>
                ) : null}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
              </>
            )}
            <Button
              type="submit"
              size="lg"
              className="mt-3 min-h-12 w-full rounded-xl bg-emphasis-foreground text-sm font-semibold text-background hover:bg-emphasis-foreground/80"
              disabled={!canContinue || isChecking}
            >
              {isChecking
                ? step.type === "email"
                  ? "Checking email"
                  : "Checking message"
                : isEditing
                  ? "Save change"
                  : state.stepIndex === steps.length - 1
                    ? "Send inquiry"
                    : "Continue"}
              {isChecking ? (
                <CircleDashedIcon className="size-[17px] animate-spin motion-reduce:animate-none" />
              ) : (
                <ArrowRightCompactIcon className="size-[17px]" />
              )}
            </Button>
            {isCustomOption && (
              <Button
                type="button"
                variant="ghost"
                className="mt-2 min-h-10 w-full rounded-xl text-xs font-semibold text-muted-foreground"
                onClick={() => {
                  setValue("")
                  setIsCustomOption(false)
                }}
              >
                <CaretLeftIcon className="size-4" /> Choose from the list
              </Button>
            )}
          </form>
        )}

        {state.stepIndex > 0 && !isEditing && (
          <ReviewAnswers
            state={state}
            dispatch={dispatch}
            expanded={step.type === "email"}
          />
        )}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t p-3">
        {isEditing ? (
          <Button
            variant="ghost"
            className="min-h-10 rounded-lg px-3 text-xs font-semibold text-strong-foreground"
            onClick={() => dispatch({ type: "cancel-edit" })}
          >
            <CaretLeftIcon className="size-4" /> Cancel edit
          </Button>
        ) : state.stepIndex > 0 ? (
          <Button
            variant="ghost"
            className="min-h-10 rounded-lg px-3 text-xs font-semibold text-strong-foreground"
            onClick={() => dispatch({ type: "back" })}
          >
            <CaretLeftIcon className="size-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          className="min-h-10 rounded-lg px-3 text-xs font-semibold text-muted-foreground"
          onClick={onCancel}
        >
          Cancel inquiry
        </Button>
      </footer>
    </div>
  )
}

function ReviewAnswers({
  state,
  dispatch,
  expanded = false,
}: {
  state: InquiryState
  dispatch: React.Dispatch<Parameters<typeof inquiryReducer>[1]>
  expanded?: boolean
}) {
  const steps = inquirySteps[state.type]
  return (
    <details
      className="mt-6 rounded-xl border bg-card px-4 py-3"
      open={expanded || undefined}
    >
      <summary className="cursor-pointer rounded text-xs font-semibold text-strong-foreground focus-visible:ring-2 focus-visible:ring-ring">
        Review earlier answers
      </summary>
      <div className="mt-3 space-y-2 border-t pt-3">
        {steps.slice(0, state.stepIndex).map((earlier, index) => (
          <div
            key={earlier.key}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <div className="min-w-0">
              <span className="block text-muted-foreground">
                {earlier.label}
              </span>
              <span className="mt-1 block truncate font-medium text-strong-foreground">
                {state.answers[earlier.key]}
              </span>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "begin-edit", stepIndex: index })}
              className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Change ${earlier.label}`}
            >
              <PencilSimpleIcon className="size-3.5" /> Change
            </button>
          </div>
        ))}
      </div>
    </details>
  )
}

function InquirySuccess({
  state,
  onContinue,
  onRestart,
}: {
  state: InquiryState
  onContinue: () => void
  onRestart: () => void
}) {
  const context =
    state.type === "hire"
      ? state.answers.role
      : state.type === "project"
        ? state.answers.projectType
        : "General inquiry"

  return (
    <div className="motion-view flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
        <div className="flex min-h-full items-center py-8">
          <div className="w-full">
            <span className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckIcon className="size-6" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
              Your inquiry was sent.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Montasim will reply to{" "}
              <strong className="font-semibold text-strong-foreground">
                {state.answers.email}
              </strong>
              . He will review the details and reply directly.
            </p>
            <div className="mt-6 rounded-2xl bg-muted p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Inquiry</span>
                <span className="max-w-[65%] text-right font-medium break-words">
                  {context}
                </span>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-right font-medium">
                  {state.answers.name}
                </span>
              </div>
              {state.type === "general" ? (
                <div className="mt-3 border-t pt-3 text-sm">
                  <span className="text-muted-foreground">Message</span>
                  <p className="mt-1.5 font-medium break-words whitespace-pre-wrap text-strong-foreground">
                    {state.answers.context}
                  </p>
                </div>
              ) : null}
            </div>
            <Button
              size="lg"
              className="mt-6 min-h-12 w-full rounded-xl bg-emphasis-foreground text-sm font-semibold text-background hover:bg-emphasis-foreground/80"
              onClick={onContinue}
            >
              Continue asking questions
              <ArrowRightCompactIcon className="size-[17px]" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
              onClick={onRestart}
            >
              Start another inquiry
            </Button>
          </div>
        </div>
      </div>
      <p className="shrink-0 border-t px-5 py-4 text-center text-[11px] leading-4 text-muted-foreground">
        Contact details stay separate from AI conversation history.
      </p>
    </div>
  )
}

function InquiryError({
  message,
  onRetry,
  onEditEmail,
}: {
  message: string | null
  onRetry: () => void
  onEditEmail: () => void
}) {
  return (
    <div className="motion-view min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
      <div className="flex min-h-full items-center py-8">
        <div className="w-full">
          <span className="grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <WarningCircleIcon className="size-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
            Your inquiry was not sent.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {message ?? "Your answers are still here. Try again to continue."}
          </p>
          <Button
            size="lg"
            className="mt-6 min-h-12 w-full rounded-xl bg-emphasis-foreground text-sm font-semibold text-background hover:bg-emphasis-foreground/80"
            onClick={onRetry}
          >
            <ArrowClockwiseIcon className="size-[17px]" />
            Try again
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
            onClick={onEditEmail}
          >
            Change email
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
          >
            <a href={`mailto:${profileCatalog.profile.email}`}>
              Email directly
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
