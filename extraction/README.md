# Audio Processing Pipeline

A complete audio processing pipeline for extracting, transcribing, analyzing, and embedding audio content from Instagram Reels, TikTok, YouTube Shorts, and Facebook Reels. Built with Python Flask backend, Supabase storage, OpenAI Whisper transcription, GPT-4.1-mini analysis, and vector embeddings for semantic search.

## Features

- 🎵 Extract audio from multiple platforms:
  - Instagram Reels
  - TikTok videos
  - YouTube Shorts (videos ≤ 60 seconds)
  - Facebook / Facebook Reels
- 🖼️ Thumbnail extraction and storage
- ☁️ Cloud storage with Supabase
- 🎙️ Audio transcription using OpenAI Whisper API
- 🤖 AI content analysis (summary, topics, sentiment, category) using GPT-4.1-mini
- 🔍 Vector embeddings for semantic search (text-embedding-3-small)
- ⚡ Async job processing with RQ + Redis
- 🔌 SaveIt integration API endpoints
- 🎨 Clean, modern web interface
- ✅ Comprehensive error handling and job status tracking
- 📱 Responsive design
- 🔌 Modular platform architecture for easy extension

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.9+** - [Download Python](https://www.python.org/downloads/)
2. **ffmpeg** - Required for audio extraction
3. **Redis** - Required for async job processing
4. **Supabase Account** - For database and storage
5. **OpenAI API Key** - For transcription and AI analysis

### Installing ffmpeg

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
1. Download ffmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract and add to PATH, or use:
```bash
choco install ffmpeg
```

### Installing Redis

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

#### Windows
```bash
choco install redis-64
```

Or download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

### Setting Up Environment Variables

1. **Copy the example environment file:**
```bash
cp .env.example .env
```

2. **Edit `.env` and add your credentials:**
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_AUDIO_BUCKET=temp-audio              # Optional override
SUPABASE_THUMBNAIL_BUCKET=thumbnails          # Optional override

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
```

3. **Set up Supabase:**
   - Create a new Supabase project
   - Run the database schema migration (see `utils/database_schema.sql`)
   - Create storage buckets: `temp-audio` (private) and `thumbnails` (public)

## Installation

1. **Clone or navigate to the project directory:**
```bash
cd "IG Downloader"
```

2. **Create a virtual environment (recommended):**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up Supabase database:**
   - Apply the database schema using Supabase MCP or dashboard
   - See `utils/database_schema.sql` for the schema
   - Create storage buckets: `temp-audio` and `thumbnails`

5. **Start Redis (if not running as a service):**
```bash
redis-server
```

## Usage

### Starting the Server

1. **Activate your virtual environment** (if not already activated):
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Start Redis** (if not running as a service):
```bash
redis-server
```

3. **Start the RQ worker** (in a separate terminal):
```bash
source venv/bin/activate
python worker.py
```
Or use RQ directly:
```bash
rq worker --with-scheduler
```

4. **Run the Flask application:**
```bash
python app.py
```

5. **Open your browser and navigate to:**
```
http://localhost:5001
```

### Using the Web Interface

1. Copy a video URL from one of the supported platforms:
   - **Instagram Reels**: `https://www.instagram.com/reel/ABC123xyz/` or `https://www.instagram.com/reels/ABC123xyz/`
   - **TikTok**: `https://www.tiktok.com/@username/video/1234567890` or `https://vm.tiktok.com/...`
   - **YouTube Shorts**: `https://www.youtube.com/shorts/VIDEO_ID`
   - **Facebook Reels**: `https://www.facebook.com/reel/VIDEO_ID` or `https://fb.watch/...`
2. Paste it into the input field
3. Click "Download Audio"
4. Wait for processing (may take a few moments)
5. The MP3 file will download automatically once processing is complete

### Testing with cURL

You can also test the API directly with any supported platform.

**Create a Job:**
```bash
# Instagram Reel
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/ABC123xyz/"}'

# TikTok
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.tiktok.com/@username/video/1234567890"}'

# YouTube Shorts
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/shorts/VIDEO_ID"}'

# Facebook Reels
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.facebook.com/reel/VIDEO_ID"}'
```

**Check Status:**
```bash
curl http://localhost:5001/jobs/{job_id}/status
```

**Get Result:**
```bash
curl http://localhost:5001/jobs/{job_id}/result
```

### Testing with Postman

1. Create a new POST request to `http://localhost:5001/jobs/create`
2. Body (raw JSON) - use any supported platform:
```json
{
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```
Or:
```json
{
  "url": "https://www.facebook.com/reel/VIDEO_ID"
}
```
3. Copy the `job_id` from the response
4. Create a GET request to `http://localhost:5001/jobs/{job_id}/status` to check progress
5. Create a GET request to `http://localhost:5001/jobs/{job_id}/result` to get the final data (includes `platform` field)

## Project Structure

```
IG Downloader/
├── app.py                    # Flask API server with multi-platform routing
├── worker.py                 # RQ worker entry point for background jobs
├── legacy_routes.py          # Legacy /download endpoint (testing only)
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variables template
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture & data flow diagrams
│   ├── INTEGRATION_PLAN.md   # Integration guide for SaaS embedding
│   ├── PLATFORM_HANDLER_GUIDE.md  # Guide for adding new platforms
│   ├── SUPABASE_SETUP.md     # Database setup instructions
│   └── TESTING_GUIDE.md      # Testing procedures
├── utils/
│   ├── __init__.py
│   ├── config.py             # Configuration management
│   ├── supabase_client.py    # Supabase storage client
│   ├── job_queue.py          # RQ job queue setup
│   ├── job_models.py         # Job status and database models
│   ├── job_processor.py      # Main pipeline orchestrator
│   ├── transcription_service.py  # OpenAI Whisper transcription
│   ├── ai_analyzer.py        # GPT-4.1-mini content analysis
│   ├── embedding_service.py  # Vector embedding generation
│   ├── platform_detector.py  # Platform detection from URL
│   ├── platform_router.py    # Multi-platform request routing
│   ├── url_parser.py         # Instagram URL validation
│   ├── audio_processor.py    # Audio extraction using ffmpeg
│   ├── database_schema.sql   # Database schema migration
│   ├── apply_schema.py       # Helper script to apply schema
│   ├── create_buckets.py     # Helper script for bucket setup
│   └── platforms/            # Platform-specific handlers
│       ├── __init__.py
│       ├── base_handler.py   # Abstract base class for platform handlers
│       ├── instagram_handler.py  # Instagram Reels handler
│       ├── instagram_utils.py    # Instagram metadata utilities
│       ├── tiktok_handler.py     # TikTok handler
│       ├── youtube_handler.py    # YouTube Shorts handler
│       └── facebook_handler.py   # Facebook Reels handler
├── static/
│   ├── css/
│   │   └── globals.css       # Custom styles
│   └── js/
│       └── main.js           # Frontend JavaScript with multi-platform validation
├── templates/
│   └── index.html            # Main web interface
└── README.md                 # This file
```

## API Endpoints

### Audio Processing Pipeline Endpoints

#### POST /jobs/create

Create a new audio processing job. Returns immediately with a job ID.

**Request:**
```json
{
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

**Response:**
```json
{
  "job_id": "uuid-string",
  "rq_job_id": "rq-job-id",
  "status": "pending",
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

#### GET /jobs/{job_id}/status

Get the current status of a processing job.

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "transcribing",
  "url": "https://www.instagram.com/reel/ABC123xyz/",
  "platform": "instagram",
  "error_message": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:31:00Z"
}
```

**Platform Values:**
- `instagram` - Instagram Reels
- `tiktok` - TikTok videos
- `youtube` - YouTube Shorts
- `facebook` - Facebook Reels or Facebook videos

**Job Status Values:**
- `pending` - Job created, waiting to start
- `downloading` - Downloading video
- `extracting_audio` - Extracting audio and thumbnail
- `uploading` - Uploading files to Supabase
- `transcribing` - Transcribing audio with Whisper
- `analyzing` - Analyzing content with GPT-4.1-mini
- `generating_embeddings` - Generating vector embeddings
- `storing` - Storing final results
- `completed` - Job completed successfully
- `failed` - Job failed (check error_message)

#### GET /jobs/{job_id}/result

Get complete job result including all processed data.

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "platform": "facebook",
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
    },
    "metadata": {
      "title": "Video Title",
      "uploader": "Username",
      "description": "Video description"
    }
  }
}
```

### SaveIt Integration API

#### POST /api/v1/process

SaveIt integration endpoint for submitting audio processing jobs.

**Request:**
```json
{
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "pending",
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

#### GET /api/v1/jobs/{job_id}

SaveIt integration endpoint for retrieving complete job details.

**Response:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "result": {
    "audio_url": "...",
    "thumbnail_url": "...",
    "transcript": {...},
    "analysis": {...},
    "metadata": {
      "url": "...",
      "platform": "instagram",
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

**Supported Platforms:**
- `instagram` - Instagram Reels
- `tiktok` - TikTok videos
- `youtube` - YouTube Shorts (videos ≤ 60 seconds)
- `facebook` - Facebook Reels and Facebook videos

## Rate Limiting

The API enforces a rate limit of **10 requests per hour per IP address**. This helps prevent abuse and comply with platform terms of service.

## Legal Disclaimer

This tool is for downloading audio from **YOUR OWN** videos or content you have permission to use. Downloading copyrighted content without permission violates platform Terms of Service and may be illegal.

## Troubleshooting

### "yt-dlp not found" Error
- Ensure yt-dlp is installed: `pip install yt-dlp`
- Verify installation: `yt-dlp --version`

### "ffmpeg not found" Error
- Install ffmpeg using the instructions above
- Verify installation: `ffmpeg -version`
- Ensure ffmpeg is in your system PATH

### "Rate limit exceeded" Error
- Wait 1 hour before making another request
- The limit is 10 requests per hour per IP address

### "Private video" or "Sign in" Error
- The video may be private or require authentication
- Only public videos can be downloaded
- Some platforms may require cookies for certain content

### "Video unavailable" Error
- The video may have been deleted
- The URL may be invalid
- The platform may have blocked access

### "This is not a YouTube Short" Error
- Only YouTube Shorts (videos ≤ 60 seconds) are supported
- Regular YouTube videos are not supported
- Use a YouTube Shorts URL or ensure the video is ≤ 60 seconds

### "This video has no audio stream" Error (Facebook)
- Some Facebook Reels may be silent or have no audio track
- The video was downloaded successfully but contains no audio
- Try a different Facebook Reel that you know has audio
- This is a limitation of the source video, not the downloader

### Facebook Reels Download Issues
- Facebook Reels require public access (not private or friends-only)
- Some Reels may require login authentication
- Use `facebook.com/reel/VIDEO_ID` or `facebook.com/watch/?v=VIDEO_ID` format
- The handler uses yt-dlp with appropriate headers to bypass basic restrictions

## Platform Architecture

The pipeline uses a modular platform handler architecture:

- **Platform Detection**: URLs are automatically detected and routed to the appropriate handler
- **Handler Pattern**: Each platform (Instagram, TikTok, YouTube, Facebook) has its own handler implementing `BasePlatformHandler`
- **Download Strategies**:
  - **Instagram**: Direct video URL extraction (public CDN links)
  - **TikTok/YouTube/Facebook**: Handler-based downloads using yt-dlp Python API to preserve session context and handle signed URLs
- **Unified Interface**: All platforms follow the same workflow: metadata → download → audio extraction → transcription → analysis → embedding

### Facebook Reels Handler

The Facebook handler (`utils/platforms/facebook_handler.py`) uses:
- yt-dlp with desktop Chrome user-agent for better compatibility
- Unified session for metadata extraction and download to avoid signed URL expiration
- Support for multiple Facebook URL formats:
  - `facebook.com/reel/VIDEO_ID`
  - `facebook.com/reels/VIDEO_ID`
  - `facebook.com/watch/?v=VIDEO_ID`
  - `fb.watch/VIDEO_ID`
  - `m.facebook.com/story.php` (mobile format)

**Note**: Some Facebook Reels may be silent (no audio track). The pipeline will detect this and return an appropriate error message.

## Development

### Running in Debug Mode

The Flask app runs in debug mode by default. To disable:

```python
# In app.py, change:
app.run(debug=False, host='0.0.0.0', port=5000)
```

### Logging

Logs are output to the console with timestamps and log levels. Check the console for detailed error messages.

## Dependencies

- **Flask** - Web framework
- **flask-cors** - CORS support
- **flask-limiter** - Rate limiting
- **yt-dlp** - Video content fetching
- **requests** - HTTP handling
- **supabase** - Supabase client for database and storage
- **openai** - OpenAI API client for transcription and analysis
- **rq** - Redis Queue for async job processing
- **redis** - Redis client
- **python-dotenv** - Environment variable management

## Database Schema

The pipeline uses the following Supabase tables:

- **audio_jobs** - Main job tracking table
- **audio_files** - Audio file metadata and storage URLs
- **thumbnails** - Thumbnail image URLs
- **transcriptions** - Audio transcripts with timestamps
- **analyses** - AI-generated content analysis
- **embeddings** - Vector embeddings for semantic search (pgvector)

## License

This project is for educational purposes. Use responsibly and in accordance with platform Terms of Service.

## Support

For issues or questions, please check:
1. All prerequisites are installed correctly
2. ffmpeg is in your system PATH
3. You're using a valid, public video URL
4. You haven't exceeded the rate limit
