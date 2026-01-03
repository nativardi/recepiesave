# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SaveIt: Recipe Edition** - A Next.js app that extracts recipes from social media videos (TikTok, Instagram, YouTube, Facebook) using AI analysis. Converts video content into structured recipes with ingredients, instructions, and metadata.

## MCP Servers (Model Context Protocol)

This project has connected MCP servers that provide enhanced capabilities. **Always use these MCPs when available** for their respective domains.

### Supabase MCP

**When to use:**
- Querying data directly from the production database
- Understanding relationships between tables (recipes, ingredients, instructions, collections)
- Verifying database schema and constraints
- Debugging database issues or RLS policies
- Understanding the production database structure

**What it provides:**
- Direct access to Supabase PostgreSQL database
- Schema inspection and metadata
- Query execution and result analysis
- Real-time data exploration

**Example use cases:**
- "Show me all recipes for user X"
- "What's the schema for the ingredients table?"
- "Check if there are any orphaned collection_items"
- "List all recipes with status='failed'"

**Important:** The Supabase MCP accesses the **production database**. In dev mode (`NEXT_PUBLIC_DEV_MODE=true`), the app uses MockDataStore with localStorage, not Supabase. Use the Supabase MCP when:
- Working in production mode
- Debugging database-related issues
- Verifying schema changes
- Analyzing real production data

### Context7 MCP

**When to use:**
- Understanding codebase structure and relationships
- Finding where specific functionality is implemented
- Analyzing code patterns and architecture
- Discovering component dependencies
- Exploring how features are connected across files

**What it provides:**
- Deep codebase context and understanding
- Cross-file relationship analysis
- Pattern recognition across the codebase
- Architectural insights

**Example use cases:**
- "How does recipe extraction flow through the codebase?"
- "Where are all the places that update recipe status?"
- "Show me the relationship between RecipeRepository and MockDataStore"
- "Find all components that display recipe cards"

### MCP Usage Guidelines

1. **Prefer MCPs over manual file reading** when exploring database or codebase structure
2. **Combine MCPs with file tools** for implementation work
3. **Use Supabase MCP for schema verification** before making database-related changes
4. **Use Context7 MCP for architectural understanding** before implementing new features
5. **MCPs provide fresh, accurate data** compared to potentially outdated documentation

## Development Commands

### Essential Commands

```bash
# Start all services (Next.js + Worker + Redis)
npm run dev:all

# Development server only (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Recipe Extraction Pipeline

The app has two modes controlled by `NEXT_PUBLIC_DEV_MODE` in `.env.local`:

**Unified Startup (Recommended):**
```bash
# Automatically detects mode and starts appropriate services
npm run dev:all
```

**Dev Mode (no database/services required):**
```bash
# Set in .env.local
NEXT_PUBLIC_DEV_MODE=true

# Just run Next.js (or use npm run dev:all)
npm run dev
```

**Production Mode (full recipe extraction):**
```bash
# Set in .env.local
NEXT_PUBLIC_DEV_MODE=false

# Option 1: Use the unified command (recommended)
npm run dev:all

# Option 2: Manual startup (if you need individual control)
# Terminal 1: Start Redis
docker-compose up

# Terminal 2: Start Python worker
cd recipe-extraction
source ../extraction/venv/bin/activate
python recipe_worker.py

# Terminal 3: Start Next.js
npm run dev
```

**Note:** The `npm run dev:all` command uses `concurrently` to intelligently start services based on your environment configuration. In production mode, it runs Redis, the Python worker, and Next.js with color-coded, prefixed logs for easy debugging.

## Architecture

### High-Level Structure

```
Next.js Frontend (React + TypeScript)
    ↓
React Query Hooks (useRecipes, useCollections)
    ↓
Repository Layer (environment-aware branching)
    ↓
├─→ Dev Mode: MockDataStore → localStorage
└─→ Production: Supabase → PostgreSQL + Recipe Extraction Pipeline
```

### Recipe Extraction Pipeline (Production Mode)

```
User submits URL → Next.js API → Redis Queue → Python Worker
                                                      ↓
                                              Platform Router (IG Downloader)
                                                      ↓
                                              Download → Extract Audio → Transcribe (Whisper)
                                                      ↓
                                              Recipe Analyzer (GPT-4o-mini)
                                                      ↓
                                              Data Mapper → Supabase Database
```

### Key Architectural Patterns

**1. Repository Pattern**
- All data access goes through `RecipeRepository` and `CollectionRepository`
- Repositories handle dev/prod mode branching internally
- UI components never call Supabase directly

**2. Dev Mode Toggle**
- `process.env.NEXT_PUBLIC_DEV_MODE === "true"` enables mock data
- MockDataStore provides full CRUD with localStorage persistence
- Allows development without database/external services

**3. Recipe Extraction Service Separation**
- `extraction/` contains IG Downloader (general-purpose video processing, unmodified)
- `recipe-extraction/` contains recipe-specific AI analysis and data mapping
- Wrapper pattern keeps concerns separated and IG Downloader pristine

## Directory Structure

```
app/
├── (app)/              # Authenticated app pages
│   ├── dashboard/      # Main recipe list
│   ├── recipe/[id]/    # Recipe detail, edit, cook mode
│   ├── collections/    # User recipe collections/cookbooks
│   ├── add/            # Add recipe from URL
│   ├── search/         # Search recipes
│   ├── profile/        # User profile and stats
│   └── settings/       # App settings, export/import
├── (auth)/             # Login/signup pages
├── (public)/           # Landing page
└── api/
    └── recipes/
        ├── extract/    # Create recipe extraction job
        └── [id]/status/# Poll extraction progress

components/
├── ui/                 # Base UI primitives (button, card, input)
├── layout/             # AppShell, TopBar, BottomNav
└── composites/         # Feature components (RecipeCard, UrlCapture)

lib/
├── repositories/       # Data access layer (Recipe, Collection)
├── hooks/              # React Query hooks
├── mocks/              # MockDataStore + mock data
├── supabase/           # Supabase client configuration
├── extraction/         # Redis queue integration
├── types/              # TypeScript types
└── utils/              # Helper functions

recipe-extraction/      # Python service for recipe-specific processing
├── recipe_worker.py    # RQ worker that processes jobs
├── recipe_processor.py # Orchestrates extraction pipeline
├── recipe_analyzer.py  # GPT-4o-mini recipe extraction
├── data_mapper.py      # Maps AI output to database schema
└── config.py           # Configuration

extraction/             # IG Downloader (general-purpose, unmodified)
```

## Database Schema

### Core Tables

**recipes**: Main recipe table
- `id`, `user_id`, `original_url`, `platform` (tiktok/instagram/youtube/facebook)
- `title`, `description`, `notes`, `thumbnail_url`
- `prep_time_minutes`, `cook_time_minutes`, `servings`, `cuisine`
- `is_favorite`, `status` (pending/downloading/transcribing/analyzing/completed/failed)
- `created_at`, `updated_at`

**ingredients**: Recipe ingredients with normalization
- `id`, `recipe_id`, `raw_text`, `item`, `quantity`, `unit`, `order_index`

**instructions**: Step-by-step instructions
- `id`, `recipe_id`, `step_number`, `text`

**collections**: User recipe collections/cookbooks
- `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`

**collection_items**: Many-to-many join table
- `collection_id`, `recipe_id`, `added_at`

## Important Implementation Notes

### Working with Data

**Always use repositories, never call Supabase directly:**
```typescript
// Good
import { RecipeRepository } from "@/lib/repositories/RecipeRepository";
const recipeRepo = new RecipeRepository();
const recipes = await recipeRepo.getAll(userId);

// Bad
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const { data } = await supabase.from("recipes").select("*");
```

**Dev mode is automatically handled by repositories:**
- No need to check `NEXT_PUBLIC_DEV_MODE` in UI components
- Repository methods handle branching internally
- MockDataStore simulates async operations and maintains relationships

### Processing Status Flow

When a recipe is being extracted, its `status` field progresses through:
1. `pending` - Job created, waiting to start
2. `downloading` - Fetching video from platform
3. `extracting_audio` - Processing with FFmpeg
4. `transcribing` - Transcribing audio with OpenAI Whisper
5. `analyzing` - Analyzing content with GPT-4o-mini
6. `completed` - Ready to view
7. `failed` - Error occurred

UI components poll `/api/recipes/[id]/status` to show progress.

### React Query Usage

The app uses TanStack Query for server state:
```typescript
// Custom hooks wrap repository calls
const { data: recipes } = useRecipes(userId);
const { data: collections } = useCollections(userId);

// Mutations invalidate queries automatically
const createRecipe = useCreateRecipe();
```

### Styling

- **Tailwind CSS** with custom theme (see `tailwind.config.ts`)
- **shadcn/ui** for base components (heavily customized)
- **Framer Motion** for animations
- Dark mode fully supported via CSS variables

### Environment Variables

See `.env.example` for complete list. Key variables:

**Required for dev mode:**
```bash
NEXT_PUBLIC_DEV_MODE=true
```

**Required for production mode:**
```bash
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Backend only, never expose to frontend
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx
```

## Recipe Extraction Integration

### Adding a Recipe

**Dev Mode:**
- User pastes URL
- MockDataStore creates recipe with `status: "pending"`
- `simulateRecipeProcessing()` updates status and generates mock data
- No external services required

**Production Mode:**
1. User pastes URL → `/api/recipes/extract`
2. API creates recipe in Supabase with `status: "pending"`
3. API enqueues job to Redis via `lib/extraction/queue.ts`
4. Python worker (`recipe-extraction/recipe_worker.py`) picks up job
5. Worker orchestrates pipeline:
   - Downloads video (via IG Downloader platform handlers)
   - Extracts audio and thumbnail (FFmpeg)
   - Transcribes audio (OpenAI Whisper API)
   - Analyzes transcript for recipe data (GPT-4o-mini)
   - Maps AI output to database schema
   - Stores recipe, ingredients, instructions in Supabase
6. Worker updates recipe `status` at each stage
7. Frontend polls status endpoint and shows progress

### Python Worker

The recipe extraction worker is in `recipe-extraction/`:
- Reuses 90% of IG Downloader for video processing
- Adds recipe-specific AI analysis via `recipe_analyzer.py`
- Maps unstructured AI output to structured database schema via `data_mapper.py`
- Never modifies IG Downloader code (wrapper pattern)

### Multilingual Recipe Extraction

**Recipe extraction now auto-detects and preserves the original language:**

- **Automatic Language Detection:** Detects Hebrew, Arabic, Chinese, Japanese, Korean, Russian, Thai, and other languages
- **Language Preservation:** Extracts recipe data (title, ingredients, instructions) in the original language
- **Spelling Correction:** Fixes spelling and grammar errors while preserving the language
- **No Translation:** GPT explicitly instructed NOT to translate to English

**Implementation Details:**
- Location: `recipe-extraction/recipe_analyzer.py`
- Function: `detect_transcript_language()` - Unicode-based language detection
- System prompt: Updated to "multilingual culinary AI assistant"
- Prompt instruction: Explicit "CRITICAL - LANGUAGE PRESERVATION" block added

**Supported Languages (Auto-detected):**
- Hebrew (עברית)
- Arabic (العربية)
- Chinese (中文)
- Japanese (日本語)
- Korean (한국어)
- Russian (Русский)
- Thai (ไทย)
- All other Latin-script languages (Spanish, French, German, etc.)

**Example:**
```
Hebrew video → Whisper transcribes → Language detected: "Hebrew"
→ GPT extracts in Hebrew + fixes spelling → Recipe in Hebrew ✅
```

## Testing Strategy

- **Phase 1-3 complete**: All UI built, tested with mock data
- **Phase 4 in progress**: Integration with recipe extraction pipeline
- No formal test suite yet (relies on manual testing)
- Mock data provides realistic testing scenarios

## Common Development Tasks

### Adding a New Recipe Field

1. Update database schema (Supabase migration)
2. Update TypeScript type in `lib/types/database.ts`
3. Update MockDataStore mock data in `lib/mocks/recipes.ts`
4. Update repositories if needed
5. Update UI components to display/edit new field

### Adding a New Platform

1. Ensure IG Downloader supports the platform (or add handler)
2. Add platform to `recipes.platform` enum
3. Update platform filter UI in dashboard
4. Add platform icon/badge styling

### Debugging Extraction Pipeline

```bash
# Check Redis connection
redis-cli ping

# View queue length
redis-cli llen recipe-extraction-jobs

# Monitor worker logs
cd recipe-extraction
python recipe_worker.py  # Watch for errors

# Test Supabase connection
cd recipe-extraction
python -c "from config import get_supabase_client; get_supabase_client()"
```

## Migration Path

The app is designed for progressive enhancement:
1. **Phase 1-3** (Complete): Fully functional with localStorage
2. **Phase 4** (In Progress): Recipe extraction pipeline integration
3. **Future**: Deploy to production (Vercel + Python worker on Render/Railway)

When moving to production:
- Set `NEXT_PUBLIC_DEV_MODE=false`
- Deploy Next.js to Vercel
- Deploy Python worker to Render/Railway/Fly.io
- Use Upstash for Redis in production
- Repositories automatically use Supabase instead of MockDataStore

## Security Context

This project has undergone security review. Understanding the security posture is critical for safe development.

### Security Documentation

- **[SECURITY_FINDINGS.md](./SECURITY_FINDINGS.md)** - Running log of all security findings
- **[Docs/SECURITY.md](./Docs/SECURITY.md)** - Comprehensive security documentation
- **[Docs/SECURITY_CHECKLIST.md](./Docs/SECURITY_CHECKLIST.md)** - Pre-production checklist

### Current Security Posture

**Status:** Early development, not production-ready

**Key Points:**
- **Dev Mode is safe** - Uses localStorage, no external services
- **Production Mode has known issues** - Flask service lacks authentication
- **Must-fix items documented** - 4 critical issues to address before any exposure

### Attack Surface Overview

| Component | Auth Status | Risk Level |
|-----------|-------------|------------|
| Next.js App | Supabase Auth + RLS | Low |
| Flask Service (`extraction/`) | **None** | **High** |
| Redis Queue | None (localhost only) | Medium |

### Security Rules for Development

1. **Never expose Flask service to the internet** without implementing API key auth first
2. **Be careful with ngrok/tunnels** - they expose unauthenticated endpoints
3. **Use dev mode** (`NEXT_PUBLIC_DEV_MODE=true`) for UI development to avoid risk
4. **Validate all URLs** using hostname allowlists, not string matching
5. **Don't log secrets** - check for console.log/print statements with sensitive data

### Known Must-Fix Issues (Before Any Exposure)

| Issue | Severity | File |
|-------|----------|------|
| Unauthenticated Flask APIs | Critical | `extraction/app.py` |
| Flask debug mode on 0.0.0.0 | High | `extraction/app.py` |
| Open CORS configuration | High | `extraction/app.py` |
| Weak URL validation (SSRF) | High | `app/api/recipes/extract/route.ts` |

See [SECURITY_FINDINGS.md](./SECURITY_FINDINGS.md) for detailed findings and recommended fixes.

### When Making Security-Related Changes

1. **Always read the file first** - Understand existing patterns
2. **Update SECURITY_FINDINGS.md** - Mark items as resolved or add new findings
3. **Follow existing patterns** - Repositories for data access, Supabase for auth
4. **Never bypass authentication** - Even for "internal" endpoints

## Key Files to Review

- `IMPLEMENTATION_PLAN.md` - Detailed phase-by-phase development plan
- `recipe-extraction/README.md` - Recipe extraction service documentation
- `lib/repositories/RecipeRepository.ts` - Data access layer pattern
- `lib/mocks/MockDataStore.ts` - Dev mode data store
- `app/api/recipes/extract/route.ts` - Job submission endpoint
- `SECURITY_FINDINGS.md` - Security findings and status
- `Docs/SECURITY.md` - Full security documentation
