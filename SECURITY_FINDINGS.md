# Security Findings Log

A centralized log of all security scan findings across the SaveIt Recipe App project. This document serves as a running TODO list for security issues discovered during development and code reviews.

**Last Updated:** 2025-12-24
**Total Findings:** 1 (1 High)
**Resolved:** 0
**Pending Review:** 1

---

## Status Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 HIGH | 1 | Pending |
| 🟡 MEDIUM | 0 | - |
| 🟢 LOW | 0 | - |
| ✅ RESOLVED | 0 | - |

---

## Finding Format

Each finding includes:
- **Finding ID**: Unique identifier (FINDING-YYYY-MM-DD-N)
- **Title**: Brief description
- **Severity**: HIGH, MEDIUM, or LOW
- **Category**: Type of vulnerability
- **Status**: Pending, In Review, In Progress, Resolved
- **File(s)**: Affected source files
- **Description**: Detailed explanation
- **Recommendation**: How to fix it
- **Related Issues**: Links to related findings
- **Date Discovered**: When this was found
- **Date Resolved**: When/if this was fixed
- **Notes**: Additional context and discussion

---

## Active Findings

### FINDING-2025-12-24-001

**Title:** Missing Authentication on API Endpoints
**Severity:** 🔴 HIGH
**Category:** Authentication & Authorization (CWE-306)
**Status:** ⏳ Pending
**Confidence:** 9/10

#### Files Affected
- `Code Pojects/IG Downloader/app.py` (lines 62-331)
- `Code Pojects/IG Downloader/legacy_routes.py`

#### Description

All public API endpoints in the IG Downloader service lack authentication mechanisms:
- `POST /jobs/create` - Creates audio processing jobs
- `GET /jobs/<job_id>/status` - Retrieves job status
- `GET /jobs/<job_id>/result` - Retrieves complete job results with sensitive data
- `POST /api/v1/process` - SaveIt integration endpoint
- `GET /api/v1/jobs/<job_id>` - SaveIt integration endpoint

This allows anonymous users to:

1. **Consume API Credits Unauthorized:**
   - Each job triggers 3 paid OpenAI API calls:
     - Whisper transcription (~$0.006/minute)
     - GPT-4.1-mini analysis (~$0.015/job)
     - text-embedding-3-small (~$0.0001/job)
   - No rate limiting on `/jobs/create` endpoint
   - Attackers can submit unlimited jobs, rapidly depleting OpenAI API credits

2. **Access Other Users' Data:**
   - No `user_id` column in database schema for job ownership
   - Job IDs are UUIDs (128 bits) - hard to guess but enumerable
   - Attackers can retrieve any job's transcripts, AI analysis, and audio file URLs
   - Transcripts may contain sensitive or confidential information

3. **Exhaust Resources:**
   - Fill Supabase storage buckets (`temp-audio`, `thumbnails`) with malicious jobs
   - Overwhelm Redis queue and worker processes
   - No storage quota limits per user
   - No automatic cleanup of failed/old jobs

#### Exploit Scenario

```python
# Attacker A: Resource abuse via automation
import requests
for i in range(10000):
    response = requests.post(
        'http://service/jobs/create',
        json={'url': 'https://www.instagram.com/reel/ABC123/'}
    )
    job_id = response.json()['job_id']
    # Cost: 10,000 jobs × $0.021/job = $210 in OpenAI credits consumed

# Attacker B: Data harvesting via UUID enumeration
import uuid
for job_uuid in [generate_uuid() for _ in range(100000)]:
    response = requests.get(f'http://service/jobs/{job_uuid}/result')
    if response.status_code == 200:
        # Found a valid job - extract transcript, analysis, audio URLs
        data = response.json()
        print(f"Found job transcript: {data['result']['transcript']}")
```

#### Current Implementation

No authentication found:
- ❌ No API key validation
- ❌ No JWT or OAuth2
- ❌ No session management
- ❌ No authentication decorators on endpoints
- ❌ CORS enabled globally (`CORS(app)`)
- ❌ No rate limiting middleware
- ❌ No user/ownership association

#### Recommendations

**Priority 1 (Critical - Must implement before production):**
1. Implement API key authentication:
   ```python
   from functools import wraps

   def require_api_key(f):
       @wraps(f)
       def decorated_function(*args, **kwargs):
           api_key = request.headers.get('X-API-Key')
           if not api_key or not validate_api_key(api_key):
               return jsonify({'error': 'Invalid or missing API key'}), 401
           request.user_id = get_user_from_api_key(api_key)
           return f(*args, **kwargs)
       return decorated_function

   @app.route('/jobs/create', methods=['POST'])
   @require_api_key
   def create_job_endpoint():
       # Implementation
   ```

2. Update database schema to track job ownership:
   ```sql
   ALTER TABLE audio_jobs ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);
   CREATE INDEX idx_audio_jobs_user_id ON audio_jobs(user_id);
   ```

3. Enforce ownership validation in all endpoints:
   ```python
   job = get_job(job_id)
   if job.user_id != request.user_id:
       return jsonify({'error': 'Unauthorized'}), 403
   ```

**Priority 2 (High - Implement before wider deployment):**
4. Implement rate limiting per user/API key:
   ```python
   from flask_limiter import Limiter
   limiter = Limiter(
       app=app,
       key_func=lambda: request.headers.get('X-API-Key'),
       default_limits=["100 per day", "10 per hour"]
   )
   ```

5. Add job quota limits:
   ```python
   user_job_count = count_jobs(user_id, created_after=today)
   if user_job_count >= MAX_JOBS_PER_DAY:
       return jsonify({'error': 'Job quota exceeded'}), 429
   ```

6. Implement storage cleanup for old/failed jobs:
   - Delete audio files after 7 days
   - Remove failed jobs after 30 days
   - Implement automatic cleanup scheduled task

**Priority 3 (Medium - Hardening):**
7. Restrict CORS to known origins instead of `CORS(app)`:
   ```python
   CORS(app, origins=['https://yourdomain.com', 'https://savethat.com'])
   ```

8. Implement comprehensive audit logging:
   - Log all API requests with user_id and timestamp
   - Track OpenAI API costs per user
   - Monitor for suspicious patterns (rapid job creation, UUID enumeration)

9. Consider OAuth 2.0 / JWT for production:
   - More secure token management
   - Better integration with external services
   - Support for delegated access

#### Impact Assessment

| Aspect | Impact | Severity |
|--------|--------|----------|
| Financial | Unlimited OpenAI credit consumption | CRITICAL |
| Privacy | Unauthorized access to user transcripts | CRITICAL |
| Availability | Storage exhaustion, queue overflow | HIGH |
| Reputation | Security breach, service abuse | HIGH |

#### Related Issues

- None yet (first security scan)

#### Notes

- This service appears to be designed as a microservice component for integration into larger SaaS applications
- Documentation mentions "embedding into external SaaS products" - may expect auth to be handled at API gateway level
- However, the service should NOT assume external auth layer - it should implement its own
- The lack of auth is appropriate for internal network deployment but NOT for public internet exposure

#### Date Discovered

2025-12-24

#### Date Resolved

Pending

#### Resolution Checklist

- [ ] API key authentication implemented
- [ ] Database schema updated with user_id
- [ ] Ownership validation on all endpoints
- [ ] Rate limiting configured
- [ ] Job quota limits enforced
- [ ] Storage cleanup implemented
- [ ] CORS restricted to allowed origins
- [ ] Audit logging implemented
- [ ] Security tests written
- [ ] Production deployment verified

---

## Resolved Findings

*(None yet)*

---

## False Positives (Investigated & Dismissed)

These were flagged during security review but determined to be false positives after detailed analysis.

### FP-2025-12-24-001: Command Injection in subprocess (DISMISSED)

**Category:** Command Injection
**Findings:** Subprocess call with user-controlled URL
**Status:** ✅ Dismissed (Confidence: 2/10)

**Reason:**
- Uses `subprocess.run()` with list-based arguments (not `shell=True`)
- URL validated against strict regex before subprocess call
- Shell metacharacters not interpreted due to `shell=False`
- No concrete exploit path exists

---

### FP-2025-12-24-002: Path Traversal in job_processor (DISMISSED)

**Category:** Path Traversal
**File:** `utils/job_processor.py:79-84`
**Status:** ✅ Dismissed (Confidence: 1/10)

**Reason:**
- `job_id` is server-generated UUID, not user-controlled input
- UUIDs cryptographically random and unguessable
- Uses `os.path.join()` correctly (not string concatenation)
- Per security guidelines: "UUIDs can be assumed to be unguessable and do not need to be validated"

---

### FP-2025-12-24-003: SSRF in transcription_service (DISMISSED)

**Category:** Server-Side Request Forgery
**File:** `utils/transcription_service.py:31-60`
**Status:** ✅ Dismissed (Confidence: 2/10)

**Reason:**
- `audio_url` is system-generated by upload process, not user-controlled
- URLs come from Supabase storage references or signed URLs
- No API endpoint allows direct URL injection
- No exploit path exists for attacker to control destination host/protocol

---

### FP-2025-12-24-004: SSRF in audio_processor (DISMISSED)

**Category:** Server-Side Request Forgery
**File:** `utils/audio_processor.py:79-122`
**Status:** ✅ Dismissed (Confidence: 2/10)

**Reason:**
- `video_url` extracted from yt-dlp metadata, not direct user input
- yt-dlp validates and sanitizes URLs from social media platforms
- Returns CDN URLs from legitimate platform CDNs only
- No path to inject arbitrary host/protocol

---

### FP-2025-12-24-005: Information Disclosure via Errors (DISMISSED)

**Category:** Data Exposure
**Files:** Multiple error handlers
**Status:** ✅ Dismissed (Confidence: 3/10)

**Reason:**
- Error messages do NOT expose API keys, credentials, or passwords
- Error messages do NOT contain PII or user data
- Only temporary file paths exposed (random, unpredictable)
- Per guidelines: "Logging non-PII data is not a vulnerability"

---

### FP-2025-12-24-006: Arbitrary File Write via ffmpeg (DISMISSED)

**Category:** Input Validation
**File:** `utils/audio_processor.py:184-192`
**Status:** ✅ Dismissed (Confidence: 1/10)

**Reason:**
- All file paths generated using `tempfile` module (cryptographically secure)
- Output paths use `tempfile.NamedTemporaryFile()` - random and unpredictable
- Operations confined to OS temporary directories with proper permissions
- No user input controls output path
- `-y` flag is safe when used with secure temp paths

---

## Methodology

### Scan Tool
- Manual security code review by senior security engineer
- Focus: HIGH and MEDIUM severity findings only
- False positive filtering applied per security review guidelines

### Scan Scope
- IG Downloader project (multi-platform audio processing service)
- Python backend code (Flask app, platform handlers, job processing)
- Database migrations and schema

### Exclusions
- Denial of Service vulnerabilities
- Secrets/credentials on disk (handled by separate process)
- Rate limiting issues
- Outdated third-party libraries
- Memory safety issues
- Log spoofing concerns
- Regex injection/DOS
- Documentation files (.md)

### Confidence Scoring
- 8.0-10.0: High confidence - actionable vulnerability
- 7.0-7.9: Medium-high confidence - likely exploitable
- 6.0-6.9: Medium confidence - needs investigation
- Below 6.0: Dismissed as false positive/noise

---

## Next Steps

1. **Review FINDING-2025-12-24-001** with team
2. **Prioritize authentication implementation** before wider deployment
3. **Schedule security testing** after fixes are implemented
4. **Update this log** after each security scan or fix

---

## File Statistics

- **Total Security Findings:** 1
- **HIGH Severity:** 1
- **MEDIUM Severity:** 0
- **LOW Severity:** 0
- **False Positives Investigated:** 6
- **Scan Confidence (average):** 9/10

---

**Last Security Scan:** 2025-12-24
**Next Recommended Scan:** After authentication implementation (FINDING-2025-12-24-001)
**Responsible Team:** Security Engineering
