import { describe, expect, it } from "vitest"

import { prepareFullContextGeneration } from "@/features/chat/application/full-context-generation"
import type {
  CompiledPortfolioKnowledge,
  PortfolioKnowledgeCitation,
  PortfolioKnowledgeFact,
} from "@/features/chat/knowledge/portfolio-knowledge-types"

const facts: readonly PortfolioKnowledgeFact[] = [
  {
    id: "experience:senior",
    source: "experience",
    recordId: "senior",
    label: "Senior Software Engineer at MyMedicalHub",
    data: {
      role: "Senior Software Engineer",
      company: "MyMedicalHub International Ltd.",
      period: "Oct 2025 - Present",
      description:
        "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
    },
    evidenceRole: "first-party-portfolio",
    citationId: "experience:senior",
  },
  {
    id: "recommendation:1:peer",
    source: "recommendations",
    recordId: "peer",
    label: "Peer recommendation",
    data: {
      name: "Peer Reviewer",
      description: "Montasim communicates clearly and supports his teammates.",
    },
    evidenceRole: "professional-observation",
    citationId: "recommendation:1:peer",
  },
  {
    id: "project:postcraft",
    source: "projects",
    recordId: "postcraft",
    label: "PostCraft",
    data: {
      title: "PostCraft",
      description:
        "A resilient publishing workflow with durable scheduling and reviewable status transitions.",
    },
    evidenceRole: "first-party-portfolio",
    citationId: "project:postcraft",
  },
]

const citations: readonly PortfolioKnowledgeCitation[] = [
  {
    id: "experience:senior",
    source: "experience",
    recordId: "senior",
    label: "Senior Software Engineer at MyMedicalHub",
    href: "/experience#senior",
  },
  {
    id: "recommendation:1:peer",
    source: "recommendations",
    recordId: "peer",
    label: "Peer recommendation",
    href: "/recommendations#peer",
  },
  {
    id: "project:postcraft",
    source: "projects",
    recordId: "postcraft",
    label: "PostCraft",
    href: "/projects#postcraft",
  },
]

function knowledgeFixture(
  fixtureFacts: readonly PortfolioKnowledgeFact[] = facts,
  fixtureCitations: readonly PortfolioKnowledgeCitation[] = citations
): CompiledPortfolioKnowledge {
  const factsById = new Map(fixtureFacts.map((fact) => [fact.id, fact]))
  const citationsById = new Map(
    fixtureCitations.map((citation) => [citation.id, citation])
  )

  return {
    schemaVersion: "portfolio-knowledge/v1",
    toon: "schemaVersion: portfolio-knowledge/v1\nevidence[3]{id,data}:\n  experience:senior,{role: Senior Software Engineer}",
    hash: "knowledge-hash",
    sourceManifest: {
      schemaVersion: "portfolio-source-manifest/v1",
      sources: [],
    },
    facts: fixtureFacts,
    citations: fixtureCitations,
    relationships: [],
    derived: {
      catalogCounts: [],
      currentRole: {
        recordId: "senior",
        role: "Senior Software Engineer",
        company: "MyMedicalHub International Ltd.",
        period: "Oct 2025 - Present",
        factId: "derived:current-role",
      },
      projectChronology: [],
      newestProjectFactId: "derived:newest-project-by-github-history",
      latestDatedBlog: {
        recordId: "postcraft",
        title: "PostCraft",
        publishedAt: "2026-08-20",
        tiedRecordIds: ["postcraft"],
        tiedCount: 1,
        tieBreak: "catalog-order",
        factId: "derived:latest-dated-blog",
      },
    },
    findFact(id) {
      return factsById.get(id)
    },
    findCitation(id) {
      return citationsById.get(id)
    },
    textForFact(id) {
      const fact = factsById.get(id)
      if (!fact) return undefined
      const flatten = (value: unknown): string => {
        if (value === null) return "null"
        if (typeof value === "string") return value
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value)
        }
        if (Array.isArray(value)) return value.map(flatten).join("\n")
        if (typeof value === "object") {
          return Object.values(value).map(flatten).join("\n")
        }
        return ""
      }
      return flatten(fact.data)
    },
  }
}

describe("full-context generation", () => {
  it("prepares the complete knowledge packet and trusted previous exchange", () => {
    const knowledge = knowledgeFixture()
    const attempt = prepareFullContextGeneration({
      question: "What did he build there?",
      trustedPreviousExchange: {
        question: "Where does Montasim work?",
        answer:
          "Montasim is a Senior Software Engineer at MyMedicalHub International Ltd.",
      },
      knowledge,
    })

    expect(attempt.providerRequest.system).toContain(knowledge.toon)
    expect(attempt.providerRequest.system).toContain("third person")
    expect(attempt.providerRequest.system).toContain("20")
    expect(attempt.providerRequest.system).toContain("180")
    expect(attempt.providerRequest.system).toContain("220")
    expect(attempt.providerRequest.messages).toEqual([
      {
        role: "user",
        content: JSON.stringify({
          trustedPreviousExchange: {
            question: "Where does Montasim work?",
            answer:
              "Montasim is a Senior Software Engineer at MyMedicalHub International Ltd.",
          },
          currentQuestion: "What did he build there?",
        }),
      },
    ])
  })

  it("adapts the requested answer length to question complexity", () => {
    const knowledge = knowledgeFixture()

    const direct = prepareFullContextGeneration({
      question: "How many projects are documented?",
      knowledge,
    })
    const analytical = prepareFullContextGeneration({
      question:
        "Why should a hiring manager choose Montasim for a technically complex real-time AI platform?",
      knowledge,
    })

    expect(direct.providerRequest.system).toContain(
      "For this question, target 20 to 90 words"
    )
    expect(analytical.providerRequest.system).toContain(
      "For this question, target 90 to 180 words"
    )

    const dueDiligence = prepareFullContextGeneration({
      question: "What are his weaknesses?",
      knowledge,
    })
    expect(dueDiligence.providerRequest.system).toContain(
      "For this question, target 90 to 180 words"
    )
  })

  it("requires strict claim JSON without model-authored citations", () => {
    const system = prepareFullContextGeneration({
      question: "Why hire Montasim?",
      knowledge: knowledgeFixture(),
    }).providerRequest.system

    expect(system).toContain("Return one JSON object and nothing else")
    expect(system).toContain('"interpretation"')
    expect(system).toContain('"mode":"answer"')
    expect(system).toContain('"type":"fact|synthesis|boundary"')
    expect(system).toContain('"factIds"')
    expect(system).toContain('"supportingExcerpts"')
    expect(system).toContain("positionally aligned")
    expect(system).toContain("Do not return citation URLs")
    expect(system).toContain("professional-observation")
    expect(system).toContain("does not establish a verified personal weakness")
    expect(system).toContain("two to four decision-relevant boundaries")
    expect(system).toContain("focused or bounded delivery")
    expect(system).toContain("strongest documented evidence")
    expect(system).toContain("derived chronology")
  })

  it("accepts supported claims and derives citations from compiled facts", () => {
    const attempt = prepareFullContextGeneration({
      question: "What technically complex work has Montasim delivered?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "Montasim's documented engineering work demonstrates dependable real-time AI delivery. He architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation. For a hiring manager, that combination shows he can turn unstable live-analysis behavior into explicit state design while preserving demanding real-time performance."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation:
          "Select a high-signal example of documented technical complexity.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "accepted",
      answer: {
        mode: "answer",
        text,
        evidenceIds: ["experience:senior"],
        citations: [
          {
            label: "Senior Software Engineer at MyMedicalHub",
            href: "/experience#senior",
            kind: "experience",
          },
        ],
      },
    })
  })

  it("ignores extra model-authored citation fields and derives canonical citations", () => {
    const attempt = prepareFullContextGeneration({
      question: "What technically complex work has Montasim delivered?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "Montasim architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability and sustained 60 FPS pose estimation. For a hiring manager, this is concrete evidence that he can replace unstable real-time behavior with explicit state design while preserving demanding live-analysis performance."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain one documented complex system.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
            citation: "https://invented.example/ignored",
          },
        ],
        citations: ["https://invented.example/ignored"],
      })
    )

    expect(result).toMatchObject({
      status: "accepted",
      answer: {
        citations: [
          {
            label: "Senior Software Engineer at MyMedicalHub",
            href: "/experience#senior",
          },
        ],
      },
    })
  })

  it("does not join sentence-ending abbreviations into a proper name", () => {
    const attempt = prepareFullContextGeneration({
      question: "What work best represents him?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "Mohammad's documented engineering work includes a finite-state-machine biometric engine with deterministic transitions for 99.9% reliability and pose estimation sustained at 60 FPS. For a hiring manager, this is useful evidence that he can replace unstable live-analysis behavior with explicit state design while preserving demanding real-time performance in a healthcare product."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Select a high-signal example of documented work.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("accepts a documented role-at-company name assembled from one fact", () => {
    const attempt = prepareFullContextGeneration({
      question: "What role does he hold?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "Mohammad Montasim Al Mamun Shuvo is a Senior Software Engineer at MyMedicalHub International Ltd. His documented work there includes a finite-state-machine biometric engine with deterministic transitions for 99.9% reliability and pose estimation sustained at 60 FPS, giving hiring managers concrete evidence of senior ownership across state design and real-time AI performance."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the documented current role and its scope.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("does not treat a sentence-leading location preposition as part of a name", () => {
    const attempt = prepareFullContextGeneration({
      question:
        "What evidence suggests he can modernize frontend systems reliably?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "At MyMedicalHub, Montasim replaced unstable real-time behavior with a finite-state-machine biometric engine using deterministic transitions for 99.9% reliability and sustained 60 FPS pose estimation. For a hiring manager, that is concrete evidence that his modernization work combines architectural discipline with demanding live-analysis performance rather than treating reliability as a later patch."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation:
          "Explain documented frontend modernization and reliability evidence.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("still rejects an undocumented company after a sentence-leading preposition", () => {
    const attempt = prepareFullContextGeneration({
      question: "Where did he deliver the biometric engine?",
      knowledge: knowledgeFixture(),
    })
    const text =
      "At InventedCorp, Montasim delivered a finite-state-machine biometric engine with deterministic transitions for 99.9% reliability and sustained 60 FPS pose estimation. For a hiring manager, the cited technical result remains useful evidence of dependable real-time engineering, but the company attribution is not documented by the portfolio fact and must not be introduced by the model."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Identify the documented delivery context.",
        mode: "answer",
        claims: [
          {
            text,
            type: "fact",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unsupported-name", claimIndex: 0 }],
    })
  })

  it("rejects a number that is absent from the aligned evidence", () => {
    const attempt = prepareFullContextGeneration({
      question: "How reliable was the biometric engine?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the documented reliability result.",
        mode: "answer",
        claims: [
          {
            text: "Montasim delivered a biometric engine with 100% reliability during AI analysis. That result makes the system a useful example for hiring managers evaluating real-time engineering, because it connects deterministic state design to an explicit operational outcome while keeping live pose-estimation work responsive under practical production demands.",
            type: "fact",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unsupported-number", claimIndex: 0 }],
    })
  })

  it("treats Markdown emphasis as presentation rather than evidence text", () => {
    const markedFacts = facts.map((fact) =>
      fact.id === "experience:senior"
        ? {
            ...fact,
            data: {
              role: "Senior Software Engineer",
              company: "MyMedicalHub International Ltd.",
              period: "Oct 2025 - Present",
              description:
                "Architected a **finite-state-machine** biometric engine with deterministic state transitions for **99.9% reliability** during AI analysis and sustained 60 FPS pose estimation.",
            },
          }
        : fact
    )
    const attempt = prepareFullContextGeneration({
      question: "What technically complex work has he delivered?",
      knowledge: knowledgeFixture(markedFacts),
    })
    const text =
      "Montasim architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation. For a hiring manager, that evidence shows he can replace unstable live-analysis behavior with explicit state design while preserving demanding real-time performance in a healthcare product."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain a documented complex system.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("accepts a concise derived count supported by its visible fact label", () => {
    const countFact: PortfolioKnowledgeFact = {
      id: "derived:catalog-count:projects",
      source: "derived",
      recordId: "projects",
      label: "projects record count",
      data: { source: "projects", count: 31 },
      evidenceRole: "derived-fact",
      citationId: "project:postcraft",
    }
    const attempt = prepareFullContextGeneration({
      question: "How many projects are documented?",
      knowledge: knowledgeFixture([...facts, countFact]),
    })
    const text =
      "Montasim's portfolio documents 31 projects, giving hiring managers a broad set of implementations to inspect across products, tools, and engineering case studies."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Give the derived project count.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["derived:catalog-count:projects"],
            supportingExcerpts: ["projects record count"],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("accepts a natural-language date supported by an ISO catalog date", () => {
    const datedFact: PortfolioKnowledgeFact = {
      id: "derived:latest-dated-project-note",
      source: "derived",
      recordId: "postcraft",
      label: "Latest dated project note",
      data: { title: "PostCraft", publishedAt: "2026-08-24" },
      evidenceRole: "derived-fact",
      citationId: "project:postcraft",
    }
    const attempt = prepareFullContextGeneration({
      question: "When was the latest project note dated?",
      knowledge: knowledgeFixture([...facts, datedFact]),
    })
    const text =
      "The latest documented PostCraft note is dated August 24, 2026. That timestamp gives reviewers a precise chronology marker without implying a separate release date or a newer implementation milestone."

    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Give the latest documented note date.",
        mode: "answer",
        claims: [
          {
            text,
            type: "boundary",
            factIds: ["derived:latest-dated-project-note"],
            supportingExcerpts: ["publishedAt: 2026-08-24"],
          },
        ],
      })
    )

    expect(result).toMatchObject({ status: "accepted" })
  })

  it("requires latest-blog answers to disclose a shared-date tie", () => {
    const latestFact: PortfolioKnowledgeFact = {
      id: "derived:latest-dated-blog",
      source: "derived",
      recordId: "article-one",
      label: "Latest dated blog record",
      data: {
        title: "Article One",
        publishedAt: "2026-08-24",
        tiedRecordIds: ["article-one", "article-two"],
        tiedCount: 2,
        tieBreak: "catalog-order",
      },
      evidenceRole: "derived-fact",
      citationId: "blog:article-one",
    }
    const latestCitation: PortfolioKnowledgeCitation = {
      id: "blog:article-one",
      source: "blog",
      recordId: "article-one",
      label: "Article One",
      href: "/blog/article-one",
    }
    const base = knowledgeFixture(
      [...facts, latestFact],
      [...citations, latestCitation]
    )
    const knowledge: CompiledPortfolioKnowledge = {
      ...base,
      derived: {
        ...base.derived,
        latestDatedBlog: {
          recordId: "article-one",
          title: "Article One",
          publishedAt: "2026-08-24",
          tiedRecordIds: ["article-one", "article-two"],
          tiedCount: 2,
          tieBreak: "catalog-order",
          factId: "derived:latest-dated-blog",
        },
      },
    }
    const attempt = prepareFullContextGeneration({
      question: "What is his latest blog?",
      knowledge,
    })
    const unsupportedBoundary = attempt.evaluate(
      JSON.stringify({
        interpretation: "Identify the latest dated blog record.",
        mode: "answer",
        claims: [
          {
            text: "Article One is the latest dated blog record, published on August 24, 2026. It gives hiring managers a direct starting point for reviewing Montasim's written explanation of a documented engineering decision.",
            type: "fact",
            factIds: ["derived:latest-dated-blog"],
            supportingExcerpts: ["Latest dated blog record"],
          },
        ],
      })
    )

    expect(unsupportedBoundary).toMatchObject({
      status: "rejected",
      reasons: expect.arrayContaining([
        expect.objectContaining({ code: "chronology-ambiguity" }),
      ]),
    })

    const supportedBoundary = attempt.evaluate(
      JSON.stringify({
        interpretation: "Identify the latest dated blog record.",
        mode: "answer",
        claims: [
          {
            text: "Two blog records share the latest date, August 24, 2026; catalog order selects Article One as the starting record. This gives hiring managers a precise chronology without implying that it is uniquely newer than the other dated article.",
            type: "boundary",
            factIds: ["derived:latest-dated-blog"],
            supportingExcerpts: ["tiedCount: 2"],
          },
        ],
      })
    )

    expect(supportedBoundary).toMatchObject({ status: "accepted" })
  })

  it("rejects a date phrase that is absent from the aligned evidence", () => {
    const attempt = prepareFullContextGeneration({
      question: "When did Montasim start his senior role?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Answer the current-role start-date question.",
        mode: "answer",
        claims: [
          {
            text: "Montasim's documented senior role began in November 2025. For a hiring manager, the current position provides relevant context for assessing the scope and recency of his senior-level ownership, while the wider portfolio supplies concrete delivery evidence that can be reviewed alongside the role chronology.",
            type: "fact",
            factIds: ["experience:senior"],
            supportingExcerpts: ["Oct 2025 - Present"],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unsupported-date", claimIndex: 0 }],
    })
  })

  it("rejects an undocumented proper name", () => {
    const attempt = prepareFullContextGeneration({
      question: "Who did Montasim build the biometric engine with?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Describe only documented collaboration evidence.",
        mode: "answer",
        claims: [
          {
            text: "Montasim built the biometric engine with John Doe while delivering dependable real-time AI analysis. For a hiring manager, the documented engineering outcome remains useful evidence of deterministic state design and responsive pose estimation, but collaborator attribution must remain tied to named public evidence instead of being inferred from the technical result alone.",
            type: "fact",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unsupported-name", claimIndex: 0 }],
    })
  })

  it("rejects an undocumented single-token organization name", () => {
    const attempt = prepareFullContextGeneration({
      question: "Why should a company hire him for real-time engineering?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the documented hiring case.",
        mode: "answer",
        claims: [
          {
            text: "InventedCorp should consider Montasim because his documented biometric work combines deterministic state transitions, 99.9% reliability, and sustained 60 FPS pose estimation. Those outcomes give a hiring manager concrete evidence of real-time engineering judgment, but no company name may be introduced unless it appears in the question or cited portfolio facts.",
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unsupported-name", claimIndex: 0 }],
    })
  })

  it("does not use a recommendation as sole support for technical delivery", () => {
    const attempt = prepareFullContextGeneration({
      question: "What technical systems did Montasim architect?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Summarize documented technical ownership.",
        mode: "answer",
        claims: [
          {
            text: "Montasim architected a production biometric engine and optimized its AI pipeline, according to peer feedback. For a hiring manager, this establishes his technical ownership of deterministic state transitions, pose-estimation performance, and production reliability, while also showing that colleagues directly observed those engineering achievements during delivery across the healthcare platform.",
            type: "fact",
            factIds: ["recommendation:1:peer"],
            supportingExcerpts: [
              "Montasim communicates clearly and supports his teammates.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "evidence-role-mismatch", claimIndex: 0 }],
    })
  })

  it("rejects an answer grounded in a different named portfolio record", () => {
    const attempt = prepareFullContextGeneration({
      question: "How did Montasim structure PostCraft?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the named project's architecture.",
        mode: "answer",
        claims: [
          {
            text: "Montasim's documented engineering work used deterministic state transitions for dependable live AI analysis. For a hiring manager, the cited biometric-engine evidence demonstrates deliberate state design and responsive pose estimation, but it describes a healthcare engineering record rather than the specifically named publishing project in the visitor's question.",
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "named-artifact-mismatch" }],
    })
  })

  it("rejects evidence from a catalog unrelated to the question", () => {
    const attempt = prepareFullContextGeneration({
      question: "Which certifications has Montasim completed?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Summarize completed certifications.",
        mode: "answer",
        claims: [
          {
            text: "Montasim architected a deterministic biometric engine for dependable live AI analysis and responsive pose estimation. For hiring managers, the cited experience provides meaningful evidence of real-time engineering delivery, but it does not identify any completed credential, issuer, certification title, or proof record requested by the visitor.",
            type: "fact",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "question-irrelevant-evidence" }],
    })
  })

  it("rejects a model handoff so orchestration can try another provider", () => {
    const attempt = prepareFullContextGeneration({
      question: "What is Montasim's private salary expectation?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation:
          "The visitor is requesting private compensation information absent from the public portfolio.",
        mode: "handoff",
        claims: [],
        contactAction: "hire",
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unnecessary-handoff" }],
    })
  })

  it("rejects a handoff for an answerable hiring-insight question", () => {
    const attempt = prepareFullContextGeneration({
      question: "Why should a company hire Montasim?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "The visitor wants evidence-backed hiring insight.",
        mode: "handoff",
        claims: [],
        contactAction: "hire",
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unnecessary-handoff" }],
    })
  })

  it.each([
    "Summarize his career.",
    "Give me a professional overview.",
    "What has he accomplished?",
  ])("rejects an evasive handoff for %s", (question) => {
    const result = prepareFullContextGeneration({
      question,
      knowledge: knowledgeFixture(),
    }).evaluate(
      JSON.stringify({
        interpretation: "The visitor wants a portfolio summary.",
        mode: "handoff",
        claims: [],
        contactAction: "general",
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "unnecessary-handoff" }],
    })
  })

  it.each([
    {
      label: "unsupported ranking",
      code: "unsupported-ranking",
      text: "Montasim is the world's best real-time AI engineer because he delivered a deterministic biometric engine. For hiring managers, his finite-state-machine work and responsive pose estimation provide useful technical evidence, but the answer presents him as objectively superior to every other engineer without any documented comparative assessment supporting that global ranking.",
    },
    {
      label: "employment guarantee",
      code: "unsupported-guarantee",
      text: "Hiring Montasim guarantees that every real-time AI system will succeed in production. His finite-state-machine biometric work is relevant evidence of deterministic engineering and responsive pose analysis, but the claimed certainty extends beyond the documented project outcome and promises a universal future result that no public portfolio evidence could establish responsibly.",
    },
    {
      label: "negative personal trait",
      code: "negative-trait",
      text: "Montasim is weak at communication even though his technical work includes deterministic biometric state management and responsive pose estimation. That characterization would materially affect a hiring decision, yet it is not established by the cited engineering record and should not be inferred from implementation evidence or the absence of unrelated public details.",
    },
    {
      label: "model-authored URL",
      code: "model-authored-url",
      text: "Montasim's deterministic biometric engineering is documented at https://invented.example/claim and demonstrates responsive real-time AI delivery. For a hiring manager, the state-machine and pose-estimation evidence is useful, but a model-created destination must never become a portfolio citation because visitors need direct links derived from the trusted citation map instead.",
    },
    {
      label: "protocol-relative model URL",
      code: "model-authored-url",
      text: "Montasim's deterministic biometric engineering is supposedly documented at //invented.example/claim and demonstrates responsive real-time AI delivery. For a hiring manager, the state-machine and pose-estimation evidence is useful, but a model-created destination must never become a portfolio citation because visitors need direct links derived from the trusted citation map instead.",
    },
  ])("rejects $label", ({ code, text }) => {
    const attempt = prepareFullContextGeneration({
      question: "What does Montasim's biometric work demonstrate?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the hiring signal in the documented work.",
        mode: "answer",
        claims: [
          {
            text,
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code, claimIndex: 0 }],
    })
  })

  it.each([
    { label: "fewer than 40 words", wordCount: 39 },
    { label: "more than 220 words", wordCount: 221 },
  ])("rejects an answer with $label", ({ wordCount }) => {
    const attempt = prepareFullContextGeneration({
      question: "What does Montasim's biometric work demonstrate?",
      knowledge: knowledgeFixture(),
    })
    const result = attempt.evaluate(
      JSON.stringify({
        interpretation: "Explain the hiring signal in the documented work.",
        mode: "answer",
        claims: [
          {
            text: new Array<string>(wordCount).fill("evidence").join(" "),
            type: "synthesis",
            factIds: ["experience:senior"],
            supportingExcerpts: [
              "Architected a finite-state-machine biometric engine with deterministic state transitions for 99.9% reliability during AI analysis and sustained 60 FPS pose estimation.",
            ],
          },
        ],
      })
    )

    expect(result).toMatchObject({
      status: "rejected",
      reasons: [{ code: "word-limit" }],
    })
  })
})
