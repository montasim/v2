import {
  getExactAnswerCatalog,
  normalizeExactQuestion,
} from "@/features/chat/knowledge/exact-answer-catalog"
import type {
  ExactAnswerCategory,
  ExactAnswer,
} from "@/features/chat/knowledge/exact-answer-catalog"

export const evaluationCategoryTargets = {
  project: 42,
  "case-study": 62,
  blog: 22,
  certification: 32,
  experience: 9,
  skill: 7,
  recommendation: 11,
  affiliation: 5,
  "identity-current-availability": 10,
  "career-impact-metrics": 16,
  "hiring-fit-due-diligence": 23,
  "leadership-collaboration": 13,
  "technical-depth": 20,
  "catalog-chronology-comparison": 13,
  "client-delivery-product-thinking": 10,
  "contributions-learning": 5,
} as const satisfies Readonly<Record<ExactAnswerCategory, number>>

export type EvaluationAudience =
  | "hiring-manager"
  | "potential-client"
  | "engineering-leader"
  | "technical-peer"
  | "interviewer"

export type EvaluationEvidenceRequirement =
  "reference-overlap-required" | "reference-guidance"

export interface ChatEvaluationCase {
  readonly id: string
  readonly category: ExactAnswerCategory
  readonly audience: EvaluationAudience
  readonly question: string
  readonly referenceAnswerId: string
  readonly referenceQuestion: string
  readonly referenceAnswer: string
  readonly expectedFactIds: readonly [string, ...string[]]
  readonly supportingExcerpts: readonly [string, ...string[]]
  readonly evidenceRequirement: EvaluationEvidenceRequirement
}

type EvaluationAngleId =
  | "senior-shortlist"
  | "client-due-diligence"
  | "architecture-review"
  | "peer-evidence"
  | "interview-preparation"

interface EvaluationAngle {
  readonly id: EvaluationAngleId
  readonly audience: EvaluationAudience
}

const evaluationAngles: readonly EvaluationAngle[] = [
  { id: "senior-shortlist", audience: "hiring-manager" },
  { id: "client-due-diligence", audience: "potential-client" },
  { id: "architecture-review", audience: "engineering-leader" },
  { id: "peer-evidence", audience: "technical-peer" },
  { id: "interview-preparation", audience: "interviewer" },
] as const

const priorityReferenceIds = new Set([
  "identity-current-availability:introduction",
  "identity-current-availability:current-role",
  "career-impact-metrics:latest-professional-work",
  "career-impact-metrics:complex-professional-work",
  "career-impact-metrics:highest-signal-outcomes",
  "career-impact-metrics:top-tenth-interpretation",
  "career-impact-metrics:bounded-early-work",
  "hiring-fit-due-diligence:senior-case",
  "hiring-fit-due-diligence:weakness-due-diligence",
  "hiring-fit-due-diligence:candidate-comparison",
  "hiring-fit-due-diligence:recent-value",
  "hiring-fit-due-diligence:hiring-summary",
  "hiring-fit-due-diligence:next-step",
  "catalog-chronology-comparison:project-count",
  "catalog-chronology-comparison:case-study-count",
  "catalog-chronology-comparison:blog-count",
  "catalog-chronology-comparison:newest-project",
  "catalog-chronology-comparison:latest-blog",
  "catalog-chronology-comparison:evidence-relationship",
])

const smokeAnchorByCategory: Readonly<
  Partial<Record<ExactAnswerCategory, string>>
> = {
  "identity-current-availability": "identity-current-availability:introduction",
  "career-impact-metrics": "career-impact-metrics:top-tenth-interpretation",
  "hiring-fit-due-diligence": "hiring-fit-due-diligence:weakness-due-diligence",
  "catalog-chronology-comparison":
    "catalog-chronology-comparison:newest-project",
}

const entityEvidenceCategories = new Set<ExactAnswerCategory>([
  "case-study",
  "blog",
  "certification",
  "experience",
  "skill",
  "recommendation",
  "affiliation",
])

const directReferenceIds = new Set([
  "identity-current-availability:current-role",
  "identity-current-availability:location",
  "identity-current-availability:availability",
  "identity-current-availability:preferred-role",
  "identity-current-availability:work-arrangement",
  "identity-current-availability:timezone",
  "identity-current-availability:start-date",
  "identity-current-availability:contact",
  "career-impact-metrics:latest-professional-work",
  "career-impact-metrics:biometric-reliability",
  "career-impact-metrics:pose-performance",
  "career-impact-metrics:chatbot-refactor",
  "career-impact-metrics:application-performance",
  "career-impact-metrics:cloud-cost",
  "career-impact-metrics:healthcare-security",
  "career-impact-metrics:early-ai-integration",
  "career-impact-metrics:diagnosis-outcome",
  "career-impact-metrics:video-consultation",
])

const questionOverrides: Readonly<Record<string, string>> = {
  "identity-current-availability:introduction": "Introduce him.",
  "identity-current-availability:current-role":
    "What position does he hold now, and what does its scope involve?",
  "career-impact-metrics:latest-professional-work": "What is his latest work?",
  "identity-current-availability:headline":
    "How would you describe his professional profile in one evidence-based line?",
  "identity-current-availability:availability":
    "Is he publicly listed as open to another role?",
  "identity-current-availability:preferred-role":
    "What kinds of positions is he targeting?",
  "identity-current-availability:timezone":
    "Which time zone should a distributed team plan around?",
  "identity-current-availability:core-stack":
    "Which technologies form the center of his engineering work?",
  "identity-current-availability:full-stack-scope":
    "Does his portfolio show backend ownership as well as frontend depth?",
  "identity-current-availability:engineering-philosophy":
    "What principle guides the way he builds production software?",
  "identity-current-availability:contact":
    "Which published channel should a recruiter use to reach him?",
  "career-impact-metrics:highest-signal-outcomes":
    "If a recruiter reads only a few outcomes, which ones carry the most signal?",
  "career-impact-metrics:top-tenth-interpretation":
    "What falls within the top 10% of his lifetime work?",
  "career-impact-metrics:complex-professional-work":
    "What is his most complex work?",
  "career-impact-metrics:bounded-early-work":
    "Show me some of his less complex work.",
  "hiring-fit-due-diligence:senior-case": "Why should a company hire him?",
  "hiring-fit-due-diligence:weakness-due-diligence": "What is his weakness?",
  "hiring-fit-due-diligence:candidate-comparison":
    "How can a hiring manager compare him fairly without unsupported rankings?",
  "hiring-fit-due-diligence:recent-value":
    "What recent value would matter most to a prospective employer?",
  "hiring-fit-due-diligence:hiring-summary":
    "Summarize his hiring case using only concrete portfolio evidence.",
  "hiring-fit-due-diligence:next-step":
    "If his evidence fits an opening, what should the recruiter discuss next?",
  "catalog-chronology-comparison:project-count":
    "How many total projects does he have?",
  "catalog-chronology-comparison:case-study-count":
    "How many total case studies are there?",
  "catalog-chronology-comparison:blog-count":
    "How many total blogs are published?",
  "catalog-chronology-comparison:newest-project":
    "Using repository history, which project is the newest?",
  "catalog-chronology-comparison:latest-blog": "What is his latest blog?",
  "catalog-chronology-comparison:credential-count":
    "How many credentials are published in the portfolio?",
  "catalog-chronology-comparison:skill-group-count":
    "How many technical skill groups are documented?",
  "catalog-chronology-comparison:education-count":
    "How many education records can a visitor inspect?",
  "catalog-chronology-comparison:featured-projects":
    "What size is the portfolio's recruiter-focused project selection?",
  "catalog-chronology-comparison:authored-versus-linked-writing":
    "How is the writing catalog split between standalone and project-linked articles?",
  "catalog-chronology-comparison:project-case-study-coverage":
    "Do all published projects have a corresponding case study?",
  "catalog-chronology-comparison:catalog-breadth":
    "Which kinds of professional evidence can a visitor inspect?",
  "catalog-chronology-comparison:evidence-relationship":
    "How do the project records, case studies, and articles reinforce one another?",
  "contributions-learning:total":
    "What total contribution activity is published in the current snapshot?",
  "contributions-learning:active-days":
    "On how many days does the snapshot show activity?",
  "contributions-learning:active-weeks":
    "How consistently does the snapshot show weekly activity?",
  "contributions-learning:learning-evidence":
    "Which records show that he continues investing in learning?",
  "contributions-learning:activity-interpretation":
    "What can a recruiter responsibly infer from the contribution snapshot?",
}

let cachedCorpus: readonly ChatEvaluationCase[] | undefined

/** Builds the fixed, source-linked set used only by the evaluation runner. */
export function buildEvaluationCorpus(): readonly ChatEvaluationCase[] {
  if (cachedCorpus) return cachedCorpus

  const catalog = getExactAnswerCatalog()
  const normalizedExactQuestions = new Set(
    catalog.map((answer) => normalizeExactQuestion(answer.question))
  )
  const corpus: ChatEvaluationCase[] = []

  for (const [category, target] of typedEntries(evaluationCategoryTargets)) {
    const references = selectBalancedReferences(
      catalog.filter((answer) => answer.category === category),
      target
    )

    for (const reference of references) {
      const angle = evaluationAngles[corpus.length % evaluationAngles.length]
      const entry = toEvaluationCase(reference, angle)
      if (
        normalizedExactQuestions.has(normalizeExactQuestion(entry.question))
      ) {
        throw new Error(
          `Evaluation question unexpectedly exact-matches ${reference.id}`
        )
      }
      corpus.push(entry)
    }
  }

  if (corpus.length !== 300) {
    throw new Error(
      `Evaluation corpus requires 300 cases; received ${corpus.length}`
    )
  }

  assertUnique(
    corpus.map((entry) => entry.id),
    "case ID"
  )
  assertUnique(
    corpus.map((entry) => normalizeExactQuestion(entry.question)),
    "question"
  )
  const frozenCorpus: readonly ChatEvaluationCase[] = Object.freeze(
    corpus.map((entry) => Object.freeze(entry))
  )
  cachedCorpus = frozenCorpus
  return frozenCorpus
}

/** Selects a deterministic sample spanning the complete ordered corpus. */
export function selectEvaluationCases(
  cases: readonly ChatEvaluationCase[],
  limit: number
): readonly ChatEvaluationCase[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > cases.length) {
    throw new Error(
      `Evaluation case limit must be between 1 and ${cases.length}`
    )
  }
  if (limit === cases.length) return Object.freeze([...cases])

  const byCategory = new Map<ExactAnswerCategory, ChatEvaluationCase[]>()
  for (const evaluationCase of cases) {
    const categoryCases = byCategory.get(evaluationCase.category) ?? []
    categoryCases.push(evaluationCase)
    byCategory.set(evaluationCase.category, categoryCases)
  }

  const allCategoryQueues = [...byCategory.values()].map((categoryCases) =>
    balancedCaseOrder(categoryCases)
  )
  const categoryQueues =
    limit < allCategoryQueues.length
      ? evenlySpaced(allCategoryQueues, limit)
      : allCategoryQueues
  const selected: ChatEvaluationCase[] = []
  let round = 0
  while (selected.length < limit) {
    let addedInRound = false
    for (const queue of categoryQueues) {
      const evaluationCase = queue.at(round)
      if (!evaluationCase) continue
      selected.push(evaluationCase)
      addedInRound = true
      if (selected.length === limit) break
    }
    if (!addedInRound) break
    round += 1
  }

  if (selected.length !== limit) {
    throw new Error(`Could not select ${limit} balanced evaluation cases`)
  }
  return Object.freeze(selected)
}

function balancedCaseOrder(
  categoryCases: readonly ChatEvaluationCase[]
): readonly ChatEvaluationCase[] {
  const priority = categoryCases.filter((entry) =>
    priorityReferenceIds.has(entry.referenceAnswerId)
  )
  const category = requiredItem(categoryCases[0], "category case").category
  const smokeAnchorId = smokeAnchorByCategory[category]
  const anchor =
    categoryCases.find((entry) => entry.referenceAnswerId === smokeAnchorId) ??
    priority.at(-1) ??
    categoryCases.at(-1)
  if (!anchor) return []

  const result: ChatEvaluationCase[] = [anchor]
  const selectedIds = new Set([anchor.id])
  for (const evaluationCase of priority) {
    if (selectedIds.has(evaluationCase.id)) continue
    result.push(evaluationCase)
    selectedIds.add(evaluationCase.id)
  }

  const remaining = categoryCases.filter((entry) => !selectedIds.has(entry.id))
  const selectedIndexes = result.map((entry) => categoryCases.indexOf(entry))
  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = -1
    for (let index = 0; index < remaining.length; index += 1) {
      const sourceIndex = categoryCases.indexOf(
        requiredItem(remaining[index], "remaining evaluation case")
      )
      const distance = Math.min(
        ...selectedIndexes.map((selectedIndex) =>
          Math.abs(sourceIndex - selectedIndex)
        )
      )
      if (distance > bestDistance) {
        bestIndex = index
        bestDistance = distance
      }
    }
    const [next] = remaining.splice(bestIndex, 1)
    const evaluationCase = requiredItem(next, "balanced evaluation case")
    result.push(evaluationCase)
    selectedIndexes.push(categoryCases.indexOf(evaluationCase))
  }
  return result
}

function selectBalancedReferences(
  references: readonly ExactAnswer[],
  target: number
) {
  if (references.length < target) {
    throw new Error(
      `Evaluation category ${references[0]?.category ?? "unknown"} requires ${target} references; received ${references.length}`
    )
  }

  if (
    references[0]?.category === "project" ||
    references[0]?.category === "case-study"
  ) {
    return selectAcrossEntitiesAndVariants(references, target)
  }

  const required = references.filter((answer) =>
    priorityReferenceIds.has(answer.id)
  )
  const remaining = references.filter(
    (answer) => !priorityReferenceIds.has(answer.id)
  )
  const selected = [
    ...required,
    ...evenlySpaced(remaining, target - required.length),
  ]
  const selectedIds = new Set(selected.map((answer) => answer.id))
  return references.filter((answer) => selectedIds.has(answer.id))
}

/**
 * Project and case-study records are emitted in two- and three-record entity
 * groups. Sampling the flat list at a fixed interval can erase a whole variant
 * (for example every architecture record), so distribute coverage per entity
 * and rotate the chosen variants instead.
 */
function selectAcrossEntitiesAndVariants(
  references: readonly ExactAnswer[],
  target: number
) {
  const groups = new Map<string, ExactAnswer[]>()
  for (const reference of references) {
    const separator = reference.id.lastIndexOf(":")
    const entityId = reference.id.slice(0, separator)
    const group = groups.get(entityId) ?? []
    group.push(reference)
    groups.set(entityId, group)
  }

  const entityGroups = [...groups.values()]
  const selectionsPerEntity = Math.floor(target / entityGroups.length)
  const entitiesWithExtraSelection = new Set(
    evenlySpaced(
      entityGroups.map((_, index) => index),
      target % entityGroups.length
    )
  )
  const selectedIds = new Set<string>()

  entityGroups.forEach((group, groupIndex) => {
    const count =
      selectionsPerEntity + (entitiesWithExtraSelection.has(groupIndex) ? 1 : 0)
    for (let offset = 0; offset < count; offset += 1) {
      const reference = requiredItem(
        group[(groupIndex + offset) % group.length],
        "entity reference variant"
      )
      selectedIds.add(reference.id)
    }
  })

  return references.filter((reference) => selectedIds.has(reference.id))
}

function evenlySpaced<T>(values: readonly T[], count: number): readonly T[] {
  if (count <= 0) return []
  if (count >= values.length) return values
  if (count === 1) return [requiredItem(values.at(-1), "balanced reference")]

  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.round((index * (values.length - 1)) / (count - 1))
    return requiredItem(values[sourceIndex], "balanced reference")
  })
}

function toEvaluationCase(
  reference: ExactAnswer,
  angle: EvaluationAngle
): ChatEvaluationCase {
  return {
    id: `dynamic-eval:${reference.id}:${angle.id}`,
    category: reference.category,
    audience: angle.audience,
    question: paraphraseQuestion(reference, angle),
    referenceAnswerId: reference.id,
    referenceQuestion: reference.question,
    referenceAnswer: reference.text,
    expectedFactIds: reference.factIds,
    supportingExcerpts: reference.supportingExcerpts,
    evidenceRequirement: evidenceRequirement(reference),
  }
}

function paraphraseQuestion(reference: ExactAnswer, angle: EvaluationAngle) {
  const overridden = questionOverrides[reference.id]
  if (overridden) return overridden

  const question = reference.question.replace(/\?$/u, "")
  const quotedTitle = question.match(/[“"](.+)[”"]/u)?.[1]
  const audienceName = audienceLabel(angle.audience)
  let match: RegExpMatchArray | null

  if ((match = question.match(/^What is Montasim's (.+) project$/u))) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What does ${match[1]} reveal about his product-engineering range?`,
      "client-due-diligence": `What problem does ${match[1]} solve, and what did he build?`,
      "architecture-review": `What scope and engineering ownership does ${match[1]} demonstrate?`,
      "peer-evidence": `How does ${match[1]} work from a technical and product perspective?`,
      "interview-preparation": `What should an interviewer understand about his work on ${match[1]}?`,
    })
  }
  if (
    (match = question.match(/^Which technologies did Montasim use for (.+)$/u))
  ) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which engineering skills and technologies did he apply to ${match[1]}?`,
      "client-due-diligence": `Which technology choices support ${match[1]}?`,
      "architecture-review": `What stack and architectural concerns are documented for ${match[1]}?`,
      "peer-evidence": `How was ${match[1]} implemented technically?`,
      "interview-preparation": `Which parts of his stack are evidenced by ${match[1]}?`,
    })
  }
  if (
    (match = question.match(
      /^What problem did Montasim address in the (.+) case study$/u
    ))
  ) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What challenge makes ${match[1]} a meaningful delivery example?`,
      "client-due-diligence": `What user or business problem did ${match[1]} need to solve?`,
      "architecture-review": `Which system constraints defined the problem behind ${match[1]}?`,
      "peer-evidence": `What was difficult about the starting point for ${match[1]}?`,
      "interview-preparation": `What problem context matters before discussing ${match[1]} in an interview?`,
    })
  }
  if (
    (match = question.match(/^How did Montasim structure the (.+) solution$/u))
  ) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which architecture decisions in ${match[1]} show senior-level judgment?`,
      "client-due-diligence": `How was ${match[1]} structured to meet its delivery constraints?`,
      "architecture-review": `How would you review the system design behind ${match[1]}?`,
      "peer-evidence": `What are the main technical boundaries in ${match[1]}?`,
      "interview-preparation": `Which design decisions from ${match[1]} deserve deeper interview discussion?`,
    })
  }
  if (
    (match = question.match(
      /^What did Montasim deliver and achieve with (.+)$/u
    ))
  ) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What does the delivery record for ${match[1]} show about his impact?`,
      "client-due-diligence": `What did he ship for ${match[1]}, and what outcome did it produce?`,
      "architecture-review": `Which implementation results are documented for ${match[1]}?`,
      "peer-evidence": `What concrete engineering contributions did he make to ${match[1]}?`,
      "interview-preparation": `Which ${match[1]} outcomes should an interviewer probe further?`,
    })
  }
  if (reference.category === "blog" && quotedTitle) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What does “${quotedTitle}” reveal about his engineering judgment?`,
      "client-due-diligence": `Which practical delivery lesson emerges from “${quotedTitle}”?`,
      "architecture-review": `Which architecture insight is developed in “${quotedTitle}”?`,
      "peer-evidence": `What can another engineer learn from “${quotedTitle}”?`,
      "interview-preparation": `Which discussion point from “${quotedTitle}” belongs in a technical interview?`,
    })
  }
  if (reference.category === "certification" && quotedTitle) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What capability does the “${quotedTitle}” credential add to his profile?`,
      "client-due-diligence": `Which relevant learning is documented by “${quotedTitle}”?`,
      "architecture-review": `Which technical subject does “${quotedTitle}” validate?`,
      "peer-evidence": `What knowledge area is evidenced by “${quotedTitle}”?`,
      "interview-preparation": `What could an interviewer verify from the “${quotedTitle}” credential?`,
    })
  }
  if ((match = question.match(/^What did Montasim do as (.+)$/u))) {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which responsibilities and outcomes define his time as ${match[1]}?`,
      "client-due-diligence": `What did he own and deliver while working as ${match[1]}?`,
      "architecture-review": `How broad was his engineering scope as ${match[1]}?`,
      "peer-evidence": `What hands-on work is documented from his role as ${match[1]}?`,
      "interview-preparation": `Which achievements from his ${match[1]} role merit interview follow-up?`,
    })
  }
  if (
    (match = question.match(/^What skills did Montasim apply in his (.+)$/u))
  ) {
    return `Which capabilities did he put into practice in his ${match[1]}?`
  }
  if ((match = question.match(/^Which (.+) skills does Montasim document$/u))) {
    return `What does his published toolkit cover in ${match[1]}?`
  }
  if (
    (match = question.match(
      /^What professional feedback did (.+) give about Montasim$/u
    ))
  ) {
    return `How did ${match[1]} describe working with him?`
  }
  if ((match = question.match(/^What did Montasim study at (.+)$/u))) {
    return `What educational focus is recorded for his time at ${match[1]}?`
  }
  if ((match = question.match(/^How was Montasim involved with (.+)$/u))) {
    return `Which responsibilities did he hold with ${match[1]}?`
  }
  if (
    (match = question.match(/^What volunteering did Montasim do with (.+)$/u))
  ) {
    return `How did he contribute as a volunteer with ${match[1]}?`
  }

  return topicQuestion(reference, angle, audienceName)
}

function topicQuestion(
  reference: ExactAnswer,
  angle: EvaluationAngle,
  audienceName: string
) {
  const topic =
    evaluationTopicByReferenceId[reference.id] ??
    humanizeTopic(reference.id.split(":").at(-1) ?? reference.id)
  if (reference.category === "hiring-fit-due-diligence") {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `What evidence supports his fit for ${topic}?`,
      "client-due-diligence": `Which parts of his record reduce delivery risk for ${topic}?`,
      "architecture-review": `Which technical outcomes show his readiness for ${topic}?`,
      "peer-evidence": `What shipped work demonstrates his fit for ${topic}?`,
      "interview-preparation": `What should an interviewer verify about his fit for ${topic}?`,
    })
  }
  if (reference.category === "leadership-collaboration") {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which evidence demonstrates ${topic}?`,
      "client-due-diligence": `How does his record show ${topic} in delivery work?`,
      "architecture-review": `Where has he applied ${topic} in engineering practice?`,
      "peer-evidence": `Which observed examples support ${topic}?`,
      "interview-preparation": `What should an interviewer ask about ${topic}?`,
    })
  }
  if (reference.category === "technical-depth") {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which shipped work best demonstrates his depth in ${topic}?`,
      "client-due-diligence": `What delivery evidence shows he can apply ${topic}?`,
      "architecture-review": `How has he applied ${topic} in production systems?`,
      "peer-evidence": `Which technical examples prove hands-on experience with ${topic}?`,
      "interview-preparation": `What should a technical interview explore about his work with ${topic}?`,
    })
  }
  if (reference.category === "client-delivery-product-thinking") {
    return chooseAngleTemplate(angle, {
      "senior-shortlist": `Which portfolio evidence demonstrates ${topic}?`,
      "client-due-diligence": `How has he applied ${topic} to a real delivery constraint?`,
      "architecture-review": `Which design decisions reveal ${topic}?`,
      "peer-evidence": `What shipped example best supports ${topic}?`,
      "interview-preparation": `Which case would help an interviewer assess ${topic}?`,
    })
  }

  const templates: Readonly<Record<ExactAnswerCategory, string>> = {
    project: `What should ${audienceName} know about the ${topic} project?`,
    "case-study": `Which decisions and results matter most in the ${topic} case study?`,
    blog: `Which engineering lesson is developed in the ${topic} article?`,
    certification: `Which learning area does the ${topic} credential establish?`,
    experience: `What does the ${topic} experience record reveal about his scope?`,
    skill: `Which practical capabilities sit within his ${topic} toolkit?`,
    recommendation: `What observed working qualities appear in the ${topic} recommendation?`,
    affiliation: `What does the ${topic} affiliation add to his background?`,
    "identity-current-availability": `What should ${audienceName} know about his ${topic}?`,
    "career-impact-metrics": `Which concrete results best illustrate ${topic}?`,
    "hiring-fit-due-diligence": `Which records should ${audienceName} use to assess ${topic}?`,
    "leadership-collaboration": `Which published examples illustrate ${topic}?`,
    "technical-depth": `Which shipped examples show his experience with ${topic}?`,
    "catalog-chronology-comparison": `What does the catalog show about ${topic}?`,
    "client-delivery-product-thinking": `Which case studies best demonstrate ${topic}?`,
    "contributions-learning": `What does the contribution history establish about ${topic}?`,
  }
  const base = templates[reference.category]
  if (angle.id === "senior-shortlist") return base
  const lenses: Readonly<Record<EvaluationAngleId, string>> = {
    "senior-shortlist": base,
    "client-due-diligence": `${base.slice(0, -1)} from a delivery-risk perspective?`,
    "architecture-review": `${base.slice(0, -1)} from an architecture-review perspective?`,
    "peer-evidence": `${base.slice(0, -1)} through shipped technical evidence?`,
    "interview-preparation": `${base.slice(0, -1)} for a focused interview?`,
  }
  return lenses[angle.id]
}

const evaluationTopicByReferenceId: Readonly<Record<string, string>> = {
  "hiring-fit-due-diligence:senior-frontend-fit": "a senior frontend role",
  "hiring-fit-due-diligence:full-stack-fit": "a full-stack role",
  "hiring-fit-due-diligence:ai-product-fit": "an AI-enabled product team",
  "hiring-fit-due-diligence:saas-fit": "a SaaS platform team",
  "hiring-fit-due-diligence:product-engineering-fit":
    "a product-engineering role",
  "hiring-fit-due-diligence:reliability-fit": "a reliability-sensitive product",
  "hiring-fit-due-diligence:performance-fit":
    "performance-critical product work",
  "hiring-fit-due-diligence:cost-aware-fit": "cost-conscious engineering",
  "hiring-fit-due-diligence:security-fit": "security-conscious web work",
  "hiring-fit-due-diligence:technical-lead-fit":
    "technical leadership responsibilities",
  "hiring-fit-due-diligence:cross-functional-fit":
    "cross-functional product work",
  "hiring-fit-due-diligence:mentoring-fit": "an engineering mentoring role",
  "hiring-fit-due-diligence:client-project-fit": "a complex client web product",
  "hiring-fit-due-diligence:enterprise-fit": "an enterprise platform team",
  "hiring-fit-due-diligence:ambiguity-handling":
    "ambiguous engineering problems",
  "hiring-fit-due-diligence:quality-discipline": "quality-focused engineering",
  "hiring-fit-due-diligence:core-strengths":
    "the role requirements that match his strongest capabilities",
  "hiring-fit-due-diligence:scale-validation": "larger-scale system ownership",
  "hiring-fit-due-diligence:interview-focus":
    "the highest-value interview topics",
  "hiring-fit-due-diligence:ownership-signal":
    "ownership beyond assigned tickets",
  "hiring-fit-due-diligence:evidence-confidence":
    "an evidence-led hiring decision",
  "leadership-collaboration:current-scope":
    "leadership in his current engineering scope",
  "leadership-collaboration:review-culture": "ownership in code review",
  "leadership-collaboration:design-partnership":
    "partnership with product design",
  "leadership-collaboration:requirements-translation":
    "translating business needs for engineers",
  "leadership-collaboration:junior-support":
    "helping junior engineers through blockers",
  "leadership-collaboration:knowledge-sharing": "sharing engineering knowledge",
  "leadership-collaboration:proactivity": "proactive problem-solving",
  "leadership-collaboration:communication": "clear professional communication",
  "leadership-collaboration:quality-culture":
    "leadership in engineering quality",
  "leadership-collaboration:teamwork": "dependable collaboration",
  "leadership-collaboration:early-leadership":
    "leadership before his senior role",
  "leadership-collaboration:volunteer-leadership":
    "coordination beyond paid engineering work",
  "leadership-collaboration:leadership-style":
    "the leadership style described by colleagues",
  "technical-depth:frontend-architecture": "frontend architecture",
  "technical-depth:react-depth": "React",
  "technical-depth:nextjs-depth": "Next.js",
  "technical-depth:node-backend": "Node.js backend development",
  "technical-depth:database-range": "databases and data access",
  "technical-depth:ai-integration": "AI product integration",
  "technical-depth:browser-extension": "browser-extension engineering",
  "technical-depth:azure-cloud": "cloud and DevOps delivery",
  "technical-depth:delivery-automation": "CI/CD and release automation",
  "technical-depth:performance-engineering": "performance engineering",
  "technical-depth:testing-quality": "testing and quality tooling",
  "technical-depth:api-design": "API design",
  "technical-depth:authentication": "authentication and identity",
  "technical-depth:async-workflows": "durable asynchronous workflows",
  "technical-depth:privacy-boundaries": "privacy and trust boundaries",
  "technical-depth:architecture-range": "system design",
  "technical-depth:deep-boundaries":
    "module boundaries that control complexity",
  "technical-depth:multi-tenant-saas": "multi-tenant SaaS systems",
  "technical-depth:computer-vision": "computer vision",
  "technical-depth:developer-tool-scale": "scalable developer tooling",
  "client-delivery-product-thinking:end-to-end-delivery":
    "end-to-end product delivery",
  "client-delivery-product-thinking:publishing-product":
    "product judgment for publishing workflows",
  "client-delivery-product-thinking:privacy-product":
    "privacy-conscious product design",
  "client-delivery-product-thinking:configurable-platform":
    "configurable platform design",
  "client-delivery-product-thinking:release-confidence": "release confidence",
  "client-delivery-product-thinking:constraint-discovery":
    "discovery of hidden delivery constraints",
  "client-delivery-product-thinking:business-economics":
    "attention to project economics",
  "client-delivery-product-thinking:multi-platform-product":
    "multi-platform product thinking",
  "client-delivery-product-thinking:working-style":
    "a client-ready working style",
  "client-delivery-product-thinking:proof-of-work": "reviewable proof of work",
}

function chooseAngleTemplate(
  angle: EvaluationAngle,
  templates: Readonly<Record<EvaluationAngleId, string>>
) {
  return templates[angle.id]
}

function evidenceRequirement(
  reference: ExactAnswer
): EvaluationEvidenceRequirement {
  if (reference.category === "project") {
    return reference.id.endsWith(":technology")
      ? "reference-overlap-required"
      : "reference-guidance"
  }
  if (entityEvidenceCategories.has(reference.category)) {
    return "reference-overlap-required"
  }
  if (directReferenceIds.has(reference.id)) {
    return "reference-overlap-required"
  }
  if (
    reference.category === "catalog-chronology-comparison" &&
    /(?:-count|newest-project|latest-blog|credential-year-range)$/u.test(
      reference.id
    )
  ) {
    return "reference-overlap-required"
  }
  if (
    reference.category === "contributions-learning" &&
    /:(?:total|window|active-days|active-weeks|peak-day)$/u.test(reference.id)
  ) {
    return "reference-overlap-required"
  }
  return "reference-guidance"
}

function audienceLabel(audience: EvaluationAudience) {
  const labels: Readonly<Record<EvaluationAudience, string>> = {
    "hiring-manager": "a hiring manager",
    "potential-client": "a prospective client",
    "engineering-leader": "an engineering leader",
    "technical-peer": "a technical peer",
    interviewer: "an interviewer",
  }
  return labels[audience]
}

function humanizeTopic(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\bai\b/giu, "AI")
    .replace(/\bapi\b/giu, "API")
    .replace(/\bsaas\b/giu, "SaaS")
    .replace(/\bnextjs\b/giu, "Next.js")
    .replace(/\breact depth\b/giu, "React")
    .replace(/\bdepth\b/giu, "engineering depth")
}

function requiredItem<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new Error(`${context} is required`)
  return value
}

function typedEntries<T extends Readonly<Record<string, number>>>(value: T) {
  return Object.entries(value) as Array<[keyof T & string, T[keyof T]]>
}

function assertUnique(values: readonly string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`Evaluation corpus contains duplicate ${label}s`)
  }
}
