<!-- Description: Documentation outline for embedding the audio processing pipeline into external SaaS products. -->

# Integration Plan

This document summarizes the knowledge transfer required to make the tool production-ready. Sections mirror our phased roadmap so future developers can understand the architecture, integration points, and intended usage at a glance.

## 1. Overview & Intent

- **Goal:** expose an async job API that downloads short-form video URLs, processes audio, uploads assets to Supabase, and returns structured metadata/results.
- **Scope:** Legacy `/download` route is maintained as a testing blueprint but is not part of the embed contract.
- **Integration touchpoints:** REST POST to `/jobs/create`, polling `/jobs/{job_id}/result`, optional health/status endpoints if added later.

## 2. Environment & Configuration

- Required env vars:
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_AUDIO_BUCKET` (default `temp-audio`) and `SUPABASE_THUMBNAIL_BUCKET` (default `thumbnails`)
  - `OPENAI_API_KEY`, `REDIS_URL`
  - `FLASK_ENV`, `FLASK_DEBUG` control runtime mode
- Supporting services: Redis + RQ for background processing, Supabase Storage/DB, yt-dlp (installed in `venv`), ffmpeg CLI.
- Optional overrides demonstrate how to target different buckets or storage setups.

## 3. Architecture & Data Flow

- **Ingress:** Flask API receives URLs and immediately enqueues jobs after validating platform via `detect_platform`.
- **Router:** `PlatformRouter` picks the correct handler implementing `validate_url`, `fetch_metadata`, `download_video`.
- **Worker:** `job_processor.process_audio_job` executing under RQ. It:
  - fetches metadata (common interface across platforms)
  - downloads video via handler (polymorphic download method)
  - extracts audio & thumbnail (FFmpeg)
  - uploads files through `utils/supabase_client`, which now accepts bucket overrides and public/private flags
  - enriches job records with transcription, analysis, embeddings, and status updates.
- **Legacy blueprint:** `/download` route lives in `legacy_routes.py` and is only registered for internal testing.

## 4. API Surface (API Contract)

### POST /jobs/create

Create a new audio processing job. Returns immediately with a job ID.

**Request:**
```json
{
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

**Response (201 Created):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "rq_job_id": "rq-job-uuid",
  "status": "pending",
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

### GET /jobs/{job_id}/status

Get the current status of a processing job.

**Response (200 OK):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "transcribing",
  "url": "https://www.instagram.com/reel/ABC123xyz/",
  "platform": "instagram",
  "error_message": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:31:00Z"
}
```

**Status Values:**
- `pending` - Job created, waiting to start
- `downloading` - Fetching video from platform
- `extracting_audio` - Processing with FFmpeg
- `uploading` - Uploading files to Supabase
- `transcribing` - Transcribing audio with OpenAI Whisper
- `analyzing` - Analyzing content with GPT-4.1-mini
- `generating_embeddings` - Generating vector embeddings
- `storing` - Storing final results
- `completed` - Job completed successfully
- `failed` - Job failed (check error_message)

### GET /jobs/{job_id}/result

Get complete job result including all processed data.

**Response (200 OK):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "audio_url": "https://supabase.co/storage/v1/object/public/temp-audio/...",
    "thumbnail_url": "https://supabase.co/storage/v1/object/public/thumbnails/...",
    "duration": 45.5,
    "size_bytes": 1234567,
    "transcript": {
      "text": "Full transcript text...",
      "language": "en",
      "timestamps": [...]
    },
    "analysis": {
      "summary": "Content summary...",
      "topics": ["topic1", "topic2"],
      "sentiment": "positive",
      "category": "tutorial"
    },
    "embedding": {
      "id": "embedding-id",
      "metadata": {...}
    }
  },
  "error_message": null
}
```

### SaveIt Integration Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/v1/process` | POST | SaveIt-compatible job creation |
| `/api/v1/jobs/{job_id}` | GET | SaveIt-compatible job result |

**Note:** Legacy `/download` endpoint in `legacy_routes.py` is for testing only and not part of the embed contract.

## 5. Integration Guidance

- **Job processing expectations:** Workers should always run with access to Redis and Supabase service role key. Credentials live in environment and are shared among web + worker processes.
- **Extensibility:** Add new platform handlers under `utils/platforms/`, ensuring they implement the base handler interface. Update `PlatformRouter` if new handler is required.
- **Deployment notes:** Use Supervisor/systemd for `worker.py`. Blueprints and Flask app should be containerized with proper logging/cors settings.

## 6. Testing & Validation

- Manual smoke tests:
 1. Start Redis and run `worker.py`.
 2. Trigger `/jobs/create` with a supported URL and watch worker logs.
 3. Poll `/jobs/{job_id}/status` and `/jobs/{job_id}/result`.
- Automations: unit tests under `test_pipeline.py` and `test_supabase_connection.py`.
- `py_compile` is used during workflow to ensure Python syntax.

## 7. Next Steps / Roadmap

- **Phase 2 deliverables:** finalize this document, add a public README summary, and consider generating OpenAPI specs for the job API.
- **Phase 3 cleanup:** consolidate logging/monitoring, prepare containerized deployments, and document observability.  

