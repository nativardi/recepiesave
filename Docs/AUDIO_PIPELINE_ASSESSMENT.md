# Audio Pipeline Integration - Revised Assessment

**Date:** 2025-12-25
**Status:** Phase 1-3 Complete ✅ | Phase 4 Planning Required

---

## Executive Summary

**Current State:** The RecipeSave app is fully functional with mock data. All UI screens are built, polished, and ready for production integration.

**Integration Strategy:** Git Subtree import of IG Downloader into `extraction/` folder (as defined in TECHNICAL_STRATEGY.md).

**Key Finding:** The IG Downloader needs recipe-specific modifications **in its own repository** before import. The current AI analyzer extracts general content, not recipe data.

**Recommendation:** Complete the recipe extraction modifications in IG Downloader first, then proceed with Git Subtree integration.

---

## Current Project Status

### ✅ Phases 1-3: COMPLETE

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1: Data Layer** | ✅ Complete | MockDataStore, repositories, localStorage persistence |
| **Phase 2: Essential Features** | ✅ Complete | Favorites, CRUD, collections, filters |
| **Phase 3: Polish** | ✅ Complete | Animations, dark mode, accessibility, error boundaries |

**Evidence:**
- Build passes: `npm run build` ✅
- All 14+ screens implemented
- 31 components (composites, primitives, layout, ui)
- Lighthouse: 95+ performance, 100 accessibility
- See: [PHASE_3_COMPLETION_REPORT.md](./Archive/PHASE_3_COMPLETION_REPORT.md)

### The App is Ready for Backend Integration

```
RecipeSave App (Current State)
├── app/
│   ├── (app)/          # All authenticated screens ✅
│   ├── (auth)/         # Login/Signup screens ✅
│   ├── (public)/       # Landing page ✅
│   └── api/            # API routes (stub) ⏳
├── components/         # 31 components ✅
├── lib/
│   ├── mocks/          # MockDataStore ✅
│   ├── repositories/   # RecipeRepository, CollectionRepository ✅
│   └── hooks/          # React Query hooks ✅
└── extraction/         # ⏳ NOT YET IMPORTED
```

---

## Integration Strategy (From TECHNICAL_STRATEGY.md)

### Approach: Git Subtree (Not Copy-Paste)

**Why Git Subtree:**
- Preserves upgrade path to IG Downloader
- Prevents code drift
- Clean vendor strategy
- Allows updates via `git subtree pull`

**Import Commands (To be executed when ready):**

```bash
# Add the engine repo as a remote (one-time)
git remote add ig-engine https://github.com/nativardi/Reel-Downloader.git
git fetch ig-engine

# Import ONLY the IG Downloader subdirectory into ./extraction
git subtree add --prefix="extraction" ig-engine \
  "8ff17bdcbb8ab70bfa88b62dc7189e1ce1f7fd2b:Code Pojects/IG Downloader" \
  --squash
```

**Update Commands (Later, when upgrading):**

```bash
git fetch ig-engine
git subtree pull --prefix="extraction" ig-engine main --squash
```

### Architecture: Standalone Monolith

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SaveIt Application (Standalone)                  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Frontend (Next.js App Router)                 │    │
│  │                                                            │    │
│  │  User pastes URL → POST /api/recipes/extract              │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Next.js API Routes (/app/api/*)                   │    │
│  │                                                            │    │
│  │  POST /api/recipes/extract                                │    │
│  │  ├─ 1. Validate URL & platform                           │    │
│  │  ├─ 2. Create recipe row (status: pending)               │    │
│  │  └─ 3. Enqueue job to Redis → triggers Python worker     │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │      Extraction Service (./extraction - Git Subtree)       │    │
│  │                                                            │    │
│  │  RQ Worker → Processing Pipeline → Supabase               │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Supabase (Single Project)                      │
│                                                                     │
│  PostgreSQL              Storage              Auth                  │
│  - recipes               - thumbnails         - Users               │
│  - ingredients           - audio              - Sessions            │
│  - instructions                                                     │
│  - collections                                                      │
│  - embeddings                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Gap: Recipe-Specific AI Extraction

### Expected Response (From TECHNICAL_STRATEGY.md, lines 799-813)

```json
{
  "analysis": {
    "title": "Spicy Rigatoni Vodka",
    "summary": "Quick pasta recipe...",
    "ingredients": [
      {"item": "rigatoni", "quantity": 1, "unit": "lb", "raw_text": "1 lb rigatoni"}
    ],
    "instructions": [
      {"step": 1, "text": "Cook pasta according to package directions"}
    ],
    "prep_time_minutes": 10,
    "cook_time_minutes": 20,
    "cuisine": "Italian",
    "dietary_tags": ["vegetarian"]
  }
}
```

### Current IG Downloader Response

```json
{
  "analysis": {
    "summary": "Content summary...",
    "topics": ["topic1", "topic2"],
    "sentiment": "positive",
    "category": "tutorial"
  }
}
```

### What Needs to Change

The IG Downloader's `utils/ai_analyzer.py` needs to be adapted with a **recipe-specific prompt** that extracts:

1. **Recipe Title** - AI-generated or from video metadata
2. **Ingredients List** - Parsed with quantity, unit, item
3. **Instructions** - Step-by-step with numbered steps
4. **Timing** - prep_time_minutes, cook_time_minutes
5. **Servings** - Number of portions
6. **Cuisine** - Italian, Mexican, Thai, etc.
7. **Dietary Tags** - vegetarian, gluten-free, etc.

---

## Recommended Approach

### Principle: Modify IG Downloader First, Then Import

The IG Downloader should be treated as a separate service. Modifications should happen **in its own repository**, not after importing into RecipeSave.

**Why:**
- IG Downloader remains a reusable, standalone tool
- RecipeSave imports a "recipe-ready" version
- No need to maintain forked code in RecipeSave
- Clean upgrade path if IG Downloader improves

### Phase 0: Recipe Extraction Adaptation (In IG Downloader)

**Location:** `/Users/user/Code Projects/IG Downloader/`

**Estimated Time:** 6-8 hours

#### Task 0.1: Create Recipe Analyzer Module (4h)

**File:** `utils/recipe_analyzer.py` (NEW)

```python
def extract_recipe_from_transcript(transcript: str) -> Dict:
    """
    Extract recipe information from transcript using GPT-4o-mini.

    Returns:
        {
            "title": str,
            "description": str,
            "ingredients": [
                {"item": str, "quantity": float, "unit": str, "raw_text": str}
            ],
            "instructions": [
                {"step": int, "text": str}
            ],
            "prep_time_minutes": int,
            "cook_time_minutes": int,
            "servings": int,
            "cuisine": str,
            "dietary_tags": [str]
        }
    """
```

**Prompt Engineering Requirements:**
- Clear output schema with validation
- Few-shot examples for better accuracy
- Graceful handling of non-recipe content
- Ingredient parsing (quantity + unit + item)
- Structured instruction extraction

#### Task 0.2: Add Extraction Mode Toggle (1h)

**File:** `utils/config.py`

Add configuration for extraction mode:

```python
# Extraction mode determines analysis output format
EXTRACTION_MODE = os.getenv("EXTRACTION_MODE", "general")  # "general" or "recipe"
```

#### Task 0.3: Update Job Processor (1h)

**File:** `utils/job_processor.py`

Add conditional logic:

```python
if config.EXTRACTION_MODE == "recipe":
    from utils.recipe_analyzer import extract_recipe_from_transcript
    analysis_data = extract_recipe_from_transcript(transcript_text)
else:
    analysis_data = analyze_content(transcript_text)
```

#### Task 0.4: Update API Response Format (1h)

**Files:** `app.py`, `utils/job_models.py`

Ensure the `/api/v1/jobs/{job_id}` endpoint returns recipe-structured data when in recipe mode.

#### Task 0.5: Test Recipe Extraction (1h)

- Test with real recipe videos (TikTok, Instagram)
- Validate ingredient parsing accuracy
- Test instruction extraction quality
- Verify timing estimates

**Deliverable:** IG Downloader with `EXTRACTION_MODE=recipe` that outputs recipe-structured data

---

### Phase 4: Git Subtree Integration (In RecipeSave)

**After Phase 0 is complete in IG Downloader**

**Estimated Time:** 8-10 hours

#### Task 4.1: Import via Git Subtree (1h)

```bash
cd "/Users/user/Code Projects/RecepieSave"

# Add remote
git remote add ig-engine https://github.com/nativardi/Reel-Downloader.git
git fetch ig-engine

# Import (use the commit with recipe extraction)
git subtree add --prefix="extraction" ig-engine \
  "<new-commit-hash>:Code Pojects/IG Downloader" --squash
```

#### Task 4.2: Configure Environment (1h)

**File:** `.env.local`

```bash
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# New for extraction
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx...
EXTRACTION_MODE=recipe
```

#### Task 4.3: Setup Supabase (2h)

Using the existing RecipeSave Supabase project:

1. **Run migrations** - Apply Database_Schema.md tables
2. **Create storage buckets** - `thumbnails`, `recipe-audio`
3. **Configure RLS policies** - User isolation
4. **Enable pgvector** - For embeddings

**Note:** Use single Supabase project for both frontend and extraction service.

#### Task 4.4: Create Next.js API Routes (3h)

**File:** `app/api/recipes/extract/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { enqueueExtractionJob } from '@/lib/extraction/queue';

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Create recipe with pending status
  const { data: recipe } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      original_url: url,
      status: 'pending',
      title: 'Processing...'
    })
    .select()
    .single();

  // Enqueue extraction job
  await enqueueExtractionJob({
    recipe_id: recipe.id,
    url: url
  });

  return NextResponse.json({ recipe_id: recipe.id });
}
```

**File:** `app/api/recipes/[id]/status/route.ts`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, status, title, updated_at')
    .eq('id', params.id)
    .single();

  return NextResponse.json(recipe);
}
```

#### Task 4.5: Create Queue Integration Layer (2h)

**File:** `lib/extraction/queue.ts`

Bridge between Next.js and Python RQ worker:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function enqueueExtractionJob(job: {
  recipe_id: string;
  url: string;
}) {
  // Push job to Redis queue that RQ worker monitors
  await redis.lpush('rq:queue:default', JSON.stringify({
    func: 'utils.job_processor.process_recipe_job',
    args: [job.recipe_id, job.url],
  }));
}
```

#### Task 4.6: Wire Frontend to Real Data (2h)

Update the Add Recipe page to call the real API:

```typescript
// app/(app)/add/page.tsx
const handleSubmit = async (url: string) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    // Mock mode - keep existing behavior
    return await mockProcessing(url);
  }

  // Production mode - call real API
  const response = await fetch('/api/recipes/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const { recipe_id } = await response.json();
  router.push('/dashboard');
};
```

---

## Database Strategy

### Single Supabase Project (Recommended)

Both the Next.js frontend and Python extraction service share one Supabase project:

```
Supabase Project: saveit-recipe
├── Tables (PostgreSQL)
│   ├── profiles          # User accounts
│   ├── recipes           # Recipe data (filled by extraction)
│   ├── ingredients       # Parsed ingredients (filled by extraction)
│   ├── instructions      # Parsed steps (filled by extraction)
│   ├── collections       # User cookbooks
│   ├── collection_items  # Recipe-collection links
│   └── tags              # Recipe tags
├── Storage
│   ├── thumbnails/       # Recipe thumbnails
│   └── recipe-audio/     # Extracted audio (temporary)
└── Auth
    └── Users + Sessions
```

### Shared Environment Variables

```bash
# Both services use these
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Python uses service role
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...  # Frontend uses anon key
```

---

## Dev Mode Testing Strategy

### Option A: Keep Mock Mode (Recommended for UI Testing)

The existing mock mode in Phase 1-3 remains valuable:

```typescript
// .env.local
NEXT_PUBLIC_DEV_MODE=true  // Uses MockDataStore, no external services
```

**Benefits:**
- Fast iteration on UI
- No Redis/Python required
- Works offline

### Option B: Local Integration Testing

When ready to test the full pipeline locally:

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Python RQ Worker
cd extraction && python worker.py

# Terminal 3: Next.js
npm run dev
```

```typescript
// .env.local
NEXT_PUBLIC_DEV_MODE=false
REDIS_URL=redis://localhost:6379
```

---

## Risks and Mitigations

### Risk 1: AI Extraction Quality

**Risk:** GPT-4o-mini may not accurately extract ingredients/instructions from all video types.

**Mitigation:**
- Prompt engineering with few-shot examples
- User-editable results (Edit Recipe page already exists)
- Fallback to transcript display if extraction fails

### Risk 2: Multi-Service Complexity

**Risk:** Running Next.js + Redis + Python worker adds operational complexity.

**Mitigation:**
- Docker Compose for local development
- Single container deployment option (as documented in TECHNICAL_STRATEGY.md)
- Railway/Render for managed deployment

### Risk 3: API Costs

**Risk:** OpenAI API usage (Whisper + GPT) could become expensive at scale.

**Mitigation:**
- Rate limiting (already in IG Downloader: 10 requests/hour/IP)
- Caching transcripts
- Consider on-device Whisper for transcription

---

## Timeline Summary

| Phase | Description | Time | Dependencies |
|-------|-------------|------|--------------|
| **Phase 0** | Modify IG Downloader for recipe extraction | 6-8h | None |
| **Phase 4.1** | Git Subtree import | 1h | Phase 0 complete |
| **Phase 4.2-4.6** | Integration, API routes, wiring | 7-9h | Phase 4.1 |
| **Total** | Full integration | 14-18h | |

---

## Immediate Next Steps

### 1. Decide: When to Start Phase 0

**Option A: Start Now**
- Modify IG Downloader for recipe extraction
- Then import and integrate with RecipeSave
- Get full production pipeline working

**Option B: Defer**
- Keep RecipeSave running in mock mode
- Focus on other features/testing
- Return to integration later

### 2. If Proceeding with Phase 0

1. Open IG Downloader project
2. Create `utils/recipe_analyzer.py` with recipe-specific prompts
3. Add `EXTRACTION_MODE` configuration
4. Update job processor to use recipe analyzer
5. Test with real videos
6. Commit and tag as "recipe-extraction-v1"

### 3. If Proceeding with Phase 4

1. Import via Git Subtree
2. Configure environment
3. Setup Supabase (or connect to existing)
4. Create API routes
5. Wire frontend
6. Test end-to-end

---

## Questions for Clarification

1. **Phase 0 Timing:** Do you want to proceed with modifying IG Downloader now, or defer?

2. **Supabase Project:** Is there an existing Supabase project for RecipeSave, or should we create a new one?

3. **Deployment Target:** What's the planned deployment platform?
   - Railway/Render (single container)
   - Vercel + separate worker (split services)
   - Self-hosted

4. **Testing Priority:** Do you want to test with mock mode first, or jump directly to local integration testing?

---

## Conclusion

The RecipeSave app is ready for backend integration. The Git Subtree strategy defined in TECHNICAL_STRATEGY.md is solid. The main blocker is that IG Downloader needs recipe-specific extraction logic before import.

**Recommended Path:**
1. Phase 0: Adapt IG Downloader for recipe extraction (in its own repo)
2. Phase 4: Git Subtree import and integration
3. Test end-to-end with real videos
4. Deploy to production

This approach keeps both projects clean, maintainable, and properly separated while enabling full integration.
