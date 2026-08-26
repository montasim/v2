import * as React from "react"

import { cn } from "@/lib/utils"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full items-center rounded-xl border border-input bg-card shadow-xs transition-[color,box-shadow] outline-none",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
        "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup }
