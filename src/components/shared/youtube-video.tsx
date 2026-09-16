import { useState } from "react"

import { PlayIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export function YouTubeVideo({
  videoId,
  title,
  loading = "lazy",
  className,
}: {
  videoId: string
  title: string
  loading?: "eager" | "lazy"
  className?: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!isPlaying) {
    return (
      <button
        type="button"
        onClick={() => setIsPlaying(true)}
        aria-label={`Play ${title}`}
        className={cn(
          "group relative aspect-video h-full w-full cursor-pointer overflow-hidden border-0 bg-black text-white focus-visible:outline-2 focus-visible:outline-offset-2",
          className
        )}
      >
        <img
          src={`https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg`}
          alt=""
          loading={loading}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 bg-black/10 transition-colors duration-200 group-hover:bg-black/20 motion-reduce:transition-none" />
        <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-red-600 shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-[transform,background-color] duration-200 group-hover:scale-105 group-hover:bg-red-500 group-active:scale-95 motion-reduce:transition-none sm:size-18">
          <PlayIcon className="size-8 fill-current" strokeWidth={2} />
        </span>
      </button>
    )
  }

  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`}
      title={title}
      loading={loading}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className={cn("aspect-video h-full w-full border-0", className)}
    />
  )
}
