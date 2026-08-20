export interface StaticFaqAnswer {
  question: string
  answer: string
  source: string
}

const staticFaqAnswers = [
  {
    question: "Tell me about Montasim.",
    answer:
      "Montasim is a Senior Software Engineer based in Dhaka, Bangladesh. He builds reliable, high-performance web products with React, Next.js, Node.js, and TypeScript, with particular experience in real-time healthcare systems, AI-assisted workflows, frontend architecture, and cloud-backed SaaS.\n\nAt MyMedicalHub, he progressed from Junior Software Engineer to Senior Software Engineer and now owns frontend architecture, leads reviews, and mentors engineers.",
    source: "Profile and experience",
  },
  {
    question: "What is Montasim's current role?",
    answer:
      "Montasim is a Senior Software Engineer at MyMedicalHub International Ltd.\n\nHis current work includes frontend architecture, deterministic state management for live AI analysis, real-time computer-vision pipelines, medical assessment workflows, code reviews, and mentoring other engineers.",
    source: "Profile and experience",
  },
  {
    question: "How many years of experience does he have?",
    answer:
      "His profile states 3+ years of experience building real-time, AI-driven, multi-tenant SaaS platforms across the full stack.\n\nHis broader professional web-development history extends back to 2021, followed by progressive frontend and software-engineering roles from 2022 onward.",
    source: "Profile and experience",
  },
  {
    question: "What are his main professional achievements?",
    answer:
      "His strongest documented achievements include reducing Azure infrastructure costs by 70%, improving application performance by 40%, reaching Lighthouse scores above 90, building a MediaPipe pipeline that sustained 60 FPS, and replacing fragile live-analysis hooks with a finite-state-machine engine that achieved 99.9% reliability.\n\nEarlier healthcare work also helped reduce patient diagnosis time by 25%.",
    source: "Profile and experience",
  },
  {
    question: "What responsibilities does he own?",
    answer:
      "Montasim owns frontend architecture across a multi-service healthcare platform.\n\nHis responsibilities include designing predictable application state, reviewing pull requests, mentoring engineers, improving performance and reliability, integrating real-time and AI-driven workflows, and translating complex product requirements into maintainable production systems.",
    source: "Profile, experience, and recommendations",
  },
  {
    question: "Has he led or mentored other engineers?",
    answer:
      "Yes. His profile says he leads PR reviews and mentors engineers.\n\nRecommendations from teammates who worked under his guidance describe him as approachable, supportive, and effective at breaking down complex business and technical problems while helping junior engineers grow in confidence.",
    source: "Profile and recommendations",
  },
  {
    question: "What industries has he worked in?",
    answer:
      "His deepest product experience is in healthcare SaaS and telemedicine, including patient portals, remote consultations, biometric analysis, and medical-assessment workflows.\n\nHis portfolio also includes developer productivity tools, AI-assisted writing and social-media products, browser extensions, education and nonprofit IT operations, and earlier general web-development work.",
    source: "Experience and projects",
  },
  {
    question: "What are Montasim's strongest technical skills?",
    answer:
      "His strongest area is frontend architecture with React, Next.js, TypeScript, Redux, and predictable state management.\n\nHe also has production experience with Node.js, Express, REST APIs, PostgreSQL, MongoDB, WebRTC, Socket.io, MediaPipe, Microsoft Azure, Docker, GitHub Actions, CI/CD, system design, and security-conscious client architecture.",
    source: "Skills and experience",
  },
  {
    question: "Which frontend technologies does he use?",
    answer:
      "His frontend stack includes React, Next.js, TypeScript, JavaScript, HTML5, CSS, Tailwind CSS, Redux, Bootstrap, responsive web design, and Konva.js.\n\nHe has used these technologies for multi-role SaaS interfaces, telemedicine products, real-time analysis, browser extensions, and developer tools.",
    source: "Skills and projects",
  },
  {
    question: "Does he have backend experience?",
    answer:
      "Yes. Montasim has worked with Node.js, Express, REST APIs, Socket.io, PHP, PostgreSQL, MongoDB, and Prisma.\n\nHis portfolio includes API client architecture, authentication and SSO, real-time communication, database-backed Next.js applications, and full-stack SaaS products.",
    source: "Skills, experience, and projects",
  },
  {
    question: "What is his experience with React and Next.js?",
    answer:
      "React and Next.js are central to Montasim's work. He has used React for healthcare SaaS, telemedicine, WebRTC, real-time computer vision, deterministic state machines, and major codebase refactors.\n\nHis Next.js projects include AI products, developer tools, data-backed applications, and this portfolio, supported by TypeScript, Tailwind CSS, database integrations, and modern deployment workflows.",
    source: "Experience, skills, and projects",
  },
  {
    question: "How does he approach frontend architecture?",
    answer:
      "He treats frontend architecture as a reliability and systems-design problem. His work emphasizes deterministic state transitions, clear component responsibilities, resilient asynchronous lifecycles, security boundaries, and maintainable modules.\n\nOne documented refactor reorganized more than 54 modules into presentational and container responsibilities, while his finite-state-machine work removed race conditions from live AI analysis.",
    source: "Profile, experience, and recommendations",
  },
  {
    question: "Has he worked with real-time systems?",
    answer:
      "Yes. His real-time work includes WebRTC and OpenTok video consultations, Socket.io, MediaPipe pose estimation, live rep counting, annotated AI-analysis results, and responsive healthcare workflows.\n\nHe built a computer-vision pipeline sustaining 60 FPS and contributed to video systems designed to reduce latency during remote consultations.",
    source: "Experience, skills, and recommendations",
  },
  {
    question: "What cloud platforms has he used?",
    answer:
      "His documented cloud experience centers on Microsoft Azure. He migrated Azure virtual machines to App Service, automated CI/CD, and helped reduce infrastructure costs by 70%.\n\nHis skills also include Docker, GitHub Actions, Git, and production deployment workflows.",
    source: "Experience and skills",
  },
  {
    question: "What is his testing experience?",
    answer:
      "His listed testing and quality tools include Jest, React Testing Library, and Lighthouse. His experience also mentions automated tests, API test scenarios, and performance validation.\n\nMore broadly, his portfolio shows a consistent focus on measurable performance, predictable state, regression protection, and production stability.",
    source: "Skills, experience, and recommendations",
  },
  {
    question: "How does he improve application performance?",
    answer:
      "He combines measurement with architectural simplification. At MyMedicalHub, he removed legacy UI libraries, replaced them with focused components, and optimized React rendering cycles, producing a documented 40% performance improvement and Lighthouse scores above 90.\n\nHe also used adaptive frame-rate logic to sustain 60 FPS in a live MediaPipe pipeline.",
    source: "Profile and experience",
  },
  {
    question: "Does he have experience with AI integrations?",
    answer:
      "Yes. He has integrated real-time AI analysis into healthcare interfaces, built deterministic state handling around live biometric workflows, and developed Gemini-powered products such as PostCraft and VidQuery.\n\nThoughtline supports both Gemini and Groq, showing experience designing user-controlled AI features across web applications and browser extensions.",
    source: "Experience and projects",
  },
  {
    question: "Which projects best demonstrate his abilities?",
    answer:
      "His healthcare work best demonstrates production scale, reliability, and measurable impact: deterministic biometric analysis, 60 FPS computer vision, WebRTC consultations, and performance and cloud-cost improvements.\n\nHis independent products add breadth, including PostCraft for AI social-media workflows, DevTools with 30+ browser-based utilities, Thoughtline for LinkedIn writing, and VidQuery for YouTube Q&A.",
    source: "Experience and projects",
  },
  {
    question: "Tell me about PostCraft.",
    answer:
      "PostCraft is an AI-powered social-media manager built with Next.js, TypeScript, Gemini API, Inngest, and MongoDB. It helps users generate, preview, score, and automatically publish posts for LinkedIn, X, and Facebook while applying custom brand guardrails.",
    source: "Projects",
  },
  {
    question: "Tell me about DevTools.",
    answer:
      "DevTools is a suite of more than 30 free browser-based utilities for formatting, validating, generating, and transforming data. It includes tools such as a JSON formatter, regex tester, API request builder, WebSocket tester, encoders, converters, and generators.\n\nIt is built with Next.js, TypeScript, CodeMirror, TanStack Query, and PostgreSQL.",
    source: "Projects",
  },
  {
    question: "Tell me about Thoughtline.",
    answer:
      "Thoughtline is a user-controlled Chrome side-panel extension for understanding LinkedIn conversations and shaping replies and posts in the user's own voice. It uses WXT, React 19, TypeScript, Chrome Manifest V3, Gemini API, and Groq API.",
    source: "Projects",
  },
  {
    question: "Tell me about VidQuery.",
    answer:
      "VidQuery is a Chromium extension that adds Gemini-powered question answering to YouTube. It uses visible video metadata and transcripts together with the user's own API key, keeping the AI integration transparent and user-controlled. Its stack includes TypeScript, Chrome Manifest V3, Gemini API, and YouTube data.",
    source: "Projects",
  },
  {
    question: "What healthcare products has he worked on?",
    answer:
      "At MyMedicalHub, Montasim has worked on telemedicine and healthcare SaaS products including patient portals, medical-assessment chatbots, multi-role access, remote video consultations, supervised exercise workflows, biometric analysis, pose estimation, and real-time result visualization.\n\nHis contributions span frontend architecture, AI integration, WebRTC, security, performance, and cloud delivery.",
    source: "Experience and recommendations",
  },
  {
    question: "Which project had the greatest measurable impact?",
    answer:
      "The strongest measurable impact appears in his MyMedicalHub work rather than a single named side project.\n\nDocumented results include a 70% reduction in Azure infrastructure costs, a 40% application-performance improvement, 25% faster patient diagnosis, 60 FPS pose estimation, and 99.9% reliability during live AI analysis.",
    source: "Profile and experience",
  },
  {
    question: "Has he built products from scratch?",
    answer:
      "His portfolio shows multiple independently built products with complete product scope, including PostCraft, DevTools, Thoughtline, VidQuery, Ramadan Clock, and other web tools and extensions.\n\nTogether, these projects cover product design, frontend and backend implementation, AI-provider integration, databases, browser APIs, deployment, and ongoing releases.",
    source: "Projects",
  },
  {
    question: "What performance improvements has he delivered?",
    answer:
      "He delivered a documented 40% application-performance improvement by removing legacy UI libraries and optimizing React rendering.\n\nHe also reached Lighthouse scores above 90, sustained 60 FPS in a real-time MediaPipe pipeline, reduced remote-consultation latency through WebRTC work, and improved earlier frontend load-time stability.",
    source: "Profile and experience",
  },
  {
    question: "How has he reduced infrastructure costs?",
    answer:
      "Montasim helped reduce infrastructure costs by 70% by migrating workloads from Azure virtual machines to Azure App Service and automating CI/CD pipelines.\n\nThe change paired a more appropriate hosting model with repeatable deployment rather than relying on manual infrastructure management.",
    source: "Profile and experience",
  },
  {
    question: "Why should we hire Montasim?",
    answer:
      "He is a strong fit for teams that need senior frontend judgment, production ownership, and dependable delivery across complex workflows. His record combines measurable outcomes with architecture depth: 99.9% reliable live analysis, 60 FPS computer vision, 40% better application performance, and 70% lower cloud costs.\n\nJust as importantly, teammates describe him as supportive, clear, collaborative, proactive, and effective at mentoring engineers.",
    source: "Experience and recommendations",
  },
  {
    question: "What roles would be a good fit for him?",
    answer:
      "His experience aligns best with Senior Frontend Engineer, Senior Software Engineer, frontend-architecture, and technical-lead responsibilities.\n\nHe is particularly relevant to teams building complex SaaS, healthcare, real-time, or AI-assisted products with React, Next.js, TypeScript, Node.js, and cloud services.",
    source: "Profile, experience, and skills",
  },
  {
    question: "Is he suitable for a senior frontend position?",
    answer:
      "Yes. He currently holds a Senior Software Engineer role, owns frontend architecture, leads PR reviews, mentors engineers, and has deep React, Next.js, and TypeScript experience.\n\nHis portfolio also demonstrates senior-level responsibility for reliability, performance, state architecture, real-time workflows, accessibility, security, and maintainability.",
    source: "Profile, experience, and recommendations",
  },
  {
    question: "Is he comfortable working across the full stack?",
    answer:
      "Yes. Although frontend architecture is his strongest area, his profile describes full-stack SaaS experience with React, Next.js, Node.js, and TypeScript.\n\nHis work also includes Express, REST APIs, Socket.io, PostgreSQL, MongoDB, Prisma, authentication, cloud deployment, CI/CD, and database-backed products.",
    source: "Profile, skills, and projects",
  },
  {
    question: "What distinguishes him from other engineers?",
    answer:
      "His differentiator is a reliability-first approach to frontend engineering. He designs for race conditions, failed asynchronous work, complex state, and long-term maintenance rather than only the happy path.\n\nThat systems mindset is backed by measurable delivery and by recommendations highlighting his respect for user experience, clear communication, mentoring, and ability to bridge research, design, and production.",
    source: "Profile and recommendations",
  },
  {
    question: "What do colleagues say about working with him?",
    answer:
      "Colleagues describe Montasim as approachable, supportive, proactive, collaborative, and clear when explaining difficult requirements. Engineers credit his mentoring and technical guidance, while a senior product designer highlights his ability to preserve UX intent while building scalable, accessible, reliable interfaces.\n\nManagers also emphasize his problem solving, work ethic, communication, and dependable delivery.",
    source: "Recommendations",
  },
  {
    question: "What are his leadership strengths?",
    answer:
      "His leadership strengths include breaking complex requirements into practical solutions, explaining the reasoning behind decisions, reviewing code constructively, mentoring junior engineers, and keeping delivery focused on reliable outcomes.\n\nRecommendations also highlight humility, approachability, proactive learning, and a willingness to learn from teammates at every level.",
    source: "Profile and recommendations",
  },
  {
    question: "Is he available for remote work?",
    answer:
      "The portfolio does not state Montasim's current availability or preferred work arrangement, so it would be inaccurate to assume.\n\nUse the Discuss a role inquiry and select Remote as the work arrangement so he can confirm fit and availability directly.",
    source: "Contact preferences",
  },
  {
    question: "Would he be suitable for a technical lead role?",
    answer:
      "His experience supports consideration for a frontend-focused technical lead role. He owns frontend architecture, leads PR reviews, mentors engineers, and has guided teammates through complex healthcare workflows. Recommendations specifically describe him as a strong technical leader and mentor.\n\nThe exact fit would depend on the role's scope, team size, and backend or organizational responsibilities.",
    source: "Profile and recommendations",
  },
  {
    question: "How does Montasim handle complex requirements?",
    answer:
      "He breaks complex business requirements into explicit technical states, clear module responsibilities, and practical implementation steps. His healthcare work shows this through deterministic state machines, multi-role access, real-time analysis, and large refactors.\n\nTeammates say he explains difficult requirements clearly and helps others understand both the solution and the reasoning behind it.",
    source: "Experience and recommendations",
  },
  {
    question: "How does he collaborate with designers and product teams?",
    answer:
      "A senior product designer who worked with him says Montasim treats frontend work as a systems problem while respecting the intent of the user experience. He translates design systems into scalable interfaces and considers accessibility, responsiveness, performance, and reliability.\n\nOther recommendations describe clear communication and effective collaboration across frontend, backend, AI, and product concerns.",
    source: "Recommendations",
  },
  {
    question: "How does he approach code reviews?",
    answer:
      "His profile states that he leads PR reviews. The broader evidence suggests a mentoring-oriented approach: teammates describe him as supportive, clear, and willing to explain the reasoning behind decisions.\n\nBased on his documented work, his architectural priorities in review are likely to include predictable state, maintainable responsibilities, performance, reliability, security, and user impact.",
    source: "Profile and recommendations",
  },
  {
    question: "How does he ensure software reliability?",
    answer:
      "He starts with explicit state and failure behavior rather than adding reliability afterward. His documented work includes replacing unstable hooks with a finite-state-machine engine, eliminating race conditions during live AI analysis, designing resilient asynchronous lifecycles, adding security protections, and using tests and performance measurements.\n\nThat approach helped one live-analysis workflow reach 99.9% reliability.",
    source: "Profile and experience",
  },
  {
    question: "How does he handle production problems?",
    answer:
      "His approach is to make failure modes predictable through explicit state transitions, resilient lifecycles, bounded asynchronous work, and architecture that does not leak, stall, or surprise users.\n\nHis record includes stabilizing video consultations, removing race conditions from AI analysis, replacing legacy UI dependencies, improving cloud delivery, and troubleshooting production-facing healthcare workflows.",
    source: "Profile and experience",
  },
  {
    question: "What is his approach to maintainable code?",
    answer:
      "He favors deep, clearly separated modules, predictable state, reusable components, and explicit ownership boundaries. A documented healthcare refactor reorganized more than 54 modules into presentational and container responsibilities.\n\nRecommendations also highlight clean code, scalable component systems, and technical decisions made with long-term product maintenance in mind.",
    source: "Experience and recommendations",
  },
  {
    question: "How does he communicate technical decisions?",
    answer:
      "Teammates describe him as clear, approachable, and effective at explaining both business requirements and technical reasoning. He helps engineers understand why a solution is chosen, not only what to implement.\n\nRecommendations from engineers, managers, and designers consistently highlight communication, collaboration, transparency, and practical problem solving.",
    source: "Recommendations",
  },
  {
    question: "What is Montasim's educational background?",
    answer:
      "Montasim earned a Bachelor of Science in Computer Science and Engineering from Bangladesh Army University of Science and Technology, studying there from November 2016 to March 2021. His coursework included data structures, algorithms, software engineering, databases, and web technologies.\n\nHe previously completed science-focused secondary and higher-secondary education.",
    source: "Education",
  },
  {
    question: "What certifications does he have?",
    answer:
      "His portfolio lists certifications and completed programs from Anthropic Education, Microsoft, Google, Meta, Atlassian, Coursera, Udemy, and Programming Hero.\n\nExamples include Claude 101, Microsoft Azure Fundamentals preparation, Google Business Intelligence, Meta React Native, Agile with Atlassian Jira, API testing with Postman, and complete web-development coursework.",
    source: "Certifications",
  },
  {
    question: "How does he continue developing his skills?",
    answer:
      "His portfolio shows continuous learning through professional certificates, hands-on side projects, open-source repositories, and experimentation with current web and AI technologies.\n\nA teammate specifically notes that he stays current with industry trends, actively builds personal projects, encourages learning within the team, and remains willing to learn from junior colleagues.",
    source: "Certifications, projects, and recommendations",
  },
  {
    question: "How can I contact Montasim?",
    answer:
      "You can use the guided Discuss a role or Discuss a project inquiry in this assistant. You can also email Montasim at montasimmamun@gmail.com or use the LinkedIn, GitHub, and WhatsApp links provided in the portfolio.",
    source: "Profile and contact preferences",
  },
  {
    question: "Can I discuss a role with him?",
    answer:
      "Yes. Choose Discuss a role in the assistant. The short inquiry asks for the role, work arrangement, your name, and your work email so Montasim receives enough context to reply directly.",
    source: "Contact preferences",
  },
  {
    question: "Can I discuss a project with him?",
    answer:
      "Yes. Choose Discuss a project in the assistant. The guided inquiry collects the project type, preferred timeline, your name, and email so Montasim can review the context and respond directly.",
    source: "Contact preferences",
  },
  {
    question: "What information should I provide in an inquiry?",
    answer:
      "For a role, provide the position, expected work arrangement, your name, and work email. For a project, provide the project type, preferred timeline, your name, and email. Contact details remain separate from the AI conversation history.",
    source: "Contact preferences",
  },
  {
    question: "Where can I download his résumé?",
    answer:
      "Use the Download resume button near the top of the portfolio. It downloads the current résumé directly from this site, and the profile also includes a Google Drive viewing link.",
    source: "Profile",
  },
  {
    question: "Where can I find his GitHub and LinkedIn profiles?",
    answer:
      "Montasim's GitHub profile is https://github.com/montasim and his LinkedIn profile is https://linkedin.com/in/montasim. Both are also linked from the portfolio interface.",
    source: "Profile",
  },
] as const satisfies readonly StaticFaqAnswer[]

const staticFaqIndex = new Map(
  staticFaqAnswers.map((entry) => [normalizeQuestion(entry.question), entry])
)

export const staticFaqQuestions = staticFaqAnswers.map(
  (entry) => entry.question
)

export function getStaticFaqAnswer(
  question: string
): StaticFaqAnswer | undefined {
  return staticFaqIndex.get(normalizeQuestion(question))
}

function normalizeQuestion(question: string) {
  return question
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}+/gu, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'+]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
