# Supabase Setup Complete

## Project Information

**Project ID:** `xtnghpnxvoaclqipgtoa`  
**Project Name:** Audio Processing Pipeline  
**Project URL:** `https://xtnghpnxvoaclqipgtoa.supabase.co`  
**Region:** eu-north-1  
**Status:** ACTIVE_HEALTHY

## Database Schema

All tables have been created successfully:

✅ **audio_jobs** - Main job tracking table  
✅ **audio_files** - Audio file metadata and storage URLs  
✅ **thumbnails** - Thumbnail image URLs  
✅ **transcriptions** - Audio transcripts with timestamps  
✅ **analyses** - AI-generated content analysis  
✅ **embeddings** - Vector embeddings for semantic search (pgvector enabled)

All indexes and triggers have been created.

## API Keys

**Anon Key (Publishable):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bmdocG54dm9hY2xxaXBndG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM5NjYsImV4cCI6MjA3OTE2OTk2Nn0.FoLdm50C8gcQrS7VzFcd-BQisyrUy9_JeOeFk_0RRl4
```

**Service Role Key:** 
⚠️ You need to get this from the Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/xtnghpnxvoaclqipgtoa/settings/api
2. Copy the "service_role" key (keep it secret!)

## Environment Variables

Update your `.env` file with:

```env
SUPABASE_URL=https://xtnghpnxvoaclqipgtoa.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bmdocG54dm9hY2xxaXBndG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM5NjYsImV4cCI6MjA3OTE2OTk2Nn0.FoLdm50C8gcQrS7VzFcd-BQisyrUy9_JeOeFk_0RRl4
SUPABASE_SERVICE_ROLE_KEY=<get from dashboard>
OPENAI_API_KEY=<your_openai_api_key>
REDIS_URL=redis://localhost:6379/0
```

## Storage Buckets Setup

⚠️ **Action Required:** Create storage buckets manually in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/xtnghpnxvoaclqipgtoa/storage/buckets
2. Click "New bucket"

### Bucket 1: temp-audio
- **Name:** `temp-audio`
- **Public:** ❌ No (Private)
- **File size limit:** 100 MB
- **Allowed MIME types:** `audio/mpeg`, `audio/mp3`

### Bucket 2: thumbnails
- **Name:** `thumbnails`
- **Public:** ✅ Yes (Public)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg`, `image/jpg`, `image/png`

## Next Steps

1. ✅ Database schema - **COMPLETE**
2. ⚠️ Get service role key from dashboard
3. ⚠️ Create storage buckets (see above)
4. ⚠️ Update `.env` file with all credentials
5. ⚠️ Start Redis: `redis-server`
6. ⚠️ Start RQ worker: `python worker.py`
7. ⚠️ Start Flask app: `python app.py`

## Testing

Once everything is set up, test the pipeline:

```bash
# Submit a job
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/YOUR_REEL_ID/"}'

# Check status
curl http://localhost:5001/jobs/{job_id}/status

# Get results
curl http://localhost:5001/jobs/{job_id}/result
```

