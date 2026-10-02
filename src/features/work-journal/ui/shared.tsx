import { useEffect, useRef, useState } from "react"
import type { ReactNode, SelectHTMLAttributes } from "react"
import { useBlocker } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-strong-foreground">
      <span>{label}</span>
      {children}
    </label>
  )
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-strong-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
    />
  )
}
export function Message({
  children,
  error = false,
}: {
  children: ReactNode
  error?: boolean
}) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm leading-6 ${error ? "border-destructive/40 text-destructive" : "bg-muted/30 text-muted-foreground"}`}
    >
      {children}
    </p>
  )
}
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const inFlight = useRef(false)
  async function run<T>(action: () => Promise<T>, success = "") {
    if (inFlight.current) return undefined
    inFlight.current = true
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const result = await action()
      setNotice(success)
      return result
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "This request failed. Please try again."
      )
      return undefined
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return {
    busy,
    run,
    feedback: (
      <>
        {error && <Message error>{error}</Message>}
        {notice && <Message>{notice}</Message>}
      </>
    ),
  }
}
export function useRemote<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError("")
    load()
      .then((result) => {
        if (alive) setData(result)
      })
      .catch(() => {
        if (alive)
          setError(
            "Could not load these records. Retry, or check that the journal migration has been applied."
          )
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [load, version])
  return {
    data,
    loading,
    error,
    refresh: () => setVersion((current) => current + 1),
  }
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => void
}) {
  if (error)
    return (
      <div className="space-y-3">
        <Message error>{error}</Message>
        <Button variant="outline" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  if (loading)
    return (
      <div
        role="status"
        aria-label="Loading journal"
        className="space-y-4 py-6"
      >
        <div className="h-10 rounded-lg bg-muted motion-safe:animate-pulse" />
        <div className="h-32 rounded-lg bg-muted motion-safe:animate-pulse" />
      </div>
    )
  return null
}
export function useUnsaved(dirty: boolean, onDirty: (dirty: boolean) => void) {
  useEffect(() => {
    onDirty(dirty)
    return () => onDirty(false)
  }, [dirty, onDirty])
  useBlocker({
    shouldBlockFn: () =>
      dirty &&
      !window.confirm("Leave this page and discard unsaved journal edits?"),
    enableBeforeUnload: dirty,
  })
}
export function downloadText(
  name: string,
  text: string,
  type = "text/markdown"
) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
