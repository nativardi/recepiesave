# Security Documentation

**SaveIt: Recipe Edition**
**Last Updated:** 2025-12-30
**Status:** Early Development (Not Production-Ready)

---

## Table of Contents

1. [Security Posture Overview](#security-posture-overview)
2. [Attack Surface Analysis](#attack-surface-analysis)
3. [Threat Model](#threat-model)
4. [Security Findings Summary](#security-findings-summary)
5. [Development Security Guidelines](#development-security-guidelines)
6. [Pre-Production Roadmap](#pre-production-roadmap)

---

## Security Posture Overview

### Current Development Phase

This application is in **early-stage development**. The current security posture prioritizes:

1. **Development velocity** - Fast iteration and minimal friction
2. **Security awareness** - Understanding risks without over-engineering
3. **Documented technical debt** - Clear record of deferred security work
4. **Progressive hardening** - Security improvements aligned with production readiness

### Architecture Security Context

```
┌─────────────────────────────────────────────────────────────────┐
│                     ATTACK SURFACE DIAGRAM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Internet]                                                      │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────┐     ┌─────────────────┐                   │
│  │   Next.js App    │────▶│    Supabase     │                   │
│  │   (Vercel/local) │     │   (PostgreSQL)  │                   │
│  │                  │     │   + Auth + RLS  │                   │
│  │ Auth: Supabase ✓ │     └─────────────────┘                   │
│  │ RLS Protected  ✓ │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           │ Redis Queue                                          │
│           ▼                                                      │
│  ┌──────────────────┐     ┌─────────────────┐                   │
│  │   Flask Service  │────▶│  External APIs  │                   │
│  │  (IG Downloader) │     │ (OpenAI, CDNs)  │                   │
│  │                  │     └─────────────────┘                   │
│  │ Auth: NONE ✗     │                                           │
│  │ CORS: Open ✗     │                                           │
│  │ Debug: On  ✗     │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mode-Based Security

| Mode | Data Layer | External Services | Security Posture |
|------|------------|-------------------|------------------|
| **Dev Mode** (`NEXT_PUBLIC_DEV_MODE=true`) | MockDataStore (localStorage) | None | Low risk - isolated |
| **Production Mode** | Supabase + Redis + Python | OpenAI, Social CDNs | Higher risk - full pipeline |

---

## Attack Surface Analysis

### Next.js Application (Low Risk)

**Location:** `app/`, `lib/`, `components/`

| Component | Authentication | Authorization | Notes |
|-----------|---------------|---------------|-------|
| Public pages | N/A | N/A | Landing page only |
| Auth pages | Supabase Auth | N/A | Standard OAuth/email |
| App pages | Required | RLS | Protected by Supabase |
| API routes | Supabase JWT | RLS | Server-side validation |

**Strengths:**
- Supabase handles authentication properly
- Row-Level Security (RLS) enforces data isolation
- API routes verify user sessions server-side

**Weaknesses:**
- URL validation uses string `includes()` instead of hostname allowlist
- No explicit user ownership check in status route (relies on RLS)
- No rate limiting on API endpoints

### Flask Service (High Risk)

**Location:** `extraction/app.py`, `extraction/legacy_routes.py`

| Endpoint | Authentication | Rate Limit | Notes |
|----------|---------------|------------|-------|
| `POST /jobs/create` | None | None | Creates processing jobs |
| `GET /jobs/<id>/status` | None | None | Returns job status |
| `GET /jobs/<id>/result` | None | None | Returns transcripts/analysis |
| `POST /api/v1/process` | None | None | SaveIt integration |
| `GET /api/v1/jobs/<id>` | None | None | SaveIt integration |
| `POST /download` (legacy) | None | None | Synchronous download |

**Critical Issues:**
1. **No authentication** - Any network-reachable client can use all endpoints
2. **Open CORS** - `CORS(app)` allows all origins
3. **Debug mode** - `debug=True` with RCE potential via debugger
4. **Bound to 0.0.0.0** - Listens on all interfaces

**Exploitation Scenario:**
```python
# If Flask is reachable (ngrok, cloud dev, shared network):
for i in range(10000):
    requests.post('http://exposed:5001/jobs/create',
                  json={'url': 'https://instagram.com/reel/xxx'})
# Result: $210+ in OpenAI API costs, storage exhaustion
```

### Redis Queue (Medium Risk)

**Location:** `lib/extraction/queue.ts`, `recipe-extraction/config.py`

| Configuration | Current | Recommended |
|--------------|---------|-------------|
| URL | `redis://localhost:6379` | Environment variable |
| Authentication | None | Password required |
| TLS | No | Required in production |

**Risk:** If Redis is network-reachable without auth, attackers can:
- Inject malicious jobs
- Read job data (including URLs, user IDs)
- Flush/corrupt the queue

### External URL Fetching (Medium Risk)

**Location:** `app/api/recipes/extract/route.ts`, `extraction/utils/`

The pipeline fetches URLs from user input, creating SSRF potential:

```typescript
// Current validation (weak):
if (url.includes("instagram.com")) return "instagram";

// Bypasses:
// https://instagram.com@evil.com/reel/xxx
// https://evil.com/?redirect=instagram.com
```

**SSRF Risks:**
- Internal service scanning
- Cloud metadata access (169.254.169.254)
- Private network resource access

---

## Threat Model

### Threat Actors

| Actor | Motivation | Capability | Relevance |
|-------|-----------|------------|-----------|
| Script kiddie | Mischief, testing | Low | Dev environment exposure |
| Opportunistic attacker | Resource abuse | Medium | API credit theft |
| Curious developer | Data access | Low | Shared dev environments |

### Attack Scenarios (Prioritized)

#### 1. Resource Abuse via Unauthenticated Flask APIs

**Likelihood:** High (if exposed)
**Impact:** Critical (financial, availability)
**Vector:** Direct API calls to `/jobs/create`

**Mitigation:**
- [ ] Add API key authentication (must-fix-now)
- [ ] Restrict CORS origins (must-fix-now)
- [ ] Add rate limiting (pre-production)

#### 2. Remote Code Execution via Flask Debug

**Likelihood:** Medium (requires exposure + interaction)
**Impact:** Critical (full server compromise)
**Vector:** Werkzeug debugger PIN bypass

**Mitigation:**
- [ ] Disable debug mode by default (must-fix-now)
- [ ] Bind to 127.0.0.1 unless explicitly configured (must-fix-now)

#### 3. SSRF via URL Processing

**Likelihood:** Low-Medium
**Impact:** Medium (internal network access)
**Vector:** Crafted URLs bypassing validation

**Mitigation:**
- [ ] Implement strict hostname allowlist (must-fix-now)
- [ ] Validate URL scheme (https only)
- [ ] Block private IP ranges after DNS resolution (pre-production)

#### 4. Data Exposure via Job ID Enumeration

**Likelihood:** Low (UUIDs are hard to guess)
**Impact:** Medium (transcript/analysis access)
**Vector:** Systematic UUID generation

**Mitigation:**
- [ ] Add ownership validation on job retrieval (pre-production)
- [ ] Consider signed job IDs (future)

---

## Security Findings Summary

### Must-Fix-Now (Even in Development)

These issues can cause immediate harm if services are exposed:

| ID | Finding | Severity | Effort | Status |
|----|---------|----------|--------|--------|
| SEC-001 | Unauthenticated Flask APIs | Critical | 30 min | Pending |
| SEC-002 | Flask debug mode on 0.0.0.0 | High | 5 min | Pending |
| SEC-003 | Open CORS configuration | High | 10 min | Pending |
| SEC-004 | Weak URL validation (SSRF) | High | 1-2 hours | Pending |

### Safe to Defer (Pre-Production)

These are important but acceptable during isolated development:

| ID | Finding | Severity | Status |
|----|---------|----------|--------|
| SEC-005 | No rate limiting | Medium | Deferred |
| SEC-006 | Redis without auth | Medium | Deferred |
| SEC-007 | Public thumbnails bucket | Low | Deferred |
| SEC-008 | Verbose error messages | Low | Deferred |
| SEC-009 | Unbounded download sizes | Medium | Deferred |
| SEC-010 | SECURITY DEFINER without search_path | Low | Deferred |
| SEC-011 | RLS-only access control on status route | Low | Deferred |

### Detailed Findings

See [SECURITY_FINDINGS.md](../SECURITY_FINDINGS.md) for the complete security findings log with:
- Full descriptions and evidence
- Exploitation scenarios
- Recommended fixes
- Resolution checklists

---

## Development Security Guidelines

### For Day-to-Day Development

1. **Dev Mode is Safe**
   - `NEXT_PUBLIC_DEV_MODE=true` uses MockDataStore (localStorage)
   - No external services, no network exposure risk
   - Ideal for UI development and testing

2. **Production Mode Requires Caution**
   - Never expose Flask service to the internet without auth
   - Use `localhost` Redis in development
   - Be careful with ngrok/tunnels - they expose everything

3. **URL Handling**
   - Always validate URLs before processing
   - Use hostname allowlists, not string matching
   - Consider SSRF when adding new URL-based features

4. **Error Handling**
   - Log detailed errors server-side
   - Return generic messages to clients
   - Never expose stack traces in production

### Secure Development Checklist

Before committing code that handles:

- [ ] **User input**: Validated and sanitized?
- [ ] **URLs**: Hostname allowlist applied?
- [ ] **Database queries**: Using parameterized queries/ORM?
- [ ] **Authentication**: User session verified?
- [ ] **Authorization**: Ownership/permissions checked?
- [ ] **Secrets**: Not hardcoded or logged?

---

## Pre-Production Roadmap

### Phase 1: Quick Security Wins (Before Any Exposure)

**Estimated Time:** 2-3 hours

1. **Flask API Key Authentication**
   ```python
   # Add to extraction/app.py
   def require_api_key(f):
       @wraps(f)
       def decorated(*args, **kwargs):
           api_key = request.headers.get('X-API-Key')
           if api_key != os.environ.get('FLASK_API_KEY'):
               return jsonify({'error': 'Unauthorized'}), 401
           return f(*args, **kwargs)
       return decorated
   ```

2. **Flask Debug Mode Fix**
   ```python
   # Change extraction/app.py bottom
   if __name__ == '__main__':
       debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
       host = '127.0.0.1' if not debug else os.environ.get('FLASK_HOST', '127.0.0.1')
       app.run(debug=debug, host=host, port=5001)
   ```

3. **CORS Restriction**
   ```python
   # Replace CORS(app) with:
   CORS(app, origins=[
       'http://localhost:3000',
       'http://127.0.0.1:3000',
       os.environ.get('ALLOWED_ORIGIN', '')
   ])
   ```

4. **URL Validation Helper**
   ```typescript
   // lib/utils/url-validation.ts
   const ALLOWED_HOSTS = ['instagram.com', 'www.instagram.com',
                          'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
                          'youtube.com', 'www.youtube.com', 'youtu.be',
                          'facebook.com', 'www.facebook.com', 'fb.watch'];

   export function isAllowedVideoUrl(urlString: string): boolean {
     try {
       const url = new URL(urlString);
       if (url.protocol !== 'https:') return false;
       if (url.username || url.password) return false;
       return ALLOWED_HOSTS.includes(url.hostname);
     } catch {
       return false;
     }
   }
   ```

### Phase 2: Production Hardening (Before Launch)

**Estimated Time:** 4-6 hours

1. **Rate Limiting**
   - Add Flask-Limiter to Python service
   - Consider API gateway rate limiting
   - Implement per-user quotas

2. **Redis Security**
   - Require password in production
   - Use TLS (`rediss://`)
   - Firewall to private network only

3. **Security Headers**
   - Add CSP, HSTS, X-Frame-Options to Next.js
   - Configure via `next.config.js` headers

4. **Storage Security**
   - Make thumbnails bucket private if needed
   - Implement signed URLs for access

5. **Download Size Limits**
   - Enforce max file size in video downloads
   - Add timeout limits on processing

6. **Audit Logging**
   - Log all job creation with user context
   - Monitor for abuse patterns

### Phase 3: Ongoing Security (Post-Launch)

- Regular dependency updates
- Periodic security reviews
- Monitoring and alerting
- Incident response planning

---

## References

- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) - Actionable pre-production checklist
- [SECURITY_FINDINGS.md](../SECURITY_FINDINGS.md) - Detailed findings log
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-30 | Security Audit | Initial comprehensive security documentation |
