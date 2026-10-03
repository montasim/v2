import { Children, isValidElement } from "react"
import type { ChangeEvent, ReactElement, ReactNode } from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Radix reserves "" for "no selection", so empty option values are mapped.
const EMPTY = "__empty__"
const toRadix = (value: string) => (value === "" ? EMPTY : value)
const fromRadix = (value: string) => (value === EMPTY ? "" : value)

type OptionLike = ReactElement<{
  value?: string | number
  label?: string
  disabled?: boolean
  children?: ReactNode
  "data-logo"?: string
}>

function OptionLogo({ src, label }: { src: string; label: string }) {
  const box =
    "mr-2 inline-grid size-4 shrink-0 place-items-center rounded-sm align-[-3px]"
  return src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={cn(box, "object-contain")}
      onError={(event) => (event.currentTarget.style.visibility = "hidden")}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(box, "bg-muted text-[0.625rem] font-semibold")}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

function text(children: ReactNode) {
  return Children.toArray(children).join("")
}

function items(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return []
    const element = child as OptionLike
    if (element.type === "optgroup") {
      const nested = items(element.props.children)
      if (!nested.length) return []
      return (
        <SelectGroup key={element.key}>
          <SelectLabel>{element.props.label}</SelectLabel>
          {nested}
        </SelectGroup>
      )
    }
    if (element.type !== "option") return []
    const label = text(element.props.children)
    const logo = element.props["data-logo"]
    return (
      <SelectItem
        key={element.key}
        value={toRadix(String(element.props.value ?? label))}
        disabled={element.props.disabled}
      >
        {/* An array (not a fragment) keeps the label searchable as text. */}
        {logo === undefined
          ? label
          : [<OptionLogo key="logo" src={logo} label={label} />, label]}
      </SelectItem>
    )
  })
}

/**
 * Drop-in replacement for a native <select> (same <option>/<optgroup>
 * children and onChange(event) signature) rendered with the shared shadcn
 * Select, so every dashboard dropdown has the same menu and highlight colors.
 * Add data-logo="url" to an option to show a logo ("" shows its initial).
 */
export function FormSelect({
  id,
  value = "",
  onChange,
  children,
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string
  value?: string | number | readonly string[]
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
  children?: ReactNode
  disabled?: boolean
  required?: boolean
  className?: string
  "aria-label"?: string
}) {
  return (
    <Select
      value={toRadix(String(value))}
      onValueChange={(next) => {
        const target = { value: fromRadix(next) }
        onChange?.({
          target,
          currentTarget: target,
        } as ChangeEvent<HTMLSelectElement>)
      }}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "min-w-0 bg-card [&_[data-slot=select-value]]:truncate",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">{items(children)}</SelectContent>
    </Select>
  )
}
