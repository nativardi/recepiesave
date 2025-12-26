# Phase 4: Audio Pipeline Integration - Documentation Index

**Status:** Planning Complete ✅ | Implementation Pending
**Date:** 2025-12-26

---

## Quick Start

This is the comprehensive guide to integrating the audio processing pipeline with RecipeSave.

### What You Need to Know

1. **Phases 1-3 are complete** - The app is fully functional with mock data
2. **The integration approach has been decided** - Wrapper/Adapter pattern
3. **IG Downloader stays pristine** - Never modified, always reusable
4. **Recipe logic is custom** - Built in `recipe-extraction/` folder
5. **Database schema requires no changes** - Already supports everything we need

---

## Documentation Files

### Primary Reference

📘 **[AUDIO_PIPELINE_INTEGRATION_PLAN.md](./AUDIO_PIPELINE_INTEGRATION_PLAN.md)**

**This is the main document.** It contains:
- Architecture decision (Wrapper/Adapter pattern)
- Complete project structure
- Database schema review (no changes needed)
- Phase 0: Pre-Integration Setup (2 hours)
- Phase 4: Integration Implementation (10-12 hours)
- Testing strategy
- Deployment guide
- Future maintenance procedures

### Supporting Documents

📊 **[AUDIO_PIPELINE_ASSESSMENT.md](./AUDIO_PIPELINE_ASSESSMENT.md)**

Historical assessment that led to the final decision. Shows:
- Initial analysis of IG Downloader
- Why we chose Wrapper/Adapter pattern
- Rejected alternatives and why

📋 **[TECHNICAL_STRATEGY.md](../TECHNICAL_STRATEGY.md)**

Original architecture document. Includes:
- Git Subtree strategy
- Full project structure
- Screen-by-screen build approach
- Component library philosophy

📝 **[IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)**

Overall project plan. Now updated to reflect Phase 4 status.

---

## Key Decisions

### Decision 1: Wrapper/Adapter Pattern

**Why:** IG Downloader must remain general-purpose for use in other projects.

**Solution:**
- Import IG Downloader via Git Subtree (never modify it)
- Create `recipe-extraction/` service that wraps IG Downloader
- Reuse 90% of IG Downloader (platform handlers, transcription, audio extraction)
- Build only recipe-specific AI analysis as custom code

### Decision 2: Single Database

**Database:** Single Supabase project for both frontend and extraction service

**Tables:** Use existing RecipeSave schema (recipes, ingredients, instructions)

**Storage:** Two buckets needed:
- `recipe-thumbnails` (public)
- `recipe-audio` (private, temporary)

### Decision 3: No Schema Changes

**Confirmed:** The existing database schema supports all recipe extraction requirements.

**No changes needed to:**
- recipes table (already has prep_time, cook_time, cuisine, etc.)
- ingredients table (already has quantity, unit, item parsing)
- instructions table (already has step_number and text)

---

## Project Structure After Integration

```
RecipeSave/
├── extraction/              # IG Downloader (Git Subtree - PRISTINE)
│   └── utils/               # Reused utilities
│       ├── platform_router.py
│       ├── audio_processor.py
│       ├── transcription_service.py
│       └── supabase_client.py
│
├── recipe-extraction/       # RecipeSave-specific (NEW)
│   ├── recipe_worker.py     # RQ worker
│   ├── recipe_processor.py  # Main orchestration
│   ├── recipe_analyzer.py   # Recipe AI extraction
│   └── data_mapper.py       # Schema mapping
│
├── app/api/recipes/extract/ # Next.js API route
└── lib/extraction/queue.ts  # Redis queue bridge
```

---

## What Gets Reused vs Built

### ✅ Reused from IG Downloader

- Platform handlers (Instagram, TikTok, YouTube, Facebook)
- Video downloading
- Audio extraction (FFmpeg)
- Transcription (OpenAI Whisper)
- Supabase upload utilities

### 🎯 Built Custom for RecipeSave

- Recipe analyzer (GPT-4o-mini with recipe-specific prompts)
- Ingredient parsing (quantity, unit, item)
- Instruction extraction (step-by-step)
- Direct database writes (recipes, ingredients, instructions)

---

## Implementation Timeline

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| **Phase 0** | Setup | 2h | Not started |
| - Git Subtree import | | 30m | |
| - Create directory structure | | 15m | |
| - Documentation | | 30m | |
| - Docker Compose for Redis | | 15m | |
| - Environment variables | | 10m | |
| - Verify dependencies | | 15m | |
| **Phase 4** | Implementation | 10-12h | Not started |
| - Recipe analyzer | | 4h | |
| - Data mapper | | 1h | |
| - Recipe processor | | 3h | |
| - Configuration | | 30m | |
| - RQ worker | | 1h | |
| - Next.js API routes | | 2h | |
| - Update frontend | | 1h | |
| - Setup Supabase | | 1h | |
| - Install dependencies | | 30m | |
| **Total** | | **12-14h** | |

---

## Testing Checklist

Before marking Phase 4 complete, verify:

- [ ] Git Subtree import successful
- [ ] IG Downloader utilities importable
- [ ] Recipe analyzer extracts ingredients correctly
- [ ] Recipe analyzer extracts instructions correctly
- [ ] Data mapper converts to database schema
- [ ] RQ worker processes jobs
- [ ] Next.js API creates recipe record
- [ ] Redis queue receives jobs
- [ ] Full pipeline works end-to-end (URL → recipe in database)
- [ ] Error handling works (failed jobs, invalid URLs)
- [ ] Dev mode still works (mock data)
- [ ] Production mode uses real extraction
- [ ] Status updates correctly (pending → analyzing → completed)
- [ ] Instagram Reels work
- [ ] TikTok videos work
- [ ] YouTube Shorts work
- [ ] Thumbnails display correctly
- [ ] Ingredients parsed with quantity/unit
- [ ] Instructions numbered sequentially

---

## When to Start Implementation

**Prerequisites:**
- [ ] Phases 1-3 are complete (✅ DONE)
- [ ] Decision on deployment platform (Railway, Render, Vercel+Worker, etc.)
- [ ] Supabase project created (or use existing)
- [ ] OpenAI API key obtained
- [ ] Redis accessible (local Docker or Upstash)

**Ready to proceed when:**
- All prerequisites met
- Time allocated (12-14 hours)
- Clear on which deployment platform to target

---

## Support & References

### Main Documentation

Start here: [AUDIO_PIPELINE_INTEGRATION_PLAN.md](./AUDIO_PIPELINE_INTEGRATION_PLAN.md)

### Questions?

Check the plan document sections:
- "Architecture Decision" - Why we chose this approach
- "Database Schema Review" - Confirms no changes needed
- "Phase 0" - Setup steps
- "Phase 4" - Implementation steps
- "Testing Strategy" - How to verify it works
- "Deployment Guide" - How to deploy

### External References

- [IG Downloader (Reel-Downloader)](https://github.com/nativardi/Reel-Downloader)
- [Git Subtree Documentation](https://www.atlassian.com/git/tutorials/git-subtree)
- [RQ (Redis Queue)](https://python-rq.org/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4o-mini](https://platform.openai.com/docs/models/gpt-4o-mini)

---

## Summary

✅ **Planning is complete**
✅ **Architecture is decided**
✅ **Database schema confirmed (no changes)**
✅ **Step-by-step plan documented**
✅ **Ready for implementation when you are**

The integration is designed to:
- Keep IG Downloader pristine and reusable
- Maximize code reuse (90% of video processing)
- Isolate recipe-specific logic cleanly
- Support future upgrades to IG Downloader
- Use a single Supabase database
- Work alongside existing mock mode

**Next step:** When ready, begin Phase 0 (Setup) following the detailed steps in [AUDIO_PIPELINE_INTEGRATION_PLAN.md](./AUDIO_PIPELINE_INTEGRATION_PLAN.md).
