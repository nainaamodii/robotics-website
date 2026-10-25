# Graph Report - robotics-website  (2026-10-26)

## Corpus Check
- 198 files · ~83,903 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1186 nodes · 3083 edges · 88 communities (44 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- getDB()
- tools.ts
- validation.ts
- rate-limit.ts
- auth-guard.ts
- events.ts
- next
- react
- handleApiError()
- app/page.tsx
- dependencies
- env
- team/page.tsx
- MNNIT Robotics Club Website
- events-mcp/app/tools.py
- package.json
- projects-mcp/app/tools.py
- callback/route.ts
- ingest-magazine.ts
- devDependencies
- test/route.ts
- realm-page.tsx
- media/[id]/route.ts
- [sectionId]/route.ts
- compilerOptions
- components.json
- events-mcp/app/main.py
- chatbot-widget.tsx
- projects-mcp/app/server.py
- participate/[id]/page.tsx
- framer-motion
- projects/[id]/route.ts
- layout.tsx
- project.ts
- hero-scene.tsx
- requireAdmin()
- ApiError
- get_competition()
- signin/page.tsx
- middleware.ts
- events-mcp/app/config.py
- scripts
- health/route.ts
- [id]/teams/route.ts
- BearerAuthMiddleware
- next.config.mjs
- postcss.config.mjs
- autoprefixer@^10.4.20
- @aws-sdk/credential-providers@latest
- cloudinary@2.9.0
- cmdk@1.0.4
- date-fns@4.1.0
- dotenv
- embla-carousel-react@8.5.1
- gcp-metadata@latest
- @hookform/resolvers@^3.10.0
- @langchain/groq
- @langchain/langgraph
- next-themes
- nodemailer
- @radix-ui/react-accordion@1.2.2
- @radix-ui/react-alert-dialog@1.1.4
- @radix-ui/react-aspect-ratio@1.1.1
- @radix-ui/react-collapsible@1.1.2
- @radix-ui/react-dropdown-menu@2.1.4
- @radix-ui/react-label@2.1.1
- @radix-ui/react-navigation-menu@1.2.3
- @radix-ui/react-progress@1.1.1
- @radix-ui/react-radio-group@1.2.2
- @radix-ui/react-scroll-area@1.2.2
- @radix-ui/react-select@2.1.4
- @radix-ui/react-slider@1.2.2
- @radix-ui/react-slot
- @radix-ui/react-switch@1.1.2
- @radix-ui/react-tabs@1.1.2
- @radix-ui/react-toggle-group@1.1.1
- @radix-ui/react-tooltip@1.1.6
- react-day-picker@9.8.0
- react-hook-form@^7.60.0
- react-resizable-panels@^2.1.7
- snappy@latest
- socks@latest
- sonner@^1.7.4
- tailwind-merge
- tailwindcss-animate@^1.0.7
- @upstash/ratelimit
- vaul@^1.1.2

## God Nodes (most connected - your core abstractions)
1. `handleApiError()` - 118 edges
2. `getDB()` - 110 edges
3. `next` - 86 edges
4. `NotFoundError` - 59 edges
5. `requireAdmin()` - 48 edges
6. `requireUser()` - 42 edges
7. `ConflictError` - 40 edges
8. `react` - 39 edges
9. `framer-motion` - 38 edges
10. `lucide-react` - 37 edges

## Surprising Connections (you probably didn't know these)
- `AdminAuthPage()` --calls--> `Navbar()`  [EXTRACTED]
  app/admin/auth/page.tsx → components/navbar.tsx
- `EditProjectPage()` --calls--> `Navbar()`  [EXTRACTED]
  app/admin/edit/[id]/page.tsx → components/navbar.tsx
- `AdminPage()` --calls--> `Navbar()`  [EXTRACTED]
  app/admin/page.tsx → components/navbar.tsx
- `AdminParticipationsPage()` --calls--> `Navbar()`  [EXTRACTED]
  app/admin/participations/page.tsx → components/navbar.tsx
- `POST()` --calls--> `handleApiError()`  [EXTRACTED]
  app/api/admin/auth/logout/route.ts → lib/errors.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Eval scoring pipeline** — eval_readme_test_case_structure, eval_readme_evaluation_rubric, eval_readme_semantic_similarity_scoring [EXTRACTED 0.85]
- **Admin-managed config and email auth** — readme_smtp_config, readme_email_otp_auth, readme_admin_dashboard [EXTRACTED 0.85]

## Communities (88 total, 44 thin omitted)

### Community 0 - "getDB()"
Cohesion: 0.05
Nodes (102): POST(), Props, POST(), Props, DELETE(), dynamic, GET(), PUT() (+94 more)

### Community 1 - "tools.ts"
Cohesion: 0.07
Nodes (37): chatbotGraph, checkpointer, graphBuilder, model, toolNode, getCompetitionByIdSchema, getEventDetailsSchema, getEventsSchema (+29 more)

### Community 2 - "validation.ts"
Cohesion: 0.06
Nodes (39): AdminAuthInput, AdminAuthSchema, AssignTeamToProjectInput, CodenameSchema, CompleteProfileInput, CompleteProfileSchema, ContributorSchema, CreateCompetitionInput (+31 more)

### Community 3 - "rate-limit.ts"
Cohesion: 0.12
Nodes (29): POST(), dynamic, POST(), dynamic, POST(), chatbotBurstLimiter(), chatbotDailyLimiter(), POST() (+21 more)

### Community 4 - "auth-guard.ts"
Cohesion: 0.13
Nodes (27): GET(), POST(), POST(), Props, GET(), GET(), Props, publicUser() (+19 more)

### Community 5 - "events.ts"
Cohesion: 0.11
Nodes (30): dynamic, GET(), dynamic, GET(), POST(), DELETE(), GET(), PUT() (+22 more)

### Community 6 - "next"
Cohesion: 0.11
Nodes (24): AdminAuthPage(), AdminParticipationsPage(), ApprovalStatus, FILTER_TABS, FilterTab, STATUS_CONFIG, ApprovalStatus, ProfilePage() (+16 more)

### Community 7 - "react"
Cohesion: 0.11
Nodes (26): EditProjectPage(), AdminPage(), AdminTab, Competition, Event, EVENT_FIELD_LABELS, EventsManager(), FieldError (+18 more)

### Community 8 - "handleApiError()"
Cohesion: 0.10
Nodes (20): POST(), PUT(), GET(), GET(), POST(), POST(), Props, GET() (+12 more)

### Community 9 - "app/page.tsx"
Cohesion: 0.12
Nodes (25): Home(), Achievements(), defaults, ease, CarTimeline(), defaultContent, defaults, ease (+17 more)

### Community 10 - "dependencies"
Cohesion: 0.06
Nodes (34): dependencies, class-variance-authority@^0.7.1, @emotion/is-prop-valid@latest, framer-motion@^12.25.0, jsonwebtoken@9.0.3, lenis@^1.3.25, lucide-react@^0.454.0, mongodb@7.0.0 (+26 more)

### Community 11 - "env"
Cohesion: 0.06
Nodes (32): env, runs-on, steps, timeout-minutes, ADMIN_PASSWORD, ALLOWED_EMAIL_DOMAIN, APP_URL, CLOUDINARY_API_KEY (+24 more)

### Community 12 - "team/page.tsx"
Cohesion: 0.09
Nodes (26): Project, ProjectDetailPage(), categories, ease, ProjectsPage(), alumniMentors, ease, faculty (+18 more)

### Community 13 - "MNNIT Robotics Club Website"
Cohesion: 0.11
Nodes (30): MNNIT Robotics Club AI Agent, club_rag (Pragati magazine RAG), Context Tools (read-only), Critical Fail Conditions, Evaluation Rubric (weighted, pass 0.70), GitHub Tools (create_issue, create_pr, merge_pr, close_issue, list_pull_requests), Gmail Tools (send_gmail, search_gmail), AI Agent Golden Dataset (45 test cases) (+22 more)

### Community 14 - "events-mcp/app/tools.py"
Cohesion: 0.17
Nodes (14): ApiError, fetch_all_events(), fetch_competition_by_id(), fetch_competitions_for_event(), fetch_event_by_id(), _get(), list_competitions(), list_events() (+6 more)

### Community 15 - "package.json"
Cohesion: 0.07
Nodes (26): bcryptjs@3.0.3, clsx@^2.1.1, input-otp@1.4.1, kerberos@latest, @mongodb-js/zstd@latest, @radix-ui/react-avatar@1.1.2, @radix-ui/react-dialog@1.1.4, @radix-ui/react-hover-card@1.1.4 (+18 more)

### Community 16 - "projects-mcp/app/tools.py"
Cohesion: 0.16
Nodes (15): ApiError, fetch_all_projects(), fetch_project_by_id(), get_featured_projects(), get_project(), list_categories(), list_projects(), _matches_search() (+7 more)

### Community 17 - "callback/route.ts"
Cohesion: 0.14
Nodes (17): dynamic, GET(), KNOWN_ERRORS, redirectToSignin(), GET(), dynamic, GET(), ALLOWED_EMAIL_DOMAIN (+9 more)

### Community 18 - "ingest-magazine.ts"
Cohesion: 0.10
Nodes (18): @google/generative-ai@^0.24.1, vitest@^2.1.9, @google/generative-ai, vitest, chunkByArticle(), embed(), embedModel, execFileAsync (+10 more)

### Community 19 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, postcss@^8.5, tailwindcss@^4.1.9, @tailwindcss/postcss@^4.1.9, ts-node@^10.9.2, tsx@^4.23.4, tw-animate-css@1.3.3, @types/jsonwebtoken@^9.0.10 (+17 more)

### Community 20 - "test/route.ts"
Cohesion: 0.17
Nodes (19): dynamic, GET(), Body, dynamic, POST(), buildTransport(), fromAddress(), sendEmail() (+11 more)

### Community 21 - "realm-page.tsx"
Cohesion: 0.16
Nodes (16): CompetitionRow(), ease, EventSection(), EventsPage(), CodenameSetupInner(), CodenameSetupPage(), BRANCHES, CompleteProfileInner() (+8 more)

### Community 22 - "media/[id]/route.ts"
Cohesion: 0.19
Nodes (15): DELETE(), Props, GET(), POST(), ALLOWED_MIME, POST(), getAuthUserId(), isAdmin() (+7 more)

### Community 23 - "[sectionId]/route.ts"
Cohesion: 0.19
Nodes (16): GET(), PUT(), Body, GET(), PUT(), SectionId, connectDB, collection() (+8 more)

### Community 24 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 25 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 26 - "events-mcp/app/main.py"
Cohesion: 0.15
Nodes (5): BearerAuthMiddleware, health(), main(), health(), main()

### Community 27 - "chatbot-widget.tsx"
Cohesion: 0.24
Nodes (12): ChatbotWidget(), handleSubmit(), sendMessage(), updateAssistant(), ChatMessage, getOrCreateThreadId(), Role, SearchingDots() (+4 more)

### Community 28 - "projects-mcp/app/server.py"
Cohesion: 0.17
Nodes (5): get_featured_projects(), get_project(), list_categories(), list_projects(), search_projects()

### Community 29 - "participate/[id]/page.tsx"
Cohesion: 0.18
Nodes (9): BLOCK_COPY, Notice(), ParticipatePage(), Props, RegistrationWizard(), Result, STEPS, Props (+1 more)

### Community 30 - "framer-motion"
Cohesion: 0.14
Nodes (9): BentoProjects(), ease, pickAcrossDomains(), Project, spanPatterns, Domains, Project, Milestone (+1 more)

### Community 31 - "projects/[id]/route.ts"
Cohesion: 0.24
Nodes (13): DELETE(), GET(), invalidateProject(), PATCH(), Props, PUT(), revalidate, deleteProject() (+5 more)

### Community 32 - "layout.tsx"
Cohesion: 0.20
Nodes (9): bebasNeue, ibmPlexMono, inter, metadata, RootLayout(), viewport, SmoothScrollProvider(), ThemeProvider() (+1 more)

### Community 33 - "project.ts"
Cohesion: 0.21
Nodes (11): GET(), POST(), revalidate, Contributor, createProject(), getAllProjects(), getFeaturedProjects(), getProjectsByCategory() (+3 more)

### Community 34 - "hero-scene.tsx"
Cohesion: 0.21
Nodes (12): HeroScene(), MessageBubble(), messages, Robot(), SceneContent(), useRobotModel(), @react-three/drei@^10.7.7, @react-three/fiber@^9.6.1 (+4 more)

### Community 35 - "requireAdmin()"
Cohesion: 0.27
Nodes (9): dynamic, GET(), GET(), DELETE(), Props, requireAdmin(), unassignTeamFromProject(), listTeamsByStatus() (+1 more)

### Community 36 - "ApiError"
Cohesion: 0.33
Nodes (9): assertAllowedEmail(), ApiError, RateLimitError, col(), hashCode(), OtpDoc, otpEmail(), requestOtp() (+1 more)

### Community 37 - "get_competition()"
Cohesion: 0.18
Nodes (6): get_competition(), get_event(), list_competitions(), list_events(), get_competition(), get_event()

### Community 38 - "signin/page.tsx"
Cohesion: 0.29
Nodes (9): GOOGLE_ERRORS, GoogleMark(), safeNextPath(), SignInInner(), post(), sendCode(), setDigit(), verify() (+1 more)

### Community 39 - "middleware.ts"
Cohesion: 0.29
Nodes (9): b64urlToBytes(), parseJsonPart(), verifyHs256Jwt(), ADMIN_PROTECTED_PATHS, AUTH_PAGES, config, isUnder(), middleware() (+1 more)

### Community 40 - "events-mcp/app/config.py"
Cohesion: 0.22
Nodes (4): Settings, Config, Settings, Config

### Community 41 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, db:indexes, db:migrate, dev, lint, start, test (+1 more)

### Community 42 - "health/route.ts"
Cohesion: 0.38
Nodes (5): Check, checkMongo(), checkRedis(), dynamic, GET()

### Community 43 - "[id]/teams/route.ts"
Cohesion: 0.38
Nodes (6): GET(), POST(), Props, assignTeamToProject(), getProjectTeams(), AssignTeamToProjectSchema

## Knowledge Gaps
- **8 isolated node(s):** `Landing Page`, `Project Structure`, `GitHub Tools (create_issue, create_pr, merge_pr, close_issue, list_pull_requests)`, `Gmail Tools (send_gmail, search_gmail)`, `Test Case Structure` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 358 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `getDB()`, `rate-limit.ts`, `auth-guard.ts`, `events.ts`, `react`, `handleApiError()`, `app/page.tsx`, `dependencies`, `team/page.tsx`, `package.json`, `callback/route.ts`, `test/route.ts`, `realm-page.tsx`, `media/[id]/route.ts`, `[sectionId]/route.ts`, `participate/[id]/page.tsx`, `framer-motion`, `projects/[id]/route.ts`, `layout.tsx`, `project.ts`, `requireAdmin()`, `signin/page.tsx`, `middleware.ts`, `health/route.ts`, `[id]/teams/route.ts`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **What connects `Landing Page`, `Project Structure`, `GitHub Tools (create_issue, create_pr, merge_pr, close_issue, list_pull_requests)` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getDB()` be split into smaller, more focused modules?**
  _Cohesion score 0.051618547681539804 - nodes in this community are weakly interconnected._
- **Why does `getDB()` connect `getDB()` to `project.ts`, `tools.ts`, `requireAdmin()`, `auth-guard.ts`, `events.ts`, `ApiError`, `handleApiError()`, `health/route.ts`, `[id]/teams/route.ts`, `callback/route.ts`, `ingest-magazine.ts`, `test/route.ts`, `media/[id]/route.ts`, `[sectionId]/route.ts`, `projects/[id]/route.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `tools.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07087486157253599 - nodes in this community are weakly interconnected._
- **Why does `framer-motion` connect `framer-motion` to `signin/page.tsx`, `next`, `react`, `app/page.tsx`, `dependencies`, `team/page.tsx`, `package.json`, `realm-page.tsx`, `chatbot-widget.tsx`, `participate/[id]/page.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `validation.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05807200929152149 - nodes in this community are weakly interconnected._