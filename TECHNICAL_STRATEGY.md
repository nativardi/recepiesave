<!-- Description: Defines the end-to-end technical build pipeline for SaveIt (Recipe Edition), including HTML→React conversion, component-library reuse philosophy, project structure, sequencing, quality gates, audio pipeline integration, and long-term maintenance methodology. -->

# SaveIt (Recipe Edition) — Technical Strategy & Build Pipeline

## Status

- **Inputs available now**: PRD + UI/UX Map + UI Design Doc + Master UI Spec + DB schema + **16 HTML screens** (Tailwind) in `Recepie app UI/`.
- **Agreed adjustments**:
  - **Design-system normalization**: unify tokens (colors, fonts, radii) in app config.
  - **Icons**: keep **Material Symbols** initially for speed.
  - **Auth**: delay implementation until core features are working (dev bypass mode).
- **Architecture decision**: **Standalone monolith** — embed audio processing pipeline directly into this project.
- **Supabase operations**: All database/storage tasks handled via **Supabase MCP**.
- **Build approach**: Screen-by-screen conversion with incremental component extraction (see Section 5).
- **Implementation strategy**: **UI-first with mocks** — build and validate all screens with mock data, then wire backend progressively. Backend/worker setup is deferred until UI flows are proven.

---

## Quick Reference: What to Build & In What Order

### Where to find UI assets

All HTML code and screenshots for each screen are in:

```
Recepie app UI/
├── home_dashboard_1/        # Dashboard → START HERE (Wave 1, Screen #1)
│   ├── code.html           # HTML implementation
│   └── screen.png          # Design reference
├── recipe_detail_view/      # Recipe Detail → Wave 1, Screen #2
├── cook_mode_overlay/       # Cook Mode → Wave 1, Screen #3
├── home_dashboard_3/        # Cookbooks List → Wave 1, Screen #4
├── cookbook_details_1/      # Cookbook Details → Wave 1, Screen #5
└── ... (11 more screens)
```

### Screen build order

**See [Section 7: Screen Build Sequencing](#7-screen-build-sequencing-optimized-for-speed) for the complete inventory and recommended order.**

Quick summary:
- **Wave 1** (build first): Dashboard, Recipe Detail, Cook Mode, Cookbooks List, Cookbook Details
- **Wave 2**: Search/Pantry, Add Recipe, Processing State
- **Wave 3**: Create Cookbook, Add to Cookbook, Edit Recipe, Settings, Profile
- **Wave 4** (build last): Landing Page, Login, Signup

Each wave builds on component patterns discovered in previous waves.

---

## 1) Goals & Non-Goals

### Goals

- Convert HTML screens into a **production Next.js app** with:
  - **Reusable component library** (minimal component count).
  - **Consistent design tokens** (single source of truth).
  - **Fast iteration loop** (mock data → real data → polish).
  - **Supabase-backed** auth + data with RLS.
- Integrate the existing **audio processing pipeline** for recipe extraction.

### Non-Goals (for MVP build phase)

- Full monetization / "Pro" subscription implementation.
- Heavy performance micro-optimizations before core flows work.
- Perfect test coverage from day 1 (we'll add tests once flows stabilize).

---

## 2) Tech Stack (Baseline)

### Frontend

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (used as primitives; we still standardize our own design tokens)
- **TanStack Query** (client caching + mutation patterns)
- **Supabase JS** + auth helpers
- **Material Symbols** (initial icon set)

### Backend

- **Supabase Postgres** (tables from `Database_Schema.md`, plus RLS)
- **Supabase Storage** (thumbnails, audio files)
- **Supabase MCP** — all database schema, migrations, and storage operations

### Recipe Extraction Service (Embedded)

- **Integrated Python/Flask service** (embedded “engine”, sourced from IG Downloader / Reel-Downloader)
- **Redis + RQ** for async job queue (runs alongside Next.js)
- **OpenAI APIs**: Whisper (transcription), GPT-4.1-mini (analysis), Embeddings
- **Deployment**: Single standalone application (both frontend + extraction service)
- See [Section 12: Audio Pipeline Integration](#12-audio-processing-pipeline-integration) for architecture.

#### Source-of-truth & import strategy (recommended)

We treat the extraction pipeline as an internal **engine** inside this repo (monolith), but we do **not** “copy/paste” it.

- **Why**: copy/paste loses upgrade path and causes drift. A clean vendor strategy lets us update the engine later without rework.
- **Best approach**: **git subtree** into `extraction/` pinned to a known-good commit.
  - Repo: `https://github.com/nativardi/Reel-Downloader`
  - Path in that repo: `Code Pojects/IG Downloader`
  - Pin (known working commit): `8ff17bdcbb8ab70bfa88b62dc7189e1ce1f7fd2b`

**Subtree import commands (run once):**

```bash
# Add the engine repo as a remote (one-time)
git remote add ig-engine https://github.com/nativardi/Reel-Downloader.git
git fetch ig-engine

# Import ONLY the IG Downloader subdirectory into ./extraction (preserves history)
git subtree add --prefix="extraction" ig-engine "8ff17bdcbb8ab70bfa88b62dc7189e1ce1f7fd2b:Code Pojects/IG Downloader" --squash
```

**Subtree update commands (later, when we decide to upgrade the engine):**

```bash
git fetch ig-engine
git subtree pull --prefix="extraction" ig-engine main --squash
```

Notes:
- This keeps the extraction code **in-repo** (simple deployments), while still letting us upgrade via git history.
- We will wrap the engine behind **Next.js API routes** (SaveIt owns the public API). We do not depend on Flask routes at runtime.

---

## 3) UI/UX + Dev Philosophy: "Quality First, Minimize Duplication"

This is a guiding principle for the whole build:

### Core rules (in priority order)

1. **Quality and functionality are non-negotiable**
   - Never sacrifice user experience or app functionality to reduce component count.
   - If a screen needs a custom component to work properly, create it.

2. **Minimize duplication, not components**
   - The goal is to avoid copy-pasting the same pattern repeatedly.
   - If a pattern appears 2+ times, extract it as a reusable component.

3. **Prefer variants over new components**
   - One `Button` with variants beats `PrimaryButton`, `SecondaryButton`, `IconButton` as separate files.

4. **Prefer composition over complexity**
   - Build "page sections" by composing smaller primitives.
   - Keep components focused and single-purpose.

5. **Use design tokens consistently**
   - If a style repeats 3+ times, move it into a token/variant.

### What this means in practice

- We'll build a **small set of primitives** (Button, Input, Card, Tabs, Sheet/Dialog, Toggle, Chip, ListRow) and compose them into screens.
- We introduce a new component when it meets **any** of these:
  - **Reused 2+ times** across different screens.
  - **Complex enough** that inline implementation hurts readability.
  - **Interactive** with non-trivial state management.
  - **Accessibility-critical** (keyboard handling, ARIA, focus management).
  - **Screen-specific** but too large to keep inline (>50 lines).

### Decision framework

When asking "Should this be a component?":

```
Is it reused 2+ times? → YES → Extract it
       ↓ NO
Is it >50 lines inline? → YES → Extract it  
       ↓ NO
Does it have complex state/interactions? → YES → Extract it
       ↓ NO
Keep it inline in the page file
```

**Remember**: A well-organized codebase with 50 quality components beats a "minimal" codebase with 20 components and duplicated code.

---

## 4) Project Setup Pipeline (Starting from Scratch)

### Phase A — Bootstrap (Foundation)

**Deliverable:** Running Next.js app with global styles, tokens, routing skeleton.

- Create Next.js project (TypeScript + Tailwind + App Router)
- Add dependencies: Supabase, TanStack Query, shadcn/ui, tailwind-merge/clsx
- Add **Material Symbols** font import globally
- Establish design tokens:
  - **Colors**: normalize to a single palette (primary = `#ea580c`, background = `#fff7ed`, etc.)
  - **Typography**: keep **Inter + serif headings** (as in HTML); align to our spec later if desired
  - **Radii**: standardize (cards ~ `rounded-2xl`, pills `rounded-full`)

### Phase B — App Shell & Navigation

**Deliverable:** App layout with consistent header patterns + bottom nav.

- Implement route groups:
  - `(public)` for landing page
  - `(auth)` for login/signup
  - `(app)` for authenticated pages
- Implement `AppShell` layout for `(app)` routes:
  - `TopBar` slot (varies by screen)
  - `BottomNav` persistent
  - content padding to avoid nav overlap

### Phase C — Data Layer Skeleton (Before Real Data)

**Deliverable:** Typed data contracts + mock data provider.

- Define TypeScript types aligned to Supabase tables.
- Build a **mock repository** layer so UI work doesn't block:
  - `RecipeRepository` (mock → Supabase)
  - `CollectionRepository` (mock → Supabase)

---

## 5) HTML → React Conversion Strategy: Screen-by-Screen with Incremental Extraction

### Core Approach: Hybrid Sequential Method

**Why screen-by-screen?**
- **Precision**: Ensures each screen matches the design exactly before moving forward.
- **Reduces rework**: Prevents discovering edge cases after building 10 components.
- **Natural component discovery**: Components emerge organically from real usage patterns.

**Why incremental extraction?**
- **Speed**: Don't pre-build components you might not need.
- **Quality**: Components are shaped by actual requirements, not assumptions.

### The Process (Per Screen)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Implement screen inline (quick & dirty)            │
│  - Copy HTML structure, convert to JSX                     │
│  - Hardcode mock data inline                               │
│  - Get it rendering correctly                              │
│  Time: ~30-60 minutes per screen                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Identify duplication patterns                      │
│  - Is this pattern already in another screen?              │
│  - Is this >50 lines that could be isolated?              │
│  - Does this have reusable interactions?                   │
│  Time: ~10 minutes analysis                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Extract ONLY when justified                        │
│  - Move to components/ folder                              │
│  - Add proper TypeScript props                             │
│  - Make it reusable (but not over-engineered)             │
│  Time: ~20-40 minutes per component                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Refactor previous screens if applicable            │
│  - Go back and use new component in earlier screens        │
│  - Consolidate duplicated code                             │
│  Time: ~15 minutes per refactor                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Move to next screen
```

### Example: Dashboard Screen Workflow

**Initial implementation** (inline in `dashboard/page.tsx`):
```tsx
export default function Dashboard() {
  return (
    <div className="p-4">
      {/* 200 lines of inline JSX */}
      <div className="grid grid-cols-2 gap-4">
        {mockRecipes.map(recipe => (
          <div className="flex flex-col gap-2 bg-white p-2 rounded-lg">
            <img src={recipe.thumbnail} className="w-full rounded-lg aspect-[3/4]" />
            <div className="px-1 pb-1">
              <p className="text-gray-900 font-medium">{recipe.title}</p>
              <p className="text-gray-500 text-sm">{recipe.cookTime}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**After discovering reuse** (extract when building Recipe Detail):
```tsx
// components/composites/RecipeCard.tsx
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-2 rounded-lg">
      <img src={recipe.thumbnail} className="w-full rounded-lg aspect-[3/4]" />
      <div className="px-1 pb-1">
        <p className="text-gray-900 font-medium">{recipe.title}</p>
        <p className="text-gray-500 text-sm">{recipe.cookTime}</p>
      </div>
    </div>
  )
}

// dashboard/page.tsx (refactored)
export default function Dashboard() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {mockRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}
```

### When to Extract vs. Keep Inline

| Scenario | Action | Rationale |
|----------|--------|-----------|
| Pattern appears in 2+ screens | Extract immediately | Clear reuse case |
| Complex interaction (>20 lines logic) | Extract | Keeps page file readable |
| Used once but >80 lines | Extract | Improves page maintainability |
| Simple layout used once (<50 lines) | Keep inline | Not worth abstraction overhead |
| Styling only, no logic | Keep inline | Use Tailwind classes |

### Common Pitfalls (and how we avoid them)

**Pitfall 1: Premature abstraction**
- ❌ Building 30 components before implementing any screens
- ✅ Build screens first, extract components as patterns emerge

**Pitfall 2: Over-engineering for "future reuse"**
- ❌ Making every component hyper-configurable "just in case"
- ✅ Build for current needs, refactor when actual second use case appears

**Pitfall 3: Under-extraction (copy-paste hell)**
- ❌ Duplicating the same 50-line card across 5 screens
- ✅ Extract after second occurrence

**Pitfall 4: Style drift**
- ❌ Each screen using slightly different colors/spacing
- ✅ Centralize design tokens from day one

**Pitfall 5: Hardcoded data everywhere**
- ❌ Mock data scattered across component files
- ✅ Keep all mocks in `lib/mocks/` folder

### Quality Checkpoints (Per Screen)

Before moving to the next screen:
- [ ] Screen matches the HTML/screenshot visually
- [ ] Responsive on mobile (primary) and desktop
- [ ] Mock data flows through props correctly
- [ ] Interactive elements work (buttons, toggles, tabs)
- [ ] Any obvious duplication has been extracted
- [ ] No console errors or TypeScript issues

### Build Sequence (Recommended Order)

Following this order maximizes component reuse discovery:

1. **Dashboard** → Establishes: RecipeCard, URLInput, BottomNav
2. **Recipe Detail** → Establishes: Tabs, IngredientRow, InstructionStep
3. **Cook Mode** → Reuses: InstructionStep, adds ProgressBar
4. **Cookbooks List** → Reuses: RecipeCard (thumbnail variant), establishes CollectionCard
5. **Cookbook Details** → Reuses: RecipeCard, FilterChips
6. Continue Wave 2-4 screens...

This sequence ensures that when you build screen #5, you already have components from screens #1-4 to reuse.

---

## 6) Component Library Structure (Minimal + Reusable)

### Directory layout

```
components/
├── ui/              # shadcn primitives + our thin wrappers
├── primitives/      # opinionated building blocks (Button, Input, Card, Chip, etc.)
├── composites/      # reused 2+ screens (RecipeCard, IngredientRow, etc.)
└── layout/          # shell pieces (BottomNav, TopBar, AppShell)
```

### Target minimal component set (initial)

**Primitives (variants-driven):**

- `Button` (variants: primary/secondary/ghost/icon, sizes)
- `Input` / `Textarea`
- `Card` (+ `CardHeader`, `CardContent`)
- `Tabs` (shadcn)
- `Toggle` / `Switch` (shadcn)
- `Chip` (filter pills)
- `ListRow` (thumbnail + title + meta + optional right action)
- `ProgressBar` (for processing/cook mode)

**Composites (only if reused):**

- `RecipeCard` (grid)
- `RecipeThumbnailCard` (horizontal)
- `IngredientChecklistRow` (checkbox + text)
- `InstructionStepCard` (cook mode step)
- `BottomNav`
- `CookModeControls` (prev/next step navigation)

---

## 7) Screen Build Sequencing (Optimized for Speed)

### Complete Screen Inventory (16 screens)

All screens have HTML + screenshot available in `Recepie app UI/` folder.

| # | Screen | HTML Folder (in `Recepie app UI/`) | Route |
|---|--------|-------------|-------|
| 1 | Home Dashboard | `home_dashboard_1/` | `/dashboard` |
| 2 | Review & Edit Recipe | `home_dashboard_2/` | `/recipe/[id]/edit` |
| 3 | Cookbooks Library | `home_dashboard_3/` | `/collections` |
| 4 | Processing State | `home_dashboard_4/` | (inline state) |
| 5 | Add New Recipe | `home_dashboard_5/` | `/add` |
| 6 | Recipe Detail View | `recipe_detail_view/` | `/recipe/[id]` |
| 7 | The Pantry (Search) | `the_pantry_(search)/` | `/search` |
| 8 | App Settings | `app_settings/` | `/settings` |
| 9 | Cookbook Details | `cookbook_details_1/` | `/collections/[id]` |
| 10 | User Profile | `cookbook_details_2/` | `/profile` |
| 11 | Create New Cookbook | `create_new_cookbook/` | `/collections/new` |
| 12 | Add Recipes to Cookbook | `add_recipes_to_cookbook/` | `/collections/[id]/add-recipes` |
| 13 | **Cook Mode Overlay** | `cook_mode_overlay/` | `/recipe/[id]/cook` |
| 14 | **Landing Page** | `landing_page/` | `/` |
| 15 | **Login** | `login/` | `/login` |
| 16 | **Signup** | `signup/` | `/signup` |

### Build Waves

**Wave 1 — Core Navigation + Core Value**

1. Dashboard / Home
2. Recipe Detail
3. Cook Mode Overlay
4. Cookbooks list
5. Cookbook details

**Wave 2 — High-utility screens**

6. Pantry / Search chat
7. Add recipe (URL paste)
8. Processing state (inline card)

**Wave 3 — Management flows**

9. Create cookbook
10. Add recipes to cookbook
11. Review/Edit recipe
12. Settings
13. Profile

**Wave 4 — Public + Auth (delayed until core works)**

14. Landing page
15. Login
16. Signup

---

## 8) Authentication Strategy: Dev Bypass Mode

### Why delay auth?

- Speeds up development — no login required during testing.
- Reduces friction for rapid iteration.
- Auth screens are built in Wave 4 anyway.

### Implementation: Environment-based bypass

```typescript
// lib/auth/dev-user.ts
export const DEV_USER = {
  id: 'dev-user-uuid-12345',
  email: 'dev@saveit.local',
  full_name: 'Dev User',
  avatar_url: '/placeholder-avatar.png',
}

// lib/auth/get-user.ts
export async function getCurrentUser() {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return DEV_USER
  }
  return await getSupabaseUser()
}
```

### When to wire real auth

| Milestone | Auth Status |
|-----------|-------------|
| Wave 1-3 development | Dev bypass ON |
| Wave 4 (auth screens built) | Wire real Supabase Auth |
| Before first external user test | Auth required |
| Before any public deploy | Auth required |

### Environment variables

```bash
# .env.local (development)
NEXT_PUBLIC_DEV_MODE=true

# .env.production
NEXT_PUBLIC_DEV_MODE=false
```

---

## 9) Backend & Data Wiring Strategy

### Rule: UI first with mocks, then wire data progressively

- **Build all Wave 1 screens with mocks first.**
- **After Wave 1 renders correctly, do a backend validation spike** (Phase 3a) to prove one end-to-end extraction flow works.
- **Then continue building screens (Waves 2-4) and wire data as you go.**

### Why this sequence?

1. **Velocity**: You validate UX faster without waiting for backend setup.
2. **Pattern discovery**: You discover component reuse patterns organically by building multiple screens.
3. **Risk mitigation**: The backend spike (Phase 3a) catches integration issues early, before you've built 10+ screens that depend on incorrect assumptions.

### Integration milestones

**Phase 3a: Backend Validation Spike** (after Wave 1 screens built)
- Setup Supabase (tables, RLS, buckets, types)
- Wire ONE recipe extraction end-to-end (URL paste → worker → DB → UI)
- Validate mock data shapes match real schema
- Prove async patterns work (polling/realtime, status transitions, error handling)

**Phase 4+: Progressive wiring** (as Waves 2-4 screens are built)

1. **Supabase Read Paths** (first priority)
   - list recipes, recipe detail, list collections, collection details
   
2. **Supabase Write Paths**
   - create collection, add/remove collection items, update recipe notes/tags
   
3. **Supabase Auth** (Wave 4)
   - login/signup/logout, OAuth providers (Google, Apple)
   
4. **Audio Pipeline Integration** (expand beyond spike)
   - Add error recovery, retry logic, progress indicators
   - See [Section 12](#12-audio-processing-pipeline-integration) for full details.

### Realtime updates (nice-to-have, not blocking)

- Subscribe to recipe status updates so the dashboard updates when processing completes.

---

## 10) Quality Gates (Speed + Maintainability)

### Per-component gate

- Renders with:
  - empty data
  - long text
  - missing image
- Keyboard reachable where interactive
- No duplicated token-like class clusters in 3+ places

### Per-screen gate

- Matches screenshot layout within reasonable tolerance
- Loading state exists
- Error state exists (generic fallback is fine)

### Release gate

- Auth flow works (when enabled)
- URL paste creates a processing recipe row
- Dashboard shows recipes
- Recipe detail renders ingredients/instructions from DB
- Cook mode navigates through steps

---

## 11) Maintenance Methodology (How We Keep It Clean)

### Code ownership rules

- Any repeated UI pattern → becomes a variant or shared primitive.
- Any screen-specific layout that's not reused stays in the page file.
- Keep files small and focused (ideally <200 lines). If a component grows, split it by responsibility.

### Naming conventions

- Handlers: `handleClick`, `handleSubmit`, `handleToggle...`
- Components: nouns (`RecipeCard`, `BottomNav`)
- Variants: consistent (`variant="primary"`, `size="lg"`)

### Data access

- UI components do not call Supabase directly.
- Pages/hooks call a repository layer (mock → Supabase) so we can iterate without rewrites.

### Supabase MCP usage

- **All database operations** (schema, migrations, RLS policies) are executed via Supabase MCP.
- **Storage bucket setup** (thumbnails, audio) via MCP.
- **Type generation** for TypeScript types from DB schema.

---

## 12) Audio Processing Pipeline Integration

### Overview

The recipe extraction pipeline is an **embedded Python/Flask service** (vendored into `extraction/` from IG Downloader / Reel-Downloader) that:

1. Downloads video from social platforms (Instagram, TikTok, YouTube, Facebook)
2. Extracts audio and thumbnail
3. Transcribes audio (OpenAI Whisper)
4. Analyzes content for recipe data (OpenAI GPT-4.1-mini)
5. Generates embeddings for semantic search
6. Stores results in Supabase

### Architecture (Standalone Monolith)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SaveIt Application (Standalone)                  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Frontend (Next.js App Router)                 │    │
│  │                                                            │    │
│  │  User pastes URL → POST /api/recipes/extract              │    │
│  │                                                            │    │
│  │  [Dashboard] [Recipe Detail] [Cook Mode] [Collections]    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Next.js API Routes (/app/api/*)                   │    │
│  │                                                            │    │
│  │  POST /api/recipes/extract                                │    │
│  │  ├─ 1. Validate URL & platform                           │    │
│  │  ├─ 2. Create recipe row (status: pending)               │    │
│  │  └─ 3. Enqueue job to Redis → triggers Python worker     │    │
│  │                                                            │    │
│  │  GET /api/recipes/[id]/status                             │    │
│  │  └─ Return recipe status from DB                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │      Extraction Service (Python/Flask - Embedded)          │    │
│  │                                                            │    │
│  │  ┌──────────────┐    ┌──────────────┐                     │    │
│  │  │ Flask Server │ ←→ │ Redis Queue  │                     │    │
│  │  │ (Optional)   │    │              │                     │    │
│  │  └──────────────┘    └──────┬───────┘                     │    │
│  │                              ↓                             │    │
│  │                     ┌─────────────────┐                    │    │
│  │                     │  RQ Worker      │                    │    │
│  │                     │  (Background)   │                    │    │
│  │                     └────────┬────────┘                    │    │
│  │                              ↓                             │    │
│  │              ┌───────────────────────────────┐             │    │
│  │              │   Processing Pipeline         │             │    │
│  │              │                               │             │    │
│  │              │  1. Platform Handler          │             │    │
│  │              │  2. FFmpeg (audio/thumbnail)  │             │    │
│  │              │  3. Upload to Supabase        │             │    │
│  │              │  4. OpenAI Whisper            │             │    │
│  │              │  5. OpenAI Analysis           │             │    │
│  │              │  6. OpenAI Embeddings         │             │    │
│  │              │  7. Update recipe in DB       │             │    │
│  │              └───────────────────────────────┘             │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase (Shared Layer)                        │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │ PostgreSQL  │  │  Storage    │  │  Auth                       │ │
│  │ - recipes   │  │ - thumbnails│  │  - Users                    │ │
│  │ - ingredients│  │ - audio     │  │  - Sessions                 │ │
│  │ - instructions│ │            │  │                             │ │
│  │ - collections│  │            │  │                             │ │
│  │ - embeddings│  │            │  │                             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Project Structure (Monorepo)

```
saveit-recipe/
├── app/                      # Next.js App Router (frontend)
│   ├── (public)/
│   ├── (auth)/
│   ├── (app)/
│   └── api/
│       └── recipes/
│           └── extract/
│               └── route.ts  # Enqueues extraction job
├── components/               # React components
├── lib/                      # Shared utilities
├── extraction/               # Python extraction service (embedded)
│   ├── app.py               # Flask server (optional)
│   ├── worker.py            # RQ worker (required)
│   ├── utils/
│   │   ├── platforms/       # Instagram, TikTok, YouTube handlers
│   │   ├── job_processor.py
│   │   └── supabase_client.py
│   ├── requirements.txt
│   └── .env
├── docker-compose.yml       # Redis + services
├── package.json
└── README.md
```

### API Endpoints (Internal)

Since the extraction service is embedded, we use **Next.js API routes** as the interface:

**Create Job:**

```http
POST /api/recipes/extract
Content-Type: application/json

{
  "url": "https://www.instagram.com/reel/ABC123xyz/",
  "user_id": "user-uuid"
}
```

**Response:**

```json
{
  "recipe_id": "recipe-uuid",
  "status": "pending",
  "message": "Recipe extraction started"
}
```

**Get Status:**

```http
GET /api/recipes/[recipe_id]/status
```

**Response:**

```json
{
  "recipe_id": "recipe-uuid",
  "status": "transcribing",
  "progress": 45,
  "updated_at": "2025-01-15T10:31:00Z"
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting to start |
| `downloading` | Fetching video from platform |
| `extracting_audio` | Processing with FFmpeg |
| `uploading` | Uploading files to Supabase |
| `transcribing` | Transcribing audio with OpenAI Whisper |
| `analyzing` | Analyzing content with GPT-4.1-mini |
| `generating_embeddings` | Generating vector embeddings |
| `storing` | Storing final results |
| `completed` | Job completed successfully |
| `failed` | Job failed (check error_message) |

**Completed Result:**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "audio_url": "https://supabase.co/storage/...",
    "thumbnail_url": "https://supabase.co/storage/...",
    "duration": 45.5,
    "transcript": {
      "text": "Full transcript...",
      "language": "en"
    },
    "analysis": {
      "title": "Spicy Rigatoni Vodka",
      "summary": "Quick pasta recipe...",
      "ingredients": [...],
      "instructions": [...],
      "prep_time_minutes": 10,
      "cook_time_minutes": 20,
      "cuisine": "Italian",
      "dietary_tags": ["vegetarian"]
    },
    "embedding": {
      "id": "embedding-uuid"
    }
  }
}
```

### Frontend Integration Flow (Simplified)

```typescript
// app/(app)/add/page.tsx
const handleSubmitURL = async (url: string) => {
  try {
    // Single API call triggers everything
    const response = await fetch('/api/recipes/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url,
        user_id: currentUser.id 
      }),
    })

    const { recipe_id } = await response.json()
    
    // Navigate to dashboard - recipe shows with "processing" state
    router.push('/dashboard')
  } catch (error) {
    toast.error('Failed to extract recipe')
  }
}

// Dashboard shows processing card
{recipe.status === 'processing' && (
  <ProcessingCard 
    recipe={recipe}
    progress={recipe.progress || 0}
  />
)}

// Option 1: Polling (simple)
useEffect(() => {
  if (recipe.status === 'processing') {
    const interval = setInterval(async () => {
      const updated = await fetchRecipe(recipe.id)
      if (updated.status === 'completed') {
        refetchRecipes()
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds
    
    return () => clearInterval(interval)
  }
}, [recipe.status])

// Option 2: Realtime (better UX)
useEffect(() => {
  const channel = supabase
    .channel('recipe-updates')
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'recipes',
        filter: `id=eq.${recipe.id}`
      },
      (payload) => {
        if (payload.new.status === 'completed') {
          refetchRecipes()
          toast.success('Recipe ready!')
        }
      }
    )
    .subscribe()
    
  return () => supabase.removeChannel(channel)
}, [recipe.id])
```

### Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Redis (for extraction worker)
REDIS_URL=redis://localhost:6379

# OpenAI (for extraction)
OPENAI_API_KEY=sk-xxx...

# Dev mode
NEXT_PUBLIC_DEV_MODE=true
```

### Deployment Strategy (Standalone)

**Option 1: Single Container (Recommended for MVP)**

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install Python and system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg redis

# Copy Next.js app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Copy Python service
COPY extraction/ ./extraction/
RUN pip install -r extraction/requirements.txt

# Start script runs:
# 1. Redis server
# 2. Python RQ worker
# 3. Next.js server
CMD ["./start.sh"]
```

**Deploy to:**
- **Render.com** (easiest) - supports monorepo
- **Railway.app** - good for monolith
- **Fly.io** - full control

**Option 2: Separate Services (Better for scaling)**

| Service | Platform | Notes |
|---------|----------|-------|
| Next.js frontend | Vercel | Stateless, auto-scaling |
| Python worker | Render Background Worker | Runs `worker.py` |
| Redis | Upstash | Managed Redis |
| Supabase | Supabase Cloud | Database + Storage + Auth |

**Environment Variables (Production)**

```bash
# Shared
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
REDIS_URL=redis://production-redis:6379

# Next.js
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_DEV_MODE=false

# Python Worker
SUPABASE_AUDIO_BUCKET=recipe-audio
SUPABASE_THUMBNAIL_BUCKET=recipe-thumbnails
```

---

## 13) Immediate Next Steps (Actionable)

### Phase 0: Setup (Day 1)

1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest saveit-recipe --typescript --tailwind --app
   cd saveit-recipe
   ```

2. **Install dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install @tanstack/react-query
   npm install clsx tailwind-merge class-variance-authority
   npm install lucide-react  # or keep Material Symbols
   npx shadcn-ui@latest init
   ```

3. **Vendor the extraction engine** (**DEFERRED** - optional in Phase 0)
   - Import the engine into `extraction/` using the **git subtree** strategy above (pinned to a known working commit).
   - **Note**: You can defer this entirely until after Wave 1 screens are built. The extraction engine sits unused in `extraction/` until you're ready to wire it.
   - If you do import it now, do NOT test it yet — just verify the code is in place.

4. **Setup Supabase** (**DEFERRED** - do this when you're ready to wire real data)
   - Create tables from `Database_Schema.md`
   - Enable RLS policies
   - Create storage buckets (thumbnails, audio)
   - Generate TypeScript types
   - **Note**: You can skip this entirely in Phase 0. UI will use mocks. Come back to this before the backend spike (see Phase 3a).

5. **Configure design tokens**
   - Update `tailwind.config.ts` with normalized colors
   - Add Material Symbols font to `app/layout.tsx`
   - Create `lib/utils/cn.ts` for class merging

### Phase 1: Foundation (Days 2-3)

6. **Build app shell**
   - Create route groups: `(public)`, `(auth)`, `(app)`
   - Build `BottomNav` component
   - Build `AppShell` layout with dev bypass auth
   - Add mock user provider

7. **Setup data layer**
   - Create TypeScript types in `lib/types/`
   - Create mock data in `lib/mocks/recipes.ts`
   - Build repository pattern (mock implementations first)

### Phase 2: First Screen (Days 4-5)

8. **Build Dashboard screen** (screen-by-screen approach)
   - Implement inline first (get it working)
   - Extract components as duplication appears
   - Wire up mock data
   - Test responsive layout

### Phase 3: Continue Wave 1 Screens (Days 6-10)

9. **Complete Wave 1** (Dashboard variants + Recipe Detail + Collections)
   - Follow screen-by-screen approach (see Section 5)
   - Extract components incrementally (see Section 5)
   - Keep using mocks for all data

### Phase 3a: Backend Validation Checkpoint (Day 11)

10. **Backend integration spike** (validates async patterns before building more screens)
    - **Setup Supabase** (if not done yet): tables, RLS, buckets, types
    - **Wire ONE recipe extraction end-to-end**:
      - User pastes URL → `POST /api/recipes/extract` → worker processes → recipe row updates → UI polls/subscribes → shows completed recipe
    - **Validate**:
      - Mock data shapes match Supabase schema exactly
      - Async status transitions work (`pending` → `transcribing` → `completed`)
      - Error states render correctly
      - Loading states + polling/realtime work as designed
    - **Deliverable**: One fully-working recipe extraction flow (URL → final recipe display)
    - **Important**: This is a *validation spike*, not full integration. We're proving the pattern works before building 10 more screens that depend on it.

### Phase 4: Continue Waves 2-4 (Week 3+)

11. Follow Wave 2-4 screen sequence (see Section 7)
12. Wire real data progressively as screens are built (see Section 9)

---

## Appendix A: Complete Project Structure

```
saveit-recipe/
├── app/                                    # Next.js App Router
│   ├── (public)/
│   │   └── page.tsx                       # Landing page (/)
│   ├── (auth)/
│   │   ├── login/page.tsx                 # /login
│   │   └── signup/page.tsx                # /signup
│   ├── (app)/
│   │   ├── layout.tsx                     # AppShell with BottomNav
│   │   ├── dashboard/page.tsx             # /dashboard
│   │   ├── recipe/
│   │   │   └── [id]/
│   │   │       ├── page.tsx               # /recipe/[id]
│   │   │       ├── edit/page.tsx          # /recipe/[id]/edit
│   │   │       └── cook/page.tsx          # /recipe/[id]/cook
│   │   ├── collections/
│   │   │   ├── page.tsx                   # /collections
│   │   │   ├── new/page.tsx               # /collections/new
│   │   │   └── [id]/
│   │   │       ├── page.tsx               # /collections/[id]
│   │   │       └── add-recipes/page.tsx   # /collections/[id]/add-recipes
│   │   ├── search/page.tsx                # /search
│   │   ├── add/page.tsx                   # /add
│   │   ├── settings/page.tsx              # /settings
│   │   └── profile/page.tsx               # /profile
│   ├── api/
│   │   └── recipes/
│   │       ├── extract/route.ts           # POST - trigger extraction
│   │       └── [id]/
│   │           └── status/route.ts        # GET - check status
│   ├── layout.tsx                         # Root layout
│   └── globals.css                        # Global styles
├── components/
│   ├── ui/                                # shadcn primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── primitives/                        # Custom primitives
│   │   ├── chip.tsx
│   │   ├── list-row.tsx
│   │   └── progress-bar.tsx
│   ├── composites/                        # Reusable composites
│   │   ├── recipe-card.tsx
│   │   ├── ingredient-row.tsx
│   │   ├── instruction-step.tsx
│   │   └── processing-card.tsx
│   └── layout/                            # Layout components
│       ├── bottom-nav.tsx
│       ├── top-bar.tsx
│       └── app-shell.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser client
│   │   ├── server.ts                      # Server client
│   │   └── middleware.ts                  # Auth middleware
│   ├── types/
│   │   ├── database.types.ts              # Generated from Supabase
│   │   └── recipe.ts                      # App-specific types
│   ├── mocks/
│   │   ├── recipes.ts
│   │   ├── collections.ts
│   │   └── users.ts
│   ├── repositories/                      # Data access layer
│   │   ├── recipe-repository.ts
│   │   └── collection-repository.ts
│   ├── auth/
│   │   ├── dev-user.ts                    # Dev bypass
│   │   └── get-user.ts                    # Auth helper
│   └── utils/
│       ├── cn.ts                          # Class merging
│       └── format.ts                      # Formatters
├── extraction/                            # Python service (embedded)
│   ├── app.py                            # Flask server (optional)
│   ├── worker.py                         # RQ worker (required)
│   ├── utils/
│   │   ├── platforms/
│   │   │   ├── base_handler.py
│   │   │   ├── instagram_handler.py
│   │   │   ├── tiktok_handler.py
│   │   │   ├── youtube_handler.py
│   │   │   └── facebook_handler.py
│   │   ├── job_processor.py
│   │   ├── supabase_client.py
│   │   └── config.py
│   ├── requirements.txt
│   └── .env
├── Recepie app UI/                       # HTML screens (reference)
│   ├── home_dashboard_1/
│   │   ├── code.html
│   │   └── screen.png
│   └── ...
├── docs/                                 # Documentation
│   ├── TECHNICAL_STRATEGY.md
│   ├── Database_Schema.md
│   ├── PRD.md
│   └── ...
├── public/
│   └── placeholder-avatar.png
├── docker-compose.yml                    # Redis + services
├── .env.local                            # Local development
├── .env.example                          # Template
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── package.json
└── README.md
```

---

## Appendix B: Design Tokens (Normalized)

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        primary: '#ea580c',        // Orange-600
        'primary-hover': '#c2410c', // Orange-700
        background: '#fff7ed',      // Orange-50
        surface: '#ffffff',
        charcoal: '#3D405B',
        muted: '#78716c',           // Stone-500
        accent: '#ef4444',          // Red-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Lora', 'serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
        full: '9999px',
      },
    },
  },
}
```

---

## Appendix C: Supported Platforms (Extraction)

| Platform | URL Patterns |
|----------|--------------|
| Instagram | `instagram.com/reel/`, `instagram.com/p/` |
| TikTok | `tiktok.com/@user/video/`, `vm.tiktok.com/` |
| YouTube | `youtube.com/shorts/`, `youtu.be/` |
| Facebook | `facebook.com/reel/`, `fb.watch/` |

