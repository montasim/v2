import { useEffect, useRef, useState } from "react"

export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const

export const KONAMI_DISPLAY_SEQUENCE = [
  "↑",
  "↑",
  "↓",
  "↓",
  "←",
  "→",
  "←",
  "→",
  "B",
  "A",
] as const

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.matches("input, textarea, select") || target.isContentEditable)
  )
}

export function useKonamiCode(onUnlock: () => void) {
  const onUnlockRef = useRef(onUnlock)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    onUnlockRef.current = onUnlock
  }, [onUnlock])

  useEffect(() => {
    let position = 0
    let resetTimer: number | undefined

    function updateProgress(nextPosition: number) {
      window.clearTimeout(resetTimer)
      position = nextPosition
      setProgress(nextPosition)

      if (nextPosition > 0) {
        resetTimer = window.setTimeout(() => {
          position = 0
          setProgress(0)
        }, 1800)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (typeof event.key !== "string") return

      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return
      }

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

      if (key === KONAMI_SEQUENCE[position]) {
        updateProgress(position + 1)
        event.preventDefault()

        if (position === KONAMI_SEQUENCE.length) {
          updateProgress(0)
          onUnlockRef.current()
        }
        return
      }

      updateProgress(key === KONAMI_SEQUENCE[0] ? 1 : 0)
      if (position === 1) event.preventDefault()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.clearTimeout(resetTimer)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return progress
}
