export type PreparedAnswerId = "hiring" | "impact" | "expertise"

export interface PreparedAnswer {
  question: string
  answer: string
  source: string
}

const preparedAnswers = {
  hiring: {
    question: "What makes Montasim a strong senior engineer?",
    answer:
      "Montasim combines frontend depth with production ownership. At MyMedicalHub, he progressed from Junior Software Engineer to Senior Software Engineer while taking responsibility for architecture, reliability, performance, and team guidance.\n\nHis work includes replacing unstable React hooks with a deterministic state machine that reached 99.9% reliability during AI analysis, sustaining 60 FPS pose estimation, improving application performance by 40%, and reducing Azure infrastructure costs by 70%.\n\nColleagues consistently describe him as approachable, proactive, and clear when explaining difficult requirements. Recommendations from engineers, managers, and a product designer also highlight his mentoring, collaboration, attention to user experience, and ability to turn complex healthcare workflows into maintainable production systems.",
    source: "Experience and recommendations",
  },
  impact: {
    question: "Which projects best show Montasim's impact?",
    answer:
      "Three areas show Montasim's impact particularly well.\n\nAt MyMedicalHub, he built reliable real-time healthcare experiences: a deterministic biometric engine with 99.9% reliability, a MediaPipe pipeline sustaining 60 FPS, and WebRTC workflows that helped reduce patient diagnosis time by 25%. He also improved application performance by 40% and led an Azure migration that reduced infrastructure costs by 70%.\n\nHis independent work shows product range. PostCraft applies generative AI to social media workflows, b4joinacompany turns public company research into a focused decision tool, and DevTools packages more than 30 browser utilities into one maintainable product. Thoughtline and VidQuery further demonstrate practical, user-controlled AI integrations for Chrome.",
    source: "Experience and projects",
  },
  expertise: {
    question: "What are Montasim's strongest technical skills?",
    answer:
      "Montasim's strongest area is frontend architecture with React, Next.js, TypeScript, and predictable state management. He has applied these skills to complex healthcare SaaS, multi-role interfaces, real-time analysis, and large refactors, including restructuring more than 54 modules with clear presentational and container responsibilities.\n\nHe also works across Node.js, Express, REST APIs, PostgreSQL, MongoDB, and Prisma, with production experience in WebRTC, Socket.io, MediaPipe, SSO, and security-conscious client architecture.\n\nOn the delivery side, he has hands-on experience with Microsoft Azure, Docker, GitHub Actions, and CI/CD. His portfolio consistently emphasizes system design, performance, accessibility, testing, and maintainability rather than treating the frontend as a collection of screens.",
    source: "Skills and experience",
  },
} as const satisfies Record<PreparedAnswerId, PreparedAnswer>

export function getPreparedAnswer(id: PreparedAnswerId): PreparedAnswer {
  return preparedAnswers[id]
}
