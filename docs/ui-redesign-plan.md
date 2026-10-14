# Smart Study Portal - UI/UX Overhaul & Redesign Plan

**Author:** Antigravity Advanced Agentic Pair-Programmer  
**Target Completion:** Multi-Phase Comprehensive Redesign  
**Technology Stack:** Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS Tokens, Framer Motion, Lucide Icons, Spring Boot 3.4 API, FastAPI ML Engine.

---

## 1. Vision & Brand Evolution

The objective is to elevate the "Smart Study Portal" into a world-class, premium, calm, and distraction-free academic workspace. We evolve the signature brand identity without diluting it:
- **Base Canvas:** Deep green-black tones (`#060d09`, `#0a140f`) that soothe student eye strain during long evening sessions.
- **Surface Elevation:** 3 distinct frosted elevations with crisp, subtle borders (`rgba(255, 255, 255, 0.08)`) and high-performance backdrop blurs.
- **Accent Philosophy:** Neon lime (`#7aff87` / `#22c55e`) is strictly rationed as a **Primary Action Accent** (max one per view). Secondary, tertiary, and row actions utilize sleek glass/ghost styling.
- **Typography:**
  - Display & Key Headings: Editorial serif font with fixed letter-spacing (no tighter than `-0.015em` to `-0.02em`), generous line-height (`1.2`), and standard word-spacing to eliminate collapsed words.
  - Body & Data Displays: Crisp geometric sans (Inter / system fallback), minimum 14px body text, 4.5:1+ contrast on all readable elements.
- **Motion:** Subtle Framer Motion transitions (150ms-300ms, smooth cubic-bezier), strictly respecting `prefers-reduced-motion`, avoiding 3D tilts, custom cursors, parallax, or gratuitous loops.

---

## 2. Design Tokens Architecture (`frontend/src/app/globals.css`)

### 2.1 CSS Variables & Palette Tokens
```css
:root {
  /* Surfaces */
  --bg-canvas: #060d09;
  --bg-surface-1: rgba(16, 28, 20, 0.75);
  --bg-surface-2: rgba(22, 38, 28, 0.65);
  --bg-surface-3: rgba(30, 52, 38, 0.55);
  --bg-card: rgba(14, 25, 18, 0.85);
  --bg-card-hover: rgba(20, 35, 25, 0.95);
  --bg-overlay: rgba(3, 7, 5, 0.82);

  /* Brand Accents */
  --accent-lime: #7aff87;
  --accent-lime-hover: #96ff9f;
  --accent-lime-dim: rgba(122, 255, 135, 0.14);
  --accent-lime-border: rgba(122, 255, 135, 0.32);
  --accent-emerald: #10b981;
  --accent-mint: #34d399;

  /* Semantic Feedback */
  --success: #22c55e;
  --success-bg: rgba(34, 197, 94, 0.12);
  --success-border: rgba(34, 197, 94, 0.28);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.12);
  --warning-border: rgba(245, 158, 11, 0.28);
  --danger: #ef4444;
  --danger-bg: rgba(239, 68, 68, 0.12);
  --danger-border: rgba(239, 68, 68, 0.32);
  --info: #3b82f6;
  --info-bg: rgba(59, 130, 246, 0.12);
  --info-border: rgba(59, 130, 246, 0.28);

  /* Typography Colors */
  --text-primary: #f0fdf4;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --text-inverse: #051409;

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.15);
  --border-strong: rgba(255, 255, 255, 0.25);
  --border-focus: var(--accent-lime);

  /* Sizing & Geometry */
  --container-max-w: 1200px;
  --nav-height: 68px;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Typography Scale */
  --font-display: 2.75rem; /* ~44px */
  --font-h1: 2rem;        /* 32px */
  --font-h2: 1.5rem;      /* 24px */
  --font-h3: 1.15rem;     /* 18px */
  --font-body: 0.9375rem; /* 15px */
  --font-small: 0.8125rem;/* 13px */
  --font-label: 0.75rem;  /* 12px */
}
```

---

## 3. Shared Reusable Component Library (`frontend/src/components/ui/`)

To eliminate copy-pasted styles and fragile layout drift, we introduce standard atomic primitives:

1. **`PageHeader`** (`src/components/ui/page-header.tsx`):
   - Consistent typography: eyebrow (with Lucide icon), h1 with `-0.02em` tracking, description, and action button slot.
   - Built-in breadcrumb / back capability.
2. **`StatCard`** (`src/components/ui/stat-card.tsx`):
   - Unified card with label, Lucide icon, large numeric value, subtitle/context, and optional micro-progress ring or trend.
3. **`Button`** (`src/components/ui/button.tsx`):
   - Variants: `primary` (lime), `secondary` (glass outline), `ghost`, `danger`.
   - Built-in loading state with accessible `aria-busy` and spinner. Min touch height 44px.
4. **`ConfirmDialog`** (`src/components/ui/confirm-dialog.tsx`):
   - Accessible modal dialog for destructive actions (Delete Material, Delete Task, Suspend User, Inline Role Demotion, Disconnect Student, Regenerate Plan).
   - Trap focus, Escape key to close, explicit Confirm & Cancel buttons.
5. **`ProgressRing`** (`src/components/ui/progress-ring.tsx`):
   - Clean, non-clipped SVG radial meter for Pomodoro timer and completion metrics.
6. **`EmptyState`** (`src/components/ui/empty-state.tsx`):
   - Helpful icon, clear message, and action CTA when lists (tasks, quizzes, sessions) are empty.
7. **`Skeleton`** (`src/components/ui/skeleton.tsx`):
   - Smooth pulse loader placeholders for document lists, statistics, and tables.
8. **`Input` & `Select` & `Checkbox`**:
   - Custom styled dark-theme controls with accessible labels, hover/focus rings, and 44px tap area.

---

## 4. Phased Implementation Roadmap

### Phase A: Design Tokens, Typography, App Shell & Navigation
1. **Fix Global CSS**: Correct tracking (`letter-spacing: -0.018em`), word-spacing, line-height, scrollbar stability, and top-padding offsets.
2. **Unified Container**: Apply `.app-container` max-width 1200px centered layout across all views.
3. **Role-Aware Redesigned Navbar**:
   - Show relevant links based on authenticated user role.
   - Distinct active tab indicator pill.
   - Desktop: clean, spacious layout with brand logo aligned to grid.
   - Mobile (< 768px): slide-out drawer or bottom bar with 44px+ tap targets.
   - User profile dropdown menu with role badge, user name, and clean sign-out.

### Phase B: Shared Accessible Primitives
1. Create `Button`, `PageHeader`, `StatCard`, `ConfirmDialog`, `ProgressRing`, `Skeleton`, `EmptyState`, and accessible `Checkbox`/`Select`.
2. Verify all buttons and interactive elements pass WCAG 2.2 AA (44px target, accessible label, focus-visible).

### Phase C: Page-by-Page Redesign

#### 1. Authentication (`/login`, `/register`)
- Hide pre-seeded credentials behind a discrete expandable "Developer Quick-Access" accordion (collapsed by default).
- Add show/hide password toggle, autocomplete attributes, inline validation messages, and live password rule requirements on registration.
- Remove Admin option from registration role selector.
- Center card properly with `scrollbar-gutter: stable`, eliminate vertical cut-offs on 1024x768.

#### 2. Landing Page (`/`)
- Rebuild hero product preview: clean, un-tilted, crisp dashboard preview card without clipped badges or overlapping text.
- Overhaul copywriting to clearly explain features: AI Ingestion, Adaptive Study Plans, Active Recall Quizzes, Source-Grounded Tutor, Focus Clock, Parent Insights.
- Add structured sections below fold: "How It Works" (3 steps), "Core Features Grid", "Student & Parent Experience", "FAQ", and Final CTA Banner with real navigation targets.

#### 3. Student Dashboard (`/dashboard`)
- Greet user by actual name (`"Welcome, {userName}"`).
- Align stat strip numbers with actual backend telemetry.
- Study materials card: Render Markdown properly (clamped to 3 lines with "Read more" modal/toggle), real file type icons (PDF, DOCX, TXT), date, and size. Add search, filter, and duplicate detection badge.
- Move floating "S" tile into header user menu. Make quick links prominent, card-style interactive elements.

#### 4. Quizzes (`/quizzes` & `/quizzes/:id`)
- Document list: compact rows with document metadata (size, upload date), one single primary action per document, and delete action in an overflow menu with confirmation modal.
- Active "Generating Quiz…" state with animated progress and `aria-live` announcement.
- Fix empty state copy alignment.
- Quiz runner: clean question progression bar, high-contrast radio options, review summary screen.

#### 5. AI Tutor (`/ai-tutor`)
- Honest status handling: Clearly indicate "Document-Grounded Tutor (Preview Mode)" with explanatory guidance.
- Render markdown replies cleanly using proper formatting.
- Fixed-height chat column with smooth auto-scroll to bottom, sticky composer with multi-line Enter / Shift+Enter support.
- File attachment chip preview and suggested starter prompts.

#### 6. Tasks (`/tasks`)
- Varied, logical priorities (High, Medium, Normal) based on deadline and study time.
- Group tasks by day (Today, Tomorrow, Later this week) with clear date headings.
- "Regenerate plan" confirmation modal warning before overwriting tasks.
- 24px accessible checkbox with strike-through completion animation.

#### 7. Focus Mode (`/focus`)
- Countdown presets (Pomodoro 25m, Extended 45m, Deep 60m, Custom) alongside stopwatch.
- Clean SVG progress ring that does not clip container.
- Filter out trivial sessions under 1 minute; prompt before saving short bursts.
- Searchable task selector dropdown.
- Session history grouped by day with humanized durations.

#### 8. Progress & Analytics (`/analytics`)
- Unify statistics calculation across all views.
- Replace duplicate cards with actionable metrics (Current Streak, Weekly Focus Target, Topic Accuracy).
- Polished chart with legible y-axis, clean gridlines, and hover tooltips.
- Topic performance breakdown table highlighting strong and weak areas.

#### 9. Parent Portal (`/parent`)
- Replace hardcoded "Steady progress" with honest, data-driven academic assessment.
- Synchronize metrics with student database (study hours, tasks completed, library docs).
- Replace emoji tab prefixes with Lucide icons.
- Add confirmation modal for "Disconnect Student" and state handling for invitations.

#### 10. Admin Portal (`/admin`)
- Confirmation dialogs for user suspension and role alteration. Block self-demotion or self-suspension.
- Accessible names (`aria-label`) on all 7 role select controls (resolves critical Axe violation).
- Paginated, sortable user management table.
- Clean telemetry status cards for JVM, ML engine, and database.
- Replace tab emoji prefixes with Lucide icons.

### Phase D: Metric Consistency & Data Harmonization
- Ensure single source of truth for study minutes, task completion, and quiz accuracy across Dashboard, Progress, Parent, and Admin views.

### Phase E: Verification & Re-Audit
- Production build validation (`npm run build`).
- Re-run automated Playwright & Axe audit at 1440, 1024, 768, and 390px.
- Compile final before/after comparison report in `docs/ui-audit.md`.
