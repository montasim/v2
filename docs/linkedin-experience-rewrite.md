# LinkedIn Experience: Proposed Rewrite (v2, with your answers)

Applied to LinkedIn on 2026-11-01 (descriptions only; locations and the Multiversal "LinkedIn helped me get this job" label left unchanged).

## How each entry is built

| Part | Mainly for | What it does |
|---|---|---|
| **Scope line** (first line) | Hiring managers | Level, ownership, team size, product and scale. It's what shows before "…see more". |
| **Bullet opens with a plain-English result** | Clients | What the business or user got (cost, speed, reliability, a new capability). |
| **Bullet ends with the "how"** | Engineers | The real technical detail, so peers see depth. |
| **Short bullet label** | All | Easy to skim, and shows you think about outcomes. |

---

## 1. Senior Software Engineer: MyMedicalHub International
**Oct 2025 – Present · Mohakhali, Dhaka · On-site**

```
Lead a team of 3 engineers and own frontend architecture across 3 microservices of a HIPAA-compliant telemedicine and biometric-assessment platform used by 1,000+ patients and clinicians across 250+ client configurations.

• Reliability: Replaced fragile React-hook state in the biometric assessment flow with a deterministic finite-state-machine engine (calibration → pose detection → recording → AI analysis). 99.9% of assessment sessions now complete without a crash or freeze (verified through error-tracking logs and QA), with 60 FPS MediaPipe pose estimation and real-time rep counting.

• Clinician tooling: Built a Konva.js canvas engine that lets clinicians correct range-of-motion measurements after a session, using affine transforms (zoom/pan), dual-layer rendering and pixel-accurate frame comparison.

• Long-session stability: Ran AI rep counting and video analysis in parallel with adaptive frame rates, and moved MediaRecorder to imperative control (instance reuse, generation-counter resets) to eliminate lifecycle bugs and memory leaks.

• Patient intake: Led the Redux Toolkit rewrite of the medical-assessment chatbot: dynamic question routing, conditional visibility, an audio pipeline and multi-step forms.

• Faster builds, modern codebase: Refactored 54+ modules into a presentational/container architecture across 3 microservices and removed legacy dependencies. The result was faster application load, shorter build and production deploy times, and a codebase on current tooling the team already knows.

• Leadership: Introduced an internal code-review process and run PR reviews and frontend technical decisions, which reduced the number of bugs caught in peer review. Mentor 3 engineers.

Stack: Next.js · TypeScript · React · Redux Toolkit · MediaPipe · WebRTC · Konva.js · Azure
```

---

## 2. Software Engineer: MyMedicalHub International
**Oct 2023 – Sep 2025 · Mohakhali, Dhaka · On-site**

```
Owned the biometric strength-assessment module end to end and led cloud cost and infrastructure work across 4 environments (dev, staging, UAT, production).

• Cost: Cut cloud hosting cost 70% (about $10K a year) by moving from self-managed virtual machines to a managed platform (Azure App Service) and automating CI/CD with GitHub Actions.

• Performance: Improved application performance 40% (faster load time, smaller bundle size) and reached Lighthouse 90+ by replacing 5 legacy UI libraries (Bootstrap, Reactstrap, react-table and others) with custom components and tuning React render cycles.

• New product module: Built the biometric strength-assessment module from scratch (rep counting, dynamic-duration video recording, multi-tenant configuration) with real-time pose validation for posture, face orientation and out-of-frame detection.

• Multi-tenancy: Designed a feature-flag system and API-driven theming that let one codebase serve 250+ client configurations without forks.

• Security & compliance: Shipped HIPAA-compliant SSO (patient/provider/admin roles, OAuth, strict CSP) and an automated clinical reporting engine that produces branded HTML/PDF reports for B2B partners.

• Platform: Built a session-recording pipeline (MediaRecorder → AWS S3, PM2 across 4 environments), plus QR-code generation, cross-platform deep linking, analytics and error logging.

Recognition: Employee of the Month, October 2023.

Stack: React · Next.js · TypeScript · Node.js · Azure App Service · AWS S3 · GitHub Actions · MediaPipe
```

---

## 3. Junior Software Engineer: MyMedicalHub International
**Nov 2022 – Oct 2023 · Uttara, Dhaka · On-site**

```
Built the real-time video consultation layer of a telemedicine platform for remote physical therapy.

• Clinical impact: Added real-time AI analysis and custom joint-angle measurement to live video sessions. Assessments became 25% faster than manual measurement by a physiotherapist, with 95%+ accuracy against expert clinician measurements.

• Video reliability & cost: Replaced the third-party OpenTok service with a WebRTC pipeline on self-hosted STUN/TURN servers and Socket.IO live feedback. This replaced a usage-based vendor bill (about $3K a year) with a fixed-cost server and reduced the latency and connection drops in remote consultations.

• First annotation tool: Built the first canvas-based annotation interface with line and angle measurement for range-of-motion correction. It later grew into the standalone Re-Annotation microservice.

• Security & speed: Built a JWT-based API client layer with XSS and CSRF protection, and cut initial load time with lazy loading and route-based code splitting.

• Delivery: Set up CI/CD across dev, staging, UAT and production, and fixed a routing bug that sent invited existing patients to the wrong flow.

Stack: React · Next.js · WebRTC · OpenTok · Socket.IO · Canvas API · Node.js
```

---

## 4. Junior Frontend Developer (Internship): Multiversal Software Ltd
**Aug 2022 – Oct 2022 · Uttara, Dhaka · On-site**

```
Frontend intern on a telemedicine platform; first production React work.

• Built responsive React components (JavaScript, HTML5, CSS3) used across desktop and mobile.
• Fixed front-end performance and stability issues, reducing page load time.
• Delivered features in an Agile team, with sprint work, code review, documentation and Git.

Stack: React · JavaScript · HTML5 · CSS3
```

---

## 5. DRRA: kept as two roles
**Disabled Rehabilitation and Research Association · Tongi, Gazipur**

### Computer Instructor (Part-time)
**Feb 2022 – Jul 2022**

```
• Designed and taught a computer-skills curriculum (IT fundamentals, MS Word, Excel, PowerPoint) for around 25 students.
• Tracked each student's progress with hands-on assessments. It was early practice in explaining technical topics simply, which I now use when mentoring engineers.
```

### Management Information System Officer (Full-time)
**Dec 2021 – Jul 2022**

```
• Kept IT systems running for a rehabilitation and training centre, handling software updates, hardware maintenance and troubleshooting.
• Maintained program and student-progress data used for assessments and organisational reporting.
```

---

## 6. Web Developer (Internship): Codez Info Tech.
**May 2021 – Nov 2021 · North Badda, Dhaka · On-site**

```
• Built and maintained websites and web applications for 2 client projects using PHP, JavaScript and MySQL.
• Turned client requirements (gathered through the project manager) into scoped features, and wrote and ran test scenarios before each release.

Stack: PHP · JavaScript · MySQL
```

---

## Decisions I made from your answers

| Item | Decision | Why |
|---|---|---|
| Cost cut | **70%** (confirmed). Optional: "~$10K/year" | VM was 8 vCPU / 128 GB running Windows: an E16-class VM (or constrained E16-8s_v5), about $1.744/hour, roughly $1,273/month on Windows pay-as-you-go in East US. 70% of that is about $890/month, or roughly $10,700/year. Estimate from public list prices, not your invoice. |
| OpenTok fee | "Usage-based vendor bill (about $3K a year)" replaced by a fixed-cost server | The old Vonage bill was about $200–300/month, which is $2,400–3,600/year. The net saving is that minus the TURN server cost (unknown), so the bullet states the bill that was removed, not a net saving. |
| Server specs | Left out | Size, OS and licence details reveal internal setup and don't help readers. |
| Latency | No number | You don't remember the before and after, so it's described as qualitative improvement. |
| Junior location | **Uttara, Dhaka** | You confirmed the office moved. I shortened the full street address to the area. |
| Refactor results | No % | You described the effects (faster load, faster build and deploy) without numbers, so they're stated without numbers. |
| Rehab-workflow link at DRRA | Left out | You didn't confirm it. |
| Codez | Removed "worked directly with clients" | Requirements came through a manager. |
| Multiversal "LinkedIn helped me get this job" | Your choice | You didn't say. I'd remove it. |
