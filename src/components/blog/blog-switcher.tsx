import { useNavigate } from "@tanstack/react-router"

import { BreadcrumbSwitcher } from "@/components/shared/breadcrumb-switcher"
import type { BreadcrumbSwitcherOption } from "@/components/shared/breadcrumb-switcher"
import { BookOpenTextIcon } from "@/components/ui/icons"
import { blogCatalog } from "@/lib/content/blog"
import type { BlogPost } from "@/lib/content/blog"

export const blogSwitcherOptions: readonly BreadcrumbSwitcherOption[] =
  blogCatalog.posts.map((post) => ({
    value: post.slug,
    title: post.title,
    keywords: [post.category],
    fallbackIcon: <BookOpenTextIcon className="size-4" />,
  }))

export function BlogSwitcher({ current }: { current: BlogPost }) {
  const navigate = useNavigate()
  return (
    <BreadcrumbSwitcher
      label={current.title}
      current={current.slug}
      options={blogSwitcherOptions}
      onSelect={(slug) =>
        void navigate({ to: "/blog/$slug", params: { slug } })
      }
      ariaLabel="Switch article"
      searchPlaceholder="Find an article…"
      emptyText="No articles found."
    />
  )
}
