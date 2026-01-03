# Audio Pipeline Integration Plan - Final Approach

**Date:** 2025-12-26
**Status:** Planning Complete - Ready for Implementation
**Integration Strategy:** Wrapper/Adapter Pattern (Option 1)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decision](#architecture-decision)
3. [Project Structure](#project-structure)
4. [Database Schema Review](#database-schema-review)
5. [Phase 0: Pre-Integration Setup](#phase-0-pre-integration-setup)
6. [Phase 4: Integration Implementation](#phase-4-integration-implementation)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)
9. [Future Maintenance](#future-maintenance)

---

## Executive Summary

### Decision: Wrapper/Adapter Pattern

**Why:** The IG Downloader must remain a general-purpose tool for use in other projects. Therefore, we will:

1. **Import IG Downloader as-is** via Git Subtree (never modify it)
2. **Create a separate recipe-extraction service** that wraps IG Downloader
3. **Reuse 90% of IG Downloader** (platform handlers, transcription, audio processing)
4. **Build only recipe-specific analysis** as custom code

### What Gets Reused from IG Downloader

- ✅ Platform handlers (Instagram, TikTok, YouTube, Facebook)
- ✅ Video downloading (`PlatformRouter`, `BaseHandler`)
- ✅ Audio extraction (`audio_processor.py` with FFmpeg)
- ✅ Transcription (`transcription_service.py` with OpenAI Whisper)
- ✅ Supabase upload utilities (`supabase_client.py`)

### What We Build Custom

- 🎯 Recipe analyzer (GPT-4o-mini with recipe-specific prompts)
- 🎯 Recipe data structuring (ingredients parsing, instructions extraction)
- 🎯 Recipe-specific worker (`recipe_worker.py`)
- 🎯 Direct integration with RecipeSave schema (recipes, ingredients, instructions tables)

### Benefits

| Benefit | Description |
|---------|-------------|
| **Pristine IG Downloader** | Never modified, can upgrade via `git subtree pull` |
| **Maximum Reuse** | 90% of video processing logic reused |
| **Clean Separation** | Recipe logic isolated in `recipe-extraction/` folder |
| **Maintainable** | Clear boundaries between general-purpose and recipe-specific code |
| **Upgradeable** | Can pull updates from IG Downloader without conflicts |

---

## Architecture Decision

### Rejected Approaches

#### ❌ Fork and Modify IG Downloader
- **Why rejected:** User needs IG Downloader to remain general-purpose for other projects
- **Issue:** Would create divergence between general and recipe versions

#### ❌ Separate Python Service (API-based)
- **Why rejected:** Too much infrastructure complexity
- **Issue:** Need to run IG Downloader as separate server, can't reuse code directly

### ✅ Selected Approach: Wrapper/Adapter Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    RecipeSave Application                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Next.js API Routes (/app/api/*)                │    │
│  │                                                         │    │
│  │  POST /api/recipes/extract                             │    │
│  │  └─ Enqueue job to Redis → recipe_worker.py           │    │
│  └────────────────────────────────────────────────────────┘    │
│                              ↓                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   recipe-extraction/  (RecipeSave-specific)            │    │
│  │                                                         │    │
│  │   recipe_worker.py                                     │    │
│  │   ├─ Orchestrates recipe extraction flow              │    │
│  │   └─ Calls IG Downloader utilities ──┐                │    │
│  │                                       │                │    │
│  │   recipe_analyzer.py                 │                │    │
│  │   └─ GPT-4o-mini recipe extraction   │                │    │
│  │                                       │                │    │
│  │   recipe_processor.py                │                │    │
│  │   └─ Data structuring & storage      │                │    │
│  └───────────────────────────────────────┼────────────────┘    │
│                                          │                      │
│  ┌──────────────────────────────────────▼────────────────┐    │
│  │   extraction/  (IG Downloader - PRISTINE)             │    │
│  │                                                         │    │
│  │   utils/platform_router.py        ◄─── Imported       │    │
│  │   utils/audio_processor.py        ◄─── Imported       │    │
│  │   utils/transcription_service.py  ◄─── Imported       │    │
│  │   utils/supabase_client.py        ◄─── Imported       │    │
│  │                                                         │    │
│  │   ❌ worker.py                    (Not used)           │    │
│  │   ❌ ai_analyzer.py               (Not used)           │    │
│  │   ❌ job_processor.py             (Not used)           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

### Final Directory Layout

```
RecipeSave/
├── app/
│   ├── (app)/
│   ├── (auth)/
│   ├── (public)/
│   └── api/
│       └── recipes/
│           └── extract/
│               └── route.ts          # Enqueues recipe extraction job
│
├── components/                       # (Existing - 31 components)
│
├── lib/
│   ├── extraction/
│   │   └── queue.ts                 # Redis queue bridge
│   ├── supabase/
│   ├── repositories/
│   └── ...
│
├── extraction/                       # IG Downloader (Git Subtree - PRISTINE)
│   ├── utils/
│   │   ├── platform_router.py       ✅ IMPORTED
│   │   ├── audio_processor.py       ✅ IMPORTED
│   │   ├── transcription_service.py ✅ IMPORTED
│   │   ├── supabase_client.py       ✅ IMPORTED
│   │   ├── platforms/
│   │   │   ├── base_handler.py      ✅ IMPORTED
│   │   │   ├── instagram_handler.py ✅ IMPORTED
│   │   │   ├── tiktok_handler.py    ✅ IMPORTED
│   │   │   ├── youtube_handler.py   ✅ IMPORTED
│   │   │   └── facebook_handler.py  ✅ IMPORTED
│   │   │
│   │   ├── ai_analyzer.py           ❌ NOT USED
│   │   ├── job_processor.py         ❌ NOT USED
│   │   └── job_models.py            ❌ NOT USED
│   │
│   ├── app.py                        ❌ NOT USED
│   ├── worker.py                     ❌ NOT USED
│   └── requirements.txt              ✅ REFERENCE (for dependencies)
│
├── recipe-extraction/                # RecipeSave-specific (NEW)
│   ├── __init__.py
│   │
│   ├── recipe_worker.py              # RQ worker entry point
│   │   └─ Listens to Redis queue
│   │
│   ├── recipe_processor.py           # Main orchestration
│   │   ├─ Uses extraction/utils/* for video/audio/transcription
│   │   ├─ Calls recipe_analyzer for AI extraction
│   │   └─ Writes to RecipeSave database (recipes, ingredients, instructions)
│   │
│   ├── recipe_analyzer.py            # Recipe-specific AI extraction
│   │   └─ GPT-4o-mini with recipe prompts
│   │
│   ├── data_mapper.py                # Maps AI output to database schema
│   │   └─ Parses ingredients, structures instructions
│   │
│   ├── config.py                     # Recipe extraction config
│   │
│   └── requirements.txt              # Additional dependencies (if any)
│
├── docker-compose.yml                # Redis for local dev
├── .env.local
└── README.md
```

### What Goes Where

| Component | Location | Source | Modifiable? |
|-----------|----------|--------|-------------|
| Platform handlers | `extraction/utils/platforms/` | IG Downloader | ❌ No |
| Audio processing | `extraction/utils/audio_processor.py` | IG Downloader | ❌ No |
| Transcription | `extraction/utils/transcription_service.py` | IG Downloader | ❌ No |
| Recipe analysis | `recipe-extraction/recipe_analyzer.py` | RecipeSave | ✅ Yes |
| Recipe orchestration | `recipe-extraction/recipe_processor.py` | RecipeSave | ✅ Yes |
| RQ Worker | `recipe-extraction/recipe_worker.py` | RecipeSave | ✅ Yes |

---

## Database Schema Review

### Current Schema Status: ✅ NO CHANGES REQUIRED

The existing RecipeSave database schema already supports all recipe extraction requirements.

#### Existing Tables (from Database_Schema.md)

**recipes**
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  original_url TEXT NOT NULL,
  platform TEXT NOT NULL,  -- 'tiktok', 'instagram', 'youtube', 'facebook'
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  prep_time_minutes INT,   ✅ Recipe extraction fills this
  cook_time_minutes INT,   ✅ Recipe extraction fills this
  servings INT,            ✅ Recipe extraction fills this
  cuisine TEXT,            ✅ Recipe extraction fills this
  is_favorite BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',  ✅ Processing status
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  embedding VECTOR(1536)   ✅ OpenAI embeddings
);
```

**ingredients**
```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  raw_text TEXT NOT NULL,  ✅ AI extraction fills this
  item TEXT,               ✅ Normalized ingredient name
  quantity FLOAT,          ✅ Parsed quantity
  unit TEXT,               ✅ Parsed unit
  order_index INT NOT NULL DEFAULT 0
);
```

**instructions**
```sql
CREATE TABLE instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  step_number INT NOT NULL,  ✅ AI extraction fills this
  text TEXT NOT NULL         ✅ AI extraction fills this
);
```

### Status Values for recipes.status

| Status | Description | Set By |
|--------|-------------|--------|
| `pending` | Job created, waiting to start | Next.js API route |
| `downloading` | Fetching video from platform | recipe_processor.py |
| `extracting_audio` | Processing with FFmpeg | recipe_processor.py |
| `transcribing` | Transcribing audio with OpenAI Whisper | recipe_processor.py |
| `analyzing` | Analyzing content with GPT-4o-mini | recipe_processor.py |
| `completed` | Job completed successfully | recipe_processor.py |
| `failed` | Job failed (check error_message) | recipe_processor.py |

### IG Downloader Tables (NOT USED)

The IG Downloader has its own database tables (`audio_jobs`, `audio_files`, `transcriptions`, `analyses`, `embeddings`). We will **NOT use these tables** in RecipeSave.

**Why:** We're only importing utility functions, not the full job processing system.

### Storage Buckets Required

```sql
-- Create storage buckets in Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('recipe-thumbnails', 'recipe-thumbnails', true),
  ('recipe-audio', 'recipe-audio', false);
```

**recipe-thumbnails** - Public (URLs returned to frontend)
**recipe-audio** - Private (temporary storage, can be deleted after processing)

### Summary: Schema Changes Required

**Answer:** ✅ **ZERO schema changes required.**

The existing RecipeSave schema already has everything needed:
- recipes table with all metadata fields
- ingredients table with parsed structure
- instructions table with step-by-step format
- status tracking for processing states
- Storage buckets (need to be created in Supabase, but schema is defined)

---

## Phase 0: Pre-Integration Setup

**Goal:** Import IG Downloader and set up the foundation without implementing recipe extraction yet.

**Estimated Time:** 2 hours

### Task 0.1: Git Subtree Import (30 min)

**Prerequisites:**
- Ensure you're on a clean git branch
- Commit any pending changes first

**Commands:**

```bash
# Navigate to RecipeSave project
cd "/Users/user/Code Pojects/RecepieSave"

# Add IG Downloader repo as remote
git remote add ig-engine https://github.com/nativardi/Reel-Downloader.git

# Fetch the repo
git fetch ig-engine

# Import ONLY the IG Downloader subdirectory into ./extraction
# Using known-good commit from TECHNICAL_STRATEGY.md
git subtree add --prefix="extraction" ig-engine \
  8ff17bdcbb8ab70bfa88b62dc7189e1ce1f7fd2b:"Code Pojects/IG Downloader" \
  --squash

# Verify import
ls -la extraction/
```

**Expected Result:**
```
extraction/
├── app.py
├── worker.py
├── utils/
│   ├── platform_router.py
│   ├── audio_processor.py
│   ├── transcription_service.py
│   └── platforms/
└── requirements.txt
```

**Commit Message:**
```
Import IG Downloader via git subtree for recipe extraction

Imported from: https://github.com/nativardi/Reel-Downloader
Commit: 8ff17bdcbb8ab70bfa88b62dc7189e1ce1f7fd2b
Path: Code Pojects/IG Downloader

This code will NOT be modified. Recipe-specific logic will live in
recipe-extraction/ folder as a wrapper.
```

### Task 0.2: Create recipe-extraction/ Directory Structure (15 min)

```bash
# Create directory structure
mkdir -p recipe-extraction
cd recipe-extraction

# Create __init__.py
touch __init__.py

# Create placeholder files (we'll implement these in Phase 4)
touch recipe_worker.py
touch recipe_processor.py
touch recipe_analyzer.py
touch data_mapper.py
touch config.py
touch requirements.txt
```

**Initial requirements.txt:**
```txt
# recipe-extraction/requirements.txt
# Additional dependencies beyond what IG Downloader provides

# None yet - we'll reuse IG Downloader's dependencies
# If needed later, add here (e.g., specific parsers)
```

### Task 0.3: Add .gitignore Entries (5 min)

**File:** `.gitignore`

```gitignore
# Python
*.pyc
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
extraction/venv/
extraction/.venv/
recipe-extraction/venv/
recipe-extraction/.venv/

# Environment variables
extraction/.env
recipe-extraction/.env

# Redis
dump.rdb

# Logs
extraction/*.log
recipe-extraction/*.log
```

### Task 0.4: Document the Integration (30 min)

Create a README in the recipe-extraction folder:

**File:** `recipe-extraction/README.md`

```markdown
# RecipeSave Recipe Extraction Service

This service extracts recipe data from video URLs using AI analysis.

## Architecture

This is a **wrapper service** that reuses components from the IG Downloader
(located in `../extraction/`) while adding recipe-specific analysis.

### What We Reuse from IG Downloader

- Platform handlers (Instagram, TikTok, YouTube, Facebook)
- Video downloading and metadata extraction
- Audio extraction (FFmpeg)
- Transcription (OpenAI Whisper)
- Supabase upload utilities

### What This Service Provides

- Recipe-specific AI analysis (GPT-4o-mini)
- Ingredient parsing (quantity, unit, item)
- Instruction extraction (step-by-step)
- **Multilingual support:** Auto-detects language from transcript and extracts recipes in original language
- Direct integration with RecipeSave database schema

## Files

- `recipe_worker.py` - RQ worker that processes extraction jobs
- `recipe_processor.py` - Main orchestration logic
- `recipe_analyzer.py` - Recipe-specific AI extraction
- `data_mapper.py` - Maps AI output to database schema
- `config.py` - Configuration

## Running Locally

See: /Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md
```

### Task 0.5: Verify Python Dependencies (15 min)

Check what dependencies IG Downloader needs:

```bash
cd extraction
cat requirements.txt
```

**Expected dependencies:**
- flask
- flask-cors
- rq
- redis
- supabase
- openai
- yt-dlp
- python-dotenv

**Note:** We'll install these in Phase 4 when we actually run the worker.

### Task 0.6: Create Docker Compose for Redis (15 min)

**File:** `docker-compose.yml` (in project root)

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: saveit-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

**Usage:**
```bash
# Start Redis
docker-compose up -d

# Stop Redis
docker-compose down

# View logs
docker-compose logs -f redis
```

### Task 0.7: Update Environment Variables Template (10 min)

**File:** `.env.example`

Add these new variables:

```bash
# ========================================
# Recipe Extraction Service
# ========================================

# Redis (for job queue)
REDIS_URL=redis://localhost:6379

# OpenAI (for transcription and analysis)
OPENAI_API_KEY=sk-xxx...

# Supabase (shared with frontend)
# Already defined above in frontend section

# Recipe Extraction Mode
EXTRACTION_MODE=recipe
```

### Phase 0 Deliverables

- ✅ IG Downloader imported via Git Subtree into `extraction/`
- ✅ `recipe-extraction/` directory structure created
- ✅ Documentation written (README.md)
- ✅ Docker Compose for Redis configured
- ✅ Environment variables template updated
- ✅ .gitignore entries added

**No implementation yet** - just the foundation.

---

## Phase 4: Integration Implementation

**Goal:** Implement the recipe extraction service and wire it to the Next.js frontend.

**Estimated Time:** 10-12 hours

### Task 4.1: Implement Recipe Analyzer (4 hours)

**File:** `recipe-extraction/recipe_analyzer.py`

```python
"""
Recipe-specific AI analyzer using GPT-4o-mini.
Extracts structured recipe data from transcripts.
"""
import json
import logging
from typing import Dict, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


def extract_recipe_from_transcript(transcript: str, metadata: Optional[Dict] = None) -> Dict:
    """
    Extract recipe information from transcript using GPT-4o-mini.

    Args:
        transcript: Full transcript text from video
        metadata: Optional video metadata (title, description)

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
    try:
        logger.info(f"Extracting recipe from transcript (length: {len(transcript)} chars)")

        client = OpenAI()

        # Build context from metadata if available
        context = ""
        if metadata:
            if metadata.get('title'):
                context += f"Video Title: {metadata['title']}\n"
            if metadata.get('description'):
                context += f"Description: {metadata['description']}\n"

        # Recipe extraction prompt
        prompt = f"""Extract recipe information from this cooking video transcript.

{context}
Transcript:
{transcript}

Please analyze the transcript and extract recipe information in JSON format with this exact structure:

{{
    "title": "Recipe name (create a descriptive title if not explicitly stated)",
    "description": "Brief 1-2 sentence description of the dish",
    "ingredients": [
        {{
            "item": "ingredient name (normalized, singular)",
            "quantity": 1.0,
            "unit": "cup",
            "raw_text": "1 cup flour"
        }}
    ],
    "instructions": [
        {{
            "step": 1,
            "text": "Detailed instruction text"
        }}
    ],
    "prep_time_minutes": 10,
    "cook_time_minutes": 20,
    "servings": 4,
    "cuisine": "Italian",
    "dietary_tags": ["vegetarian"]
}

Guidelines:
- Extract ALL ingredients mentioned, preserving quantities and units
- If quantity/unit is unclear, set to null but include in raw_text
- Normalize ingredient names (e.g., "tomatoes" → "tomato")
- Number instructions sequentially starting from 1
- Be specific in instruction text (include timing, temperature, techniques)
- Estimate prep/cook time if not explicitly stated
- Cuisine should be one of: Italian, Mexican, Chinese, Japanese, Thai, Indian, French, American, Mediterranean, or "Other"
- Dietary tags: vegetarian, vegan, gluten-free, dairy-free, keto, paleo, etc.
- If this is NOT a recipe (e.g., just talking about food), set title to "Not a recipe" and leave other fields minimal

Respond with ONLY valid JSON, no additional text."""

        # Call OpenAI API
        logger.info("Sending transcript to GPT-4o-mini for recipe analysis...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a culinary AI assistant specialized in extracting structured recipe data from video transcripts. Always respond with valid JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for consistent extraction
            max_tokens=2000
        )

        # Extract response
        response_text = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            recipe_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {response_text[:200]}")
            raise RuntimeError(f"Failed to parse recipe extraction response: {str(e)}")

        # Validate required fields
        required_fields = ['title', 'ingredients', 'instructions']
        for field in required_fields:
            if field not in recipe_data:
                logger.error(f"Missing required field '{field}' in AI response")
                raise ValueError(f"AI response missing required field: {field}")

        # Validate it's actually a recipe
        if recipe_data.get('title', '').lower() == 'not a recipe':
            logger.warning("Content is not a recipe")
            raise ValueError("Video does not contain recipe content")

        # Set defaults for optional fields
        recipe_data.setdefault('description', '')
        recipe_data.setdefault('prep_time_minutes', None)
        recipe_data.setdefault('cook_time_minutes', None)
        recipe_data.setdefault('servings', None)
        recipe_data.setdefault('cuisine', 'Other')
        recipe_data.setdefault('dietary_tags', [])

        logger.info(
            f"Recipe extraction complete. "
            f"Title: {recipe_data['title']}, "
            f"Ingredients: {len(recipe_data['ingredients'])}, "
            f"Steps: {len(recipe_data['instructions'])}"
        )

        return recipe_data

    except Exception as e:
        logger.error(f"Recipe extraction failed: {e}", exc_info=True)
        raise RuntimeError(f"Failed to extract recipe: {str(e)}")
```

**Key Features:**
- Few-shot prompting with clear JSON schema
- Ingredient parsing (quantity, unit, item)
- Instruction extraction with step numbers
- Cuisine and dietary tag detection
- Validation for non-recipe content
- Error handling with detailed logging

### Task 4.2: Implement Data Mapper (1 hour)

**File:** `recipe-extraction/data_mapper.py`

```python
"""
Maps AI-extracted recipe data to RecipeSave database schema.
"""
import logging
from typing import Dict, List
from uuid import UUID

logger = logging.getLogger(__name__)


def map_recipe_to_database(recipe_data: Dict, recipe_id: UUID, user_id: UUID) -> Dict:
    """
    Map AI-extracted recipe data to database insert format.

    Args:
        recipe_data: Output from recipe_analyzer.extract_recipe_from_transcript()
        recipe_id: UUID of the recipe record
        user_id: UUID of the user who created the recipe

    Returns:
        {
            "recipe_update": {...},
            "ingredients": [...],
            "instructions": [...]
        }
    """

    # Map recipe fields
    recipe_update = {
        "title": recipe_data.get("title", "Untitled Recipe"),
        "description": recipe_data.get("description", ""),
        "prep_time_minutes": recipe_data.get("prep_time_minutes"),
        "cook_time_minutes": recipe_data.get("cook_time_minutes"),
        "servings": recipe_data.get("servings"),
        "cuisine": recipe_data.get("cuisine", "Other"),
        "status": "completed"
    }

    # Map ingredients
    ingredients = []
    for idx, ing in enumerate(recipe_data.get("ingredients", [])):
        ingredients.append({
            "recipe_id": str(recipe_id),
            "raw_text": ing.get("raw_text", ""),
            "item": ing.get("item"),
            "quantity": ing.get("quantity"),
            "unit": ing.get("unit"),
            "order_index": idx
        })

    # Map instructions
    instructions = []
    for inst in recipe_data.get("instructions", []):
        instructions.append({
            "recipe_id": str(recipe_id),
            "step_number": inst.get("step", 0),
            "text": inst.get("text", "")
        })

    logger.info(
        f"Mapped recipe data: {len(ingredients)} ingredients, "
        f"{len(instructions)} instructions"
    )

    return {
        "recipe_update": recipe_update,
        "ingredients": ingredients,
        "instructions": instructions
    }
```

### Task 4.3: Implement Recipe Processor (3 hours)

**File:** `recipe-extraction/recipe_processor.py`

```python
"""
Main orchestrator for recipe extraction pipeline.
Reuses IG Downloader utilities while adding recipe-specific logic.
"""
import logging
import os
import sys
import tempfile
import shutil
from typing import Dict
from uuid import UUID

# Add extraction/ to Python path to import IG Downloader utilities
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'extraction'))

# Import IG Downloader utilities (pristine, never modified)
from utils.platform_router import PlatformRouter
from utils.audio_processor import convert_video_file_to_audio
from utils.transcription_service import transcribe_audio
from utils.supabase_client import upload_thumbnail, upload_audio_file
from utils.platform_detector import detect_platform

# Import RecipeSave-specific modules
from recipe_analyzer import extract_recipe_from_transcript
from data_mapper import map_recipe_to_database
from config import get_supabase_client

logger = logging.getLogger(__name__)


def process_recipe_extraction(recipe_id: str, url: str, user_id: str) -> Dict:
    """
    Main recipe extraction pipeline.

    Flow:
        1. Download video (via IG Downloader platform handlers)
        2. Extract audio + thumbnail (via IG Downloader audio processor)
        3. Transcribe audio (via IG Downloader transcription service)
        4. Extract recipe data (via RecipeSave recipe analyzer) 🎯 NEW
        5. Store in database (via RecipeSave data mapper) 🎯 NEW

    Args:
        recipe_id: UUID of recipe record in database
        url: Video URL to process
        user_id: UUID of user who created the recipe

    Returns:
        {
            "status": "completed",
            "recipe_id": str,
            "title": str
        }
    """
    try:
        logger.info(f"Starting recipe extraction for {recipe_id} from {url}")

        supabase = get_supabase_client()

        # Update status: downloading
        update_recipe_status(supabase, recipe_id, "downloading")

        # Step 1: Detect platform and get handler (IG Downloader)
        platform = detect_platform(url)
        platform_name = platform.value if platform else "unknown"
        logger.info(f"Platform detected: {platform_name}")

        platform_router = PlatformRouter()
        handler = platform_router.get_handler(url)

        # Step 2: Fetch metadata (IG Downloader)
        metadata = handler.fetch_metadata(url)
        video_url = metadata.get('video_url')
        title = metadata.get('title', 'Recipe Video')
        duration = metadata.get('duration', 0)
        uploader = metadata.get('uploader') or metadata.get('channel') or 'Unknown'
        description = metadata.get('description') or metadata.get('caption') or ''

        logger.info(f"Metadata fetched. Title: {title}, Duration: {duration}s")

        # Update platform in database
        supabase.table("recipes").update({
            "platform": platform_name
        }).eq("id", recipe_id).execute()

        # Step 3: Extract audio and thumbnail (IG Downloader)
        update_recipe_status(supabase, recipe_id, "extracting_audio")

        temp_dir = tempfile.mkdtemp(prefix=f"{platform_name}_")
        try:
            download_target = os.path.join(temp_dir, recipe_id)
            downloaded_path = handler.download_video(url, download_target, metadata=metadata)

            audio_bytes, audio_filename, thumbnail_bytes = convert_video_file_to_audio(
                downloaded_path
            )

            logger.info(f"Audio extracted: {len(audio_bytes)} bytes")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

        # Step 4: Upload thumbnail (IG Downloader utility)
        thumbnail_url = None
        if thumbnail_bytes:
            try:
                thumbnail_url = upload_thumbnail(thumbnail_bytes, recipe_id)
                supabase.table("recipes").update({
                    "thumbnail_url": thumbnail_url
                }).eq("id", recipe_id).execute()
                logger.info(f"Thumbnail uploaded: {thumbnail_url}")
            except Exception as e:
                logger.warning(f"Thumbnail upload failed: {e}")

        # Step 5: Transcribe audio (IG Downloader)
        update_recipe_status(supabase, recipe_id, "transcribing")

        transcript_data = transcribe_audio(audio_bytes)
        transcript_text = transcript_data.get('text', '')
        language = transcript_data.get('language', 'en')

        logger.info(f"Transcription complete. Language: {language}, Length: {len(transcript_text)} chars")

        # Step 6: Extract recipe data (RecipeSave - NEW) 🎯
        update_recipe_status(supabase, recipe_id, "analyzing")

        recipe_data = extract_recipe_from_transcript(
            transcript_text,
            metadata={'title': title, 'description': description}
        )

        logger.info(f"Recipe extracted: {recipe_data['title']}")

        # Step 7: Map to database schema (RecipeSave - NEW) 🎯
        mapped_data = map_recipe_to_database(recipe_data, recipe_id, user_id)

        # Step 8: Store in database
        # Update recipe
        supabase.table("recipes").update(
            mapped_data["recipe_update"]
        ).eq("id", recipe_id).execute()

        # Insert ingredients
        if mapped_data["ingredients"]:
            supabase.table("ingredients").insert(
                mapped_data["ingredients"]
            ).execute()

        # Insert instructions
        if mapped_data["instructions"]:
            supabase.table("instructions").insert(
                mapped_data["instructions"]
            ).execute()

        logger.info(f"Recipe extraction completed successfully: {recipe_id}")

        return {
            "status": "completed",
            "recipe_id": recipe_id,
            "title": recipe_data["title"]
        }

    except Exception as e:
        logger.error(f"Recipe extraction failed: {e}", exc_info=True)

        # Update status to failed
        try:
            supabase = get_supabase_client()
            supabase.table("recipes").update({
                "status": "failed"
            }).eq("id", recipe_id).execute()
        except:
            pass

        raise


def update_recipe_status(supabase, recipe_id: str, status: str):
    """Helper to update recipe status."""
    logger.info(f"Status update: {recipe_id} → {status}")
    supabase.table("recipes").update({
        "status": status
    }).eq("id", recipe_id).execute()
```

**Continued in next file...**

### Task 4.4: Implement Configuration (30 min)

**File:** `recipe-extraction/config.py`

```python
"""
Configuration for recipe extraction service.
"""
import os
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Get Supabase client with service role key."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    return create_client(url, key)


def get_redis_url() -> str:
    """Get Redis URL from environment."""
    return os.environ.get("REDIS_URL", "redis://localhost:6379")


def get_openai_api_key() -> str:
    """Get OpenAI API key from environment."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY must be set")
    return key
```

### Task 4.5: Implement RQ Worker (1 hour)

**File:** `recipe-extraction/recipe_worker.py`

```python
"""
Redis Queue worker for recipe extraction jobs.
"""
import os
import sys
import logging
from redis import Redis
from rq import Worker, Queue, Connection

# Add extraction/ to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'extraction'))

from recipe_processor import process_recipe_extraction
from config import get_redis_url

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Start RQ worker to process recipe extraction jobs."""
    redis_url = get_redis_url()

    logger.info(f"Connecting to Redis: {redis_url}")
    redis_conn = Redis.from_url(redis_url)

    logger.info("Starting recipe extraction worker...")
    logger.info("Listening for jobs on queue: 'recipe-extraction'")

    with Connection(redis_conn):
        worker = Worker(['recipe-extraction'])
        worker.work()


if __name__ == '__main__':
    main()
```

**Usage:**
```bash
# Start the worker
cd recipe-extraction
python recipe_worker.py
```

### Task 4.6: Create Next.js API Routes (2 hours)

**File:** `app/api/recipes/extract/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enqueueRecipeExtraction } from '@/lib/extraction/queue';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create recipe record with pending status
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        original_url: url,
        status: 'pending',
        title: 'Processing...',
        description: 'Recipe extraction in progress'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create recipe:', insertError);
      return NextResponse.json(
        { error: 'Failed to create recipe' },
        { status: 500 }
      );
    }

    // Enqueue extraction job
    await enqueueRecipeExtraction({
      recipe_id: recipe.id,
      url: url,
      user_id: user.id
    });

    return NextResponse.json({
      recipe_id: recipe.id,
      status: 'pending',
      message: 'Recipe extraction started'
    }, { status: 201 });

  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**File:** `lib/extraction/queue.ts`

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RecipeExtractionJob {
  recipe_id: string;
  url: string;
  user_id: string;
}

export async function enqueueRecipeExtraction(job: RecipeExtractionJob): Promise<void> {
  // Create RQ-compatible job format
  const rqJob = {
    func: 'recipe_processor.process_recipe_extraction',
    args: [job.recipe_id, job.url, job.user_id],
    kwargs: {},
    origin: 'recipe-extraction',
    description: `Extract recipe from ${job.url}`
  };

  // Push to Redis queue
  await redis.lpush('rq:queue:recipe-extraction', JSON.stringify(rqJob));
}
```

### Task 4.7: Update Add Recipe Page (1 hour)

**File:** `app/(app)/add/page.tsx`

Update the URL submission handler:

```typescript
const handleSubmitURL = async (url: string) => {
  try {
    setIsProcessing(true);

    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      // Mock mode - keep existing behavior
      return await mockDataStore.simulateRecipeProcessing(url);
    }

    // Production mode - call real API
    const response = await fetch('/api/recipes/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('Failed to start recipe extraction');
    }

    const { recipe_id } = await response.json();

    toast.success('Recipe extraction started!');
    router.push('/dashboard');

  } catch (error) {
    console.error('Failed to extract recipe:', error);
    toast.error('Failed to start recipe extraction');
  } finally {
    setIsProcessing(false);
  }
};
```

### Task 4.8: Setup Supabase (1 hour)

#### Create Storage Buckets

```sql
-- Run in Supabase SQL Editor

-- Create thumbnails bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-thumbnails', 'recipe-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Create audio bucket (private, temporary)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-audio', 'recipe-audio', false)
ON CONFLICT (id) DO NOTHING;
```

#### Enable pgvector (for embeddings)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Verify Tables Exist

The tables should already exist from previous migrations. Verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('recipes', 'ingredients', 'instructions', 'profiles', 'collections');
```

### Task 4.9: Install Python Dependencies (30 min)

```bash
# Navigate to extraction folder
cd extraction

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install IG Downloader dependencies
pip install -r requirements.txt

# Navigate to recipe-extraction folder
cd ../recipe-extraction

# Install any additional dependencies (currently none)
# pip install -r requirements.txt

# Verify installations
python -c "import openai; import supabase; import redis; print('All dependencies installed')"
```

### Phase 4 Deliverables

- ✅ Recipe analyzer implemented with GPT-4o-mini
- ✅ Data mapper for database schema conversion
- ✅ Recipe processor orchestrating the full pipeline
- ✅ RQ worker for background job processing
- ✅ Next.js API routes for job submission
- ✅ Queue integration layer (Redis)
- ✅ Frontend wired to real API (with dev mode toggle)
- ✅ Supabase buckets created
- ✅ Python dependencies installed

---

## Testing Strategy

### Unit Testing (Optional for MVP)

**File:** `recipe-extraction/test_recipe_analyzer.py`

```python
import pytest
from recipe_analyzer import extract_recipe_from_transcript

def test_extract_recipe_basic():
    transcript = """
    Today I'm making pasta carbonara. You'll need 1 pound of spaghetti,
    4 eggs, 1 cup of parmesan cheese, and 8 ounces of bacon.

    First, cook the pasta according to package directions. While that's cooking,
    fry the bacon until crispy. Mix the eggs and cheese together. When the pasta
    is done, drain it and mix it with the bacon and egg mixture. Serve immediately.
    """

    result = extract_recipe_from_transcript(transcript)

    assert result['title']
    assert len(result['ingredients']) >= 4
    assert len(result['instructions']) >= 3
    assert result['cuisine']
```

### Integration Testing

#### Test 1: End-to-End Recipe Extraction

```bash
# Terminal 1: Start Redis
docker-compose up redis

# Terminal 2: Start RQ Worker
cd recipe-extraction
source ../extraction/venv/bin/activate
export OPENAI_API_KEY=sk-xxx
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=xxx
export REDIS_URL=redis://localhost:6379
python recipe_worker.py

# Terminal 3: Submit test job
# Use the Next.js app to paste a recipe video URL
# Or use curl:
curl -X POST http://localhost:3000/api/recipes/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/RECIPE_REEL_ID/"}'
```

**Watch the logs:**
- Terminal 2 should show: downloading → extracting_audio → transcribing → analyzing → completed
- Check Supabase to verify recipe, ingredients, and instructions are created

#### Test 2: Error Handling

Submit a non-recipe video URL and verify:
- Status updates to "failed"
- Error is logged
- Frontend shows appropriate error message

### Manual Testing Checklist

- [ ] Submit Instagram Reel URL → Recipe extracted
- [ ] Submit TikTok URL → Recipe extracted
- [ ] Submit YouTube Short URL → Recipe extracted
- [ ] Submit non-recipe URL → Graceful failure
- [ ] Submit invalid URL → Validation error
- [ ] Dev mode still works (mock data)
- [ ] Production mode uses real extraction
- [ ] Status updates correctly (pending → processing → completed)
- [ ] Recipe appears in dashboard after completion
- [ ] Ingredients are parsed correctly (quantity, unit, item)
- [ ] Instructions are numbered sequentially
- [ ] Thumbnail displays correctly

---

## Deployment Guide

### Option 1: Single Container (Recommended for MVP)

**File:** `Dockerfile`

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    redis-server \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY extraction/requirements.txt extraction/requirements.txt
RUN pip install -r extraction/requirements.txt

# Copy Python services
COPY extraction/ extraction/
COPY recipe-extraction/ recipe-extraction/

# Copy and install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy Next.js app
COPY . .

# Build Next.js
RUN npm run build

# Expose ports
EXPOSE 3000

# Start script
COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]
```

**File:** `start.sh`

```bash
#!/bin/bash

# Start Redis in background
redis-server --daemonize yes

# Start RQ worker in background
cd recipe-extraction
python recipe_worker.py &

# Start Next.js
cd ..
npm start
```

**Deploy to:**
- Railway.app
- Render.com
- Fly.io

### Option 2: Separate Services

| Service | Platform | Description |
|---------|----------|-------------|
| Frontend | Vercel | Next.js app |
| Worker | Render Background Worker | Python RQ worker |
| Redis | Upstash | Managed Redis |
| Supabase | Supabase Cloud | Database + Storage + Auth |

**Environment Variables (Production):**

```bash
# Shared
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
REDIS_URL=rediss://default:xxx@upstash.io:6379

# Next.js only
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_DEV_MODE=false

# Worker only
EXTRACTION_MODE=recipe
```

---

## Future Maintenance

### Upgrading IG Downloader

When IG Downloader gets updates (bug fixes, new platforms, etc.):

```bash
# Fetch latest from upstream
git fetch ig-engine

# Pull updates into extraction/ folder
git subtree pull --prefix="extraction" ig-engine main --squash

# Verify nothing broke
cd extraction
cat requirements.txt  # Check for new dependencies
```

**Test after upgrade:**
- Verify platform handlers still work
- Test transcription pipeline
- Ensure no breaking changes in utility functions

### Monitoring

**Metrics to track:**
- Recipe extraction success rate
- Average processing time
- OpenAI API costs (Whisper + GPT)
- Error rates by platform (Instagram vs TikTok vs YouTube)

**Logging:**
- All logs go to `recipe-extraction/worker.log`
- Monitor for errors in production

### Cost Optimization

**Current costs:**
- Whisper: ~$0.006 per minute of audio
- GPT-4o-mini: ~$0.15 per 1M tokens (~$0.001 per recipe)
- Estimated: $0.05-0.10 per recipe extraction

**Optimization strategies:**
- Cache transcripts (avoid re-transcribing)
- Batch processing
- Rate limiting (already in IG Downloader)

---

## Summary

### Architecture

```
Next.js API → Redis Queue → RQ Worker (recipe_worker.py)
                                  ↓
                          recipe_processor.py
                              ├─ IG Downloader utilities (reused)
                              │  ├─ Platform handlers
                              │  ├─ Audio extraction
                              │  ├─ Transcription
                              │  └─ Supabase uploads
                              │
                              └─ RecipeSave custom (new)
                                 ├─ Recipe analyzer (GPT-4o-mini)
                                 ├─ Data mapper
                                 └─ Database writes
```

### Files Created

| File | Purpose |
|------|---------|
| `extraction/` (Git Subtree) | IG Downloader (pristine) |
| `recipe-extraction/recipe_worker.py` | RQ worker |
| `recipe-extraction/recipe_processor.py` | Main orchestration |
| `recipe-extraction/recipe_analyzer.py` | AI recipe extraction |
| `recipe-extraction/data_mapper.py` | Schema mapping |
| `recipe-extraction/config.py` | Configuration |
| `app/api/recipes/extract/route.ts` | Job submission API |
| `lib/extraction/queue.ts` | Redis queue bridge |
| `docker-compose.yml` | Local Redis setup |

### Database Changes

**Answer:** ✅ **ZERO changes required.**

The existing schema already supports all recipe extraction needs.

### Ready for Implementation

This plan is complete and ready to execute when you're ready. All decisions are documented, architecture is clear, and steps are actionable.
