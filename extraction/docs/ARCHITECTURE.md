<!-- Description: Architecture overview and data flow diagram for the audio processing pipeline -->

# Architecture Overview

This document provides a comprehensive view of the system architecture, data flow, and pipeline design.

## System Components

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│   API)      │
└──────┬──────┘
       │ POST /jobs/create
       ▼
┌─────────────────────────────────────────┐
│         Flask API (app.py)              │
│  ┌────────────────────────────────┐    │
│  │  Platform Detection & Routing  │    │
│  │  (PlatformRouter)              │    │
│  └────────────────────────────────┘    │
└──────┬──────────────────────────────────┘
       │ Enqueue Job
       ▼
┌─────────────────────────────────────────┐
│         Redis Queue (RQ)                │
│  ┌────────────────────────────────┐    │
│  │  Job Queue Management          │    │
│  └────────────────────────────────┘    │
└──────┬──────────────────────────────────┘
       │ Dequeue Job
       ▼
┌─────────────────────────────────────────┐
│      RQ Worker (worker.py)              │
│  ┌────────────────────────────────┐    │
│  │  Pipeline Orchestrator         │    │
│  │  (job_processor.py)            │    │
│  └────────────────────────────────┘    │
└──────┬──────────────────────────────────┘
       │
       ├──► Platform Handler (polymorphic)
       │    ├── InstagramHandler
       │    ├── TikTokHandler
       │    ├── YouTubeHandler
       │    └── FacebookHandler
       │
       ├──► Audio Processor (FFmpeg)
       │    ├── Video Download
       │    ├── Audio Extraction
       │    └── Thumbnail Extraction
       │
       ├──► Supabase Storage
       │    ├── Audio Upload (temp-audio bucket)
       │    └── Thumbnail Upload (thumbnails bucket)
       │
       ├──► OpenAI Whisper API
       │    └── Audio Transcription
       │
       ├──► OpenAI GPT-4.1-mini
       │    └── Content Analysis
       │
       └──► OpenAI Embeddings
            └── Vector Generation
                 ▼
       ┌─────────────────────────┐
       │  Supabase PostgreSQL    │
       │  - Jobs Table           │
       │  - Audio Files Table    │
       │  - Transcriptions Table │
       │  - Analysis Table       │
       │  - Embeddings Table     │
       └─────────────────────────┘
```

## Data Flow (Request Lifecycle)

### 1. Job Creation (API → Redis)
```
Client Request
    ↓
POST /jobs/create {"url": "..."}
    ↓
Platform Detection (detect_platform)
    ↓
Create Job Record in DB (status: pending)
    ↓
Enqueue to Redis Queue
    ↓
Return job_id to client
```

### 2. Job Processing (Worker)
```
Worker pulls job from Redis
    ↓
Update status: DOWNLOADING
    ↓
┌─────────────────────────────────────────┐
│ Platform Handler Routing                │
│   handler = router.get_handler(url)     │
│   metadata = handler.fetch_metadata()   │
│   video = handler.download_video()      │
└─────────────────────────────────────────┘
    ↓
Update status: EXTRACTING_AUDIO
    ↓
┌─────────────────────────────────────────┐
│ Audio & Thumbnail Extraction (FFmpeg)   │
│   audio_bytes = extract_audio()         │
│   thumbnail_bytes = extract_thumbnail() │
└─────────────────────────────────────────┘
    ↓
Update status: UPLOADING
    ↓
┌─────────────────────────────────────────┐
│ Upload to Supabase Storage              │
│   audio_url = upload_audio_file()       │
│   thumbnail_url = upload_thumbnail()    │
└─────────────────────────────────────────┘
    ↓
Update status: TRANSCRIBING
    ↓
┌─────────────────────────────────────────┐
│ OpenAI Whisper Transcription            │
│   transcript = transcribe_audio()       │
└─────────────────────────────────────────┘
    ↓
Update status: ANALYZING
    ↓
┌─────────────────────────────────────────┐
│ OpenAI GPT-4.1-mini Analysis            │
│   analysis = analyze_content()          │
│   (summary, topics, sentiment, category)│
└─────────────────────────────────────────┘
    ↓
Update status: GENERATING_EMBEDDINGS
    ↓
┌─────────────────────────────────────────┐
│ OpenAI Embeddings Generation            │
│   vector = generate_embeddings()        │
└─────────────────────────────────────────┘
    ↓
Update status: STORING
    ↓
Store all results in Supabase DB
    ↓
Update status: COMPLETED
```

## Pipeline Extension Points

The pipeline is designed to be extensible. Here's how to add new steps:

### Adding a New Processing Step (e.g., Translation)

1. **Create the service module** (e.g., `utils/translation_service.py`):
```python
def translate_content(text: str, target_language: str) -> Dict:
    """Translate transcribed text to target language."""
    # Implementation here
    return {
        'translated_text': '...',
        'source_language': 'en',
        'target_language': target_language
    }
```

2. **Add database storage** (update `utils/job_models.py`):
```python
def store_translation(audio_file_id: str, translated_text: str, ...) -> str:
    """Store translation in database."""
    # Implementation here
```

3. **Integrate into pipeline** (update `utils/job_processor.py`):
```python
# After transcription step
update_job_status(job_id, JobStatus.TRANSLATING)
translation_data = translate_content(transcript_data['text'], 'es')
translation_id = store_translation(audio_file_id, translation_data['translated_text'], ...)
logger.info(f"Translation complete. ID: {translation_id}")
```

### Adding a New Platform (e.g., Twitter/X)

1. **Create handler** (`utils/platforms/twitter_handler.py`):
```python
from utils.platforms.base_handler import BasePlatformHandler

class TwitterHandler(BasePlatformHandler):
    def validate_url(self, url: str) -> bool:
        # Validate Twitter/X video URL
        pass
    
    def extract_id(self, url: str) -> str:
        # Extract tweet ID
        pass
    
    def fetch_metadata(self, url: str) -> Dict:
        # Fetch video metadata from Twitter API
        pass
    
    def get_platform_name(self) -> str:
        return "Twitter"
    
    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        # Download video using Twitter API or CDN
        pass
```

2. **Register in router** (`utils/platform_router.py`):
```python
from utils.platforms.twitter_handler import TwitterHandler

class PlatformRouter:
    def __init__(self):
        self.handlers = {
            Platform.INSTAGRAM: InstagramHandler(),
            Platform.TIKTOK: TikTokHandler(),
            Platform.YOUTUBE: YouTubeHandler(),
            Platform.TWITTER: TwitterHandler(),  # Add new handler
        }
```

3. **Update platform detector** (`utils/platform_detector.py`):
```python
class Platform(str, Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    TWITTER = "twitter"  # Add new platform
    UNKNOWN = "unknown"

def detect_platform(url: str) -> Platform:
    # Add Twitter detection logic
    if 'twitter.com' in url or 'x.com' in url:
        return Platform.TWITTER
```

## Configuration & Environment

All environment-driven configuration is centralized in `utils/config.py`:

```python
class Config:
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_AUDIO_BUCKET: str = "temp-audio"         # Configurable
    SUPABASE_THUMBNAIL_BUCKET: str = "thumbnails"     # Configurable
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Flask
    FLASK_ENV: str = "development"
    FLASK_DEBUG: bool = False
```

### Overriding Storage Buckets

To use custom bucket names (e.g., in a multi-tenant SaaS):

```bash
# .env file
SUPABASE_AUDIO_BUCKET=tenant-123-audio
SUPABASE_THUMBNAIL_BUCKET=tenant-123-thumbnails
```

The system will automatically use these buckets throughout the pipeline.

## Error Handling & Retry Logic

### Job Status States
- `pending` → Initial state
- `downloading` → Fetching video
- `extracting_audio` → Processing with FFmpeg
- `uploading` → Uploading to storage
- `transcribing` → OpenAI Whisper
- `analyzing` → OpenAI GPT-4.1-mini
- `generating_embeddings` → OpenAI Embeddings
- `storing` → Final DB writes
- `completed` → Success
- `failed` → Error occurred (see error_message)

### Failure Handling
- All exceptions are caught in `job_processor.py`
- Job status is updated to `failed`
- Error message is stored in database
- Worker continues processing other jobs
- No automatic retry (implement in RQ if needed)

## Performance Considerations

### Bottlenecks
1. **Video Download** - Network-dependent, varies by platform
2. **FFmpeg Processing** - CPU-bound, scales with video length
3. **OpenAI API Calls** - Rate-limited, add queue management if high volume

### Scaling Strategy
1. **Horizontal Worker Scaling** - Run multiple `worker.py` instances
2. **Redis Clustering** - For high job throughput
3. **Supabase Connection Pooling** - Configured in client
4. **CDN for Static Assets** - Serve audio/thumbnails via CDN

## Security Considerations

### API Keys
- Never commit `.env` files
- Use service role key only in backend/worker
- Rotate keys regularly

### Storage Access
- Audio bucket: **Private** (requires signed URLs)
- Thumbnails bucket: **Public** (direct access)
- Sign URLs with 1-hour expiry for audio downloads

### Input Validation
- URL validation at API layer
- Platform detection before processing
- Sanitize all user inputs

