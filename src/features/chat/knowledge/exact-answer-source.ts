import { affiliationCatalog } from "@/lib/content/affiliations"
import { blogCatalog } from "@/lib/content/blog"
import { certificationCatalog } from "@/lib/content/certifications"
import { contributionCatalog } from "@/lib/content/contributions"
import { educationCatalog } from "@/lib/content/education"
import { experienceCatalog } from "@/lib/content/experience"
import { profileCatalog } from "@/lib/content/profile"
import { projectCaseStudyCatalog } from "@/lib/content/project-case-studies"
import { projectCatalog } from "@/lib/content/projects"
import { recommendationCatalog } from "@/lib/content/recommendations"
import { skillCatalog } from "@/lib/content/skills"
import { getCompiledPortfolioKnowledge } from "@/features/chat/knowledge/portfolio-knowledge.server"
import type { PortfolioKnowledgeFact } from "@/features/chat/knowledge/portfolio-knowledge-types"

import type {
  ExactAnswer,
  ExactAnswerCategory,
} from "@/features/chat/knowledge/exact-answer-catalog"

interface EvidenceReference {
  readonly factIds: readonly [string, ...string[]]
  readonly excerpts: readonly [string, ...string[]]
}

interface AnswerSeed {
  readonly id: string
  readonly question: string
  readonly text: string
  readonly evidence: readonly [EvidenceReference, ...EvidenceReference[]]
}

function clean(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function excerpt(value: string, maximumLength = 520): string {
  const sourceText = value.trim()
  if (sourceText.length <= maximumLength) return sourceText

  const shortened = sourceText.slice(0, maximumLength)
  const wordBoundary = shortened.lastIndexOf(" ")
  return sourceText
    .slice(0, wordBoundary > 120 ? wordBoundary : maximumLength)
    .trimEnd()
}

function sentence(value: string): string {
  const normalized = clean(value)
  return /[.!?][”'"]?$/.test(normalized) ? normalized : `${normalized}.`
}

function withoutTerminalPunctuation(value: string): string {
  return clean(value).replace(/[.!?]+$/, "")
}

function lowercaseFirst(value: string): string {
  const normalized = clean(value)
  const initialWord = normalized.match(/^[A-Za-z]+/)?.[0]
  if (
    initialWord &&
    initialWord.length > 1 &&
    initialWord === initialWord.toLocaleUpperCase()
  ) {
    return normalized
  }
  return `${normalized.charAt(0).toLocaleLowerCase()}${normalized.slice(1)}`
}

function indefiniteArticle(value: string): "a" | "an" {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a"
}

function projectTypeLabel(value: string): string {
  return value.toLocaleLowerCase() === "api" ? "API" : value
}

function quotedList(values: readonly string[]): string {
  return values
    .map((value) => `“${withoutTerminalPunctuation(value)}”`)
    .join("; ")
}

function attributedContributionSentences(values: readonly string[]): string {
  return values
    .map((value, index) => {
      const normalized = withoutTerminalPunctuation(value)
      const contribution = lowercaseFirst(normalized)
      return `${index === 0 ? "Montasim" : "He"} ${contribution}.`
    })
    .join(" ")
}

function splitSentences(value: string): readonly string[] {
  const normalized = clean(value)
  return normalized.split(/(?<=[.!?])\s+(?=[A-Z])/)
}

function reference(id: string, supportingExcerpt: string): EvidenceReference {
  const candidates = factsForReference(id)
  const normalizedSupport = clean(supportingExcerpt)
  const matchingFacts = candidates.filter((fact) => {
    const value = clean(factText(fact))
    return value.length > 0 && normalizedSupport.includes(value)
  })
  const selectedFacts = matchingFacts.length
    ? matchingFacts
    : candidates.slice(0, 16)

  if (!selectedFacts[0]) {
    throw new Error(`Exact-answer evidence reference does not resolve: ${id}`)
  }

  return {
    factIds: selectedFacts.map((fact) => fact.id) as [string, ...string[]],
    excerpts: selectedFacts.map((fact) => excerpt(factText(fact))) as [
      string,
      ...string[],
    ],
  }
}

function directFactReference(id: string): EvidenceReference {
  const fact = compiledKnowledge.findFact(id)
  if (!fact) throw new Error(`Exact-answer fact does not resolve: ${id}`)

  return {
    factIds: [fact.id],
    excerpts: [excerpt(factText(fact))],
  }
}

const compiledKnowledge = getCompiledPortfolioKnowledge()

function factText(fact: PortfolioKnowledgeFact): string {
  const compiledText = compiledKnowledge.textForFact(fact.id)
  if (!compiledText) throw new Error(`Missing compiled fact text: ${fact.id}`)
  return compiledText
}

function requiredItem<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new Error(`${context} is required`)
  return value
}

function sourceFacts(source: string, recordId: string) {
  return compiledKnowledge.facts.filter(
    (fact) => fact.source === source && fact.recordId === recordId
  )
}

function factsForReference(id: string): readonly PortfolioKnowledgeFact[] {
  if (id.startsWith("derived:")) {
    const fact = compiledKnowledge.findFact(id)
    return fact ? [fact] : []
  }

  if (id === "profile") return sourceFacts("profile", "profile")
  if (id === "contributions") {
    return sourceFacts("contributions", "github-contributions")
  }

  const [source, ...segments] = id.split(":")
  if (!source || !segments[0]) return []

  if (source === "project") return sourceFacts("projects", segments[0])
  if (source === "experience") return sourceFacts("experience", segments[0])
  if (source === "certification") {
    return sourceFacts("certifications", segments[0])
  }
  if (source === "skills") return sourceFacts("skills", segments[0])
  if (source === "education") return sourceFacts("education", segments[0])
  if (source === "organization") {
    return sourceFacts("organizations", segments[0])
  }
  if (source === "volunteering") {
    return sourceFacts("volunteering", segments[0])
  }
  if (source === "recommendation") {
    return sourceFacts("recommendations", segments.slice(1).join(":"))
  }
  if (source === "blog") {
    const recordId = segments[0]
    const directFact = compiledKnowledge.findFact(id)
    return directFact ? [directFact] : sourceFacts("blog", recordId)
  }
  if (source === "case-study") {
    const [recordId, section] = segments
    const factIds =
      section === "problem"
        ? new Set([`case-study:${recordId}`, `case-study:${recordId}:problem`])
        : new Set([`case-study:${recordId}:${section}`])
    const citedFacts = sourceFacts("casestudy", recordId).filter((fact) =>
      factIds.has(fact.id)
    )
    return citedFacts.length ? citedFacts : sourceFacts("casestudy", recordId)
  }

  return []
}

function answer(category: ExactAnswerCategory, seed: AnswerSeed): ExactAnswer {
  const factIds = Array.from(
    new Set(seed.evidence.flatMap((item) => item.factIds))
  )
  const supportingExcerpts = Array.from(
    new Set(seed.evidence.flatMap((item) => item.excerpts))
  )
  if (!factIds[0] || !supportingExcerpts[0])
    throw new Error(`Exact answer ${seed.id} requires evidence`)

  return Object.freeze({
    id: `${category}:${seed.id}`,
    category,
    question: seed.question,
    text: clean(seed.text),
    factIds: factIds as [string, ...string[]],
    supportingExcerpts: supportingExcerpts as [string, ...string[]],
  })
}

function projectReference(project: (typeof projectCatalog.records)[number]) {
  return reference(
    `project:${project.id}`,
    `${project.title} ${project.type} ${project.description} ${project.technologies.join(" ")} ${project.topics.join(" ")} ${project.githubRepositoryCreatedAt} ${project.githubInitialCommitAt}`
  )
}

function caseStudyReference(
  caseStudy: (typeof projectCaseStudyCatalog.records)[number],
  section: "problem" | "architecture" | "contribution" | "outcomes"
) {
  const source = {
    problem: `${caseStudy.problem} ${caseStudy.constraints.join(" ")}`,
    architecture: `${caseStudy.architecture.summary} ${caseStudy.decisions.map((decision) => decision.detail).join(" ")}`,
    contribution: caseStudy.contribution.join(" "),
    outcomes: caseStudy.outcomes.join(" "),
  }[section]

  return reference(`case-study:${caseStudy.slug}:${section}`, source)
}

function experienceReference(
  experience: (typeof experienceCatalog.records)[number]
) {
  return reference(
    `experience:${experience.id}`,
    `${experience.role}. ${experience.company}. ${experience.period}. ${experience.location}. ${experience.description} ${experience.technologies.join(" ")}`
  )
}

function skillReference(skill: (typeof skillCatalog.records)[number]) {
  return reference(
    `skills:${skill.id}`,
    `${skill.category} ${skill.items.join(", ")}`
  )
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function buildProjectAnswers(): readonly ExactAnswer[] {
  return projectCatalog.records.flatMap((project) => {
    const type = projectTypeLabel(project.type)
    return [
      answer("project", {
        id: `${project.id}:overview`,
        question: `What is Montasim's ${project.title} project?`,
        text: `${project.title} is documented as ${indefiniteArticle(type)} ${type} project built by Montasim. The project description states: ${sentence(project.description)} Its recorded stack includes ${project.technologies.slice(0, 6).join(", ")}. The related case study lets a hiring reviewer examine the problem, architecture, contribution, and outcomes behind this concise project record.`,
        evidence: [projectReference(project)],
      }),
      answer("project", {
        id: `${project.id}:technology`,
        question: `Which technologies did Montasim use for ${project.title}?`,
        text: `The documented stack for ${project.title} includes ${project.technologies.join(", ")}. Those technologies support the project's recorded purpose: ${sentence(project.description)} This ties the stack to a concrete product scope instead of presenting it as an isolated keyword list.`,
        evidence: [projectReference(project)],
      }),
    ]
  })
}

function buildCaseStudyAnswers(): readonly ExactAnswer[] {
  return projectCaseStudyCatalog.records.flatMap((caseStudy) => [
    answer("case-study", {
      id: `${caseStudy.slug}:problem`,
      question: `What problem did Montasim address in the ${caseStudy.project.title} case study?`,
      text: `${sentence(caseStudy.problem)} Montasim's documented role covered ${lowercaseFirst(caseStudy.role)}, with scope spanning ${lowercaseFirst(caseStudy.scope)}. Two representative constraints were ${quotedList(caseStudy.constraints.slice(0, 2))}. These conditions show what the solution had to respect beyond the visible feature request.`,
      evidence: [caseStudyReference(caseStudy, "problem")],
    }),
    answer("case-study", {
      id: `${caseStudy.slug}:architecture`,
      question: `How did Montasim structure the ${caseStudy.project.title} solution?`,
      text: `${sentence(caseStudy.architecture.summary)} One key decision, “${caseStudy.decisions[0].title},” is documented as follows: ${sentence(caseStudy.decisions[0].detail)} This shows how Montasim converts a stated constraint into an explicit system boundary instead of treating architecture as a collection of tools.`,
      evidence: [caseStudyReference(caseStudy, "architecture")],
    }),
    answer("case-study", {
      id: `${caseStudy.slug}:delivery`,
      question: `What did Montasim deliver and achieve with ${caseStudy.project.title}?`,
      text: `${attributedContributionSentences(caseStudy.contribution)} The case study records these outcomes: ${quotedList(caseStudy.outcomes)}. Together, those sections distinguish Montasim's stated contribution from the capabilities and limits recorded for the resulting system.`,
      evidence: [
        caseStudyReference(caseStudy, "contribution"),
        caseStudyReference(caseStudy, "outcomes"),
      ],
    }),
  ])
}

function buildBlogAnswers(): readonly ExactAnswer[] {
  return blogCatalog.posts.map((post) => {
    const section = requiredItem(
      post.sections.at(0),
      `First section for blog post ${post.slug}`
    )
    const overview = reference(
      `blog:${post.slug}`,
      `${post.kind} ${post.slug} ${post.projectId ?? ""} ${post.title} ${post.excerpt} ${post.category} ${post.topic} ${post.publishedAt ?? ""}`
    )
    const sectionEvidence =
      post.kind === "case-study-derived" && post.projectId
        ? [caseStudyReference(requiredCaseStudy(post.projectId), "problem")]
        : [
            reference(
              `blog:${post.slug}:${section.id}`,
              `${section.id} ${section.label} ${section.title} ${section.paragraphs.join(" ")} ${section.callout ?? ""}`
            ),
          ]

    return answer("blog", {
      id: post.slug,
      question: `What engineering insight does Montasim share in “${post.title}”?`,
      text: `In “${post.title},” Montasim opens with the section “${section.title}.” It begins: ${sentence(section.paragraphs[0])} The article gives readers his documented reasoning about an implementation trade-off rather than only repeating the project's feature summary.`,
      evidence: [overview, ...sectionEvidence],
    })
  })
}

function buildCertificationAnswers(): readonly ExactAnswer[] {
  return certificationCatalog.records.map((credential) => {
    const issuer =
      credential.issuer === credential.platform
        ? `issued by ${credential.issuer}`
        : `issued by ${credential.issuer} through ${credential.platform}`

    return answer("certification", {
      id: credential.id,
      question: `What does Montasim's “${credential.title}” credential document?`,
      text: `Montasim completed “${credential.title},” ${issuer} in ${credential.year}. The portfolio describes its focus as follows: ${sentence(credential.description)} This credential documents that stated learning activity and should not be treated as evidence beyond its published scope.`,
      evidence: [
        reference(
          `certification:${credential.id}`,
          `${credential.title}. ${credential.issuer}. ${credential.year}. ${credential.description}`
        ),
      ],
    })
  })
}

function buildExperienceAnswers(): readonly ExactAnswer[] {
  return experienceCatalog.records.flatMap((experience) => {
    const work = attributedContributionSentences(
      splitSentences(experience.description)
    )
    return [
      answer("experience", {
        id: `${experience.id}:responsibility`,
        question: `What did Montasim do as ${experience.role} at ${experience.company}?`,
        text: `Montasim held the ${experience.role} role at ${experience.company} (${experience.period}). ${work} This record scopes the stated responsibilities and outcomes to that specific stage of his career.`,
        evidence: [experienceReference(experience)],
      }),
      answer("experience", {
        id: `${experience.id}:stack`,
        question: `What skills did Montasim apply in his ${experience.role} role at ${experience.company}?`,
        text: `The role documents work with ${experience.technologies.join(", ")}. ${work} This ties the listed technologies to a specific role rather than presenting them as an isolated keyword list.`,
        evidence: [experienceReference(experience)],
      }),
    ]
  })
}

function buildSkillAnswers(): readonly ExactAnswer[] {
  return skillCatalog.records.map((group) =>
    answer("skill", {
      id: group.id,
      question: `Which ${group.category} skills does Montasim document?`,
      text: `Montasim's ${group.category} catalog includes ${group.items.join(", ")}. These are the skills explicitly published in the portfolio for this category; individual experience, projects, and case studies provide the separate evidence of where particular technologies were applied.`,
      evidence: [skillReference(group)],
    })
  )
}

const recommendationInsights: Readonly<Record<string, string>> = {
  "Shoriful Islam":
    "the reviewer describes Montasim as detail-oriented, reliable, collaborative with backend engineers, proactive about optimization, and committed to automated testing.",
  "Tabbi Quadir":
    "the reviewer describes Montasim as skilled, dedicated, proactive when addressing challenges, collaborative, and quick to learn or take on new responsibilities.",
  "Md. Tamim Tanvir, MBA":
    "the reviewer highlights Montasim's frontend-systems thinking and his ability to translate complex design systems into scalable, accessible interfaces without losing the intended user experience.",
  "Shahriar Iqbal":
    "the reviewer highlights frontend expertise, clean and maintainable code, careful problem decomposition, attention to detail, collaboration, and knowledge sharing.",
  "Mahmudul Ahsan":
    "the reviewer describes Montasim as a supportive, approachable team lead who makes difficult work easier to learn, encourages improvement, and remains willing to learn from junior colleagues.",
  "Syed Mahedi Hasen":
    "the reviewer says Montasim translated complex business requirements into practical solutions, explained the reasoning behind decisions, and helped a junior engineer deliver features with greater confidence.",
  "Md. Sazzad Hossain":
    "the reviewer credits Montasim's Next.js and TypeScript work, his contribution to WebRTC and OpenTok video calling, and his delivery of responsive, maintainable interfaces in an Agile team.",
  "Md. Rifaet Ullah":
    "the reviewer says Montasim bridged AI research and production through real-time annotated results and metric visualizations, while contributing clean code, curiosity, and collaborative delivery.",
  "Md. Rashedul Islam":
    "the reviewer credits Montasim's telemedicine frontend and AI integration, automated testing, and optimization work, including a stated 25% reduction in average diagnosis time.",
  "Imam Mahadi Hasan":
    "the reviewer highlights Montasim's ability to translate design concepts into interactive MERN applications, with careful UI execution, problem-solving, communication, and collaboration.",
  "Sakkhar Saha CSM®, SFPC™, SFC™":
    "the reviewer describes Montasim as hardworking and dedicated, with a record of completing assigned work on time and to high standards.",
  "Md. Azharul Sharif":
    "the reviewer highlights Montasim's skill, dedication, constructive attitude, and habit of looking for ways to improve product quality.",
  "Rana Hamid":
    "the reviewer describes Montasim as knowledgeable about an emerging AI-healthcare stack, willing to learn unfamiliar approaches, collaborative, and strong in written and verbal communication.",
  "Abu Saleh Musa Miah":
    "the reviewer credits Montasim's leadership on student projects involving driver-drowsiness and hand-pose detection, and describes him as supportive, transparent, honest, and positive under stress.",
  "Abid Hasan":
    "the reviewer highlights Montasim's programming and creative ability, positive attitude, and hardworking approach.",
  "Md. Mahmudul Haque Joy":
    "the reviewer describes Montasim as hardworking, a fast learner, and technically inclined.",
}

function buildRecommendationAnswers(): readonly ExactAnswer[] {
  return recommendationCatalog.records.map((recommendation, index) =>
    answer("recommendation", {
      id: `${index}:${slug(recommendation.name)}`,
      question: `What professional feedback did ${recommendation.name} give about Montasim?`,
      text: `The portfolio records that ${recommendation.name} ${recommendation.relationship}. In attributed feedback, ${requiredItem(recommendationInsights[recommendation.name], `Recommendation insight for ${recommendation.name}`)} This is qualitative evidence about observed work and collaboration; it is not used to prove unrelated technical claims.`,
      evidence: [recommendationReference(recommendation.name)],
    })
  )
}

const organizationInsights: Readonly<Record<string, string>> = {
  "organization-bncc":
    "The record notes recognition as Second Best Cadet, participation in multiple cadet training exercises, and shortlisting for a Sri Lanka tour. It connects the experience to leadership, teamwork, and discipline.",
  "organization-baust-career-club":
    "The record notes participation in career programs, workshops, and professional networking, along with collaboration on career-focused student activities. It connects that involvement to communication, leadership, and teamwork.",
  "organization-baust-programming-club":
    "The record notes programming contests, coding-practice sessions, technical workshops, and collaborative study of algorithms and data structures. It connects that involvement to problem-solving and analytical thinking.",
}

const volunteeringInsights: Readonly<Record<string, string>> = {
  "volunteering-carmichael-event-organizer":
    "The record covers student and staff events, Iftar gatherings, educational tours, volunteer-team leadership, and budget management.",
  "volunteering-rangpur-zilla-school-event-organizer":
    "The record covers annual Iftar and class events, event-budget responsibility, and coordination with volunteer teams.",
}

function buildAffiliationAnswers(): readonly ExactAnswer[] {
  const education = educationCatalog.records.map((record) =>
    answer("affiliation", {
      id: record.id,
      question: `What did Montasim study at ${record.institution}?`,
      text: `Montasim's education record lists a ${record.degree} at ${record.institution} (${record.period}). It records that he ${lowercaseFirst(record.details)} ${record.highlights.join(" ")} This establishes the educational foundation documented by the portfolio.`,
      evidence: [
        reference(
          `education:${record.id}`,
          `${record.institution} ${record.degree}. ${record.period}. ${record.details} ${record.highlights.join(" ")}`
        ),
      ],
    })
  )

  const organizations = affiliationCatalog.organizations.map((record) =>
    answer("affiliation", {
      id: record.id,
      question: `How was Montasim involved with ${record.name}?`,
      text: `Montasim's documented role with ${record.name} was ${record.role}, associated with ${record.associatedWith}, during ${record.period || "the period documented in the portfolio"}. ${requiredItem(organizationInsights[record.id], `Organization insight for ${record.id}`)} This adds evidence of his activities beyond formal software roles.`,
      evidence: [
        reference(
          `organization:${record.id}`,
          `${record.name} ${record.role} ${record.period} ${record.associatedWith} ${record.description}`
        ),
      ],
    })
  )

  const volunteering = affiliationCatalog.volunteering.map((record) =>
    answer("affiliation", {
      id: record.id,
      question: `What volunteering did Montasim do with ${record.organization}?`,
      text: `Montasim volunteered as ${record.role} with ${record.organization} during ${record.period} in ${record.location}. ${requiredItem(volunteeringInsights[record.id], `Volunteering insight for ${record.id}`)} This documents hands-on coordination, teamwork, and delivery outside his paid engineering experience.`,
      evidence: [
        reference(
          `volunteering:${record.id}`,
          `${record.organization} ${record.role} ${record.period} ${record.location} ${record.description}`
        ),
      ],
    })
  )

  return [...education, ...organizations, ...volunteering]
}

function requiredExperience(id: string) {
  const record = experienceCatalog.records.find((item) => item.id === id)
  if (!record) throw new Error(`Missing experience record: ${id}`)
  return record
}

function requiredProject(id: string) {
  const record = projectCatalog.records.find((item) => item.id === id)
  if (!record) throw new Error(`Missing project record: ${id}`)
  return record
}

function requiredCaseStudy(projectId: string) {
  const record = projectCaseStudyCatalog.findByProjectId(projectId)
  if (!record) throw new Error(`Missing case study for project: ${projectId}`)
  return record
}

function requiredSkill(id: string) {
  const record = skillCatalog.records.find((item) => item.id === id)
  if (!record) throw new Error(`Missing skill record: ${id}`)
  return record
}

function requiredBlogPost(postSlug: string) {
  const post = blogCatalog.find(postSlug)
  if (!post) throw new Error(`Missing blog record: ${postSlug}`)
  return post
}

function recommendationReference(name: string) {
  const record = recommendationCatalog.records.find(
    (candidate) => candidate.name === name
  )
  if (!record) throw new Error(`Missing recommendation from: ${name}`)
  const index = recommendationCatalog.records.indexOf(record)

  return reference(
    `recommendation:${index}:${slug(record.name)}`,
    `${record.name} ${record.role} ${record.relationship} ${record.date} ${record.text}`
  )
}

const seniorExperience = requiredExperience(
  "experience-mymedicalhub-senior-software-engineer"
)
const softwareExperience = requiredExperience(
  "experience-mymedicalhub-software-engineer"
)
const juniorExperience = requiredExperience(
  "experience-mymedicalhub-junior-software-engineer"
)
const multiversalExperience = requiredExperience(
  "experience-multiversal-junior-frontend-developer"
)
const codezExperience = requiredExperience("experience-codez-web-developer")
const postcraft = requiredProject("project-postcraft")
const postcraftCaseStudy = requiredCaseStudy(postcraft.id)
const thoughtline = requiredProject("project-thoughtline")
const thoughtlineCaseStudy = requiredCaseStudy(thoughtline.id)
const devtools = requiredProject("project-devtools")
const devtoolsCaseStudy = requiredCaseStudy(devtools.id)
const foliofarer = requiredProject("project-foliofarer")
const foliofarerCaseStudy = requiredCaseStudy(foliofarer.id)
const companyResearch = requiredProject("project-b4joinacompany")
const companyResearchCaseStudy = requiredCaseStudy(companyResearch.id)
const tinAuditChecker = requiredProject("project-tin-audit-checker")
const tinAuditCaseStudy = requiredCaseStudy(tinAuditChecker.id)
const locationRegistry = requiredProject("project-bangladesh-location-registry")
const locationRegistryCaseStudy = requiredCaseStudy(locationRegistry.id)
const educanvas = requiredProject("project-educanvas")
const educanvasCaseStudy = requiredCaseStudy(educanvas.id)
const frontendSkills = requiredSkill("skills-frontend")
const backendSkills = requiredSkill("skills-backend-apis")
const databaseSkills = requiredSkill("skills-databases")
const aiSkills = requiredSkill("skills-ai-agents")
const browserSkills = requiredSkill("skills-browser-extensions")
const cloudSkills = requiredSkill("skills-cloud-devops")
const testingSkills = requiredSkill("skills-testing-quality")
const designSkills = requiredSkill("skills-design-collaboration")
const realTimeSkills = requiredSkill("skills-realtime-vision")
const architectureSkills = requiredSkill("skills-architecture-security")
const { profile } = profileCatalog
const biometricArchitectureArticle = requiredBlogPost(
  "from-useeffect-chaos-to-deterministic-systems"
)

const profileReference = reference(
  "profile",
  `${profile.name} ${profile.title} ${profile.tagline} ${profile.location} ${profile.email} ${profile.workPreferences.availability} ${profile.workPreferences.preferredRoles.join(" ")} ${profile.workPreferences.workArrangement} ${profile.workPreferences.timeZone} ${profile.workPreferences.earliestStartDate} ${profile.socialLinks.map((link) => `${link.platform} ${link.url} ${link.label}`).join(" ")} ${profile.about}`
)
const biometricArticleReference = reference(
  `blog:${biometricArchitectureArticle.slug}`,
  `${biometricArchitectureArticle.title} ${biometricArchitectureArticle.excerpt} ${biometricArchitectureArticle.sections.flatMap((section) => [section.title, ...section.paragraphs, section.callout ?? ""]).join(" ")}`
)

function buildIdentityAnswers(): readonly ExactAnswer[] {
  const current = experienceReference(seniorExperience)
  const seeds: readonly AnswerSeed[] = [
    {
      id: "current-role",
      question: "Which role does Montasim hold now, and what work defines it?",
      text: `Montasim is currently a Senior Software Engineer at MyMedicalHub International Ltd., a role documented from October 2025 to the present. His current work includes deterministic biometric analysis, 60 FPS pose estimation, real-time rep counting, and a large medical-chatbot refactor, giving the title concrete production scope.`,
      evidence: [current],
    },
    {
      id: "introduction",
      question: "How would you introduce Montasim to a hiring team?",
      text: `Montasim is a Dhaka-based Senior Software Engineer with 3+ years of documented experience building real-time, AI-driven, multi-tenant SaaS across React, Next.js, Node.js, and TypeScript. He has been promoted twice at MyMedicalHub and now owns frontend architecture, leads PR reviews, and mentors engineers.`,
      evidence: [profileReference, current],
    },
    {
      id: "headline",
      question: "What professional headline best describes Montasim?",
      text: `${profile.title}. That headline is supported by current senior-level healthcare SaaS work involving real-time computer vision, deterministic state architecture, TypeScript, React, Redux Toolkit, MediaPipe, and Microsoft Azure.`,
      evidence: [profileReference, current],
    },
    {
      id: "location",
      question: "Where is Montasim based?",
      text: `Montasim is based in ${profile.location} and works in the ${profile.workPreferences.timeZone} time zone. His portfolio makes the location explicit so recruiters and clients can evaluate working arrangements and scheduling with reliable public information.`,
      evidence: [profileReference],
    },
    {
      id: "availability",
      question: "Is Montasim currently open to a new role?",
      text: `Yes. Montasim's portfolio lists his availability as “${profile.workPreferences.availability}” and his earliest start date as “${profile.workPreferences.earliestStartDate}.” Hiring teams can use the portfolio contact options to discuss a specific role, timeline, and process directly.`,
      evidence: [profileReference],
    },
    {
      id: "preferred-role",
      question: "Which roles is Montasim seeking?",
      text: `Montasim explicitly lists ${profile.workPreferences.preferredRoles.join(", ")} as his preferred role. His present title, promotion history, architecture ownership, measured production outcomes, PR leadership, and mentoring provide the strongest portfolio evidence for that level.`,
      evidence: [profileReference, current],
    },
    {
      id: "work-arrangement",
      question: "Which work arrangements can Montasim consider?",
      text: `Montasim's stated preference is ${profile.workPreferences.workArrangement}. The portfolio does not narrow that public preference further, so details such as office cadence or team-hour expectations should be confirmed with him for the specific opportunity.`,
      evidence: [profileReference],
    },
    {
      id: "timezone",
      question: "What time zone does Montasim work from?",
      text: `Montasim lists ${profile.workPreferences.timeZone} as his time zone and ${profile.location} as his location. No fixed overlap window is published, so a hiring manager should confirm the required collaboration hours directly rather than assume them.`,
      evidence: [profileReference],
    },
    {
      id: "start-date",
      question: "When could Montasim start a new position?",
      text: `The public work-preference record lists Montasim's earliest start date as “${profile.workPreferences.earliestStartDate}.” A specific joining date can depend on the opportunity and hiring process, so the portfolio contact channel is the right place to confirm it.`,
      evidence: [profileReference],
    },
    {
      id: "core-stack",
      question: "What is Montasim's core engineering stack?",
      text: `Montasim's profile centers on React, Next.js, Node.js, and TypeScript. His published skill catalog expands that into frontend architecture, backend APIs, databases, AI providers, testing, cloud delivery, browser extensions, real-time systems, and security-oriented system design.`,
      evidence: [
        profileReference,
        skillReference(frontendSkills),
        skillReference(backendSkills),
      ],
    },
    {
      id: "specialization",
      question: "What kind of software does Montasim specialize in?",
      text: `Montasim specializes in production web platforms where real-time behavior, AI integration, multi-tenant SaaS, and dependable frontend architecture matter. His healthcare work documents deterministic state transitions, 60 FPS computer vision, reliable WebRTC, performance optimization, and security controls rather than demo-only AI features.`,
      evidence: [
        profileReference,
        current,
        experienceReference(juniorExperience),
      ],
    },
    {
      id: "full-stack-scope",
      question: "Is Montasim only a frontend engineer?",
      text: `No. Frontend architecture is a documented strength, but the portfolio describes full-stack work with React, Next.js, Node.js, TypeScript, Express, PostgreSQL, MongoDB, authentication, APIs, queues, cloud deployment, and CI/CD. His project and role records show those technologies attached to delivered systems.`,
      evidence: [
        profileReference,
        skillReference(frontendSkills),
        skillReference(backendSkills),
        skillReference(databaseSkills),
      ],
    },
    {
      id: "engineering-philosophy",
      question: "How does Montasim describe his engineering approach?",
      text: `Montasim says he builds software to survive production rather than only the happy path. His stated approach prioritizes predictable state transitions, resilient lifecycles, and async workflows that do not leak, stall, or surprise users; the FSM biometric engine is direct experience evidence of that philosophy.`,
      evidence: [profileReference, current],
    },
    {
      id: "career-level",
      question: "What evidence supports Montasim's senior title?",
      text: `The portfolio documents a Senior Software Engineer role, two promotions at MyMedicalHub, ownership of frontend architecture, PR-review leadership, and mentoring. Delivery evidence includes a 99.9%-reliable biometric engine, 60 FPS pose analysis, 40% performance improvement, 70% cloud-cost reduction, and a 54+ module refactor.`,
      evidence: [
        profileReference,
        current,
        experienceReference(softwareExperience),
      ],
    },
    {
      id: "contact",
      question: "How can a recruiter contact Montasim?",
      text: `Recruiters can contact Montasim through the portfolio's email, LinkedIn, WhatsApp, or inquiry flow. The published email is ${profile.email}; using a direct channel is especially appropriate for role-specific questions that the public portfolio does not document.`,
      evidence: [profileReference],
    },
  ]

  return seeds.map((seed) => answer("identity-current-availability", seed))
}

function buildCareerImpactAnswers(): readonly ExactAnswer[] {
  const senior = experienceReference(seniorExperience)
  const software = experienceReference(softwareExperience)
  const junior = experienceReference(juniorExperience)
  const seeds: readonly AnswerSeed[] = [
    {
      id: "current-delivery",
      question: "What is Montasim delivering in his present position?",
      text: `In his present Senior Software Engineer role, Montasim architected an FSM-based biometric engine that reached 99.9% reliability, optimized pose estimation and rep counting for 60 FPS, led a Redux Toolkit rewrite of a medical assessment chatbot, and refactored more than 54 modules into a Presentational/Container pattern.`,
      evidence: [senior],
    },
    {
      id: "latest-professional-work",
      question: "What is Montasim's latest documented professional work?",
      text: `The latest professional record is his Senior Software Engineer role at MyMedicalHub, beginning in October 2025 and continuing at present. Its documented work combines deterministic biometric state management, real-time computer vision, rep counting, Redux Toolkit, and a 54+ module architecture refactor.`,
      evidence: [senior],
    },
    {
      id: "measured-results",
      question: "Which measured engineering results has Montasim produced?",
      text: `Montasim's role records document 99.9% reliability for live AI analysis, 60 FPS pose estimation, 40% better application performance, 70% lower Azure infrastructure cost, 25% faster patient diagnosis, and 95% AI-analysis accuracy. These metrics span reliability, speed, cost, and user-facing healthcare impact.`,
      evidence: [senior, software, junior],
    },
    {
      id: "biometric-reliability",
      question: "How did Montasim improve reliability in biometric analysis?",
      text: `Montasim replaced unstable React hooks with a finite-state-machine biometric engine using deterministic state transitions. The current-role record attributes 99.9% reliability during AI analysis to that architecture, showing a concrete move from fragile event behavior to explicit system states.`,
      evidence: [senior],
    },
    {
      id: "pose-performance",
      question:
        "What real-time performance did Montasim achieve for pose analysis?",
      text: `Montasim optimized the AI pipeline to sustain 60 FPS pose estimation with real-time rep counting through adaptive frame-rate logic. That is documented production work in his current role and pairs throughput with the 99.9% reliability result from the biometric engine.`,
      evidence: [senior],
    },
    {
      id: "chatbot-refactor",
      question: "What was the scale of Montasim's medical-chatbot refactor?",
      text: `Montasim led a full rewrite of the medical assessment chatbot with Redux Toolkit and refactored more than 54 modules into a Presentational/Container pattern. The record shows both state-management ownership and deliberate restructuring of a substantial existing frontend codebase.`,
      evidence: [senior],
    },
    {
      id: "application-performance",
      question: "How did Montasim improve application performance?",
      text: `As a Software Engineer at MyMedicalHub, Montasim removed legacy UI libraries and optimized React rendering cycles, producing a documented 40% application-performance improvement. His profile also records Lighthouse scores above 90 from replacing legacy libraries with custom components.`,
      evidence: [software, profileReference],
    },
    {
      id: "cloud-cost",
      question: "How did Montasim reduce cloud infrastructure cost?",
      text: `Montasim migrated Azure virtual machines to App Service and automated CI/CD pipelines, producing a documented 70% infrastructure-cost reduction. This is strong evidence that his engineering decisions consider operational economics as well as application code.`,
      evidence: [software],
    },
    {
      id: "healthcare-security",
      question:
        "What security work has Montasim delivered in healthcare software?",
      text: `Montasim deployed a HIPAA-compliant SSO system with multi-role access, OAuth integration, and strict Content Security Policy headers. Earlier, he built a JWT-based REST API client layer with XSS and CSRF protections, giving his healthcare experience both identity and browser-security depth.`,
      evidence: [software, junior],
    },
    {
      id: "early-ai-integration",
      question: "What impact did Montasim's earlier AI integration have?",
      text: `In his Junior Software Engineer role, Montasim integrated real-time AI analysis and custom algorithms that the portfolio says reduced patient diagnosis time by 25% while achieving 95% accuracy. It is an early example of tying AI integration to a measured healthcare workflow outcome.`,
      evidence: [junior],
    },
    {
      id: "diagnosis-outcome",
      question: "Did Montasim's work affect patient diagnosis time?",
      text: `Yes. The MyMedicalHub Junior Software Engineer record states that his real-time AI analysis and custom algorithms reduced patient diagnosis time by 25% and achieved 95% accuracy. The claim is scoped to that documented work rather than generalized to every healthcare product.`,
      evidence: [junior],
    },
    {
      id: "video-consultation",
      question: "What did Montasim contribute to remote consultations?",
      text: `Montasim integrated a WebRTC video pipeline that stabilized remote consultations and reduced call latency. A colleague recommendation also attributes a pivotal role in the telemedicine video-calling application and experience with WebRTC and OpenTok for virtual appointments and supervised exercises.`,
      evidence: [junior, recommendationReference("Md. Sazzad Hossain")],
    },
    {
      id: "promotion-evidence",
      question: "How has Montasim progressed at MyMedicalHub?",
      text: `The records show a continuous progression from Junior Software Engineer to Software Engineer and then Senior Software Engineer at MyMedicalHub. His profile summarizes that as two promotions, while the role descriptions show increasing scope from AI and WebRTC integration to performance, cloud, security, architecture, and mentoring.`,
      evidence: [profileReference, junior, software, senior],
    },
    {
      id: "career-trajectory",
      question: "What does Montasim's career trajectory show?",
      text: `Montasim moved from PHP and JavaScript client delivery into React telemedicine, then real-time healthcare AI, cloud and security optimization, and finally senior frontend architecture. The progression is documented through successive roles and measurable outcomes rather than inferred from titles alone.`,
      evidence: [
        experienceReference(codezExperience),
        experienceReference(multiversalExperience),
        junior,
        software,
        senior,
      ],
    },
    {
      id: "company-tenure",
      question:
        "What has Montasim accomplished across his MyMedicalHub tenure?",
      text: `Across three MyMedicalHub roles, Montasim delivered real-time AI analysis, WebRTC consultation infrastructure, security controls, a 40% performance gain, a 70% Azure-cost reduction, deterministic biometric processing at 99.9% reliability, 60 FPS pose analysis, and a 54+ module chatbot refactor.`,
      evidence: [junior, software, senior],
    },
    {
      id: "complex-professional-work",
      question:
        "Which professional assignment best demonstrates Montasim's technical complexity?",
      text: `His current healthcare biometric work is the clearest documented example: he replaced unstable hooks with a deterministic finite-state machine, reached 99.9% reliability, sustained 60 FPS pose estimation with rep counting, and restructured a medical chatbot across more than 54 modules. It combines state, real-time AI, performance, and maintainability.`,
      evidence: [senior],
    },
    {
      id: "highest-signal-outcomes",
      question:
        "Which small set of outcomes best represents Montasim's career impact?",
      text: `A high-signal set is 99.9% reliable live AI analysis at 60 FPS, 40% better application performance, 70% lower Azure infrastructure cost, and 25% faster diagnosis at 95% accuracy. Together they demonstrate production reliability, performance engineering, cost ownership, and healthcare impact.`,
      evidence: [senior, software, junior],
    },
    {
      id: "top-tenth-interpretation",
      question:
        "What belongs in the strongest tenth of Montasim's documented outcomes?",
      text: `The portfolio does not publish a formal percentile ranking, but the most defensible highlights are the FSM biometric engine at 99.9% reliability and 60 FPS, the 70% Azure-cost reduction, the 40% performance improvement, and the 25% diagnosis-time reduction at 95% accuracy. Those are his clearest measured production outcomes.`,
      evidence: [senior, software, junior],
    },
    {
      id: "real-time-systems",
      question: "What real-time systems has Montasim worked on professionally?",
      text: `His professional record covers real-time MediaPipe pose analysis, rep counting, biometric assessment, AI result visualization, and WebRTC consultations. The documented outcomes include 60 FPS processing, 99.9% reliability, stabilized calls, lower latency, and faster diagnosis.`,
      evidence: [senior, junior, recommendationReference("Md. Rifaet Ullah")],
    },
    {
      id: "frontend-ownership",
      question: "What frontend ownership has Montasim demonstrated?",
      text: `Montasim's profile says he owns frontend architecture across a multi-service platform, leads PR reviews, and mentors engineers. His current role adds a Redux Toolkit chatbot rewrite, deterministic biometric state architecture, and a Presentational/Container refactor spanning more than 54 modules.`,
      evidence: [profileReference, senior],
    },
    {
      id: "production-resilience",
      question: "How has Montasim made production behavior more predictable?",
      text: `The strongest example is replacing unstable React-hook coordination with explicit finite-state transitions for biometric analysis, reaching 99.9% reliability. His broader profile describes the same discipline as building resilient lifecycles and async workflows that do not leak, stall, or surprise users.`,
      evidence: [senior, profileReference, biometricArticleReference],
    },
    {
      id: "performance-range",
      question:
        "Does Montasim optimize both frontend and infrastructure performance?",
      text: `Yes. His portfolio documents a 40% application-performance gain from removing legacy UI libraries and optimizing React rendering, Lighthouse scores above 90 with custom components, 60 FPS AI pose analysis, and a 70% infrastructure-cost reduction through Azure App Service and CI/CD.`,
      evidence: [profileReference, software, senior],
    },
    {
      id: "role-comparison",
      question:
        "How did Montasim's responsibilities expand between his three MyMedicalHub roles?",
      text: `The Junior role centered on real-time AI, WebRTC, and a protected API client; the Software Engineer role added performance, Azure cost, CI/CD, SSO, and CSP ownership; the Senior role added deterministic architecture, 60 FPS computer vision, chatbot leadership, and a 54+ module refactor.`,
      evidence: [junior, software, senior],
    },
    {
      id: "business-value",
      question:
        "Where has Montasim connected engineering work to business value?",
      text: `His records connect engineering to 70% lower infrastructure cost, 40% better application performance, 25% faster diagnosis, 95% accuracy, and more reliable real-time analysis. Those results address operating cost, user experience, workflow speed, and platform trust rather than technology adoption alone.`,
      evidence: [senior, software, junior],
    },
    {
      id: "bounded-early-work",
      question:
        "What is an example of Montasim succeeding on a focused early-career scope?",
      text: `At Multiversal, Montasim built and maintained responsive React UI components for a telemedicine platform, debugged frontend code, and reduced page-load time. It is a narrower scope than his current architecture work, but it shows disciplined user-interface delivery and performance improvement early in his career.`,
      evidence: [experienceReference(multiversalExperience)],
    },
  ]

  return seeds.map((seed) => answer("career-impact-metrics", seed))
}

function buildHiringFitAnswers(): readonly ExactAnswer[] {
  const senior = experienceReference(seniorExperience)
  const software = experienceReference(softwareExperience)
  const junior = experienceReference(juniorExperience)
  const designRecommendation = recommendationReference("Md. Tamim Tanvir, MBA")
  const managerRecommendation = recommendationReference("Tabbi Quadir")
  const mentorRecommendation = recommendationReference("Mahmudul Ahsan")
  const seeds: readonly AnswerSeed[] = [
    {
      id: "senior-case",
      question:
        "Why should a hiring manager consider Montasim for a senior engineering role?",
      text: `Montasim combines documented progression with measurable production ownership: two promotions at MyMedicalHub, frontend architecture leadership, PR reviews, mentoring, 99.9% reliable real-time AI at 60 FPS, a 40% performance gain, and a 70% cloud-cost reduction. That mix makes him a strong evidence-backed senior candidate for complex product teams.`,
      evidence: [profileReference, senior, software],
    },
    {
      id: "senior-frontend-fit",
      question: "What makes Montasim a strong senior frontend candidate?",
      text: `His frontend case goes beyond component delivery: he owns architecture, replaced unstable hook coordination with a deterministic FSM, led a Redux Toolkit chatbot rewrite, refactored 54+ modules, improved application performance by 40%, and earned colleague recognition for scalable, accessible implementation of complex design systems.`,
      evidence: [profileReference, senior, software, designRecommendation],
    },
    {
      id: "full-stack-fit",
      question: "What supports hiring Montasim for a full-stack position?",
      text: `Montasim's strongest depth is frontend architecture, while his documented stack also covers Node.js, Express, PostgreSQL, MongoDB, authentication, REST APIs, queues, cloud deployment, and CI/CD. Projects such as PostCraft add scheduled publishing, provider integration, persistent workflows, and multi-platform product logic to that full-stack profile.`,
      evidence: [
        profileReference,
        skillReference(backendSkills),
        skillReference(databaseSkills),
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "ai-product-fit",
      question: "Would Montasim fit a team building AI-enabled products?",
      text: `Yes. He has production evidence across real-time healthcare AI, MediaPipe pose analysis, AI result visualization, Gemini-, Groq-, and OpenRouter-backed projects, and provider-aware product architecture. Crucially, his work emphasizes deterministic control, user trust, and provider boundaries rather than treating model output as automatically reliable.`,
      evidence: [
        senior,
        junior,
        skillReference(aiSkills),
        projectReference(thoughtline),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "healthcare-fit",
      question: "Why is Montasim relevant to healthcare software teams?",
      text: `Montasim has multi-year healthcare-platform experience spanning telemedicine UI, WebRTC consultations, real-time AI analysis, biometric assessment, medical chat, HIPAA-compliant SSO, role-based access, OAuth, CSP, and patient-workflow improvements. His documented results combine reliability, security, performance, and measurable diagnosis-time impact.`,
      evidence: [senior, software, junior],
    },
    {
      id: "saas-fit",
      question:
        "What evidence makes Montasim suitable for a SaaS platform team?",
      text: `His profile documents multi-tenant SaaS experience and ownership across a multi-service platform. The supporting work covers authentication, role-based access, frontend architecture, async workflows, cloud migration, CI/CD, performance, scheduled delivery, and maintainable component boundaries—concerns that persist beyond a single screen or feature.`,
      evidence: [
        profileReference,
        senior,
        software,
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "product-engineering-fit",
      question:
        "Does Montasim show product thinking as well as technical depth?",
      text: `Yes. His case studies frame problems in terms of user control, trust, privacy, operating constraints, and maintainability. Examples include keeping LinkedIn publishing manual in Thoughtline, keeping tax-ID lookup client-side, and designing scheduled publishing so delivery survives beyond an open browser request.`,
      evidence: [
        caseStudyReference(thoughtlineCaseStudy, "problem"),
        caseStudyReference(tinAuditCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "reliability-fit",
      question: "Why would Montasim suit a reliability-sensitive product?",
      text: `His portfolio repeatedly makes failure behavior explicit: a 99.9%-reliable FSM biometric engine, resilient async-workflow principles, read-only release verification, provider trust boundaries, and durable scheduled publishing. That record shows reliability as an architectural concern rather than an after-the-fact test phase.`,
      evidence: [
        profileReference,
        senior,
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "performance-fit",
      question: "What makes Montasim useful on a performance-sensitive team?",
      text: `Montasim has documented performance outcomes at several layers: 60 FPS real-time pose estimation, 40% better application performance, Lighthouse scores above 90, reduced frontend load time, and a 70% infrastructure-cost reduction. He can discuss rendering, runtime behavior, asset or library choices, and deployment economics through these concrete examples.`,
      evidence: [
        senior,
        software,
        profileReference,
        experienceReference(multiversalExperience),
      ],
    },
    {
      id: "cost-aware-fit",
      question: "Does Montasim demonstrate cost-conscious engineering?",
      text: `Yes. He achieved a documented 70% infrastructure-cost reduction by moving Azure VMs to App Service and automating CI/CD. That outcome shows he can connect architecture and deployment choices to operating cost, not only developer preference.`,
      evidence: [software],
    },
    {
      id: "security-fit",
      question:
        "What evidence supports Montasim for security-conscious web work?",
      text: `Montasim has delivered HIPAA-compliant SSO with multi-role access, OAuth, and strict CSP headers, plus a JWT API client with XSS and CSRF protection. His browser-extension case studies also distinguish untrusted page content, local credentials, permissions, and model providers as separate trust boundaries.`,
      evidence: [
        software,
        junior,
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "architecture-fit",
      question: "How strong is Montasim's architecture evidence?",
      text: `The evidence spans deterministic state machines, Presentational/Container refactoring, multi-service frontend ownership, modular-monolith decisions, durable job workflows, browser-extension trust boundaries, and explicit lifecycle models. These are documented decisions with constraints and outcomes, not a standalone “system design” label.`,
      evidence: [
        profileReference,
        senior,
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(companyResearchCaseStudy, "architecture"),
      ],
    },
    {
      id: "technical-lead-fit",
      question: "Could Montasim contribute as a technical lead?",
      text: `The portfolio supports technical-lead potential through current architecture ownership, PR-review leadership, mentoring, a large chatbot rewrite, and colleague accounts of clear decision explanations and practical guidance. The exact people-management scope is not published, so that dimension should be calibrated in interview.`,
      evidence: [
        profileReference,
        senior,
        mentorRecommendation,
        recommendationReference("Syed Mahedi Hasen"),
      ],
    },
    {
      id: "mentoring-fit",
      question: "What evidence shows Montasim can mentor other engineers?",
      text: `Montasim states that he mentors engineers, and two direct colleague accounts add detail: one describes him as a supportive, approachable first team lead; another says his guidance on complex requirements and codebase challenges improved successful delivery and confidence.`,
      evidence: [
        profileReference,
        mentorRecommendation,
        recommendationReference("Syed Mahedi Hasen"),
      ],
    },
    {
      id: "cross-functional-fit",
      question:
        "How does Montasim work across design, product, and engineering?",
      text: `A senior product designer says Montasim translated complex design systems into scalable, accessible, production-ready interfaces without losing UX intent. Engineering recommendations also describe effective backend and AI-team collaboration, clear technical explanations, and attention to how decisions affect usability and long-term scalability.`,
      evidence: [
        designRecommendation,
        recommendationReference("Md. Sazzad Hossain"),
        recommendationReference("Md. Rifaet Ullah"),
      ],
    },
    {
      id: "client-project-fit",
      question: "Why might a client choose Montasim for a complex web product?",
      text: `Montasim can show product records that cover discovery constraints, architecture, implementation, and verifiable outcomes across SaaS, AI, browser extensions, data products, packages, and developer tools. His earlier Codez role also explicitly records analyzing client needs, implementing functionality, and executing test scenarios.`,
      evidence: [
        experienceReference(codezExperience),
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "startup-fit",
      question: "What makes Montasim relevant to a fast-moving startup?",
      text: `His portfolio shows breadth without losing delivery discipline: frontend and backend work, AI-provider integration, product experiments, CI/CD, cloud-cost ownership, and a broad independent-project record. The strongest evidence is his ability to turn ambiguous product constraints into explicit boundaries and testable outcomes.`,
      evidence: [
        profileReference,
        software,
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "enterprise-fit",
      question: "What makes Montasim relevant to an enterprise platform?",
      text: `His professional work includes multi-service healthcare SaaS, HIPAA-compliant SSO, multi-role access, OAuth, CSP, Azure migration, CI/CD, large-module refactoring, deterministic state, and formal PR review. Those records speak directly to security, maintainability, operational cost, and cross-team change.`,
      evidence: [profileReference, senior, software],
    },
    {
      id: "distributed-arrangement",
      question: "Can Montasim be considered for remote or hybrid work?",
      text: `Yes. His published preference explicitly allows remote, on-site, or hybrid work from Dhaka in UTC+6. The portfolio does not state a fixed overlap window, so a recruiter should align collaboration hours directly for the specific team.`,
      evidence: [profileReference],
    },
    {
      id: "ambiguity-handling",
      question: "How does Montasim approach ambiguous engineering problems?",
      text: `His case studies start by separating the visible feature from underlying constraints, then document boundaries, decisions, contribution, and outcomes. Thoughtline distinguishes page input, providers, credentials, and publish control; PostCraft separates request-time editing from durable scheduling. That is strong evidence of structured ambiguity reduction.`,
      evidence: [
        caseStudyReference(thoughtlineCaseStudy, "problem"),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "quality-discipline",
      question: "What evidence shows Montasim values engineering quality?",
      text: `The record includes automated testing, PR reviews, deterministic state, strict validation boundaries, performance measurement, and case studies that state limitations instead of hiding them. A QA colleague also describes clean, maintainable code, attention to detail, structured problem-solving, and consistent high-quality delivery.`,
      evidence: [
        profileReference,
        senior,
        recommendationReference("Shahriar Iqbal"),
      ],
    },
    {
      id: "learning-velocity",
      question: "How does Montasim keep his skills current?",
      text: `His portfolio combines 47 published credentials, an active technical-skill catalog, recent AI-agent and project work, and colleague feedback describing continuous learning and experimentation. This supports learning discipline, while the project and experience records show where knowledge moved into delivered systems.`,
      evidence: [
        profileReference,
        mentorRecommendation,
        reference(
          "contributions",
          String(contributionCatalog.totalContributions)
        ),
      ],
    },
    {
      id: "core-strengths",
      question: "What are Montasim's strongest documented capabilities?",
      text: `His strongest evidence clusters around frontend architecture, real-time and AI-driven systems, deterministic state management, performance engineering, cloud-cost optimization, healthcare security, and product-aware system design. Leadership evidence adds PR reviews, mentoring, and effective design-engineering collaboration.`,
      evidence: [profileReference, senior, software, designRecommendation],
    },
    {
      id: "standout-evidence",
      question: "What makes Montasim stand out in the portfolio evidence?",
      text: `The differentiator is the combination of measurable delivery and explicit engineering judgment: 99.9% reliable AI analysis at 60 FPS, 70% lower cloud cost, 40% better application performance, deterministic architecture, and case studies that explain trust, lifecycle, and failure boundaries.`,
      evidence: [
        senior,
        software,
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "weakness-due-diligence",
      question:
        "How should a hiring manager assess Montasim's development areas?",
      text: `The public portfolio does not document a verified personal weakness, so inventing one would be misleading. Useful interview diligence is to calibrate the scale of his architecture ownership, the team and stakeholder scope behind current leadership, and how he would transfer his healthcare and frontend depth into the hiring team's domain.`,
      evidence: [profileReference, senior],
    },
    {
      id: "scale-validation",
      question: "What scope should an interviewer validate with Montasim?",
      text: `Validate the exact size and boundaries of the multi-service platform he owns, the number and seniority of engineers he mentors, and his decision authority across product and backend teams. The portfolio establishes architecture ownership, PR reviews, mentoring, and a 54+ module refactor, but does not publish those organizational details.`,
      evidence: [profileReference, senior],
    },
    {
      id: "private-details",
      question:
        "What hiring details are not available in Montasim's public portfolio?",
      text: `The portfolio does not publish compensation expectations, visa status, relocation position, a fixed time-zone overlap window, or detailed notice-period terms. It does publish active availability, a Senior Software Engineer preference, flexible work arrangements, UTC+6, and an “Immediately” earliest-start entry; private details should be discussed directly.`,
      evidence: [profileReference],
    },
    {
      id: "candidate-comparison",
      question: "Is Montasim better than another candidate?",
      text: `The portfolio cannot support a fair ranking against someone whose evidence is not provided. What it can establish is Montasim's documented value: senior progression, real-time AI and healthcare depth, measurable reliability, performance and cost outcomes, architecture ownership, mentoring, and a substantial catalog of technical work.`,
      evidence: [profileReference, senior, software, junior],
    },
    {
      id: "interview-focus",
      question:
        "Which topics would make the most useful interview with Montasim?",
      text: `Ask him to walk through the biometric FSM and its 99.9% reliability, the 60 FPS pipeline, the Azure migration behind the 70% cost reduction, the 54+ module chatbot rewrite, and one case-study trade-off such as durable PostCraft scheduling. Those topics let interviewers test both depth and decision quality.`,
      evidence: [
        senior,
        software,
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "recent-value",
      question: "What value is Montasim creating most recently?",
      text: `His most recent professional record shows him making live healthcare AI more deterministic and maintainable: 99.9% reliable FSM-controlled analysis, 60 FPS pose estimation with rep counting, a Redux Toolkit chatbot rewrite, and a Presentational/Container refactor across more than 54 modules.`,
      evidence: [senior],
    },
    {
      id: "ownership-signal",
      question: "Does Montasim show ownership beyond assigned tickets?",
      text: `Yes. The portfolio documents frontend architecture ownership, PR reviews, mentoring, a full chatbot rewrite, cloud migration and CI/CD automation, security-system deployment, and personal projects with explicit architecture and outcome records. Those are broader system and lifecycle responsibilities, not isolated ticket completion.`,
      evidence: [
        profileReference,
        senior,
        software,
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "communication-signal",
      question: "What evidence supports Montasim's communication ability?",
      text: `Direct reports and collaborators describe him as approachable, clear when breaking down requirements, willing to explain the reasoning behind decisions, collaborative across functions, and effective at translating design intent into production interfaces. These are attributed professional observations rather than self-authored claims.`,
      evidence: [
        mentorRecommendation,
        recommendationReference("Syed Mahedi Hasen"),
        designRecommendation,
      ],
    },
    {
      id: "evidence-confidence",
      question: "How reliable is the portfolio case for hiring Montasim?",
      text: `The strongest case is built from role records with named dates and metrics, repository-linked projects, verified case-study commits, published credentials, and attributed recommendations. Hiring teams should still validate role scope and context in interview, but the portfolio offers unusually concrete starting evidence for that conversation.`,
      evidence: [
        senior,
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
        managerRecommendation,
      ],
    },
    {
      id: "hiring-summary",
      question: "Give a concise evidence-based hiring summary for Montasim.",
      text: `Montasim is a Senior Software Engineer with two promotions, production healthcare SaaS depth, and measurable results across reliability, real-time AI, frontend performance, cloud cost, and diagnosis workflows. He adds architecture ownership, mentoring, cross-functional credibility, and a broad documented project catalog. The next step is a role-specific technical conversation.`,
      evidence: [
        profileReference,
        senior,
        software,
        junior,
        designRecommendation,
      ],
    },
    {
      id: "next-step",
      question:
        "What is the best next step if Montasim looks relevant to an opening?",
      text: `Contact Montasim with the role's scope, seniority, core technical problems, work arrangement, time-zone expectations, and interview process. His portfolio lists active availability and an immediate earliest-start entry, while a direct conversation can validate the organizational and domain context not contained in public records.`,
      evidence: [profileReference],
    },
  ]

  return seeds.map((seed) => answer("hiring-fit-due-diligence", seed))
}

function buildLeadershipAnswers(): readonly ExactAnswer[] {
  const mentor = recommendationReference("Mahmudul Ahsan")
  const directReport = recommendationReference("Syed Mahedi Hasen")
  const designer = recommendationReference("Md. Tamim Tanvir, MBA")
  const manager = recommendationReference("Tabbi Quadir")
  const seeds: readonly AnswerSeed[] = [
    {
      id: "current-scope",
      question:
        "What leadership responsibilities does Montasim currently document?",
      text: `Montasim's profile says he owns frontend architecture across a multi-service platform, leads PR reviews, and mentors engineers. His current role adds leadership of a full medical-chatbot rewrite and a 54+ module Presentational/Container refactor.`,
      evidence: [profileReference, experienceReference(seniorExperience)],
    },
    {
      id: "mentoring",
      question: "How do engineers describe Montasim as a mentor?",
      text: `One engineer describes Montasim as a supportive and approachable first team lead who made an early-career transition easier. Another says Montasim broke down complex requirements, explained implementation reasoning, and helped him deliver features and grow in confidence.`,
      evidence: [mentor, directReport],
    },
    {
      id: "review-culture",
      question: "What is Montasim's role in code review?",
      text: `His profile explicitly states that he leads PR reviews as part of owning frontend architecture. The public data does not specify review volume, but colleague feedback about clean, maintainable code and clear technical reasoning supports a quality-focused review style.`,
      evidence: [profileReference, recommendationReference("Shahriar Iqbal")],
    },
    {
      id: "design-partnership",
      question: "How does Montasim collaborate with product designers?",
      text: `A senior product designer says Montasim translates complex design systems into scalable, accessible, production-ready interfaces without losing UX intent. The recommendation emphasizes that he considers usability, accessibility, performance, and long-term scalability when making frontend decisions.`,
      evidence: [designer],
    },
    {
      id: "backend-partnership",
      question: "How does Montasim collaborate with backend engineers?",
      text: `Colleagues credit Montasim with effective backend collaboration during telemedicine and AI integration, including efficient data transmission and real-time video workflows. The evidence describes him as a team player who troubleshoots issues and coordinates frontend behavior with backend systems.`,
      evidence: [
        recommendationReference("Shoriful Islam"),
        recommendationReference("Md. Sazzad Hossain"),
      ],
    },
    {
      id: "requirements-translation",
      question:
        "Can Montasim translate business requirements for other engineers?",
      text: `A direct report says Montasim consistently helped turn complex business requirements into practical technical solutions and explained the reasoning behind decisions. That feedback is reinforced by case studies that make problem, constraints, decisions, contribution, and outcomes explicit.`,
      evidence: [
        directReport,
        caseStudyReference(postcraftCaseStudy, "problem"),
      ],
    },
    {
      id: "junior-support",
      question:
        "How does Montasim support junior engineers when they are blocked?",
      text: `Two engineers describe him as approachable and supportive when tasks or codebase problems become difficult. They specifically attribute improved confidence, learning, successful feature delivery, and clearer problem-solving to his guidance.`,
      evidence: [mentor, directReport],
    },
    {
      id: "decision-context",
      question: "Does Montasim explain why technical decisions are made?",
      text: `Yes. A direct report says Montasim ensured the team understood the reasoning behind decisions and implementations, not only the expected output. His case-study writing follows the same pattern by connecting each decision to a stated constraint and outcome.`,
      evidence: [
        directReport,
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "knowledge-sharing",
      question: "What evidence shows Montasim shares engineering knowledge?",
      text: `His documented mentoring and PR-review responsibilities are supported by colleagues who say he explains complex requirements clearly, offers practical guidance, and encourages learning. His public case studies also expose architecture decisions and limitations for other engineers to inspect.`,
      evidence: [profileReference, mentor, directReport],
    },
    {
      id: "learning-humility",
      question:
        "How do colleagues describe Montasim's attitude toward learning from others?",
      text: `A teammate describes Montasim as growth-oriented and willing to learn even from junior team members, while also encouraging continuous improvement. Another collaborator highlights his curiosity and ability to bridge research and production.`,
      evidence: [mentor, recommendationReference("Md. Rifaet Ullah")],
    },
    {
      id: "proactivity",
      question: "Is Montasim described as proactive?",
      text: `Yes. A manager describes him as proactive in addressing challenges, quick to take on new responsibilities, and committed to high-quality work. Other recommendations describe proactive performance optimization, troubleshooting, learning, and product improvement.`,
      evidence: [manager, recommendationReference("Md. Azharul Sharif")],
    },
    {
      id: "communication",
      question: "How is Montasim's professional communication described?",
      text: `Recommendations describe Montasim as clear, collaborative, approachable, and effective in both technical explanation and cross-functional discussion. One colleague explicitly praises his written and verbal communication; others highlight his ability to preserve design intent and make complex requirements practical.`,
      evidence: [recommendationReference("Rana Hamid"), designer, directReport],
    },
    {
      id: "delivery-commitment",
      question: "What do managers say about Montasim's delivery discipline?",
      text: `Managers describe Montasim as dedicated, dependable, proactive, and committed to high standards. One directly states that he met deadlines with high-quality work; another highlights diligent execution, effective communication, and readiness for new responsibilities.`,
      evidence: [
        recommendationReference("Sakkhar Saha CSM®, SFPC™, SFC™"),
        manager,
      ],
    },
    {
      id: "quality-culture",
      question:
        "How does Montasim contribute to an engineering quality culture?",
      text: `His record combines PR-review leadership and mentoring with colleague observations about clean, maintainable code, attention to detail, automated tests, and clear reasoning. That evidence suggests quality is reinforced through both technical standards and team guidance.`,
      evidence: [
        profileReference,
        recommendationReference("Shahriar Iqbal"),
        recommendationReference("Shoriful Islam"),
      ],
    },
    {
      id: "teamwork",
      question: "What evidence supports Montasim as a collaborative teammate?",
      text: `Multiple recommendations independently describe Montasim as collaborative, supportive, positive, and willing to share knowledge. They cite work across backend, AI, design, QA, and junior-engineer relationships, giving the teamwork claim broader support than a single endorsement.`,
      evidence: [
        manager,
        designer,
        recommendationReference("Md. Rifaet Ullah"),
        recommendationReference("Rana Hamid"),
      ],
    },
    {
      id: "cross-functional-leadership",
      question: "How does Montasim lead across functional boundaries?",
      text: `The clearest evidence is his ownership at the design-engineering and AI-production boundaries: preserving UX intent in scalable interfaces, integrating research pipelines into real-time product experiences, coordinating backend behavior, and guiding engineers through business requirements and implementation choices.`,
      evidence: [
        designer,
        recommendationReference("Md. Rifaet Ullah"),
        directReport,
      ],
    },
    {
      id: "early-leadership",
      question:
        "Did Montasim demonstrate leadership before his senior software role?",
      text: `Yes. His organization record notes leadership, teamwork, and discipline through Bangladesh National Cadet Corps training, including recognition as Second Best Cadet. A former teacher also attributes successful difficult student projects partly to Montasim's leadership.`,
      evidence: [
        reference(
          "organization:organization-bncc",
          affiliationCatalog.organizations[0]?.description ?? "BNCC"
        ),
        recommendationReference("Abu Saleh Musa Miah"),
      ],
    },
    {
      id: "volunteer-leadership",
      question:
        "What non-work evidence shows Montasim can coordinate people and resources?",
      text: `His volunteering records document leading event volunteers, organizing educational tours and community events, and managing budgets. Those activities provide bounded evidence of coordination, resource responsibility, and team delivery outside software engineering.`,
      evidence: affiliationCatalog.volunteering.map((record) =>
        reference(`volunteering:${record.id}`, record.description)
      ) as [EvidenceReference, ...EvidenceReference[]],
    },
    {
      id: "executive-feedback",
      question: "What leadership-level feedback has Montasim received?",
      text: `Managers and an executive founder describe Montasim as technically capable, reliable, attentive to detail, proactive, collaborative, and committed to improving product quality. These are attributed observations and should support working-style assessment rather than substitute for technical evaluation.`,
      evidence: [
        recommendationReference("Shoriful Islam"),
        manager,
        recommendationReference("Md. Azharul Sharif"),
      ],
    },
    {
      id: "leadership-style",
      question:
        "What leadership style emerges from Montasim's recommendations?",
      text: `The recommendations consistently describe an approachable, explanation-led style: he helps engineers understand the reason behind decisions, supports them through blockers, invites learning in both directions, and keeps delivery and user experience in view. The portfolio does not publish a formal management philosophy, so this synthesis stays tied to observed collaboration.`,
      evidence: [mentor, directReport, designer],
    },
  ]

  return seeds.map((seed) => answer("leadership-collaboration", seed))
}

function buildTechnicalDepthAnswers(): readonly ExactAnswer[] {
  const senior = experienceReference(seniorExperience)
  const software = experienceReference(softwareExperience)
  const junior = experienceReference(juniorExperience)
  const seeds: readonly AnswerSeed[] = [
    {
      id: "frontend-architecture",
      question: "What is Montasim's strongest frontend-architecture example?",
      text: `His healthcare biometric engine is the strongest professional example: Montasim replaced more than 40 unstable effect-driven interactions with a finite-state machine, creating deterministic transitions and reaching 99.9% reliability. The same role includes Redux Toolkit and a Presentational/Container refactor across 54+ chatbot modules.`,
      evidence: [senior, profileReference, biometricArticleReference],
    },
    {
      id: "full-stack-evidence",
      question: "Which records demonstrate Montasim's full-stack range?",
      text: `His role history includes React, Node.js, Express, PostgreSQL, JWT, WebRTC, Azure, Docker, and CI/CD. Project records add Next.js, MongoDB, Prisma, Drizzle, Better Auth, queues, scheduled jobs, email, APIs, and multiple AI providers, with case studies explaining how those parts are bounded.`,
      evidence: [
        junior,
        software,
        skillReference(backendSkills),
        skillReference(databaseSkills),
        projectReference(postcraft),
      ],
    },
    {
      id: "react-depth",
      question: "What evidence shows Montasim's depth with React?",
      text: `React appears across his professional progression from responsive telemedicine components to rendering optimization, deterministic biometric state, Redux Toolkit, and a 54+ module architecture refactor. His projects extend that experience into Next.js, browser extensions, React Three Fiber, and reusable component systems.`,
      evidence: [
        experienceReference(multiversalExperience),
        software,
        senior,
        skillReference(frontendSkills),
      ],
    },
    {
      id: "nextjs-depth",
      question: "How has Montasim used Next.js?",
      text: `The project catalog documents Next.js across AI SaaS, research, publishing, education, multilingual sharing, developer tools, dynamic SVG APIs, and data lookup products. The evidence shows Next.js used with authentication, databases, APIs, background workflows, internationalization, and testing rather than as a single landing-page framework.`,
      evidence: [
        projectReference(postcraft),
        projectReference(devtools),
        projectReference(educanvas),
        skillReference(frontendSkills),
      ],
    },
    {
      id: "typescript-depth",
      question: "Where does Montasim apply TypeScript?",
      text: `TypeScript is documented across his current professional role and a broad set of web apps, browser extensions, npm packages, AI tools, data products, and agent skills. The case studies repeatedly use typed schemas and explicit domain models to make uncertainty and lifecycle rules visible in APIs.`,
      evidence: [
        senior,
        skillReference(frontendSkills),
        projectReference(thoughtline),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "node-backend",
      question: "What backend work has Montasim done with Node.js?",
      text: `Montasim's experience includes Node.js and Express in healthcare and earlier PHP/JavaScript client delivery. His projects use Node-backed APIs, authentication, scheduled workflows, queues, email, database access, package tooling, and CI/CD; PostCraft is a particularly broad example of persistent AI publishing workflows.`,
      evidence: [
        junior,
        software,
        skillReference(backendSkills),
        projectReference(postcraft),
      ],
    },
    {
      id: "database-range",
      question: "Which databases and data-access tools does Montasim document?",
      text: `The skills catalog lists PostgreSQL, MongoDB, Redis, SQLite, Prisma, Drizzle ORM, Mongoose, and PhpMyAdmin. Projects connect those tools to routines, publishing, URL sharing, education, authentication, scheduling, and provenance-rich public datasets.`,
      evidence: [
        skillReference(databaseSkills),
        projectReference(postcraft),
        projectReference(locationRegistry),
      ],
    },
    {
      id: "real-time-depth",
      question: "What is Montasim's real-time engineering experience?",
      text: `His professional work includes WebRTC consultations, real-time AI analysis, MediaPipe pose estimation, biometric state, metric visualization, and rep counting. Documented outcomes include stabilized calls, lower latency, 60 FPS processing, 99.9% reliability, 25% faster diagnosis, and 95% accuracy.`,
      evidence: [senior, junior, skillReference(realTimeSkills)],
    },
    {
      id: "ai-integration",
      question: "How does Montasim integrate AI into products?",
      text: `Montasim's evidence spans healthcare analysis, pose estimation, annotated results, YouTube transcript Q&A, writing assistance, company research, and social publishing. His architectures keep model providers behind explicit boundaries, retain user control for consequential actions, and pair AI output with deterministic application state.`,
      evidence: [
        senior,
        junior,
        skillReference(aiSkills),
        projectReference(thoughtline),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
      ],
    },
    {
      id: "browser-extension",
      question: "What browser-extension engineering has Montasim done?",
      text: `He has built Chromium extensions for YouTube Q&A, LinkedIn writing assistance, and workplace context. The documented stack includes WXT, React 19, TypeScript, Manifest V3, Chrome APIs, local credential handling, content-script boundaries, validation, testing, and CI/CD.`,
      evidence: [
        skillReference(browserSkills),
        projectReference(thoughtline),
        projectReference(requiredProject("project-vidquery")),
        projectReference(requiredProject("project-mulalens")),
      ],
    },
    {
      id: "web-security",
      question: "What web-security controls has Montasim implemented?",
      text: `His professional records include HIPAA-compliant SSO, multi-role access, OAuth, strict CSP headers, JWT-based API access, XSS protection, and CSRF protection. Thoughtline adds a clear trust model separating untrusted page content, permissions, local credentials, and external AI providers.`,
      evidence: [
        software,
        junior,
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        skillReference(architectureSkills),
      ],
    },
    {
      id: "azure-cloud",
      question: "What cloud and DevOps work has Montasim delivered?",
      text: `Montasim migrated Azure VMs to App Service and automated CI/CD, reducing infrastructure cost by 70%. His broader catalog includes Docker, GitHub Actions, Netlify, npm packaging, build tooling, release verification, and deployment-audit skills.`,
      evidence: [
        software,
        skillReference(cloudSkills),
        projectReference(requiredProject("project-prepare-netlify-deployment")),
      ],
    },
    {
      id: "delivery-automation",
      question: "How does Montasim use CI/CD and release automation?",
      text: `CI/CD is tied to a documented 70% Azure-cost reduction and appears throughout his project catalog for builds, tests, packages, deployments, releases, and metadata validation. His agent skills also make release verification and partial-failure states explicit instead of assuming one green system proves delivery.`,
      evidence: [
        software,
        skillReference(cloudSkills),
        projectReference(requiredProject("project-verify-project-release")),
        caseStudyReference(
          requiredCaseStudy("project-verify-project-release"),
          "architecture"
        ),
      ],
    },
    {
      id: "finite-state-machine",
      question:
        "Why did Montasim use a finite-state machine for biometric analysis?",
      text: `The portfolio says unstable React hooks and more than 40 effects made live biometric behavior difficult to predict. Montasim replaced that coordination with explicit finite-state transitions, producing a deterministic engine documented at 99.9% reliability during AI analysis.`,
      evidence: [senior, profileReference, biometricArticleReference],
    },
    {
      id: "performance-engineering",
      question: "What layers of performance engineering has Montasim handled?",
      text: `He has optimized React rendering and dependencies for a 40% application gain, reached Lighthouse scores above 90, sustained 60 FPS pose estimation, reduced page-load time, stabilized WebRTC calls, and cut Azure cost by 70%. That is evidence across browser, real-time pipeline, network, and infrastructure layers.`,
      evidence: [
        senior,
        software,
        junior,
        experienceReference(multiversalExperience),
        profileReference,
      ],
    },
    {
      id: "testing-quality",
      question: "Which testing and quality tools does Montasim use?",
      text: `His skills catalog includes Jest, Vitest, Playwright, React Testing Library, and Lighthouse. Project records connect them to unit, component, integration, and browser-level checks, while recommendations describe automated tests, maintainable code, and structured troubleshooting in professional work.`,
      evidence: [
        skillReference(testingSkills),
        recommendationReference("Shoriful Islam"),
        recommendationReference("Shahriar Iqbal"),
      ],
    },
    {
      id: "accessible-design",
      question:
        "What evidence connects Montasim's frontend work to accessibility and design quality?",
      text: `A senior product designer says Montasim preserves UX intent while translating complex design systems into scalable, accessible, responsive interfaces. Foliofarer's architecture reinforces that concern by ensuring core content and navigation do not depend on WebGL capability or motion tolerance.`,
      evidence: [
        recommendationReference("Md. Tamim Tanvir, MBA"),
        caseStudyReference(foliofarerCaseStudy, "architecture"),
        skillReference(designSkills),
      ],
    },
    {
      id: "api-design",
      question: "What API experience does Montasim document?",
      text: `His catalog covers REST APIs, JWT clients, authentication, payments, email, Google Drive integration, AI providers, and small typed HTTP libraries. The client-parser and media-type case studies also show API designs that state uncertainty and refuse to confuse filename lookup with content validation.`,
      evidence: [
        junior,
        skillReference(backendSkills),
        caseStudyReference(
          requiredCaseStudy("project-client-parser"),
          "architecture"
        ),
        caseStudyReference(
          requiredCaseStudy("project-mime-types-lite"),
          "architecture"
        ),
      ],
    },
    {
      id: "authentication",
      question:
        "What authentication and identity experience does Montasim have?",
      text: `Professionally, he deployed HIPAA-compliant SSO with multi-role access and OAuth, and built a JWT-based protected API client. Projects add Better Auth, NextAuth, account boundaries, protected administration, and role-aware workflows across several Next.js products.`,
      evidence: [
        software,
        junior,
        skillReference(backendSkills),
        projectReference(postcraft),
        projectReference(educanvas),
      ],
    },
    {
      id: "data-modeling",
      question: "What examples show Montasim's data-modeling judgment?",
      text: `His case studies model routine plans separately from outcomes, keep company evidence labeled by provenance, retain location-source provenance, and unify sharing lifecycles without erasing differences between links, text, and QR data. These examples prioritize semantics and trust over convenient but misleading schemas.`,
      evidence: [
        caseStudyReference(
          requiredCaseStudy("project-routempo"),
          "architecture"
        ),
        caseStudyReference(companyResearchCaseStudy, "architecture"),
        caseStudyReference(locationRegistryCaseStudy, "architecture"),
        caseStudyReference(
          requiredCaseStudy("project-shrnkly"),
          "architecture"
        ),
      ],
    },
    {
      id: "async-workflows",
      question: "How does Montasim design durable asynchronous workflows?",
      text: `PostCraft separates interactive editing from durable scheduled delivery, persists reviewable job state, and avoids depending on an open browser tab or request. His release-oriented agent skills similarly model multi-system delivery as staged work with verification rather than pretending remote operations are atomic.`,
      evidence: [
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(
          requiredCaseStudy("project-ship-agent-skill"),
          "architecture"
        ),
      ],
    },
    {
      id: "privacy-boundaries",
      question: "How does Montasim handle privacy and trust boundaries?",
      text: `Examples include keeping tax-ID lookup client-side, treating LinkedIn page content as untrusted input, storing user-supplied provider keys locally in extension scope, labeling company-research evidence by source, and retaining provenance in public datasets. Each design limits what the system is allowed to infer or transmit.`,
      evidence: [
        caseStudyReference(tinAuditCaseStudy, "architecture"),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        caseStudyReference(companyResearchCaseStudy, "architecture"),
        caseStudyReference(locationRegistryCaseStudy, "architecture"),
      ],
    },
    {
      id: "scheduled-publishing",
      question: "How did Montasim architect scheduled social publishing?",
      text: `PostCraft persists scheduling state and hands delivery to durable background execution instead of tying it to the request or browser session that created it. The case study also keeps generated variants, brand review, previews, and delivery status as explicit parts of the workflow.`,
      evidence: [
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "architecture-range",
      question:
        "Which projects best demonstrate Montasim's system-design range?",
      text: `PostCraft demonstrates durable AI publishing, Thoughtline demonstrates browser and provider trust boundaries, Foliofarer separates content from rendering capability, DevTools manages dozens of workflows behind shared contracts, and the Bangladesh Location Registry preserves provenance across heterogeneous sources.`,
      evidence: [
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        caseStudyReference(foliofarerCaseStudy, "architecture"),
        caseStudyReference(devtoolsCaseStudy, "architecture"),
        caseStudyReference(locationRegistryCaseStudy, "architecture"),
      ],
    },
    {
      id: "deep-boundaries",
      question:
        "How does Montasim use module boundaries to control complexity?",
      text: `His documented architectures isolate changing concerns: providers from product policy, browser content from trusted extension state, rendering from portfolio content, individual tools from shared execution contracts, and institution themes from core education workflows. The recurring goal is to keep one change from leaking across unrelated responsibilities.`,
      evidence: [
        caseStudyReference(thoughtlineCaseStudy, "architecture"),
        caseStudyReference(foliofarerCaseStudy, "architecture"),
        caseStudyReference(devtoolsCaseStudy, "architecture"),
        caseStudyReference(educanvasCaseStudy, "architecture"),
      ],
    },
    {
      id: "small-packages",
      question:
        "What does Montasim's package work reveal about API discipline?",
      text: `His HTTP status, MIME type, content type, and client parser packages deliberately keep focused boundaries. Their case studies distinguish data from behavior, lookup from validation, and heuristic classification from certainty—useful evidence that he can make small APIs honest instead of expanding them without limits.`,
      evidence: [
        caseStudyReference(
          requiredCaseStudy("project-http-status-lite"),
          "architecture"
        ),
        caseStudyReference(
          requiredCaseStudy("project-mime-types-lite"),
          "architecture"
        ),
        caseStudyReference(
          requiredCaseStudy("project-content-types-lite"),
          "architecture"
        ),
        caseStudyReference(
          requiredCaseStudy("project-client-parser"),
          "architecture"
        ),
      ],
    },
    {
      id: "multi-tenant-saas",
      question: "What supports Montasim's multi-tenant SaaS experience?",
      text: `His profile explicitly documents multi-tenant SaaS work and frontend ownership across a multi-service platform. Supporting records include multi-role SSO, OAuth, secure client boundaries, modular content management, authenticated publishing, scheduled jobs, and project architectures that separate tenant- or institution-specific policy from shared workflows.`,
      evidence: [
        profileReference,
        software,
        caseStudyReference(educanvasCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "computer-vision",
      question: "What computer-vision engineering has Montasim delivered?",
      text: `Montasim's professional work uses MediaPipe for pose estimation and real-time rep counting, sustained at 60 FPS within a biometric engine documented at 99.9% reliability. An academic recommendation also references completed driver-drowsiness and hand-pose projects, though the production healthcare role is the stronger current evidence.`,
      evidence: [
        senior,
        skillReference(realTimeSkills),
        recommendationReference("Abu Saleh Musa Miah"),
      ],
    },
    {
      id: "adaptive-webgl",
      question:
        "How did Montasim prevent Foliofarer's 3D interface from excluding users?",
      text: `Foliofarer keeps core career content and navigation independent from WebGL, adds an accessible Atlas path, stores Passport progress locally, and adapts rendering to device capability and user preferences. The architecture treats 3D as an enhancement rather than the only route to the information.`,
      evidence: [
        projectReference(foliofarer),
        caseStudyReference(foliofarerCaseStudy, "architecture"),
      ],
    },
    {
      id: "developer-tool-scale",
      question:
        "How did Montasim avoid building a separate architecture for every DevTools utility?",
      text: `The DevTools case study defines shared contracts for tool metadata, validation, execution, state, and presentation, while keeping local transformations distinct from server-backed features. That lets more than 50 workflows share platform behavior without forcing unrelated tools into one implementation.`,
      evidence: [
        projectReference(devtools),
        caseStudyReference(devtoolsCaseStudy, "architecture"),
        caseStudyReference(devtoolsCaseStudy, "outcomes"),
      ],
    },
  ]

  return seeds.map((seed) => answer("technical-depth", seed))
}

function catalogCountReference(
  source:
    | "projects"
    | "casestudy"
    | "blog"
    | "certifications"
    | "experience"
    | "skills"
    | "recommendations"
    | "education"
    | "organizations"
    | "volunteering",
  count: number
) {
  return reference(`derived:catalog-count:${source}`, `${source}: ${count}`)
}

function buildCatalogAnswers(): readonly ExactAnswer[] {
  const newestProject = projectCatalog.newestByGitHubHistory
  const latestBlog = requiredItem(
    blogCatalog.latestDatedPosts.at(0),
    "Latest dated blog"
  )

  const projectTypeCounts = Array.from(
    projectCatalog.records.reduce((counts, project) => {
      counts.set(project.type, (counts.get(project.type) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  )
    .map(([type, count]) => `${projectTypeLabel(type)}: ${count}`)
    .join(", ")
  const myMedicalHubRoles = experienceCatalog.records.filter(
    (record) => record.company === "MyMedicalHub International Ltd."
  )
  const certificationYears = certificationCatalog.records.map((record) =>
    Number(record.year)
  )
  const seeds: readonly AnswerSeed[] = [
    {
      id: "project-count",
      question: "How many projects are published in Montasim's portfolio?",
      text: `The portfolio currently publishes ${projectCatalog.records.length} project records. They span web applications, browser extensions, packages, AI agent skills, datasets, developer tools, an API, and a template, so the count represents several forms of documented engineering work.`,
      evidence: [
        catalogCountReference("projects", projectCatalog.records.length),
      ],
    },
    {
      id: "case-study-count",
      question: "How many project case studies has Montasim documented?",
      text: `Montasim has ${projectCaseStudyCatalog.records.length} project case studies. Each uses a structured record for problem, constraints, architecture, decisions, personal contribution, and outcomes, giving reviewers more depth than a project-card description alone.`,
      evidence: [
        catalogCountReference(
          "casestudy",
          projectCaseStudyCatalog.records.length
        ),
      ],
    },
    {
      id: "blog-count",
      question: "How many articles are in Montasim's blog catalog?",
      text: `The blog catalog contains ${blogCatalog.posts.length} articles: ${blogCatalog.authoredPosts.length} authored essays and ${blogCatalog.caseStudyDerivedPosts.length} project-linked articles. The distinction matters because project-linked writing is another route into the same underlying case-study evidence, not a separate accomplishment.`,
      evidence: [directFactReference("derived:blog-content-distribution")],
    },
    {
      id: "credential-count",
      question: "How many credentials does Montasim publish?",
      text: `Montasim publishes ${certificationCatalog.records.length} certification records. They cover frontend development, React, Azure, API testing, unit testing, accessibility, Agile delivery, project management, UX, business intelligence, developer tooling, and supporting technical foundations.`,
      evidence: [
        catalogCountReference(
          "certifications",
          certificationCatalog.records.length
        ),
      ],
    },
    {
      id: "experience-count",
      question: "How many professional experience records does Montasim list?",
      text: `The experience catalog contains ${experienceCatalog.records.length} records, ranging from early web development and IT or teaching responsibilities to frontend telemedicine and three successive engineering levels at MyMedicalHub.`,
      evidence: [
        catalogCountReference("experience", experienceCatalog.records.length),
      ],
    },
    {
      id: "skill-group-count",
      question: "How many technical skill groups does Montasim maintain?",
      text: `The skills catalog contains ${skillCatalog.records.length} groups. They organize frontend, backend and APIs, databases, AI and agent development, browser extensions, cloud and DevOps, testing, design collaboration, office tools, real-time computer vision, and architecture and security.`,
      evidence: [catalogCountReference("skills", skillCatalog.records.length)],
    },
    {
      id: "recommendation-count",
      question:
        "How many professional recommendations appear in the portfolio?",
      text: `The portfolio publishes ${recommendationCatalog.records.length} attributed recommendations. They represent managers, teammates, direct reports, design and QA collaborators, and former teachers, providing qualitative evidence from different working relationships.`,
      evidence: [
        catalogCountReference(
          "recommendations",
          recommendationCatalog.records.length
        ),
      ],
    },
    {
      id: "education-count",
      question: "How many education records does Montasim publish?",
      text: `Montasim publishes ${educationCatalog.records.length} education records: a Bachelor of Science in Computer Science and Engineering, a Higher Secondary Certificate in the science group, and a Secondary School Certificate in the science group.`,
      evidence: [
        catalogCountReference("education", educationCatalog.records.length),
      ],
    },
    {
      id: "organization-count",
      question: "How many organization affiliations are listed for Montasim?",
      text: `The portfolio lists ${affiliationCatalog.organizations.length} organization affiliations: Bangladesh National Cadet Corps, BAUST Career Club, and BAUST Programming Club. They document leadership, teamwork, career-development activity, and collaborative technical learning.`,
      evidence: [
        catalogCountReference(
          "organizations",
          affiliationCatalog.organizations.length
        ),
      ],
    },
    {
      id: "volunteering-count",
      question: "How many volunteering records does Montasim have?",
      text: `Montasim publishes ${affiliationCatalog.volunteering.length} volunteering records, both as an event organizer. They document planning community events, coordinating volunteers, arranging educational activities, and managing budgets.`,
      evidence: [
        catalogCountReference(
          "volunteering",
          affiliationCatalog.volunteering.length
        ),
      ],
    },
    {
      id: "newest-project",
      question: "Which project is newest by Montasim's GitHub history?",
      text: `${newestProject.title} is the newest project by the portfolio's GitHub-history rule. Its history begins on ${newestProject.githubRepositoryCreatedAt.slice(0, 10)}, using the earlier of repository creation and initial commit; this identifies when repository history began, not a claimed public-release date.`,
      evidence: [
        reference(
          "derived:newest-project-by-github-history",
          `${newestProject.title}: ${newestProject.githubRepositoryCreatedAt}`
        ),
        projectReference(newestProject),
      ],
    },
    {
      id: "latest-blog",
      question:
        "Which article is treated as Montasim's latest dated blog entry?",
      text: `The derived chronology selects “${latestBlog.title}” at ${latestBlog.publishedAt}. Several project-linked articles share that date, so the compiler uses catalog order as an explicit tie-break instead of pretending their publication times are known more precisely.`,
      evidence: [
        reference(
          "derived:latest-dated-blog",
          `${latestBlog.title}: ${latestBlog.publishedAt}`
        ),
      ],
    },
    {
      id: "featured-projects",
      question: "How many projects are featured for recruiter review?",
      text: `${projectCatalog.featured.length} project records are explicitly marked as featured: ${projectCatalog.featured.map((project) => project.title).join(", ")}. Featured status is a curated portfolio choice, while the full project catalog remains available for broader evidence.`,
      evidence: projectCatalog.featured.map(projectReference) as [
        EvidenceReference,
        ...EvidenceReference[],
      ],
    },
    {
      id: "project-type-distribution",
      question: "How is Montasim's project catalog distributed by type?",
      text: `The ${projectCatalog.records.length} projects are distributed as ${projectTypeCounts}. This mix shows a catalog extending beyond web applications into reusable packages, agent workflows, extensions, data, developer tools, and API-oriented work.`,
      evidence: [directFactReference("derived:project-type-distribution")],
    },
    {
      id: "authored-versus-linked-writing",
      question:
        "How much of Montasim's writing is standalone versus project-linked?",
      text: `The blog contains ${blogCatalog.authoredPosts.length} authored essays and ${blogCatalog.caseStudyDerivedPosts.length} case-study-derived articles. The project-linked articles provide a reading route to existing case-study facts, while the authored essays contain separate long-form material.`,
      evidence: [directFactReference("derived:blog-content-distribution")],
    },
    {
      id: "mymedicalhub-role-count",
      question: "How many MyMedicalHub roles document Montasim's progression?",
      text: `${myMedicalHubRoles.length} successive MyMedicalHub records document his progression: ${myMedicalHubRoles.map((record) => record.role).join(" → ")}. Their responsibilities expand from real-time AI and WebRTC to performance, cloud, security, and senior architecture leadership.`,
      evidence: myMedicalHubRoles.map(experienceReference) as [
        EvidenceReference,
        ...EvidenceReference[],
      ],
    },
    {
      id: "project-case-study-coverage",
      question: "Does every published project have a corresponding case study?",
      text: `Yes. The validated catalogs contain ${projectCatalog.records.length} projects and ${projectCaseStudyCatalog.records.length} case studies, with one case study linked to every project record. That relationship lets visitors move from a concise project description to problem, architecture, contribution, and outcome evidence.`,
      evidence: [
        catalogCountReference("projects", projectCatalog.records.length),
        catalogCountReference(
          "casestudy",
          projectCaseStudyCatalog.records.length
        ),
      ],
    },
    {
      id: "credential-year-range",
      question: "What years do Montasim's published credentials cover?",
      text: `The credential catalog spans ${Math.min(...certificationYears)} through ${Math.max(...certificationYears)}. It records continued learning from foundational computing and developer tools through frontend, cloud, testing, accessibility, project delivery, data, and current AI-agent education.`,
      evidence: [directFactReference("derived:credential-year-range")],
    },
    {
      id: "catalog-breadth",
      question:
        "What kinds of evidence are available across Montasim's portfolio?",
      text: `The portfolio combines profile facts, ${experienceCatalog.records.length} experience records, ${projectCatalog.records.length} projects, ${projectCaseStudyCatalog.records.length} case studies, ${blogCatalog.posts.length} articles, ${certificationCatalog.records.length} credentials, ${recommendationCatalog.records.length} recommendations, skills, education, affiliations, volunteering, and contribution activity. Each source has a different evidentiary role.`,
      evidence: [
        catalogCountReference("experience", experienceCatalog.records.length),
        catalogCountReference("projects", projectCatalog.records.length),
        catalogCountReference(
          "casestudy",
          projectCaseStudyCatalog.records.length
        ),
        catalogCountReference("blog", blogCatalog.posts.length),
        catalogCountReference(
          "certifications",
          certificationCatalog.records.length
        ),
        catalogCountReference(
          "recommendations",
          recommendationCatalog.records.length
        ),
      ],
    },
    {
      id: "evidence-relationship",
      question:
        "How do Montasim's projects, case studies, and blog articles relate?",
      text: `A project record identifies the product and stack; its case study explains problem, constraints, architecture, contribution, and outcomes; a project-linked blog article presents that same evidence as a readable engineering narrative. The layers are related views, not three independent accomplishments.`,
      evidence: [
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "architecture"),
        reference(
          `blog:scheduled-publishing-cannot-depend-on-an-open-tab:architecture`,
          postcraftCaseStudy.architecture.summary
        ),
      ],
    },
  ]

  return seeds.map((seed) => answer("catalog-chronology-comparison", seed))
}

function buildClientDeliveryAnswers(): readonly ExactAnswer[] {
  const seeds: readonly AnswerSeed[] = [
    {
      id: "end-to-end-delivery",
      question:
        "What evidence shows Montasim can deliver a product end to end?",
      text: `His case studies connect a defined problem to constraints, architecture, implementation, and outcomes across AI SaaS, extensions, data products, packages, and developer tools. PostCraft is a strong full-path example, covering generation, brand controls, previews, scheduling, durable delivery, and provider integration.`,
      evidence: [
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "problem"),
        caseStudyReference(postcraftCaseStudy, "contribution"),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "client-needs",
      question: "Has Montasim worked directly from client requirements?",
      text: `Yes. His Web Developer role at Codez explicitly documents analyzing client needs, developing appropriate functionality, and creating and executing test scenarios. His later project case studies add more detailed evidence of translating user and business constraints into technical boundaries.`,
      evidence: [
        experienceReference(codezExperience),
        caseStudyReference(postcraftCaseStudy, "problem"),
      ],
    },
    {
      id: "publishing-product",
      question: "What product judgment does PostCraft demonstrate?",
      text: `PostCraft treats social publishing as a lifecycle rather than a prompt box: one idea moves through generation, brand controls, platform previews, review, scheduling, and durable delivery. The architecture separates interactive work from background execution and keeps delivery status reviewable.`,
      evidence: [
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "architecture"),
        caseStudyReference(postcraftCaseStudy, "outcomes"),
      ],
    },
    {
      id: "privacy-product",
      question:
        "What client-side privacy decision did Montasim make for tax-ID lookup?",
      text: `For TIN Audit Checker, Montasim kept the 72,342-record lookup in the browser so the queried identifier did not need to reach an application server. The case study scopes the product to a historical list and avoids implying that a match is a current legal determination.`,
      evidence: [
        projectReference(tinAuditChecker),
        caseStudyReference(tinAuditCaseStudy, "architecture"),
        caseStudyReference(tinAuditCaseStudy, "outcomes"),
      ],
    },
    {
      id: "job-seeker-product",
      question:
        "How did Montasim design company research without unfair scoring?",
      text: `b4joinacompany keeps workplace stories, salary submissions, official sources, and interview evidence labeled by provenance instead of flattening them into a good-or-bad company score. That gives job seekers useful context while making uncertainty and source quality visible.`,
      evidence: [
        projectReference(companyResearch),
        caseStudyReference(companyResearchCaseStudy, "architecture"),
      ],
    },
    {
      id: "configurable-platform",
      question:
        "How did Montasim avoid separate codebases for different education sites?",
      text: `EduCanvas separates institution theme and content configuration from shared publishing, identity, and delivery workflows. The result supports multiple institution types without maintaining a forked application for each client, reducing drift while preserving controlled variation.`,
      evidence: [
        projectReference(educanvas),
        caseStudyReference(educanvasCaseStudy, "architecture"),
        caseStudyReference(educanvasCaseStudy, "outcomes"),
      ],
    },
    {
      id: "release-confidence",
      question:
        "How could Montasim improve delivery confidence for a client project?",
      text: `His release-oriented agent skills validate builds, packages, tags, CI, install instructions, metadata, deployments, and public documentation as separate verifiable states. That approach makes partial failure visible and reduces the risk of declaring a release complete based on one system alone.`,
      evidence: [
        caseStudyReference(
          requiredCaseStudy("project-ship-agent-skill"),
          "architecture"
        ),
        caseStudyReference(
          requiredCaseStudy("project-verify-project-release"),
          "outcomes"
        ),
        caseStudyReference(
          requiredCaseStudy("project-prepare-netlify-deployment"),
          "architecture"
        ),
      ],
    },
    {
      id: "bounded-delivery",
      question:
        "Can Montasim deliver a focused tool as well as a large platform?",
      text: `Yes. His catalog ranges from narrow typed packages and single-purpose audit or SVG tools to multi-sided SaaS and healthcare platforms. The smaller case studies show deliberate scope control, while larger systems show authentication, persistence, scheduling, real-time behavior, and operational workflows.`,
      evidence: [
        projectReference(requiredProject("project-content-types-lite")),
        projectReference(tinAuditChecker),
        projectReference(postcraft),
        experienceReference(seniorExperience),
      ],
    },
    {
      id: "constraint-discovery",
      question:
        "How does Montasim uncover requirements beyond the visible feature?",
      text: `His case studies explicitly separate the visible request from constraints such as trust, lifecycle, failure recovery, source provenance, accessibility, privacy, and ownership. This makes hidden product risks discussable before they become incidental implementation behavior.`,
      evidence: [
        caseStudyReference(thoughtlineCaseStudy, "problem"),
        caseStudyReference(postcraftCaseStudy, "problem"),
        caseStudyReference(foliofarerCaseStudy, "problem"),
      ],
    },
    {
      id: "business-economics",
      question: "What evidence shows Montasim considers project economics?",
      text: `The clearest professional result is a 70% infrastructure-cost reduction from migrating Azure VMs to App Service and automating CI/CD. Product architectures such as shared EduCanvas workflows and common DevTools contracts also address duplication and maintenance cost, though those records do not publish monetary figures.`,
      evidence: [
        experienceReference(softwareExperience),
        caseStudyReference(educanvasCaseStudy, "architecture"),
        caseStudyReference(devtoolsCaseStudy, "architecture"),
      ],
    },
    {
      id: "data-trust",
      question: "How does Montasim make data-heavy products more trustworthy?",
      text: `The Bangladesh Location Registry retains source provenance through normalization, while company research preserves evidence labels and the TIN checker keeps lookups private and historically scoped. Across these products, the design avoids presenting normalized data as more certain or current than its sources allow.`,
      evidence: [
        caseStudyReference(locationRegistryCaseStudy, "architecture"),
        caseStudyReference(companyResearchCaseStudy, "architecture"),
        caseStudyReference(tinAuditCaseStudy, "architecture"),
      ],
    },
    {
      id: "multi-platform-product",
      question:
        "What does Montasim understand about multi-platform publishing?",
      text: `PostCraft models one idea through platform-specific generation, scoring, previews, brand constraints, scheduling, and delivery to LinkedIn, X, and Facebook. The workflow acknowledges that platforms have different limits and that durable publishing cannot depend on a browser tab remaining open.`,
      evidence: [
        projectReference(postcraft),
        caseStudyReference(postcraftCaseStudy, "problem"),
        caseStudyReference(postcraftCaseStudy, "architecture"),
      ],
    },
    {
      id: "working-style",
      question: "What working style could a client expect from Montasim?",
      text: `Attributed feedback describes Montasim as proactive, clear, collaborative, attentive to detail, and committed to high-quality delivery. His case studies reinforce a habit of making scope, constraints, technical decisions, and limitations explicit, which can support transparent client communication.`,
      evidence: [
        recommendationReference("Tabbi Quadir"),
        recommendationReference("Shahriar Iqbal"),
        caseStudyReference(postcraftCaseStudy, "problem"),
      ],
    },
    {
      id: "scope-conversation",
      question:
        "What should a potential client discuss with Montasim before starting work?",
      text: `Discuss the target users, business outcome, privacy and security constraints, reliability expectations, integrations, delivery environment, ownership after launch, and what evidence will prove success. Montasim's portfolio supports complex product delivery, but price, capacity, timeline, and engagement terms are not publicly documented.`,
      evidence: [
        profileReference,
        caseStudyReference(postcraftCaseStudy, "problem"),
      ],
    },
    {
      id: "proof-of-work",
      question: "What proof can a client review before contacting Montasim?",
      text: `Clients can review ${projectCatalog.records.length} project records, ${projectCaseStudyCatalog.records.length} structured case studies, repository links and verified commits, live or package links where published, technical articles, professional experience, credentials, and attributed recommendations. That material supports a focused conversation about the closest comparable work.`,
      evidence: [
        catalogCountReference("projects", projectCatalog.records.length),
        catalogCountReference(
          "casestudy",
          projectCaseStudyCatalog.records.length
        ),
        catalogCountReference(
          "recommendations",
          recommendationCatalog.records.length
        ),
      ],
    },
  ]

  return seeds.map((seed) => answer("client-delivery-product-thinking", seed))
}

function buildContributionAnswers(): readonly ExactAnswer[] {
  const days = contributionCatalog.weeks.flatMap(
    (week) => week.contributionDays
  )
  const activeDays = days.filter((day) => day.contributionCount > 0)
  const activeWeeks = contributionCatalog.weeks.filter((week) =>
    week.contributionDays.some((day) => day.contributionCount > 0)
  )
  const busiestDay = days.reduce((busiest, day) =>
    day.contributionCount > busiest.contributionCount ? day : busiest
  )
  const firstDay = requiredItem(days.at(0), "First contribution day")
  const lastDay = requiredItem(days.at(-1), "Last contribution day")

  const activityReference = directFactReference(
    "derived:contribution-activity-summary"
  )
  const seeds: readonly AnswerSeed[] = [
    {
      id: "total",
      question: "How much GitHub contribution activity does Montasim publish?",
      text: `The portfolio's contribution snapshot records ${contributionCatalog.totalContributions.toLocaleString("en-US")} contributions. This is an activity measure for the published window, not a quality score; project, case-study, and professional records provide the evidence of what the work accomplished.`,
      evidence: [activityReference],
    },
    {
      id: "window",
      question: "What date range does Montasim's contribution snapshot cover?",
      text: `The published daily contribution window runs from ${firstDay.date} through ${lastDay.date}, across ${contributionCatalog.weeks.length} recorded weeks. The portfolio treats this as a bounded snapshot rather than a lifetime contribution total.`,
      evidence: [activityReference],
    },
    {
      id: "active-days",
      question:
        "On how many days does Montasim's snapshot show contribution activity?",
      text: `${activeDays.length} days in the published snapshot have at least one contribution. That describes visible activity frequency within the recorded window; it should be read alongside project records and documented outcomes rather than used alone to judge engineering effectiveness.`,
      evidence: [activityReference],
    },
    {
      id: "active-weeks",
      question: "How consistent is Montasim's weekly contribution activity?",
      text: `${activeWeeks.length} of the ${contributionCatalog.weeks.length} recorded weeks contain at least one contribution. This is useful activity context, while the portfolio's professional metrics and case-study outcomes remain stronger signals of impact and decision quality.`,
      evidence: [activityReference],
    },
    {
      id: "peak-day",
      question:
        "What is the busiest day in Montasim's published contribution snapshot?",
      text: `The highest daily value in the snapshot is ${busiestDay.contributionCount} contributions on ${busiestDay.date}. It is a factual peak in the supplied activity data, not evidence that one day was more valuable than another.`,
      evidence: [activityReference],
    },
    {
      id: "learning-evidence",
      question: "What evidence shows Montasim invests in continued learning?",
      text: `The portfolio combines ${certificationCatalog.records.length} credentials, ${skillCatalog.records.length} organized skill groups, recent project and case-study work, and ${contributionCatalog.totalContributions.toLocaleString("en-US")} contributions in the published activity snapshot. Colleagues also describe continuous learning and active personal-project work.`,
      evidence: [
        catalogCountReference(
          "certifications",
          certificationCatalog.records.length
        ),
        catalogCountReference("skills", skillCatalog.records.length),
        activityReference,
        recommendationReference("Mahmudul Ahsan"),
      ],
    },
    {
      id: "activity-interpretation",
      question:
        "What can a recruiter reasonably infer from Montasim's contribution graph?",
      text: `A recruiter can infer sustained visible development activity during the recorded window, with ${contributionCatalog.totalContributions.toLocaleString("en-US")} contributions across ${activeWeeks.length} active weeks. The graph cannot establish code quality, ownership, or business impact by itself, so those judgments should come from the role, project, and case-study evidence.`,
      evidence: [activityReference],
    },
  ]

  return seeds.map((seed) => answer("contributions-learning", seed))
}

export function buildPortfolioExactAnswers(): readonly ExactAnswer[] {
  return [
    ...buildProjectAnswers(),
    ...buildCaseStudyAnswers(),
    ...buildBlogAnswers(),
    ...buildCertificationAnswers(),
    ...buildExperienceAnswers(),
    ...buildSkillAnswers(),
    ...buildRecommendationAnswers(),
    ...buildAffiliationAnswers(),
    ...buildIdentityAnswers(),
    ...buildCareerImpactAnswers(),
    ...buildHiringFitAnswers(),
    ...buildLeadershipAnswers(),
    ...buildTechnicalDepthAnswers(),
    ...buildCatalogAnswers(),
    ...buildClientDeliveryAnswers(),
    ...buildContributionAnswers(),
  ]
}
