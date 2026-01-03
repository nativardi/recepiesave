# Security Checklist

**SaveIt: Recipe Edition**
**Purpose:** Actionable security checklist for pre-production hardening
**Last Updated:** 2025-12-30

---

## How to Use This Checklist

This checklist is organized by **when** each item should be addressed:

1. **Must-Fix-Now** - Before exposing any service (ngrok, deploy, shared env)
2. **Pre-Production** - Before any real users access the system
3. **Production Hardening** - Before public launch
4. **Ongoing** - Continuous security maintenance

Check off items as you complete them. Each item includes:
- Brief description
- File(s) affected
- Estimated effort

---

## Must-Fix-Now

Critical items that prevent immediate exploitation if services are exposed.

### Flask Service Authentication

- [ ] **Add API key authentication to Flask endpoints**
  - Files: `extraction/app.py`
  - Effort: 30 minutes
  - Details: Add `@require_api_key` decorator to all `/jobs/*` and `/api/v1/*` endpoints
  - Environment variable: `FLASK_API_KEY`

### Flask Debug Mode

- [ ] **Disable debug mode by default**
  - Files: `extraction/app.py`
  - Effort: 5 minutes
  - Details: Change `debug=True` to `debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'`

- [ ] **Bind to localhost by default**
  - Files: `extraction/app.py`
  - Effort: 5 minutes
  - Details: Change `host='0.0.0.0'` to `host=os.environ.get('FLASK_HOST', '127.0.0.1')`

### CORS Configuration

- [ ] **Restrict CORS to known origins**
  - Files: `extraction/app.py`
  - Effort: 10 minutes
  - Details: Replace `CORS(app)` with allowlist of trusted origins

### URL Validation (SSRF Prevention)

- [ ] **Create centralized URL validation helper**
  - Files: New `lib/utils/url-validation.ts`
  - Effort: 30 minutes
  - Details: Hostname allowlist, scheme validation, userinfo rejection

- [ ] **Apply URL validation in Next.js API**
  - Files: `app/api/recipes/extract/route.ts`
  - Effort: 15 minutes
  - Details: Replace `url.includes()` with `isAllowedVideoUrl()`

- [ ] **Apply URL validation in Python platform detector**
  - Files: `extraction/utils/platform_detector.py`
  - Effort: 30 minutes
  - Details: Use `urllib.parse` and hostname matching

---

## Pre-Production

Important items to address before any real users access the system.

### Rate Limiting

- [ ] **Add rate limiting to Flask endpoints**
  - Files: `extraction/app.py`
  - Effort: 1 hour
  - Details: Install `flask-limiter`, configure per-endpoint limits
  - Suggested limits: 10 jobs/hour per API key, 100 jobs/day

- [ ] **Add rate limiting to Next.js API routes**
  - Files: `app/api/recipes/extract/route.ts`
  - Effort: 1 hour
  - Details: Use Vercel rate limiting or implement custom solution

### Redis Security

- [ ] **Require Redis authentication in production**
  - Files: `lib/extraction/queue.ts`, `recipe-extraction/config.py`
  - Effort: 30 minutes
  - Details: Parse password from `REDIS_URL`, fail if no auth on non-localhost

- [ ] **Use TLS for Redis connections**
  - Files: Same as above
  - Effort: 15 minutes
  - Details: Support `rediss://` URL scheme

### Error Handling

- [ ] **Sanitize error responses in Flask**
  - Files: `extraction/app.py`, `extraction/legacy_routes.py`
  - Effort: 30 minutes
  - Details: Replace `str(e)` with generic error messages, log details server-side

### Access Control

- [ ] **Add explicit user ownership check in status route**
  - Files: `app/api/recipes/[id]/status/route.ts`
  - Effort: 15 minutes
  - Details: Call `supabase.auth.getUser()` and filter by `user_id`

### Download Limits

- [ ] **Enforce max file size for video downloads**
  - Files: `extraction/utils/audio_processor.py`
  - Effort: 45 minutes
  - Details: Check Content-Length before download, abort if exceeds limit

- [ ] **Add processing timeout limits**
  - Files: `extraction/utils/job_processor.py`
  - Effort: 30 minutes
  - Details: Add timeout wrapper around processing functions

---

## Production Hardening

Items to complete before public launch.

### Security Headers

- [ ] **Add security headers to Next.js**
  - Files: `next.config.js`
  - Effort: 30 minutes
  - Headers to add:
    - Content-Security-Policy
    - Strict-Transport-Security
    - X-Frame-Options
    - X-Content-Type-Options
    - Referrer-Policy

### Storage Security

- [ ] **Review thumbnail bucket permissions**
  - Files: `supabase/migrations/003_storage_buckets.sql`
  - Effort: 30 minutes
  - Decision: Keep public or switch to signed URLs

- [ ] **Implement signed URLs if needed**
  - Files: `recipe-extraction/recipe_processor.py`
  - Effort: 1 hour
  - Details: Generate time-limited signed URLs for access

### Database Hardening

- [ ] **Add search_path to SECURITY DEFINER function**
  - Files: `supabase/migrations/001_initial_schema.sql`
  - Effort: 15 minutes
  - Details: Add `SET search_path = public` to `handle_new_user()`

- [ ] **Review and audit RLS policies**
  - Files: `supabase/migrations/002_rls_policies.sql`
  - Effort: 1 hour
  - Details: Verify all tables have appropriate RLS, test edge cases

### SSRF Hardening

- [ ] **Block private IP ranges after DNS resolution**
  - Files: `extraction/utils/audio_processor.py`
  - Effort: 2 hours
  - Details: Resolve hostname, check against private IP blocklist before request

### Monitoring & Logging

- [ ] **Implement audit logging for job creation**
  - Files: `extraction/app.py`, `recipe-extraction/recipe_worker.py`
  - Effort: 2 hours
  - Details: Log user_id, timestamp, URL for each job

- [ ] **Set up monitoring for abuse patterns**
  - Effort: 2-4 hours
  - Details: Alert on rapid job creation, unusual URLs, error spikes

### Secret Management

- [ ] **Remove any logged credentials**
  - Files: `extraction/test_supabase_connection.py`
  - Effort: 15 minutes
  - Details: Remove key printing, use proper secret masking

- [ ] **Verify no secrets in version control**
  - Effort: 30 minutes
  - Details: Check `.gitignore`, scan history if needed

---

## Ongoing Security

Continuous security maintenance tasks.

### Regular Tasks

- [ ] **Weekly: Review dependency updates**
  - Run `npm audit` and `pip check`
  - Update packages with known vulnerabilities

- [ ] **Monthly: Review access logs**
  - Check for unusual patterns
  - Verify no unauthorized access attempts

- [ ] **Quarterly: Security review**
  - Re-run security audit
  - Review this checklist for new items

### Incident Response

- [ ] **Document incident response process**
  - Who to contact
  - How to disable compromised services
  - Communication plan

- [ ] **Test backup and recovery**
  - Verify database backups work
  - Test restoration process

---

## Quick Reference: Environment Variables

Security-related environment variables needed for production:

```bash
# Flask Security
FLASK_API_KEY=<strong-random-key>
FLASK_DEBUG=false
FLASK_HOST=127.0.0.1  # or 0.0.0.0 behind reverse proxy
ALLOWED_ORIGIN=https://your-domain.com

# Redis Security
REDIS_URL=rediss://:password@host:port/0

# Supabase (existing)
SUPABASE_SERVICE_ROLE_KEY=<keep-secret>

# OpenAI (existing)
OPENAI_API_KEY=<keep-secret>
```

---

## Progress Tracking

### Status Summary

| Category | Total | Completed | Percentage |
|----------|-------|-----------|------------|
| Must-Fix-Now | 7 | 0 | 0% |
| Pre-Production | 8 | 0 | 0% |
| Production Hardening | 9 | 0 | 0% |
| Ongoing | 4 | 0 | 0% |
| **Total** | **28** | **0** | **0%** |

### Last Updated

- **Date:** 2025-12-30
- **Updated by:** Security Audit
- **Next Review:** Before production deployment

---

## References

- [SECURITY.md](./SECURITY.md) - Full security documentation
- [SECURITY_FINDINGS.md](../SECURITY_FINDINGS.md) - Detailed findings log
