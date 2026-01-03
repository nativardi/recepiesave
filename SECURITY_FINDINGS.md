# Security Findings Log

A centralized log of all security scan findings across the SaveIt Recipe App project. This document serves as a running TODO list for security issues discovered during development and code reviews.

**Last Updated:** 2025-12-30
**Total Findings:** 11 (4 Critical/High - Must Fix Now, 7 Medium/Low - Deferred)
**Resolved:** 0
**Pending Review:** 11

---

## Status Summary

| Priority | Count | Status |
|----------|-------|--------|
| Must-Fix-Now | 4 | Pending |
| Pre-Production | 7 | Deferred |
| Resolved | 0 | - |

---

## Finding Categories

### Must-Fix-Now (Development Blockers)
Issues that can cause immediate harm if services are exposed, even during development.

### Pre-Production (Deferred)
Important issues that are acceptable during isolated development but must be fixed before production.

---

## Must-Fix-Now Findings

### FINDING-2025-12-30-001

**Title:** Unauthenticated Flask APIs + Open CORS
**Severity:** CRITICAL
**Category:** Authentication & Authorization (CWE-306)
**Status:** Pending
**Priority:** Must-Fix-Now

#### Files Affected
- `extraction/app.py` (lines 62-331)
- `extraction/legacy_routes.py`

#### Description

All public API endpoints in the Flask service lack authentication:
- `POST /jobs/create` - Creates audio processing jobs
- `GET /jobs/<job_id>/status` - Retrieves job status
- `GET /jobs/<job_id>/result` - Retrieves complete job results
- `POST /api/v1/process` - SaveIt integration endpoint
- `GET /api/v1/jobs/<job_id>` - SaveIt integration endpoint
- `POST /download` - Legacy synchronous download

Additionally, CORS is configured to allow all origins: `CORS(app)`

#### Impact

1. **Financial**: Unlimited OpenAI API credit consumption (~$0.02/job)
2. **Privacy**: Unauthorized access to transcripts and analysis
3. **Availability**: Storage exhaustion, queue flooding

#### Evidence

```python
# extraction/app.py line 35
CORS(app)  # Enable CORS for frontend

# extraction/app.py lines 62-106
@app.route('/jobs/create', methods=['POST'])
def create_job_endpoint():
    # No authentication check
    ...
```

#### Recommendation

1. Add API key authentication decorator:
```python
from functools import wraps

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != os.environ.get('FLASK_API_KEY'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated
```

2. Apply to all endpoints:
```python
@app.route('/jobs/create', methods=['POST'])
@require_api_key
def create_job_endpoint():
    ...
```

3. Restrict CORS:
```python
CORS(app, origins=['http://localhost:3000', os.environ.get('ALLOWED_ORIGIN', '')])
```

#### Estimated Fix Time: 30-45 minutes

---

### FINDING-2025-12-30-002

**Title:** Flask Debug Mode on 0.0.0.0
**Severity:** HIGH
**Category:** Security Misconfiguration (CWE-489)
**Status:** Pending
**Priority:** Must-Fix-Now

#### Files Affected
- `extraction/app.py` (lines 334-337)

#### Description

Flask runs with `debug=True` and binds to all network interfaces (`host='0.0.0.0'`).

#### Impact

- Debug mode exposes Werkzeug interactive debugger
- Potential Remote Code Execution if debugger PIN is bypassed or leaked
- Stack traces and application internals exposed on errors

#### Evidence

```python
# extraction/app.py lines 334-337
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
```

#### Recommendation

```python
if __name__ == '__main__':
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    app.run(debug=debug, host=host, port=5001)
```

#### Estimated Fix Time: 5 minutes

---

### FINDING-2025-12-30-003

**Title:** Weak URL Validation - SSRF Risk
**Severity:** HIGH
**Category:** Server-Side Request Forgery (CWE-918)
**Status:** Pending
**Priority:** Must-Fix-Now

#### Files Affected
- `app/api/recipes/extract/route.ts` (lines 11-27)
- `extraction/utils/platform_detector.py`
- `extraction/utils/url_parser.py`

#### Description

URL validation uses string `includes()` checks instead of hostname allowlists, allowing bypass attacks.

#### Impact

- SSRF to internal services
- Cloud metadata access (AWS/GCP/Azure)
- Private network scanning

#### Evidence

```typescript
// app/api/recipes/extract/route.ts lines 14-15
if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) {
    return "tiktok";
}
```

#### Bypass Examples

```
https://tiktok.com@evil.com/video/123
https://evil.com/?url=tiktok.com
https://evil.tiktok.com.attacker.com/
```

#### Recommendation

Create a centralized URL validation utility:

```typescript
// lib/utils/url-validation.ts
const ALLOWED_HOSTS = new Set([
  'instagram.com', 'www.instagram.com',
  'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
  'youtube.com', 'www.youtube.com', 'youtu.be',
  'facebook.com', 'www.facebook.com', 'fb.watch'
]);

export function isAllowedVideoUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false; // Reject userinfo
    return ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
```

#### Estimated Fix Time: 1-2 hours

---

### FINDING-2025-12-30-004

**Title:** Verbose Error Messages
**Severity:** MEDIUM
**Category:** Information Exposure (CWE-209)
**Status:** Pending
**Priority:** Must-Fix-Now (Quick Win)

#### Files Affected
- `extraction/app.py` (multiple error handlers)
- `extraction/legacy_routes.py`

#### Description

Exception details are returned directly to clients via `str(e)`.

#### Evidence

```python
# extraction/app.py line 106
return jsonify({'error': str(e)}), 500
```

#### Recommendation

```python
except Exception as e:
    logger.error(f"Failed to create job: {e}", exc_info=True)
    return jsonify({'error': 'An internal error occurred. Please try again.'}), 500
```

#### Estimated Fix Time: 15 minutes

---

## Pre-Production Findings (Deferred)

### FINDING-2025-12-30-005

**Title:** Missing Rate Limiting
**Severity:** MEDIUM
**Category:** Denial of Service (CWE-770)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `extraction/app.py`
- `app/api/recipes/extract/route.ts`

#### Description

No rate limiting on job creation endpoints allows resource exhaustion attacks.

#### Recommendation

Add Flask-Limiter:
```python
from flask_limiter import Limiter
limiter = Limiter(app=app, key_func=lambda: request.headers.get('X-API-Key'))

@app.route('/jobs/create', methods=['POST'])
@limiter.limit("10 per hour")
@require_api_key
def create_job_endpoint():
    ...
```

---

### FINDING-2025-12-30-006

**Title:** Redis Without Authentication
**Severity:** MEDIUM
**Category:** Missing Authentication (CWE-306)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `lib/extraction/queue.ts` (line 11)
- `recipe-extraction/config.py`
- `extraction/utils/config.py`

#### Description

Redis defaults to `redis://localhost:6379` without password or TLS.

#### Evidence

```typescript
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
```

#### Recommendation

For production, require authenticated Redis:
- Use password in URL: `redis://:password@host:port/0`
- Use TLS: `rediss://...`
- Fail closed if no auth on non-localhost connections

---

### FINDING-2025-12-30-007

**Title:** Public Thumbnails Bucket
**Severity:** LOW
**Category:** Data Exposure (CWE-359)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `supabase/migrations/003_storage_buckets.sql`
- `recipe-extraction/recipe_processor.py`

#### Description

Thumbnails bucket is publicly readable. URLs are predictable.

#### Recommendation

Evaluate if thumbnails need privacy. If yes, switch to signed URLs.

---

### FINDING-2025-12-30-008

**Title:** RLS-Only Access Control on Status Route
**Severity:** LOW
**Category:** Authorization Bypass (CWE-863)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `app/api/recipes/[id]/status/route.ts`

#### Description

Status route relies solely on Supabase RLS without explicit user verification.

#### Recommendation

Add explicit user check:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const { data } = await supabase
  .from('recipes')
  .select('status')
  .eq('id', recipeId)
  .eq('user_id', user.id)  // Explicit ownership check
  .single();
```

---

### FINDING-2025-12-30-009

**Title:** Unbounded Download Sizes
**Severity:** MEDIUM
**Category:** Resource Consumption (CWE-770)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `extraction/utils/audio_processor.py`
- `extraction/utils/transcription_service.py`

#### Description

Video/audio downloads have no size limits, enabling DoS via large files.

#### Recommendation

- Check Content-Length header before download
- Set max file size (e.g., 100MB)
- Stream to temp files with hard limits
- Use yt-dlp `--max-filesize` option

---

### FINDING-2025-12-30-010

**Title:** SECURITY DEFINER Without search_path
**Severity:** LOW
**Category:** SQL Injection (CWE-89)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `supabase/migrations/001_initial_schema.sql`

#### Description

`handle_new_user()` function is SECURITY DEFINER but doesn't set `search_path`.

#### Recommendation

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ...
END;
$$;
```

---

### FINDING-2025-12-30-011

**Title:** Service Role Key in Logs
**Severity:** LOW
**Category:** Sensitive Data Exposure (CWE-532)
**Status:** Deferred (Pre-Production)
**Priority:** Pre-Production

#### Files Affected
- `extraction/test_supabase_connection.py`

#### Description

Test script prints part of the service role key.

#### Recommendation

Remove or mask key logging completely.

---

## Resolved Findings

*(None yet)*

---

## False Positives (Investigated & Dismissed)

### FP-2025-12-24-001: Command Injection in subprocess (DISMISSED)

**Status:** Dismissed (Confidence: 2/10)
**Reason:** Uses `subprocess.run()` with list arguments (not `shell=True`). URL validated before use.

### FP-2025-12-24-002: Path Traversal in job_processor (DISMISSED)

**Status:** Dismissed (Confidence: 1/10)
**Reason:** `job_id` is server-generated UUID. Uses `os.path.join()` correctly.

### FP-2025-12-24-003: SSRF in transcription_service (DISMISSED)

**Status:** Dismissed (Confidence: 2/10)
**Reason:** `audio_url` is system-generated from Supabase storage, not user-controlled.

### FP-2025-12-24-004: SSRF in audio_processor (DISMISSED)

**Status:** Dismissed (Confidence: 2/10)
**Reason:** `video_url` extracted from yt-dlp metadata, not direct user input.

### FP-2025-12-24-005: Information Disclosure via Errors (DISMISSED)

**Status:** Dismissed (Confidence: 3/10)
**Reason:** Errors don't expose secrets or PII. Only temp file paths.

### FP-2025-12-24-006: Arbitrary File Write via ffmpeg (DISMISSED)

**Status:** Dismissed (Confidence: 1/10)
**Reason:** All paths use `tempfile` module. No user control over output paths.

---

## Methodology

### Scan Tool
- Manual security code review
- Focus: Authentication, Authorization, Input Validation, SSRF, Configuration

### Scan Scope
- Next.js application and API routes
- Flask service (IG Downloader)
- Python recipe extraction worker
- Supabase schema and RLS policies
- Redis queue configuration

### Prioritization Criteria

**Must-Fix-Now:**
- Can cause immediate harm if services exposed
- Low effort to fix (<1 hour)
- High impact (financial, RCE, data exposure)

**Pre-Production:**
- Important but not immediately exploitable
- Acceptable during isolated development
- Required before real users access system

---

## Resolution Checklist (Must-Fix-Now)

- [ ] SEC-001: API key authentication on Flask
- [ ] SEC-001: CORS restriction
- [ ] SEC-002: Flask debug mode fix
- [ ] SEC-002: Bind to localhost by default
- [ ] SEC-003: URL validation helper (TypeScript)
- [ ] SEC-003: URL validation in Python
- [ ] SEC-004: Sanitize error messages

---

## Next Steps

1. **Implement Must-Fix-Now items** (2-3 hours total)
2. **Document fixes in this log**
3. **Schedule Pre-Production fixes** before any deployment
4. **Re-audit after fixes** to verify remediations

---

## Related Documentation

- [Docs/SECURITY.md](./Docs/SECURITY.md) - Full security documentation
- [Docs/SECURITY_CHECKLIST.md](./Docs/SECURITY_CHECKLIST.md) - Actionable checklist

---

**Last Security Audit:** 2025-12-30
**Next Recommended Audit:** After Must-Fix-Now items resolved
