import { createFileRoute } from "@tanstack/react-router"
import { getContactContext } from "@/features/contact/application/contact-context"
import { contactSearchSchema } from "@/features/contact/domain/contact"
import { ContactPage } from "@/features/contact/ui/contact-page"
import { createMeta } from "@/lib/site"

export const Route = createFileRoute("/contact")({
  validateSearch: contactSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getContactContext({ data: deps }),
  head: ({ loaderData }) => {
    const project = loaderData?.projects.find(
      (item) => item.id === loaderData.projectId
    )
    const appMode =
      project &&
      loaderData?.topic !== "general" &&
      loaderData?.topic !== "collaboration"
    return createMeta(
      appMode
        ? `${project.title} Support — Contact Montasim`
        : loaderData?.topic === "collaboration"
          ? "Discuss an opportunity with Montasim"
          : "Get in touch with Montasim",
      appMode
        ? `Contact Montasim for help with ${project.title}. Report a problem, suggest an improvement, or ask a question.`
        : "Discuss engineering opportunities, collaboration, product support, or a question with Montasim.",
      "/contact"
    )
  },
  component: Page,
})
function Page() {
  const data = Route.useLoaderData()
  const navigate = Route.useNavigate()
  return (
    <ContactPage
      initial={data}
      onSelectionChange={(search) => {
        void navigate({ search, replace: true, resetScroll: false })
      }}
    />
  )
}
