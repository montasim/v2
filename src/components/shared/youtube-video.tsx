import { useState } from "react"

import { cn } from "@/lib/utils"

export function YouTubeVideo({
  videoId,
  title,
  loading = "lazy",
  className,
  mutedPreview = false,
}: {
  videoId: string
  title: string
  loading?: "eager" | "lazy"
  className?: string
  mutedPreview?: boolean
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
          className={cn(
            "h-full w-full object-cover",
            mutedPreview &&
              "grayscale transition-[filter,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015] group-hover:grayscale-0 group-focus-visible:grayscale-0 motion-reduce:transition-none"
          )}
        />
        <span className="absolute inset-0 bg-black/10 transition-colors duration-200 group-hover:bg-black/20 motion-reduce:transition-none" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none">
          <svg className="h-12 w-[4.25rem] sm:h-14 sm:w-[4.958rem]" viewBox="0 0 68 48" aria-hidden="true">
            <path fill="#f00" d="M66.52 7.74a8 8 0 0 0-5.64-5.66C55.91.75 34 .75 34 .75S12.09.75 7.12 2.08a8 8 0 0 0-5.64 5.66C.15 12.72.15 24 .15 24s0 11.28 1.33 16.26a8 8 0 0 0 5.64 5.66C12.09 47.25 34 47.25 34 47.25s21.91 0 26.88-1.33a8 8 0 0 0 5.64-5.66C67.85 35.28 67.85 24 67.85 24s0-11.28-1.33-16.26Z" />
            <path fill="#fff" d="M27 34.5 45 24 27 13.5v21Z" />
          </svg>
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
