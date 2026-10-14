# Smart Study Portal - Comprehensive UI/UX & Accessibility Audit

**Audit Date:** October 2026  
**Auditor:** Antigravity Advanced Agentic Pair-Programmer  
**Target Viewports Audited:** 1440px (Desktop), 1024px (Laptop/Tablet Landscape), 768px (Tablet Portrait), 390px (Mobile)  
**Tools & Standards:** Playwright, @axe-core/playwright (WCAG 2.2 AA), modern-web-design skills, motion-framer guidelines.  
**Audit Artifacts:** 76 screenshots across viewports, roles, and tabs saved in `docs/ui-audit/` and `docs/ui-audit/axe-audit-results.json`.

---

## 1. Executive Summary

A comprehensive multi-role, multi-viewport audit was conducted across the entire Smart Study Portal frontend. While the platform offers rich backend capabilities (adaptive study sessions, document ingestion, quiz generation, parent oversight, and administrative telemetry), the user interface suffers from severe structural, ergonomic, aesthetic, and accessibility flaws that degrade the student and parent experience.

### Key Severity Breakdown
- **Critical (7):**
  1. Accessible name missing on 7 inline admin `<select>` controls (WCAG Critical).
  2. Destructive actions lack confirmation and undo across the entire site (User suspension, document deletion, plan regeneration, student disconnect).
  3. Pre-seeded demo credentials and quick-login shortcuts publicly exposed on `/login`.
  4. Cross-page metric contradictions (Dashboard 3.8 hrs vs Progress 42 min vs Parent 41 min; accuracy 84% vs 57% vs 58%).
  5. Student Dashboard displays raw unformatted Markdown walls (15+ lines) for uploaded materials.
  6. Mobile navigation is completely absent: desktop navigation pills overflow and break below 768px.
  7. Focus Mode timer logs junk sessions (0s, 2s, 4s) into student history and parent reports.
- **High (11):**
  1. Display serif typography collapse: negative tracking (`-0.065em`) collides words ("Studywith a", "Pick upwhere you").
  2. Page-title hierarchy is completely fragmented across pages (huge serif on Dashboard, 20px plain on Quizzes, bold sans on Admin).
  3. Sticky header crowds content: top eyebrows sit ~10px below the nav with negative scroll-margin.
  4. Content container left margins misaligned (107px, 176px, 269px, 294px, 388px) with no consistent grid or max-width.
  5. Overuse of neon-lime accent (15 identical high-contrast lime buttons on a single view).
  6. Icon-only buttons (trash, edit pencil, expand) lack `aria-label`, tooltips, or accessible text.
  7. Touch targets under 44px (e.g. 20px focus presets, 24px action buttons).
  8. AI Tutor returns raw unformatted markdown with placeholder developer stubs, lacking honest state handling or streaming indicators.
  9. Focus mode rings clip outside card container and intersect section labels.
  10. Parent portal "Steady progress" hardcoded evaluation contradicts real failing quiz scores.
  11. Sign-in / Sign-up layout shifts horizontally due to missing `scrollbar-gutter: stable`.
- **Medium (9):**
  1. Native unstyled `<select>` chevrons and black calendar date inputs in a dark theme.
  2. Missing loading skeletons and error boundaries for async operations.
  3. Dead space and weak card borders in Focus, Tutor, and Analytics.
  4. Landing page tilted 3D mock card has overlapping floating pills and cropped borders.
  5. Admin table lacks pagination, column sorting, and unified time units ("0.7 hrs" vs "42 mins").
  6. Heading level sequence skips (`h1` -> `h4` or missing `h1`) violating WCAG 1.3.1.
  7. Low contrast 11px uppercase metadata labels.
  8. Lack of live password validation checklist on registration.
  9. Duplicate tasks and material names without deduplication or badging.
- **Low (4):**
  1. Mixed icon sets (system line icons vs emoji prefixes in Admin & Parent tabs).
  2. Decorative "Focus ✦ Flow" orbital badge with no semantic value.
  3. Vague marketing copy on landing hero ("thoughtful days").
  4. Missing keyboard skip-link for quick main content navigation.

---

## 2. Global Issues & Design System Defects

### 2.1 Typography & Tracking Collapse
- **Issue:** Headings in `globals.css` use extreme negative letter spacing (`-0.05em` to `-0.065em`). Combined with variable font rendering, word spacing is obliterated, resulting in collapsed text like `"Studywith a clearer mind"`, `"Pick upwhere you left off"`, and `"Your nextfocused hour"`.
- **Impact:** Compromises legibility and creates a broken, unprofessional first impression.
- **Fix:** Establish a strict typography scale with `letter-spacing: -0.015em` to `-0.02em` max on display headlines, normal `word-spacing`, proper `line-height` (1.15 to 1.25 for headings, 1.5 to 1.6 for body), loaded via Next.js `next/font`.

### 2.2 Page Header Inconsistency
- **Issue:**
  - `/dashboard` and `/tasks` use a gigantic serif `<h1>` with dual-tone italics.
  - `/quizzes`, `/focus`, and `/analytics` use a small ~20px regular sans `<h1>`, while internal card headers ("Generate by Topic") are visually twice as large.
  - `/admin` and `/parent` use an 800-weight bold sans header with emoji badges.
- **Impact:** Disorients users; the app feels like 4 different templates spliced together.
- **Fix:** Create a single, canonical `<PageHeader />` component with `eyebrow`, `title`, `description`, and `actions` slot, used consistently across all 10 pages.

### 2.3 Shared Container & Grid Misalignment
- **Issue:**
  - Landing logo sits at `padding-left: ~107px`, hero content at `~150px`.
  - Dashboard container starts at `~269px`.
  - Quizzes container starts at `~294px`.
  - Admin and Parent start at `~388px`.
  - On widescreen (1920px+), content stretches awkwardly or floats off-center.
- **Fix:** Enforce a single `.app-container` (max-width `1200px`, margin `0 auto`, padding `0 24px` on desktop, `0 16px` on mobile) across all layouts.

### 2.4 Sticky Navbar & Mobile Navigation
- **Issue:**
  - Sticky navbar is fixed height without `scroll-margin-top` on page content; scrolling down clips section headers by ~10-20px.
  - Desktop nav links (6 for students, 7 for parents, 8 for admins) cram horizontally and wrap or get truncated below 1024px.
  - At 390px (mobile), navigation completely breaks; there is no hamburger drawer, bottom bar, or overflow menu.
- **Fix:** Redesign `<Navbar />` to be role-aware, grouped cleanly with an active indicator pill, proper scroll padding, and a mobile bottom bar / slide-out sheet on `< 768px`.

### 2.5 Button Hierarchy & Accent Overuse
- **Issue:** The vibrant neon-lime (`var(--accent)`) is used on every row item (e.g. 15 "Generate quiz" buttons in a single list), causing visual fatigue and destroying action hierarchy.
- **Fix:** Reserve neon-lime for exactly ONE primary action per viewport. List items, table rows, and repeated cards must use `secondary`, `ghost`, or `subtle-outline` variants.

### 2.6 Icon Accessibility & Consistency
- **Issue:**
  - Trash icons, pencil icons, and close buttons lack `aria-label` and tooltips.
  - Admin and Parent tab bars use native emojis (`👥`, `📑`, `⚡`, `💻`, `📊`, `📝`, `⏱️`), whereas the rest of the application uses Lucide SVG line icons.
- **Fix:** Replace all emojis with Lucide icons. Add accessible `aria-label` and hover tooltips to all icon-only buttons.

### 2.7 Native Dark-Mode Form Elements
- **Issue:** Native `<select>` chevrons are dark grey on black; date picker inputs show a black calendar icon with `dd-mm-yyyy` default text; checkbox outlines blend into the dark background with < 2.5:1 contrast.
- **Fix:** Style custom select dropdowns, custom date pickers, and high-contrast accessible checkboxes (min 24px × 24px, 44px tap target).

---

## 3. Page-by-Page Audit Findings

### 3.1 Landing Page (`/`)
- **Severity: High**
- **Findings:**
  - Hero mock card is artificially tilted with CSS 3D `perspective(1000px) rotateY(-8deg) rotateX(4deg)`, causing floating chips to clip content.
  - "Streak unlocked" chip overlaps the "Review cell biology" text; "Today's progress" collides with the card's right boundary.
  - Tilted card border gradient renders only on right and bottom edges, looking like a rendering artifact.
  - Ring "74" has a stray `+` sign.
  - Mock card contains static fake dates ("Today, September 23") and hardcoded name "Alex".
  - Hero copy is vague ("Turn notes into momentum", "thoughtful days") rather than communicating core value propositions (Note ingestion, AI summaries, adaptive study planning, focus timer, source-grounded quizzes, parent portal).
  - Below the fold is barren: hero ends at a marquee ticker, with missing How-it-works, Feature breakdown, Student vs Parent personas, FAQ, and final CTA footer. "Explore the preview" button scrolls to a missing target.

### 3.2 Authentication (`/login` & `/register`)
- **Severity: Critical**
- **Findings:**
  - "Quick sign-in (pre-seeded accounts)" buttons are exposed directly on the public login view.
  - On `/register`, the card is taller than standard laptop viewports (`1024x768`); the "Create my space" submit button is cut off below the viewport.
  - The Account Type dropdown on register allows self-registering as "STUDENT" or "PARENT". Admin role must never be selectable.
  - Passwords lack a show/hide toggle, live validation rule checklist, and autocomplete hints.
  - Page shifts horizontally when opening forms due to lack of `scrollbar-gutter: stable`.

### 3.3 Student Dashboard (`/dashboard`)
- **Severity: Critical**
- **Findings:**
  - Greeting displays generic "Welcome, Student." instead of user's real name.
  - Stat strip labels collide with numbers (`"This week3.8 hrs"`, `"Tasks cleared8 / 11"`).
  - Hardcoded stats contradict Progress page (Dashboard shows 3.8 hrs, 8/11 tasks, 84% accuracy; Progress shows 42 min, 0/9 tasks, 57% accuracy).
  - Study materials card renders raw unprocessed Markdown walls (`"### 📌 Executive Overview **Project Title:** ... ---"`) over 15+ vertical lines.
  - Duplicate documents appear multiple times without duplicate badges or filtering.
  - Floating avatar tile `"S"` sits detached at top right; lacks interactive user profile menu.

### 3.4 Quizzes (`/quizzes` & `/quizzes/:id`)
- **Severity: High**
- **Findings:**
  - Document rows feature identical giant neon-lime "Generate quiz" buttons alongside red "Delete" buttons without confirmation.
  - "Generating Quiz…" state is a static disabled button without progress feedback, spinner, or `aria-live` announcement.
  - Quiz runner header and question navigation controls lack clear progress steps and keyboard accessibility.
  - Empty state text says "Upload your first note above", but the upload button is placed to the right of the header.

### 3.5 AI Tutor (`/ai-tutor`)
- **Severity: High**
- **Findings:**
  - Replies render raw Markdown asterisks (`**"hi"**`, `*Note: ...*`) without formatting.
  - Returns developer stub `"AI Tutor is currently under active development"` inside chat bubble.
  - Entire page scrolls instead of fixed-height viewport with dedicated message scroll and sticky composer.
  - Double focus ring on composer input; lacks Enter to send and Shift+Enter for newline.
  - Bottom development badge collides with Next.js development overlay.

### 3.6 Tasks Manager (`/tasks`)
- **Severity: High**
- **Findings:**
  - All 9 tasks are uniformly ranked as "HIGH", 25 minutes, with generic "Review X" titles.
  - Generated tasks cite subjects (Cell Biology, Algebra, Silk Roads) disconnected from user's real uploaded documents.
  - Checkboxes are small (16px) with faint grey border; touch target is only ~20px.
  - "Regenerate plan" button immediately triggers without modal confirmation or warning that existing progress will be overwritten.
  - Task completion counts contradict between Dashboard (8/11) and Tasks (0/9).

### 3.7 Focus Mode (`/focus`)
- **Severity: High**
- **Findings:**
  - Timer operates as an open-ended count-up stopwatch with no presets or session goals.
  - Concentric decorative rings clip outside the card container and cross over the status text.
  - Micro-sessions under 60s (0s, 2s, 3s, 4s, 12s) are logged automatically as junk records into student and parent history.
  - Task selector is an unstyled browser `<select>`.
  - Session history displays inconsistent time units and lacks grouping by date.

### 3.8 Progress & Analytics (`/analytics`)
- **Severity: High**
- **Findings:**
  - Duplicate KPI cards: "Tasks completed 0/9" and "Task completion 0%" provide identical information.
  - Weekly chart header states "46 total min this week", while KPI card states "42 mins total recorded".
  - Bar chart has no y-axis values, gridlines, or hover tooltips; 6 of 7 bars are empty with zero explanatory state.
  - "Recorded over time" displays 6 identical rows of zeroes instead of collapsing or offering a heatmap.

### 3.9 Parent Portal (`/parent`)
- **Severity: High**
- **Findings:**
  - Hardcoded status: `"Academic status assessment: Steady academic progress"` displayed even when student has 0% task completion and failing quiz scores.
  - Metrics contradict student view: Study library shows 6 docs (vs 15 on student), tasks show 6 (vs 9), study time 41m (vs 42m).
  - Recent sessions show multiple `"Focus Session 0 mins"` junk entries.
  - Tabs use emoji prefixes (`📊`, `📝`, `⏱️`, `📋`, `📚`).
  - Student linking lacks pending/approved states; "Disconnect Student" has no confirmation modal.

### 3.10 Admin Portal (`/admin`)
- **Severity: Critical**
- **Findings:**
  - Inline role dropdowns change privileges immediately on change with no confirmation dialog.
  - Allows self-demotion or self-suspension of the currently logged-in administrator.
  - Users table lacks sorting, search debouncing, and pagination.
  - Time units are inconsistently formatted ("0.7 hrs" vs "42 mins").
  - Server telemetry is a dense strip of tiny 10px text rather than readable status cards.
  - 7 select elements trigger critical WCAG `select-name` violations due to missing accessible names.

---

## 4. Accessibility (WCAG 2.2 AA) Audit Summary

| Rule ID | Impact | Description | Occurrences | Affected Routes |
|---|---|---|---|---|
| `select-name` | **Critical** | Select element has no accessible label | 7 nodes | `/admin` (User table role selects) |
| `heading-order` | **Moderate** | Heading levels skip hierarchy (e.g. h1 -> h4) | 12 nodes | `/ai-tutor`, `/parent`, `/admin` |
| `landmark-unique` | **Moderate** | Multiple navigation landmarks lack `aria-label` | 2 nodes | `/ai-tutor`, `/navbar` |
| `scrollable-region-focusable` | **Serious** | Overflow container not keyboard-focusable | 2 nodes | `/admin` (Document & activity tables on mobile) |
| Touch Target Size | **High** | Interactive elements smaller than 44px × 44px | 28+ nodes | Chip presets, table action icons, task checkboxes |
| Color Contrast | **High** | Text contrast under 4.5:1 on muted grey & lime-on-white | 18+ nodes | Footer links, stat subtitles, eyebrow text |

---

## 5. Next Steps
With all baseline screenshots and automated audit reports archived in `docs/ui-audit/`, proceed immediately to authoring `docs/ui-redesign-plan.md` and executing the redesign across all 5 structured phases.
