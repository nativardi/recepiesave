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
- Direct integration with RecipeSave database schema

## Files

- `recipe_worker.py` - RQ worker that processes extraction jobs
- `recipe_processor.py` - Main orchestration logic
- `recipe_analyzer.py` - Recipe-specific AI extraction
- `data_mapper.py` - Maps AI output to database schema
- `config.py` - Configuration

## Running Locally

See: [/Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md](/Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md)

## Pipeline Flow

```
User submits URL → Next.js API → Redis Queue
                                      ↓
                              RQ Worker (recipe_worker.py)
                                      ↓
                          recipe_processor.py orchestrates:

1. Download video (IG Downloader platform handlers)
2. Extract audio + thumbnail (IG Downloader audio processor)
3. Transcribe audio (IG Downloader transcription service)
4. Extract recipe (RecipeSave recipe_analyzer) 🎯 NEW
5. Map to schema (RecipeSave data_mapper) 🎯 NEW
6. Store in database (recipes, ingredients, instructions)
```

## Status Values

The extraction pipeline updates the `recipes.status` field:

- `pending` - Job created, waiting to start
- `downloading` - Fetching video from platform
- `extracting_audio` - Processing with FFmpeg
- `transcribing` - Transcribing audio with OpenAI Whisper
- `analyzing` - Analyzing content with GPT-4o-mini
- `completed` - Job completed successfully
- `failed` - Job failed (check logs)

## Development

### Prerequisites

- Python 3.11+
- Redis (running via Docker Compose or local)
- OpenAI API key
- Supabase project with RecipeSave schema

### Installation

```bash
# Install IG Downloader dependencies
cd ../extraction
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# recipe-extraction uses the same venv and dependencies
```

### Environment Variables

Required in `.env` or `.env.local`:

```bash
# OpenAI
OPENAI_API_KEY=sk-xxx...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Redis
REDIS_URL=redis://localhost:6379
```

### Running the Worker

```bash
# Terminal 1: Start Redis
docker-compose up redis

# Terminal 2: Start worker
cd recipe-extraction
source ../extraction/venv/bin/activate
export OPENAI_API_KEY=sk-xxx
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=xxx
export REDIS_URL=redis://localhost:6379
python recipe_worker.py
```

### Testing

Submit a test job via the Next.js app or curl:

```bash
curl -X POST http://localhost:3000/api/recipes/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/RECIPE_REEL_ID/"}'
```

Watch the worker logs to see the pipeline progress.

## Design Principles

1. **Never modify IG Downloader** - It remains pristine and reusable
2. **Maximum code reuse** - 90% of video processing comes from IG Downloader
3. **Clean separation** - Recipe logic is isolated in this folder
4. **Maintainable** - Clear boundaries between general and recipe-specific code
5. **Upgradeable** - Can pull IG Downloader updates without conflicts

## Future Enhancements

- Caching of transcripts (avoid re-transcribing)
- Batch processing support
- Cost optimization (Whisper + GPT usage tracking)
- Platform-specific error handling improvements
- Video quality selection for download optimization
