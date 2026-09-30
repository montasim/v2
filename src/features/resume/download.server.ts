import { profileCatalog } from "@/lib/content/profile"

export async function downloadResume() {
  const fileId = new URL(profileCatalog.profile.resumeUrl).pathname.split(
    "/"
  )[3]
  const url = new URL("https://drive.google.com/uc")
  url.searchParams.set("export", "download")
  url.searchParams.set("id", fileId)

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error("Resume unavailable")

    const pdf = await response.arrayBuffer()
    // Drive can return an HTML login or confirmation page with a 200 status.
    if (new TextDecoder().decode(pdf.slice(0, 5)) !== "%PDF-") {
      throw new Error("Invalid resume file")
    }

    // Preserve Drive's filename parameters, including UTF-8 filename*, while
    // always asking the browser to download instead of opening a preview.
    const disposition = response.headers.get("Content-Disposition")
    const downloadDisposition = disposition
      ? disposition.replace(/^[^;]+/, "attachment")
      : 'attachment; filename="resume.pdf"'

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": downloadDisposition,
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new Response(
      "The resume could not be downloaded. Please go back and try again shortly.",
      {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
