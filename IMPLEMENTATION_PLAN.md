# SaveIt Recipe App - Database-Free Implementation Plan

## Current Status: Ready for Phase 4

**Phases 1-3: COMPLETE ✅** - See [PHASE_3_COMPLETION_REPORT.md](./Docs/Archive/PHASE_3_COMPLETION_REPORT.md)

**Next Step:** Phase 4 - Audio Pipeline Integration

**Integration Strategy:** Wrapper/Adapter Pattern - Git Subtree import of IG Downloader (pristine) + custom recipe-extraction service

**Detailed Plan:** [AUDIO_PIPELINE_INTEGRATION_PLAN.md](./Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md)

**Key Decision:** IG Downloader remains general-purpose and unmodified. Recipe-specific logic lives in `recipe-extraction/` folder.

---

## Executive Summary

**Current State:** The app is fully functional with mock data. All 14+ pages built, 31 components, dark mode, animations, accessibility (WCAG AA) - all working.

**Goal:** Integrate with the audio processing pipeline to enable real recipe extraction from video URLs.

**Strategy:** Git Subtree import of IG Downloader (after recipe-specific modifications), single Supabase database for both services.

---

## Current State Analysis

### ✅ What's Working
- **UI is 82% complete** - All 14 pages built, most functionality in place
- **31 well-organized components** - Clean architecture (layout, composites, primitives, ui)
- **Comprehensive mock data exists** - 3 recipes with ingredients/instructions, 3 collections
- **TypeScript strict mode** - Full type safety established (Phase 1.3 complete)
- **React Query hooks set up** - Data layer infrastructure ready

### ❌ Critical Issue
- **App crashes on load** - Repositories call `createClient()` which returns mock that throws errors
- **Mock data disconnected** - Exists in `/lib/mocks/recipes.ts` but never used
- **No abstraction layer** - No way to swap between mock and real data

### 🎯 User Requirements
1. Maximum functionality without database ✓
2. Testable and iterable version ✓
3. Only introduce database when truly necessary ✓

---

## Architecture: External Processing Service Integration

### **Critical Component: Python/Flask Service**

SaveIt integrates with a **separate Python/Flask application** that handles all video processing:

**External Service Responsibilities:**
- Download videos from TikTok, Instagram, YouTube, Facebook (via yt-dlp)
- Extract audio and thumbnails (via FFmpeg)
- Transcribe audio to text (via OpenAI Whisper)
- ⚠️ **Current Status:** Analyze content with GPT-4o-mini to extract:
  - General summary and topics
  - Sentiment and category
- ⚠️ **REQUIRED MODIFICATION:** Must be updated to extract recipe-specific data:
  - Recipe title and description
  - Ingredients list (parsed with quantities and units)
  - Step-by-step instructions
  - Cuisine type, prep/cook time, servings
- Generate vector embeddings for semantic search
- Store all assets in Supabase Storage
- Update job record in Supabase database

**⚠️ CRITICAL:** The current AI analyzer does NOT extract recipe data. See [AUDIO_PIPELINE_ASSESSMENT.md](./Docs/AUDIO_PIPELINE_ASSESSMENT.md) for details.

**External Service API:**
- `POST /api/v1/process` - Create processing job (returns job_id)
- `GET /api/v1/jobs/{job_id}` - Poll job status and get results

**Status Flow:**
pending → downloading → extracting_audio → uploading → transcribing → analyzing → generating_embeddings → storing → completed

### **Integration Flow (Production Mode)**

1. **User pastes URL** → Next.js frontend `/add` page
2. **Frontend calls** → Next.js API route `/api/recipes/extract`
3. **API route creates recipe** → Supabase with `status: "pending"`
4. **API route calls external service** → POST to `/api/v1/process` with URL
5. **External service processes asynchronously** → Updates recipe in Supabase as it progresses
6. **Frontend polls** → GET `/api/recipes/[id]/status` every 2 seconds
7. **Frontend updates UI** → Shows processing states, progress bar
8. **When completed** → Navigate to recipe detail page with full data

### **Dev Mode (Mock Processing Flow)**

When `NEXT_PUBLIC_DEV_MODE=true`:
- **Skip external service calls** - Don't call Python/Flask API
- **Simulate processing locally** - Use setTimeout to mimic async processing
- **Generate mock data** - Create fake ingredients/instructions
- **Update status through stages** - pending → processing → transcribing → analyzing → completed
- **Store in MockDataStore** - All data stays in localStorage

This allows development and testing without:
- Running the external Python service
- Having OpenAI API keys
- Waiting for real video downloads/processing
- Using Supabase

---

## Implementation Plan

### **Phase 1: Fix Data Layer** (11 hours - CRITICAL)

Make the app runnable by creating a mock data store and wiring it to repositories.

#### Task 1.1: Create Mock Data Store (2 hours)
**File:** `/lib/mocks/MockDataStore.ts` (NEW)

Create a singleton class that:
- Holds all mock data in memory (recipes, ingredients, instructions, collections, collection_items)
- Loads from localStorage on initialization
- Saves to localStorage after mutations
- Provides CRUD methods matching repository signatures

```typescript
class MockDataStore {
  private recipes: Recipe[] = mockRecipes;
  private ingredients: Ingredient[] = mockIngredients;
  // ... other tables

  constructor() {
    this._loadFromStorage();
  }

  // Read operations
  getRecipes(userId: string): Recipe[]
  getRecipe(id: string): Recipe | null
  getRecipeWithDetails(id: string): RecipeWithDetails | null

  // Write operations
  createRecipe(data: RecipeCreateInput): Recipe
  updateRecipe(id: string, data: Partial<Recipe>): Recipe | null
  deleteRecipe(id: string): boolean

  // Persistence
  private _loadFromStorage(): void
  private _saveToStorage(): void
}
```

**Deliverable:** Fully functional in-memory data store with localStorage persistence

---

#### Task 1.2: Update RecipeRepository (3 hours)
**File:** `/lib/repositories/RecipeRepository.ts` (MODIFY)

Add environment-aware branching to all 9 methods:

```typescript
export class RecipeRepository {
  private _useMockData(): boolean {
    return process.env.NEXT_PUBLIC_DEV_MODE === "true";
  }

  async getAll(userId: string): Promise<Recipe[]> {
    if (this._useMockData()) {
      return mockDataStore.getRecipes(userId);
    }

    // Existing Supabase code unchanged
    const supabase = createClient();
    // ...
  }

  // Same pattern for all methods:
  // - getById()
  // - getByIdWithDetails()
  // - getAllWithDetails()
  // - create()
  // - updateStatus()
  // - update()
  // - delete()
}
```

**Key Points:**
- No signature changes - UI code stays the same
- Generate IDs using `crypto.randomUUID()`
- Maintain same error handling patterns
- Easy to remove dev mode checks later

---

#### Task 1.3: Update CollectionRepository (3 hours)
**File:** `/lib/repositories/CollectionRepository.ts` (MODIFY)

Same pattern as RecipeRepository, handling collection-specific logic:

```typescript
async getByIdWithRecipes(collectionId: string): Promise<CollectionWithRecipes | null> {
  if (this._useMockData()) {
    const collection = mockDataStore.getCollection(collectionId);
    if (!collection) return null;

    const items = mockDataStore.getCollectionItems(collectionId);
    const recipeIds = items.map(item => item.recipe_id);
    const recipes = mockDataStore.getRecipesByIds(recipeIds);

    return { ...collection, recipes, recipe_count: recipes.length };
  }

  // Existing Supabase code...
}
```

Update all 9 methods with dev mode branching.

---

#### Task 1.4: Environment Setup & Testing (1 hour)
**Files:** `.env.local` (NEW), `.env.example` (NEW)

1. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_DEV_MODE=true
   ```

2. Create `.env.example`:
   ```bash
   # Set to "true" to use mock data (no database required)
   NEXT_PUBLIC_DEV_MODE=true

   # Supabase credentials (only needed when DEV_MODE is false)
   # NEXT_PUBLIC_SUPABASE_URL=your-project-url
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Test checklist:
   - [ ] Run `npm run dev`
   - [ ] Dashboard loads with 3 mock recipes
   - [ ] Collections page shows mock collections
   - [ ] Recipe detail page displays ingredients/instructions
   - [ ] No console errors during navigation
   - [ ] localStorage contains `saveit_mock_data`

---

#### Task 1.5: Add CRUD Mutations to Mock Store (2 hours)
**File:** `/lib/mocks/MockDataStore.ts` (MODIFY)

Implement create, update, delete operations:

```typescript
createRecipe(data: RecipeCreateInput): Recipe {
  const recipe: Recipe = {
    id: crypto.randomUUID(),
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  this.recipes.push(recipe);
  this._saveToStorage();
  return recipe;
}

deleteRecipe(id: string): boolean {
  const index = this.recipes.findIndex(r => r.id === id);
  if (index === -1) return false;

  // Cascade delete
  this.ingredients = this.ingredients.filter(i => i.recipe_id !== id);
  this.instructions = this.instructions.filter(i => i.recipe_id !== id);
  this.collectionItems = this.collectionItems.filter(ci => ci.recipe_id !== id);

  this.recipes.splice(index, 1);
  this._saveToStorage();
  return true;
}
```

**Deliverable:** Full CRUD operations working with localStorage persistence

---

#### Task 1.6: Mock Recipe Processing Flow (3 hours)
**Files:**
- `/lib/mocks/MockDataStore.ts` (MODIFY) - Add recipe processing simulation
- `/app/(app)/add/page.tsx` (MODIFY) - Update to use mock processing in dev mode

**Problem:** Currently the Add Recipe page simulates processing but doesn't create realistic data.

**Solution:** Implement a mock processing flow that generates realistic recipe data:

```typescript
// lib/mocks/MockDataStore.ts
class MockDataStore {
  async simulateRecipeProcessing(recipeId: string, url: string): Promise<void> {
    // Stage 1: Downloading (1 second)
    await this.updateRecipe(recipeId, {
      status: 'downloading',
      title: 'Downloading video...'
    });
    await this._sleep(1000);

    // Stage 2: Transcribing (2 seconds)
    await this.updateRecipe(recipeId, {
      status: 'transcribing',
      title: 'Transcribing audio...'
    });
    await this._sleep(2000);

    // Stage 3: Analyzing (2 seconds)
    await this.updateRecipe(recipeId, {
      status: 'analyzing',
      title: 'Analyzing recipe...'
    });
    await this._sleep(2000);

    // Stage 4: Complete (generate mock data)
    const mockRecipeData = this._generateMockRecipeFromUrl(url);
    await this.updateRecipe(recipeId, {
      status: 'completed',
      title: mockRecipeData.title,
      description: mockRecipeData.description,
      cuisine: mockRecipeData.cuisine,
      prep_time_minutes: mockRecipeData.prep_time,
      cook_time_minutes: mockRecipeData.cook_time,
      servings: mockRecipeData.servings,
      thumbnail_url: mockRecipeData.thumbnail,
    });

    // Add mock ingredients and instructions
    this._addMockIngredients(recipeId, mockRecipeData.ingredients);
    this._addMockInstructions(recipeId, mockRecipeData.instructions);
  }

  private _generateMockRecipeFromUrl(url: string) {
    // Generate realistic mock recipe based on URL
    // Randomize from preset templates
    const templates = [
      {
        title: 'Creamy Garlic Pasta',
        description: 'Simple and delicious pasta with garlic cream sauce',
        cuisine: 'Italian',
        prep_time: 10,
        cook_time: 15,
        servings: 4,
        thumbnail: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
        ingredients: [
          { item: 'pasta', quantity: 1, unit: 'lb', raw_text: '1 lb pasta' },
          { item: 'heavy cream', quantity: 1, unit: 'cup', raw_text: '1 cup heavy cream' },
          { item: 'garlic', quantity: 4, unit: 'cloves', raw_text: '4 cloves garlic' },
        ],
        instructions: [
          { step: 1, text: 'Boil pasta according to package directions' },
          { step: 2, text: 'In a large pan, sauté minced garlic in butter' },
          { step: 3, text: 'Add heavy cream and simmer for 5 minutes' },
          { step: 4, text: 'Toss pasta with sauce and serve' },
        ]
      },
      // Add 2-3 more templates for variety
    ];

    // Return random template or rotate based on URL hash
    return templates[Math.floor(Math.random() * templates.length)];
  }
}
```

**Update Add Recipe page:**
```typescript
// app/(app)/add/page.tsx
const handleSubmit = async (url: string) => {
  // ... validation ...

  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    // Dev mode: Create recipe with pending status
    const newRecipe = await recipeRepository.create({
      user_id: user.id,
      original_url: url,
      platform: platform,
      status: "pending",
    });

    // Start mock processing in background (non-blocking)
    mockDataStore.simulateRecipeProcessing(newRecipe.id, url);

    // Navigate to dashboard immediately
    router.push("/dashboard");

  } else {
    // Production mode: Call API route which calls external service
    const response = await fetch('/api/recipes/extract', {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: { 'Content-Type': 'application/json' },
    });

    const { recipe_id } = await response.json();
    router.push("/dashboard");
  }
};
```

**Benefits:**
- Realistic testing without external service
- See full processing flow (status updates, progress)
- Generates varied recipe data for testing
- Can test processing states, error handling, polling

**Deliverable:** Mock recipe creation flow that mimics real external service processing

---

### **Phase 1 Validation**

After completing Phase 1, you should be able to:
- ✓ Load the app without errors
- ✓ See mock recipes on dashboard
- ✓ Navigate to recipe detail and view ingredients/instructions
- ✓ Refresh page and data persists
- ✓ Toggle `NEXT_PUBLIC_DEV_MODE` between true/false

**Milestone:** App is runnable and testable without database

---

## **Phase 2: Essential Features** (19 hours - HIGH VALUE)

Add missing UI features that provide immediate user value and work with mock data.

### Priority 1 - Core Functionality (8 hours)

#### Task 2.1: Favorite Toggle (2 hours)
**Files:**
- `/lib/repositories/RecipeRepository.ts` - Add `toggleFavorite()` method
- `/components/composites/RecipeCard.tsx` - Add click handler
- `/app/(app)/recipe/[id]/page.tsx` - Wire bookmark button

**Features:**
- Click heart icon to toggle `is_favorite` field
- Optimistic UI update (instant feedback)
- Toast notification "Added to favorites"
- Animated heart scale + color transition

#### Task 2.2: Favorites Filter (1 hour)
**File:** `/app/(app)/dashboard/page.tsx`

Add filter tabs above recipe grid:
```tsx
<Tabs value={filterView}>
  <TabsTrigger value="all">All Recipes</TabsTrigger>
  <TabsTrigger value="favorites">Favorites ({favoriteCount})</TabsTrigger>
</Tabs>
```

#### Task 2.3: Delete Recipe with Confirmation (2 hours)
**Files:**
- `/components/ui/confirm-dialog.tsx` (NEW) - Reusable confirmation modal
- `/app/(app)/recipe/[id]/page.tsx` - Add delete button + dialog

**Features:**
- Delete button in recipe detail header
- Confirmation modal: "This recipe will be permanently deleted"
- Cascade delete (removes from all collections)
- Redirect to dashboard after delete
- Toast confirmation

#### Task 2.4: Edit Recipe (3 hours)
**File:** `/app/(app)/recipe/[id]/edit/page.tsx`

Build functional form:
- Title (required)
- Description (optional)
- Notes (optional)
- Prep time, cook time, servings (numbers)
- Cuisine (text)
- Save button calls `recipeRepository.update()`
- Toast "Recipe updated"

---

### Priority 2 - Collections Management (5 hours)

#### Task 2.5: Create/Edit Collections (2 hours)
**Files:**
- `/app/(app)/collections/new/page.tsx` - Wire create form
- `/app/(app)/collections/[id]/edit/page.tsx` (NEW) - Edit form

Form fields: name (required), description (optional)

#### Task 2.6: Add/Remove Recipes from Collections (3 hours)
**File:** `/app/(app)/collections/[id]/add-recipes/page.tsx`

Wire up existing UI:
- Show all recipes with checkboxes
- Checked = already in collection
- Toggle calls `addRecipe()` or `removeRecipe()`
- Real-time count update "23 recipes in this cookbook"

---

### Priority 3 - Filters & Discovery (3 hours)

#### Task 2.7: Platform Filter (1 hour)
**File:** `/app/(app)/dashboard/page.tsx`

Add horizontal scrollable filter chips:
- All (count)
- TikTok (count)
- Instagram (count)
- YouTube (count)
- Facebook (count)

#### Task 2.8: Empty States Polish (2 hours)
Enhance empty states on all pages:
- Dashboard: "No recipes saved yet" + guidance
- Collections: "Create your first cookbook" + CTA button
- Search: "No recipes found" + suggestion
- Favorites: "No favorites yet" + heart icon

---

### Priority 4 - UX Polish (3 hours)

#### Task 2.9: Loading States (2 hours)
Audit all pages for skeleton loaders:
- Dashboard: RecipeGridSkeleton ✓ (already exists)
- Collections: CollectionCardSkeleton ✓ (already exists)
- Recipe Detail: Add loading state if missing
- Search: Add skeleton for results

#### Task 2.10: Toast Notifications (1 hour)
Install Sonner: `npm install sonner`

Add toasts for all actions:
- "Recipe saved!"
- "Recipe updated"
- "Recipe deleted"
- "Added to favorites"
- "Cookbook created"
- "Added to [Collection Name]"

**Implementation:**
```tsx
// app/layout.tsx
import { Toaster } from 'sonner';
<Toaster position="top-center" />

// Usage
import { toast } from 'sonner';
toast.success('Recipe saved!');
```

---

### **Phase 2 Validation**

After Phase 2, users should be able to:
- ✓ Favorite/unfavorite recipes
- ✓ Filter by favorites, platform
- ✓ Delete recipes with confirmation
- ✓ Edit recipe details (title, notes, timing)
- ✓ Create and manage collections
- ✓ Add/remove recipes from collections
- ✓ See polished empty states
- ✓ Get feedback via toast notifications

**Milestone:** Core CRUD operations fully functional, app feels complete

---

## **Phase 3: Polish & Enhancement** (23 hours - ✅ COMPLETED)

Make the app production-ready with animations, accessibility, and advanced features.

### ✅ Phase 3 Tasks (COMPLETED):

1. **✅ Micro-interactions & Animations** (4h) - Framer Motion for smooth transitions
2. **✅ Responsive Design Gaps** (3h) - Perfect mobile, tablet, desktop layouts
3. **✅ Accessibility** (3h) - WCAG AA compliance, keyboard nav, screen readers
4. **✅ Cook Mode Enhancements** (3h) - Timer functionality, step tracking
5. **✅ Settings Page** (2h) - Export/import data, reset to defaults
6. **✅ Profile Page** (1h) - User stats, recipes by platform breakdown
7. **✅ Performance Optimization** (2h) - Image optimization, memoization
8. **✅ Error Boundaries** (1h) - Graceful error handling
9. **✅ Dark Mode** (4h) - Theme toggle and dark color palette

**Status:** Phase 3 completed. App is now production-ready with premium UX, full accessibility support, and graceful error handling. See `/Docs/Archive/PHASE_3_COMPLETION_REPORT.md` for details.

---

## Data Architecture

### localStorage Strategy

**Structure:**
```typescript
interface MockDataStorage {
  version: number;
  user_id: string;
  recipes: Recipe[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  collections: Collection[];
  collection_items: CollectionItem[];
  last_updated: string;
}
```

**Key:** `saveit_mock_data`

**Behavior:**
- Auto-load on app init
- Auto-save after every mutation
- Reset button in settings to restore defaults
- Export button to download JSON backup

### State Management

**Current Architecture (Keep it):**
```
UI Components
    ↓
React Query Hooks (useRecipes, useCollections)
    ↓
Repository Classes
    ↓
MockDataStore (dev) OR Supabase (prod)
    ↓
localStorage (dev) OR PostgreSQL (prod)
```

**Why not add Zustand/Jotai:**
- React Query handles server state well (even for mock data)
- Component state (useState) works for UI state
- Adding state management is premature optimization
- Can always add later if needed

---

## Phase 4: Production Integration (Future)

### ⚠️ IMPORTANT: Prerequisites

**Before starting Phase 4**, review the full assessment: [AUDIO_PIPELINE_ASSESSMENT.md](./Docs/AUDIO_PIPELINE_ASSESSMENT.md)

**Infrastructure Requirements:**
- Redis server (job queue management)
- RQ worker (background processing)
- FFmpeg (audio extraction)
- yt-dlp (video downloading)
- Python 3.9+ with Flask environment
- OpenAI API key (Whisper + GPT-4o-mini)
- Supabase project with storage buckets

**Critical Modifications Required:**
- ⚠️ AI analyzer must be rewritten for recipe extraction
- ⚠️ Database schema needs recipe-specific tables
- ⚠️ Job processor needs recipe-specific logic

### When to Move to Production

**You'll need to integrate the external service when:**
- Ready to process real videos (not just mock data)
- Want AI-powered recipe extraction (GPT-4 analysis)
- Need transcription from audio (Whisper)
- Want vector search and semantic discovery
- Ready for multi-user deployment
- Need data sync across devices

### Phase 4.1: External Service Integration (8-10 hours)

#### Task 4.1.1: Setup External Python/Flask Service (2 hours)

**Prerequisites:**
- Python 3.8+ installed
- Redis server running
- ffmpeg installed
- OpenAI API key
- Supabase project created

**Setup Steps:**
1. Clone/download the Python processing service
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables:
   ```bash
   # External service .env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_AUDIO_BUCKET=temp-audio
   SUPABASE_THUMBNAIL_BUCKET=thumbnails
   OPENAI_API_KEY=your-openai-key
   REDIS_URL=redis://localhost:6379
   FLASK_ENV=production
   ```
4. Start Redis: `redis-server`
5. Start worker: `python worker.py`
6. Start Flask API: `python app.py`
7. Verify health: `curl http://localhost:5000/health`

**Deliverable:** External processing service running and accessible

---

#### Task 4.1.2: Wire Next.js to External Service (3 hours)

**File:** `/app/api/recipes/extract/route.ts` (MODIFY)

Replace the TODO on line 98 with real external service call:

```typescript
// app/api/recipes/extract/route.ts
export async function POST(request: NextRequest) {
  // ... existing validation code ...

  // Create recipe with pending status
  const { data: recipe, error: createError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      original_url: url,
      platform,
      title: "Processing...",
      status: "pending",
    })
    .select()
    .single();

  if (createError || !recipe) {
    return NextResponse.json(
      { error: createError?.message || "Failed to create recipe" },
      { status: 500 }
    );
  }

  // Call external processing service
  try {
    const processingServiceUrl = process.env.PROCESSING_SERVICE_URL || 'http://localhost:5000';
    const response = await fetch(`${processingServiceUrl}/api/v1/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url,
        recipe_id: recipe.id, // Pass recipe ID so service can update it
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Processing service returned ${response.status}`);
    }

    const { job_id } = await response.json();

    // Optionally store job_id in recipe metadata
    await supabase
      .from("recipes")
      .update({
        metadata: { processing_job_id: job_id }
      })
      .eq("id", recipe.id);

  } catch (error) {
    console.error("Error calling processing service:", error);

    // Update recipe to failed status
    await supabase
      .from("recipes")
      .update({
        status: "failed",
        title: "Processing failed"
      })
      .eq("id", recipe.id);

    return NextResponse.json(
      { error: "Failed to start recipe processing" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    recipe_id: recipe.id,
    status: recipe.status,
    message: "Recipe extraction started",
  });
}
```

**Environment Variables:**
Add to Next.js `.env.local`:
```bash
PROCESSING_SERVICE_URL=http://localhost:5000
```

For production:
```bash
PROCESSING_SERVICE_URL=https://your-processing-service.com
```

---

#### Task 4.1.3: Update Dashboard to Show Processing Status (2 hours)

**File:** `/app/(app)/dashboard/page.tsx` (MODIFY)

Add real-time status updates for processing recipes:

```typescript
// Poll for processing recipes every 5 seconds
useEffect(() => {
  const processingRecipes = recipes.filter(r =>
    r.status === 'pending' ||
    r.status === 'downloading' ||
    r.status === 'transcribing' ||
    r.status === 'analyzing'
  );

  if (processingRecipes.length === 0) return;

  const interval = setInterval(async () => {
    // Refetch recipes to get updated statuses
    await queryClient.invalidateQueries(['recipes']);
  }, 5000);

  return () => clearInterval(interval);
}, [recipes]);
```

**Show Processing Card:**
Replace normal recipe card with ProcessingCard for pending/processing recipes:

```tsx
{recipes.map(recipe =>
  recipe.status === 'completed' ? (
    <RecipeCard key={recipe.id} recipe={recipe} />
  ) : (
    <ProcessingCard
      key={recipe.id}
      status={recipe.status}
      title={recipe.title}
      progress={getProgressFromStatus(recipe.status)}
    />
  )
)}
```

---

#### Task 4.1.4: Handle External Service Webhook (Optional, 2 hours)

Instead of polling, external service can webhook Next.js when processing completes.

**Create webhook endpoint:**
`/app/api/webhooks/recipe-processed/route.ts` (NEW)

```typescript
export async function POST(request: NextRequest) {
  // Verify webhook signature (security)
  const signature = request.headers.get('x-webhook-signature');
  // ... verify signature ...

  const { recipe_id, status, result } = await request.json();

  // Recipe is already updated in Supabase by external service
  // Optionally trigger real-time update to connected clients via Supabase Realtime

  return NextResponse.json({ received: true });
}
```

**External service sends:**
```bash
POST https://your-app.com/api/webhooks/recipe-processed
{
  "recipe_id": "uuid",
  "status": "completed",
  "result": { ... }
}
```

---

### Phase 4.2: Supabase Migration (3 hours)

Once external service is connected, you can remove dev mode and use real Supabase:

1. **Setup Supabase project** (30 min)
   - Create account at supabase.com
   - Create new project
   - Run migrations from `/supabase/migrations/`

2. **Update environment** (15 min)
   - Add Supabase credentials to `.env.local`
   - Remove or set `NEXT_PUBLIC_DEV_MODE=false`

3. **Remove dev mode checks** (1 hour)
   - Delete `_useMockData()` methods from repositories
   - Remove MockDataStore imports
   - Keep localStorage utilities for other purposes

4. **Test everything** (1 hour 15 min)
   - Verify all CRUD operations with real Supabase
   - Test authentication flow
   - Test recipe extraction with external service
   - Check RLS policies
   - Verify file uploads work

**Deliverable:** Fully integrated production system

---

### Phase 4 Summary

**Total Effort:** 13 hours
**Complexity:** High (involves multiple services, async processing, error handling)

**System Architecture After Phase 4:**

```
User Browser
    ↓
Next.js Frontend (Vercel/CloudFlare)
    ↓
├─→ Next.js API Routes
│      ↓
│   ├─→ Supabase (Database, Auth, Storage)
│   └─→ Python/Flask Service (Railway/Fly.io)
│           ↓
│        ├─→ Redis/RQ (Background Jobs)
│        ├─→ OpenAI API (Whisper + GPT-4)
│        ├─→ yt-dlp (Video Downloads)
│        └─→ Supabase (Update recipes, store files)
```

**Benefits:**
- Real AI-powered recipe extraction
- Support for all video platforms
- Automatic transcription and analysis
- Vector search for semantic discovery
- Production-ready scalability

**Challenges:**
- Multi-service deployment (Next.js + Python + Redis)
- Error handling across services
- Monitoring and observability
- Cost management (OpenAI API, storage, bandwidth)

---

## Key Differences: Dev Mode vs Production

| Feature | Dev Mode (Phase 1-3) | Production (Phase 4) |
|---------|---------------------|---------------------|
| **Data Storage** | localStorage | Supabase PostgreSQL |
| **Recipe Processing** | Mock simulation | Python/Flask service |
| **AI Analysis** | Preset templates | Real GPT-4 analysis |
| **Transcription** | Not available | OpenAI Whisper |
| **Video Download** | Not available | yt-dlp via Python |
| **File Storage** | Unsplash URLs | Supabase Storage |
| **Authentication** | Dev user bypass | Real Supabase Auth |
| **Multi-user** | Single dev user | Unlimited users |
| **Data Sync** | None | Cross-device sync |
| **Deployment** | `npm run dev` | Vercel + Railway |
| **Cost** | $0 | ~$20-50/month |

---

## Risk Mitigation

### Risk 1: localStorage Quota Exceeded (5MB limit)
**Mitigation:**
- Monitor storage usage
- Show warning at 80% capacity
- Offer export before clearing
- Move to IndexedDB if needed (larger quota)

### Risk 2: Users Expect Cloud Sync
**Mitigation:**
- Add banner: "Data stored locally on this device only"
- Prominent export feature
- Clear upgrade path to cloud sync

---

## Success Criteria

### Phase 1 Complete When:
- ✓ App runs without errors
- ✓ Mock data displays in UI
- ✓ Data persists across page refreshes
- ✓ Can toggle dev mode on/off

### Phase 2 Complete When:
- ✓ All CRUD operations work
- ✓ Can favorite, edit, delete recipes
- ✓ Collections management functional
- ✓ Filters and discovery features work
- ✓ Professional UX (loading, errors, toasts)

### Phase 3 Complete When (Optional):
- ✓ Smooth animations throughout
- ✓ Fully responsive
- ✓ Accessible (WCAG AA)
- ✓ Fast (Lighthouse 90+)
- ✓ Ready for demos/screenshots

---

## Implementation Timeline

### Recommended Approach: Phases 1 & 2 First

**Week 1: Phase 1 - Foundation**
- Days 1-2: MockDataStore + Repository updates (11h)
- Day 3: Testing + bug fixes
- **Checkpoint:** App is runnable

**Week 2: Phase 2 - Core Features**
- Days 4-5: Favorites, delete, edit (8h)
- Days 6-7: Collections management (5h)
- Days 8-9: Filters, polish, toasts (6h)
- **Checkpoint:** App is fully functional

**Week 3+: Phase 3 - Polish (Optional)**
- Based on feedback and priorities
- Can defer indefinitely if Phase 1+2 meets needs

---

## Critical Files Summary

### Phase 1 (Data Layer Fix):
1. **`/lib/mocks/MockDataStore.ts`** (NEW) - Central data store with localStorage
2. **`/lib/repositories/RecipeRepository.ts`** (MODIFY) - Add dev mode branching
3. **`/lib/repositories/CollectionRepository.ts`** (MODIFY) - Add dev mode branching
4. **`.env.local`** (NEW) - Set `NEXT_PUBLIC_DEV_MODE=true`

### Phase 2 (Essential Features):
5. **`/components/ui/confirm-dialog.tsx`** (NEW) - Confirmation modal
6. **`/app/(app)/dashboard/page.tsx`** (MODIFY) - Filters and favorites
7. **`/app/(app)/recipe/[id]/page.tsx`** (MODIFY) - Favorite, delete, edit buttons
8. **`/app/(app)/recipe/[id]/edit/page.tsx`** (MODIFY) - Edit form
9. **`/app/(app)/collections/[id]/add-recipes/page.tsx`** (MODIFY) - Wire up UI

---

## Next Steps

1. **Review this plan** - Does it align with your vision?
2. **Prioritize phases** - Phase 1 mandatory, Phase 2 recommended, Phase 3 optional
3. **Begin Phase 1** - Get the app runnable first
4. **Test frequently** - Verify each task before moving forward
5. **Iterate based on feedback** - Adjust priorities as needed

**Recommended First Task:** Task 1.1 - Create MockDataStore (2 hours)

This establishes the foundation everything else builds on.

---

## Summary: Total Effort Estimate

| Phase | Tasks | Hours | Complexity | Priority | Status |
|-------|-------|-------|------------|----------|--------|
| **Phase 1: Data Layer + Mock Processing** | 6 | 14 | Medium | **CRITICAL** | Required |
| **Phase 2: Essential Features** | 10 | 19 | Low-Medium | **HIGH** | Recommended |
| **Phase 3: Polish & Enhancement** | 9 | 23 | Medium | Low | Optional |
| **Phase 4: Production Integration** | 6 | 13 | High | Future | When ready |

**Minimum Viable Product (MVP):** Phase 1 + Phase 2 = **33 hours**
- App is fully functional without database
- All core CRUD operations work
- Realistic mock recipe processing
- Professional UX with loading states and toasts
- Ready for testing and iteration

**Full Development (All Phases):** **69 hours**
- Includes animations, accessibility, responsive polish
- Integrated with external Python/Flask service
- Connected to Supabase for production
- Multi-user support, real video processing
- Production-ready deployment

**Recommended Approach:**
1. **Week 1-2:** Complete Phase 1 + Phase 2 (33 hours)
2. **Test and iterate** based on feedback
3. **Decide on Phase 3** based on polish needs
4. **Phase 4 when ready for production** (requires external service setup)

---

## Final Notes

### Why This Plan Works

1. **Incremental Value:** Each phase delivers working features
2. **No External Dependencies:** Phases 1-3 require zero external services
3. **Easy Testing:** Mock data allows immediate iteration
4. **Future-Proof:** Clean migration path to production
5. **Cost-Effective:** $0 until Phase 4

### What You Get After Phase 1 + Phase 2

✅ **Fully functional recipe app**
✅ **Paste URLs to create recipes** (simulated processing)
✅ **View recipes with ingredients/instructions**
✅ **Create and manage collections**
✅ **Favorite recipes**
✅ **Edit recipe details**
✅ **Delete recipes**
✅ **Filter by platform and favorites**
✅ **Professional loading and empty states**
✅ **Toast notifications for all actions**
✅ **Data persists in localStorage**

### What Phase 4 Adds (Production)

🚀 **Real video processing** via Python/Flask service
🚀 **AI-powered extraction** with GPT-4
🚀 **Audio transcription** with Whisper
🚀 **Multi-user support** with real authentication
🚀 **Cloud storage** with Supabase
🚀 **Cross-device sync**
🚀 **Vector search** for semantic discovery
🚀 **Production deployment** on Vercel + Railway

---

**Ready to proceed?** The plan now includes full integration with your external processing service in Phase 4, while keeping Phases 1-3 completely independent and functional.
