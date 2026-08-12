import { z } from "zod"
import certificationsJson from "@/data/certifications.json"
import contributionsJson from "@/data/contributions.json"
import educationJson from "@/data/education.json"
import experienceJson from "@/data/experience.json"
import organizationsJson from "@/data/organizations.json"
import profileJson from "@/data/profile.json"
import projectsJson from "@/data/projects.json"
import recommendationsJson from "@/data/recommendations.json"
import skillsJson from "@/data/skills.json"
import volunteeringJson from "@/data/volunteering.json"

const url = z.string().url().or(z.literal(""))
const profileSchema = z.object({
  name: z.string(),
  title: z.string(),
  tagline: z.string(),
  location: z.string(),
  email: z.email(),
  avatarUrl: z.string(),
  resumeUrl: z.string(),
  about: z.string(),
  socialLinks: z.array(
    z.object({ platform: z.string(), url: z.string(), label: z.string() })
  ),
})
const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  companyUrl: url,
  logo: z.string(),
  logoUrl: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
})
const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  imageUrl: z.string().nullable().optional(),
  liveUrl: url.optional(),
  npmUrl: url.optional(),
  releaseUrl: url.optional(),
  githubUrl: url.optional(),
  emoji: z.string().optional(),
})
const skillSchema = z.object({
  id: z.string(),
  category: z.string(),
  items: z.array(z.string()),
})
const educationSchema = z.object({
  id: z.string(),
  institution: z.string(),
  institutionUrl: url,
  degree: z.string(),
  period: z.string(),
  details: z.string(),
  highlights: z.array(z.string()),
  logo: z.string(),
  logoUrl: z.string(),
})
const certificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.string(),
  description: z.string(),
  url,
})
const recommendationSchema = z.object({
  name: z.string(),
  role: z.string(),
  relationship: z.string(),
  date: z.string(),
  text: z.string(),
})
const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  period: z.string(),
  associatedWith: z.string(),
  description: z.string(),
  logo: z.string(),
  logoUrl: z.string(),
  url,
})
const volunteeringSchema = z.object({
  id: z.string(),
  organization: z.string(),
  organizationUrl: url,
  role: z.string(),
  period: z.string(),
  location: z.string(),
  description: z.string(),
  logo: z.string(),
  logoUrl: z.string(),
})
const contributionsSchema = z.object({
  totalContributions: z.number().int().nonnegative(),
  weeks: z.array(
    z.object({
      contributionDays: z.array(
        z.object({
          contributionCount: z.number().int().nonnegative(),
          date: z.iso.date(),
        })
      ),
    })
  ),
})

export const profile = profileSchema.parse(profileJson)
export const experience = z.array(experienceSchema).parse(experienceJson)
export const projects = z.array(projectSchema).parse(projectsJson)
export const skills = z.array(skillSchema).parse(skillsJson)
export const education = z.array(educationSchema).parse(educationJson)
export const certifications = z
  .array(certificationSchema)
  .parse(certificationsJson)
export const recommendations = z
  .array(recommendationSchema)
  .parse(recommendationsJson)
export const organizations = z
  .array(organizationSchema)
  .parse(organizationsJson)
export const volunteering = z.array(volunteeringSchema).parse(volunteeringJson)
export const contributions = contributionsSchema.parse(contributionsJson)

export function socialUrl(platform: string) {
  return (
    profile.socialLinks.find((link) => link.platform === platform)?.url ?? "#"
  )
}

export type Experience = z.infer<typeof experienceSchema>
export type Project = z.infer<typeof projectSchema>

export const descriptions = {
  experience:
    "A role-by-role record of product engineering, real-time systems, cloud delivery, and technical leadership.",
  projects:
    "Production applications, developer tools, packages, datasets, and AI skills built around reliability and useful outcomes.",
  skills:
    "Technologies, platforms, and working practices used across product engineering, real-time systems, and cloud delivery.",
  education:
    "Academic background in computer science and the foundations that support practical software engineering.",
  certifications:
    "Professional learning across frontend engineering, mobile development, project delivery, API testing, and web development.",
  recommendations:
    "Feedback from managers, teammates, direct reports, collaborators, and teachers.",
  resume:
    "A complete professional summary covering experience, skills, education, certifications, and selected work.",
} as const
