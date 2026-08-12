import { z } from "zod"
import certificationsJson from "@/data/certifications.json"
import udemyCertificationsJson from "@/data/udemy-certifications.json"
import type { CatalogFilter } from "@/lib/content/shared"
import { optionalUrlSchema, uniqueDescending } from "@/lib/content/shared"

const certificationSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(1),
  platformIcon: z.string().startsWith("/"),
  issuer: z.string().min(1),
  image: z.string().startsWith("/").nullable(),
  download: z.string().startsWith("/").nullable(),
  title: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  completedAt: z.iso.date().nullable(),
  description: z.string().min(1),
  url: optionalUrlSchema,
})

const udemyCertificationSchema = z.object({
  courseId: z.number().int().positive(),
  title: z.string().min(1),
  issuer: z.string().min(1),
  completedAt: z.iso.date().nullable(),
  certificateCode: z.string().min(1).nullable(),
  courseUrl: z.url().optional(),
  lastActivityAt: z.iso.date().optional(),
})

export type Certification = z.infer<typeof certificationSchema>
export type CertificationFilter = "all" | number

// This is intentionally portfolio-specific rather than chronological. It leads
// with the strongest signals for senior frontend/full-stack hiring, then expands
// into testing, cloud, accessibility, delivery, data, and supporting foundations.
const hiringPriority = [
  "certification-meta-front-end-developer",
  "certification-microsoft-azure-fundamentals",
  "certification-postman-api-testing",
  "certification-unit-testing-jest",
  "certification-accessible-web-development",
  "certification-meta-react-native",
  "certification-agile-atlassian-jira",
  "certification-google-project-management",
  "certification-foundations-ux-design",
  "certification-google-business-intelligence",
  "certification-foundations-digital-marketing",
  "certification-udemy-2233498",
  "certification-udemy-3033196",
  "certification-udemy-2655532",
  "certification-udemy-2605684",
  "certification-udemy-2554215",
  "certification-git-github-open-source",
  "certification-git-remote-repository",
  "certification-azure-management-security",
  "certification-azure-services-lifecycles",
  "certification-azure-cloud-services",
  "certification-az-900-exam-prep",
  "certification-complete-web-development-course",
  "certification-udemy-878230",
  "certification-css-position-elements",
  "certification-udemy-787236",
  "certification-udemy-2503042",
  "certification-udemy-2971820",
  "certification-command-line-linux",
  "certification-udemy-2853150",
  "certification-udemy-1297394",
  "certification-udemy-1397484",
  "certification-udemy-389302",
  "certification-udemy-1162000",
  "certification-udemy-1528664",
  "certification-udemy-881980",
  "certification-udemy-2112114",
  "certification-udemy-2088476",
  "certification-udemy-832316",
  "certification-udemy-2355846",
  "certification-udemy-1119214",
  "certification-udemy-342220",
  "certification-udemy-847782",
  "certification-udemy-51927",
  "certification-udemy-1934692",
  "certification-resume-cover-letter",
] as const

const hiringRank = new Map<string, number>(
  hiringPriority.map((id, index) => [id, index] as const)
)

const udemyRecords = z
  .array(udemyCertificationSchema)
  .parse(udemyCertificationsJson)
  .map((record) =>
    certificationSchema.parse({
      id: `certification-udemy-${record.courseId}`,
      platform: "Udemy",
      platformIcon: "/images/certifications/platforms/udemy.svg",
      issuer: record.issuer,
      image: `/images/certifications/udemy-${record.courseId}.jpg`,
      download: null,
      title: record.title,
      year: (record.completedAt ?? record.lastActivityAt)!.slice(0, 4),
      completedAt: record.completedAt,
      description: record.certificateCode
        ? "Course certificate"
        : "Completed course · 100% progress",
      url: record.certificateCode
        ? `https://www.udemy.com/certificate/${record.certificateCode}/`
        : record.courseUrl,
    })
  )

const unsortedRecords = [
  ...z.array(certificationSchema).parse(certificationsJson),
  ...udemyRecords,
]
const records = [...unsortedRecords].sort((left, right) => {
  const leftRank = hiringRank.get(left.id) ?? Number.MAX_SAFE_INTEGER
  const rightRank = hiringRank.get(right.id) ?? Number.MAX_SAFE_INTEGER

  if (leftRank !== rightRank) return leftRank - rightRank

  return (
    (right.completedAt ?? `${right.year}-01-01`).localeCompare(
      left.completedAt ?? `${left.year}-01-01`
    ) || left.title.localeCompare(right.title)
  )
})
const years = uniqueDescending(records.map((record) => record.year))
const filters: readonly CatalogFilter<CertificationFilter>[] = [
  { value: "all", label: "All years" },
  ...years.map((year) => ({ value: Number(year), label: year })),
]

export const certificationCatalog = {
  records,
  featured: records.slice(0, 3),
  filters,
  filterSchema: z.union([
    z.literal("all"),
    z
      .number()
      .int()
      .refine((value) => years.includes(String(value))),
  ]),
  matches(record: Certification, filter: CertificationFilter) {
    return filter === "all" || record.year === String(filter)
  },
} as const
