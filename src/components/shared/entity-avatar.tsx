import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { optimizedImage } from "@/lib/assets"
import { cn } from "@/lib/utils"

export function EntityAvatar({
  src,
  fallback,
  className,
  imageClassName,
}: {
  src: string
  fallback: string
  className?: string
  imageClassName?: string
}) {
  return (
    <Avatar
      className={cn(
        "size-12 rounded-md border bg-background text-muted-foreground",
        className
      )}
      aria-hidden="true"
    >
      <AvatarFallback className="rounded-none bg-background">
        {fallback}
      </AvatarFallback>
      <AvatarImage
        src={optimizedImage(src)}
        alt=""
        className={cn(
          "absolute inset-0 aspect-square size-full object-contain",
          imageClassName
        )}
        onError={(event) => {
          event.currentTarget.hidden = true
        }}
      />
    </Avatar>
  )
}
