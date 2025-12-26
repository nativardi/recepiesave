# Testing Guide - Audio Processing Pipeline

## Prerequisites Checklist

Before testing, ensure you have:

- [ ] ✅ `.env` file created with all required values
- [ ] ✅ Redis installed and running
- [ ] ✅ Python dependencies installed (`pip install -r requirements.txt`)
- [ ] ✅ Supabase storage buckets created (`temp-audio` and `thumbnails`)
- [ ] ✅ Service role key added to `.env`

## Step 1: Verify Environment Setup

### Check .env file exists and has values:
```bash
# Make sure .env file exists
ls -la .env

# Verify it has the required keys (don't show values for security)
grep -E "^[A-Z_]+=" .env | cut -d'=' -f1
```

You should see:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- REDIS_URL

### Verify Redis is running:
```bash
redis-cli ping
```

Should return: `PONG`

If Redis is not running:
```bash
# macOS
brew services start redis
# or
redis-server

# Linux
sudo systemctl start redis
# or
redis-server
```

## Step 2: Start the Services

You need **3 terminal windows** running simultaneously:

### Terminal 1: Start Redis (if not running as service)
```bash
redis-server
```

### Terminal 2: Start RQ Worker
```bash
cd "/Users/user/Code Pojects/IG Downloader"
source venv/bin/activate
python worker.py
```

You should see:
```
Starting RQ worker...
Listening on queue: default
```

### Terminal 3: Start Flask Application
```bash
cd "/Users/user/Code Pojects/IG Downloader"
source venv/bin/activate
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
```

## Step 3: Test the Pipeline

### Test 1: Health Check (Optional - if you add this endpoint)

### Test 2: Create a Job

**Using cURL:**
```bash
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/YOUR_REEL_ID/"}'
```

**Using a test Instagram Reel URL** (replace with a real public Reel):
```bash
curl -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/ABC123xyz/"}'
```

**Expected Response:**
```json
{
  "job_id": "uuid-string",
  "rq_job_id": "rq-job-id",
  "status": "pending",
  "url": "https://www.instagram.com/reel/ABC123xyz/"
}
```

**Save the `job_id` for next steps!**

### Test 3: Check Job Status

```bash
# Replace {job_id} with the actual job_id from step 2
curl http://localhost:5001/jobs/{job_id}/status
```

**Expected Response (while processing):**
```json
{
  "job_id": "uuid-string",
  "status": "transcribing",
  "url": "...",
  "platform": "instagram",
  "error_message": null,
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:31:00Z"
}
```

**Status values you might see:**
- `pending` → `downloading` → `extracting_audio` → `uploading` → `transcribing` → `analyzing` → `generating_embeddings` → `storing` → `completed`

**Poll until status is `completed` or `failed`:**
```bash
# Check status every 5 seconds
watch -n 5 'curl -s http://localhost:5001/jobs/{job_id}/status | jq .status'
```

### Test 4: Get Job Results

Once status is `completed`:
```bash
curl http://localhost:5001/jobs/{job_id}/result | jq
```

**Expected Response:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "result": {
    "audio_url": "https://xtnghpnxvoaclqipgtoa.supabase.co/storage/v1/object/public/temp-audio/...",
    "thumbnail_url": "https://xtnghpnxvoaclqipgtoa.supabase.co/storage/v1/object/public/thumbnails/...",
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
  }
}
```

## Step 4: Test SaveIt Integration Endpoints

### Test SaveIt Process Endpoint:
```bash
curl -X POST http://localhost:5001/api/v1/process \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/YOUR_REEL_ID/"}'
```

### Test SaveIt Get Job:
```bash
curl http://localhost:5001/api/v1/jobs/{job_id} | jq
```

## Step 5: Monitor Logs

### Check Worker Logs (Terminal 2):
You should see progress like:
```
Starting job abc-123 for URL: https://...
Fetched metadata. Platform: instagram, Title: ...
Thumbnail uploaded: https://...
Audio uploaded: https://...
Transcription complete. ID: ...
Analysis complete. ID: ..., Category: tutorial
Embedding generated. ID: ..., Vector dimension: 1536
Job abc-123 completed successfully
```

### Check Flask Logs (Terminal 3):
You should see API requests:
```
INFO: Download request from 127.0.0.1 for URL: https://...
INFO: Created job abc-123 (RQ job: xyz-456) for URL: https://...
```

## Troubleshooting

### Error: "Required environment variable 'X' is not set"
- Check your `.env` file exists and has all required variables
- Make sure you're running from the project directory

### Error: "Failed to connect to Redis"
- Make sure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env` is correct

### Error: "Failed to connect to Supabase"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Supabase project is active

### Error: "Job failed" with error_message
- Check the worker logs (Terminal 2) for detailed error
- Common issues:
  - Invalid URL or video not accessible
  - OpenAI API key invalid or quota exceeded
  - Storage bucket not created

### Job stuck in "pending" status
- Check RQ worker is running (Terminal 2)
- Check Redis is running
- Restart worker if needed

### Storage bucket errors
- Verify buckets `temp-audio` and `thumbnails` exist in Supabase
- Check bucket permissions (temp-audio should be private, thumbnails public)

## Quick Test Script

Save this as `test_pipeline.sh`:

```bash
#!/bin/bash

# Test Audio Processing Pipeline
echo "Testing Audio Processing Pipeline..."

# Create job
echo "1. Creating job..."
RESPONSE=$(curl -s -X POST http://localhost:5001/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/YOUR_REEL_ID/"}')

JOB_ID=$(echo $RESPONSE | jq -r '.job_id')
echo "Job ID: $JOB_ID"

# Check status
echo "2. Checking status..."
for i in {1..30}; do
  STATUS=$(curl -s http://localhost:5001/jobs/$JOB_ID/status | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "completed" ]; then
    echo "3. Job completed! Getting results..."
    curl -s http://localhost:5001/jobs/$JOB_ID/result | jq
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Job failed!"
    curl -s http://localhost:5001/jobs/$JOB_ID/status | jq '.error_message'
    break
  fi
  
  sleep 5
done
```

Make it executable:
```bash
chmod +x test_pipeline.sh
./test_pipeline.sh
```

## Next Steps

Once testing is successful:
1. ✅ Pipeline is working end-to-end
2. ✅ All services are properly configured
3. ✅ Ready for production use or SaveIt integration

