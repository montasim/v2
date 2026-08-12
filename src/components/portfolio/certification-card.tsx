import {
  ArrowUpRightIcon,
  CertificateIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EntityAvatar } from "@/components/shared/entity-avatar"
import type { certifications } from "@/lib/content"

type Certification = (typeof certifications)[number]

type CertificationMeta = {
  platform: string
  platformIcon: string
  image?: string
  download?: string
  description: string
}

const certificationMeta: Record<string, CertificationMeta> = {
  "certification-meta-front-end-developer": {
    platform: "Coursera",
    platformIcon: "/images/certifications/platforms/coursera.svg",
    image: "/images/certifications/meta-front-end.png",
    download: "/images/certifications/meta-front-end.png",
    description: "Professional specialization in modern frontend engineering.",
  },
  "certification-meta-react-native": {
    platform: "Coursera",
    platformIcon: "/images/certifications/platforms/coursera.svg",
    image: "/images/certifications/meta-react-native.png",
    download: "/images/certifications/meta-react-native.png",
    description: "Specialization",
  },
  "certification-google-project-management": {
    platform: "Coursera",
    platformIcon: "/images/certifications/platforms/coursera.svg",
    image: "/images/certifications/google-project-management.png",
    download: "/images/certifications/google-project-management.png",
    description: "Professional specialization",
  },
  "certification-postman-api-testing": {
    platform: "Udemy",
    platformIcon: "/images/certifications/platforms/udemy.svg",
    image: "/images/certifications/postman-api-testing.jpg",
    download: "/documents/certifications/postman-api-testing.pdf",
    description: "Course certificate",
  },
  "certification-complete-web-development-course": {
    platform: "Programming Hero",
    platformIcon: "/images/certifications/platforms/programming-hero.ico",
    description: "Course completed",
  },
}

const actionClassName =
  "h-auto whitespace-nowrap p-0 font-medium text-foreground"

export function CertificationCard({ item }: { item: Certification }) {
  const meta = certificationMeta[item.id]

  return (
    <Card
      asChild
      className="interactive-surface group grid min-w-0 overflow-hidden sm:grid-cols-[1.15fr_0.85fr]"
    >
      <article>
        {meta.image ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block aspect-[13/10] bg-muted p-3 sm:aspect-auto sm:p-5"
            aria-label={`View ${item.title} credential`}
          >
            <img
              src={meta.image}
              width="520"
              height="420"
              alt={`${item.title} certificate preview`}
              className="h-full w-full object-contain transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.015] motion-reduce:transition-none"
            />
          </a>
        ) : (
          <div className="grid aspect-[13/10] place-items-center bg-muted p-8 text-center sm:aspect-auto sm:min-h-80">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-xl border bg-card">
                <CertificateIcon className="size-8 text-muted-foreground" />
              </span>
              <p className="mt-4 text-sm font-medium">
                Certificate preview not added
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add the file when it is available.
              </p>
            </div>
          </div>
        )}

        <CardContent className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <span className="inline-flex items-center gap-2 text-sm">
              <EntityAvatar
                src={meta.platformIcon}
                fallback={meta.platform.slice(0, 1)}
                className="size-8 bg-card"
                imageClassName="p-2"
              />
              {meta.platform}
            </span>
            <span className="text-xs">{item.year}</span>
          </div>
          <h2 className="mt-5 text-lg leading-snug font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {meta.description}
          </p>

          {item.url ? (
            <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-7">
              <Button
                asChild
                variant="link"
                className={`${actionClassName} group/action`}
              >
                <a href={item.url} target="_blank" rel="noreferrer">
                  View credential
                  <ArrowUpRightIcon className="group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
                </a>
              </Button>
              {meta.download && (
                <Button asChild variant="link" className={actionClassName}>
                  <a href={meta.download} download>
                    <DownloadSimpleIcon />
                    Download
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <p className="mt-auto pt-6 text-xs text-muted-foreground">
              Credential link and download will appear when added.
            </p>
          )}
        </CardContent>
      </article>
    </Card>
  )
}
