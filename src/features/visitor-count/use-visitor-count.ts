import { useEffect, useState } from "react"

type ViewCountAction = (options: { data: string }) => Promise<number>

const pendingRequests = new Map<string, Promise<number>>()

export function useVisitorCount({
  resourceKey,
  slug,
  getCount,
  recordView,
}: {
  resourceKey: string
  slug: string
  getCount: ViewCountAction
  recordView: ViewCountAction
}) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const storageKey = `portfolio-viewed:${resourceKey}:${slug}`
    let shouldRecord = true

    try {
      shouldRecord = window.sessionStorage.getItem(storageKey) !== "1"
      if (shouldRecord) window.sessionStorage.setItem(storageKey, "1")
    } catch {
      shouldRecord = !pendingRequests.has(storageKey)
    }

    let request = pendingRequests.get(storageKey)
    if (!request) {
      request = shouldRecord
        ? recordView({ data: slug })
        : getCount({ data: slug })
      pendingRequests.set(storageKey, request)

      const clearPendingRequest = () => {
        if (pendingRequests.get(storageKey) === request) {
          pendingRequests.delete(storageKey)
        }
      }
      void request.then(clearPendingRequest, clearPendingRequest)
    }

    void request.then(setCount).catch(() => {
      setCount(null)
      if (shouldRecord) {
        try {
          window.sessionStorage.removeItem(storageKey)
        } catch {
          // A later visit can retry when browser storage is unavailable.
        }
      }
    })
  }, [getCount, recordView, resourceKey, slug])

  return count
}
