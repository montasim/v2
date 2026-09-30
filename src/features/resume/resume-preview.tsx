import { useEffect, useRef, useState } from "react"
import type { PDFDocumentLoadingTask } from "pdfjs-dist"
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { Skeleton } from "@/components/ui/skeleton"

export function ResumePreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    const lifecycle = new AbortController()
    const isCancelled = () => lifecycle.signal.aborted
    let task: PDFDocumentLoadingTask | undefined
    const container = containerRef.current!
    setStatus("loading")

    async function renderResume() {
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist")
      if (isCancelled()) return
      GlobalWorkerOptions.workerSrc = workerUrl
      task = getDocument({ url })
      const pdf = await task.promise
      const pages = document.createDocumentFragment()

      for (let number = 1; number <= pdf.numPages; number++) {
        if (isCancelled()) return
        const page = await pdf.getPage(number)
        // Render sharply for desktop and let CSS fit the document to any screen.
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.className = "block h-auto w-full dark:invert dark:hue-rotate-180"
        canvas.setAttribute("aria-hidden", "true")
        canvas.getContext("2d", { alpha: true })
        await page.render({
          canvas,
          viewport,
          background: "rgba(0, 0, 0, 0)",
        }).promise

        const accessibleText = document.createElement("p")
        accessibleText.className = "sr-only"
        const text = await page.getTextContent()
        accessibleText.textContent = text.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
        pages.append(canvas, accessibleText)
      }

      if (!isCancelled()) {
        container.replaceChildren(pages)
        setStatus("ready")
      }
    }

    void renderResume().catch(() => {
      if (!isCancelled()) setStatus("error")
    })

    return () => {
      lifecycle.abort()
      void task?.destroy()
      container.replaceChildren()
    }
  }, [url])

  return (
    <section aria-label="Resume preview" className="mt-8">
      {status === "loading" && (
        <div className="relative aspect-[210/297] max-w-4xl overflow-hidden">
          <div className="absolute inset-0 p-[6%]">
            <p role="status" className="mb-6 text-sm text-muted-foreground">
              Loading resume preview… You can download the PDF while you wait.
            </p>
            <div
              aria-hidden="true"
              className="animate-pulse motion-reduce:animate-none"
            >
              <Skeleton className="h-5 w-3/5 animate-none sm:h-7" />
              <Skeleton className="mt-3 h-2 w-4/5 animate-none sm:h-3" />
              {[0, 1, 2, 3].map((section) => (
                <div key={section} className="mt-[6%]">
                  <Skeleton className="h-3 w-1/5 animate-none sm:h-4" />
                  <div className="mt-3 space-y-2 border-t pt-4 sm:space-y-3">
                    <Skeleton className="h-2 w-full animate-none sm:h-3" />
                    <Skeleton className="h-2 w-[94%] animate-none sm:h-3" />
                    <Skeleton className="h-2 w-full animate-none sm:h-3" />
                    <Skeleton className="h-2 w-3/4 animate-none sm:h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {status === "error" && (
        <p role="alert" className="py-8 text-sm text-muted-foreground">
          The resume preview couldn’t load. Use the download button to read the
          PDF, or refresh this page to try again.
        </p>
      )}
      <div
        ref={containerRef}
        aria-busy={status === "loading"}
        className="max-w-4xl space-y-8"
      />
    </section>
  )
}
