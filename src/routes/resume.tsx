import { createFileRoute } from "@tanstack/react-router"
import { DetailPage } from "@/components/shared/detail-page"
import { DownloadAction } from "@/components/shared/navigation-action"
import { DownloadSimpleIcon } from "@/components/ui/icons"
import { profileCatalog } from "@/lib/content/profile"
import { createMeta } from "@/lib/site"
import { ResumePreview } from "@/features/resume/resume-preview"

const description = "View my resume or download a PDF copy to keep."

export const Route = createFileRoute("/resume")({
  head: () => createMeta("Resume", description, "/resume"),
  component: ResumePage,
})

function ResumePage() {
  const { profile } = profileCatalog

  return (
    <DetailPage
      title="Resume"
      description={`${description} If the preview doesn’t load, use the download button to read the PDF.`}
      headerAction={
        <DownloadAction
          href={profile.resumeDownloadUrl}
          size="lg"
          className="bg-emphasis-foreground text-background hover:bg-emphasis-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <DownloadSimpleIcon />
          Download resume (PDF)
        </DownloadAction>
      }
    >
      <ResumePreview url={profile.resumeDownloadUrl} />
    </DetailPage>
  )
}
