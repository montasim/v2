import { useId, useState } from "react"
import { useServerFn } from "@tanstack/react-start"

import { Button } from "@/components/ui/button"
import { CheckIcon, CircleDashedIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { InputGroup } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { getEmailVerificationError } from "@/features/email-verification/domain/email-verification"
import { subscribeToNewsletter } from "@/features/newsletter/application/subscribe"
import { getNewsletterSubscriptionError } from "@/features/newsletter/domain/subscriber"
import { cn } from "@/lib/utils"

export function NewsletterForm({ className }: { className?: string }) {
  const fieldId = useId()
  const subscribe = useServerFn(subscribeToNewsletter)
  const [email, setEmail] = useState("")
  const [saved, setSaved] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState("")

  return (
    <form
      className={cn("grid w-full gap-2.5", className)}
      onSubmit={async (event) => {
        event.preventDefault()
        setError("")
        setIsChecking(true)

        try {
          const website = String(
            new FormData(event.currentTarget).get("website") ?? ""
          )
          await subscribe({ data: { email, website } })
          setSaved(true)
        } catch (verificationError) {
          setError(
            getEmailVerificationError(verificationError) ??
              getNewsletterSubscriptionError(verificationError) ??
              "The subscription could not be completed. Try again."
          )
        } finally {
          setIsChecking(false)
        }
      }}
    >
      <Input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <Label htmlFor={fieldId} className="text-xs font-semibold">
        Email address
      </Label>
      {/* On phones the field and button stack, so the shared box is dropped and each stands alone. */}
      <InputGroup className="gap-1.5 p-1.5 max-sm:flex-col max-sm:items-stretch max-sm:gap-2.5 max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none max-sm:focus-within:ring-0">
        <Input
          id={fieldId}
          type="email"
          autoComplete="email"
          required
          disabled={isChecking}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setSaved(false)
            setError("")
          }}
          placeholder="you@example.com"
          className="min-h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 max-sm:border! max-sm:bg-card! max-sm:px-3 max-sm:shadow-xs! max-sm:focus-visible:ring-2! dark:bg-transparent"
        />
        <Button
          type="submit"
          disabled={isChecking}
          className="min-h-9 bg-emphasis-foreground px-4.5 text-background"
        >
          {isChecking ? (
            <CircleDashedIcon className="animate-spin motion-reduce:animate-none" />
          ) : saved ? (
            <CheckIcon />
          ) : null}
          {isChecking ? "Subscribing" : saved ? "Subscribed" : "Subscribe"}
        </Button>
      </InputGroup>
      <p
        className={cn(
          // Collapses while empty but stays mounted, so the live region still announces.
          "min-h-4.5 text-xs empty:absolute",
          error ? "text-destructive" : "text-muted-foreground"
        )}
        role={error ? "alert" : "status"}
      >
        {error ||
          (saved
            ? "Subscription confirmed. Check your inbox for a welcome email."
            : null)}
      </p>
    </form>
  )
}
