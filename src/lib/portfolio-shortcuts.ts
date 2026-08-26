export const sectionShortcuts = [
  { label: "About", to: "/", hash: "about", key: "1" },
  { label: "Experience", to: "/", hash: "experience", key: "2" },
  { label: "Education", to: "/education", key: "3" },
  { label: "Skills", to: "/", hash: "skills", key: "4" },
  { label: "Projects", to: "/", hash: "projects", key: "5" },
  {
    label: "Recommendations",
    to: "/",
    hash: "recommendations",
    key: "6",
  },
] as const

export const additionalSections = [
  { label: "Case studies", to: "/case-studies" },
  { label: "Certifications", to: "/certifications" },
  { label: "Volunteering", to: "/", hash: "volunteering" },
  { label: "Organizations", to: "/", hash: "organizations" },
] as const

export const actionShortcuts = [
  { label: "Buy me a coffee", key: "⌘B", action: "coffee" },
  { label: "Toggle theme", key: "T", action: "theme" },
  { label: "Open / close assistant", key: "C", action: "assistant" },
  { label: "Resume", key: "P", action: "resume" },
  { label: "LinkedIn", key: "L", action: "linkedin" },
  { label: "GitHub", key: "G", action: "github" },
  { label: "Email", key: "E", action: "email" },
] as const

export type PortfolioSection =
  (typeof sectionShortcuts)[number] | (typeof additionalSections)[number]
export type PortfolioAction = (typeof actionShortcuts)[number]["action"]
