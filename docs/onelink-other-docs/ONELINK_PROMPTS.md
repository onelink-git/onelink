

# Gemini prompt (paste into gemini-cli)
	* ***инструкции да прочете всичк ите документи, да анализира и да генерира пълния дизайн/спецификация/артефакти за интеграция на чат функцията в OneLink***

SYSTEM INSTRUCTION:
You have filesystem access to the current working directory: ~/OneLink-Chat-Research. This directory contains 10 research files about chat systems (mix of .md, .txt, .pdf — treat them all as sources). The user has already granted visibility to this folder. Read every file in the directory, extract the meaningful findings, and use them to design a production-ready chat interface and integration plan for the OneLink project.

CONTEXT / CONSTRAINTS:
- Project OneLink is a privacy-first social/profile platform where users register with a nickname (minimal required data). 
- Backend: Next.js app router + Firebase (Firestore + Firebase Auth) is the existing stack and must be the primary integration target. 
- Principles: privacy-first, minimal data collection, no ads, opt-in analytics only, server-side validation, secure-by-default.
- Target platforms: responsive Web (desktop + mobile), progressive web-friendly (offline support desirable).
- UI style: minimalist, fast, accessible, tailwind-compatible. Keep components reusable and mobile-first.
- Deliverables must be created as files in the current directory. Use the filenames specified below.

TASK (high level):
Analyze all documents, synthesize requirements and trade-offs, design the chat UI and system architecture tailored to OneLink, and generate implementation-ready artifacts (design docs, schemas, component skeletons, security rules, test plan, integration guide, and prioritized task list).

REQUIREMENTS (detailed):
1. Read & Summarize Sources
   - Produce a short summary (1–2 paragraphs) of each of the 10 files and a consolidated findings section highlighting patterns, recommended approaches, and potential risks discovered across files.

2. Use-cases & UX Requirements
   - Define primary and secondary chat use-cases specifically for OneLink (e.g., 1:1 private messaging, ephemeral messages option, contact discovery by nickname, safe blocking/reporting flow).
   - Provide detailed UX flows for: starting a chat, sending messages, message receipts, message deletion/export, blocking/reporting, offline usage, and notification behavior.
   - Accessibility requirements (ARIA roles, keyboard navigation, screen readers).

3. Full System Architecture
   - Diagram (textual) showing frontend components, backend services, Firestore collections and indexes, authentication/authorization flows, real-time delivery path (Firestore listeners / WebSocket fallbacks), and optional helper services (push notifications).
   - Design choices rationale and trade-offs (e.g., Firestore vs Realtime DB vs WebSocket + custom server).

4. Data Model (Firestore)
   - Provide the Firestore collections and document schemas with example documents for:
     - `users`
     - `conversations` (or `threads`)
     - `messages`
     - `profile_views` (as already used)
     - `attachments` (if any)
     - `message_read_status`
   - Indexing and query patterns (for pagination, unread count, recent conversations).
   - Document size and subcollection strategy recommendations.

5. Security & Privacy
   - Provide concrete Firebase security rules snippets for the chat collections (authorization checks, server-only writes where needed).
   - Server-side validation approach using Firebase Admin SDK (token verification).
   - Anti-abuse strategies: rate limiting, moderation flags, automated spam heuristics, reporting and quarantine flows.
   - Optional E2EE design (description and high-level implementation plan using client-side encryption, key management & metadata minimization). DO NOT provide code that circumvents security best-practices — present choices, pros/cons, and a recommended pragmatic approach for MVP.

6. Frontend Component Design
   - Provide a complete component breakdown for Next.js + React + TypeScript + Tailwind:
     - Page-level components (ChatList, ChatWindow, Composer, MessageBubble, AttachmentPreview, TypingIndicator, PresenceIndicator, ConversationHeader).
     - For each component: props interface (TypeScript), responsibilities, and example markup snippet (JSX) with Tailwind classes.
   - Provide optimistic update strategy, message status lifecycle, and offline queuing approach.
   - Provide suggested CSS/Tailwind utility classes and responsive behavior notes.

7. API & Integration
   - Define API routes (Next.js app router) required for operations that must be server-mediated (export profile messages, admin moderation, sending push tokens, batch operations).
   - Provide sample pseudo-code or small code snippets for:
     - Verifying tokens server-side.
     - Writing server-validated message metadata (e.g., for profile_views or export).
   - Integration checklist for wiring chat UI to Firestore listeners, secure writes, and batched deletes/exports.

8. Testing & QA
   - Create a test plan (unit, integration, end-to-end, security tests).
   - Provide example test cases for key flows (message send/receive, pagination, blocked user behavior, message export).
   - Provide performance/load testing guidelines and metrics to monitor (latency, message delivery success, Firestore read/writes per second).

9. Deliverables & Output Files (create these in the current directory)
   - `chat-analysis-summary.md` — summaries of each source + consolidated findings.
   - `chat-design.md` — full design doc (UX flows, architecture, data model, security).
   - `chat-schema.json` — machine-readable Firestore schema examples and indexes.
   - `chat-components.tsx` — skeleton React/TSX components (stateless and with prop types) with Tailwind classes (no full implementation, but complete skeletons).
   - `firestore.rules` — suggested Firestore security rules for chat collections.
   - `integration-guide.md` — step-by-step integration instructions for OneLink (how to wire components, env vars, required Firebase setup).
   - `test-plan.md` — testing checklist and example test cases.
   - `todo-prioritized.md` — prioritized implementation tasks with complexity labels (low/medium/high) and acceptance criteria for each task.
   - `ui-mockups.svg` — simple vector wireframes (or ASCII fallback if SVG not possible) illustrating mobile and desktop chat layouts (main view + composer + conversation list).
   - `e2ee-options.md` — short comparative document describing E2EE options, recommended path for MVP and later upgrade path.

10. Output formatting
    - Each markdown must be well-structured with headings, bullet lists, code blocks, and examples.
    - Provide JSON for machine-readable schema (`chat-schema.json`).
    - The `chat-components.tsx` file must compile as TypeScript skeletons (no external imports besides React and typings), include TypeScript interfaces for props and a top-level comment describing where to plug real data.
    - All files must be saved to the current directory and also printed to stdout in a compact summary at the end of the run (file list + first 10 lines of each file).

11. Prioritization & MVP recommendations
    - Provide an explicit MVP feature set (minimal features necessary to ship chat) and a clear upgrade roadmap for features that can wait (groups, voice, video).
    - For each MVP item specify acceptance criteria.

12. Risk analysis & mitigations
    - List top 8 risks (privacy, abuse, data leakage, scaling, regulatory) and concrete mitigations.

13. Style & Tone
    - Professional, actionable, and concise.
    - Use "we" in design rationale sections (e.g., "we recommend...") and keep explanations technical but accessible to engineers and product managers.

EXECUTION DETAILS:
- Process each file; do not ignore PDFs — extract textual content.
- If any file is ambiguous or very short, infer intent but note where inference was necessary.
- Where you make assumptions (e.g., about current DB layout or environment variables), explicitly list them in `chat-analysis-summary.md`.
- Do not call external APIs; work only with local files and your internal reasoning.
- At the end, produce a final short summary (5-8 bullet points) that a product manager can read in 30 seconds.

OUTPUT:
- Create the files listed above in the current directory.
- Print a short summary table to stdout showing filenames created and a one-line description of each.
- Then print the 5–8 bullet final summary.

You are free to be opinionated and give a single recommended path for OneLink, but include clearly marked alternatives and tradeoffs.

Begin now.
