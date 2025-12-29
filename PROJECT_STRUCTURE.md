# SaveIt Recipe App - Project Structure

## 🎯 Purpose of This File

**This is a quick reference and navigation guide.** Use it to:
- Understand where things are in the project
- Get current status at a glance
- Find which documentation to read next
- Understand the overall structure

⚠️ **For detailed implementation tasks**, refer to **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — that's the source of truth for what to build.

---

## 📋 When Claude Should Use This File

| Scenario | What to Do |
|----------|-----------|
| "Where should I find X component?" | Search the directory structure below |
| "What phase are we in?" | Check "Current Implementation Status" |
| "Which docs should I read?" | Check "Root Documentation Files" |
| "What's the exact task I need to do?" | Go to **IMPLEMENTATION_PLAN.md** instead |
| "How should I architecture this?" | Go to **TECHNICAL_STRATEGY.md** instead |

---

## 📁 Project Organization

### Root Documentation Files

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - ⭐ **CURRENT ACTIVE PLAN**
  Database-free implementation approach with phases 1-4. This is the source of truth for development.

- **[README.md](./README.md)** - Project overview and quick start guide

- **[TECHNICAL_STRATEGY.md](./TECHNICAL_STRATEGY.md)** - Technical architecture and design decisions

### Documentation Directory (`/Docs`)

#### Active Documentation
- **[PRD.md](./Docs/PRD.md)** - Product Requirements Document
- **[UI_UX_Map.md](./Docs/UI_UX_Map.md)** - User interface mapping
- **[User_Interface_Design_Document.md](./Docs/User_Interface_Design_Document.md)** - Detailed UI specifications
- **[Master_UI_Generation_Spec.md](./Docs/Master_UI_Generation_Spec.md)** - UI generation guidelines
- **[Database_Schema.md](./Docs/Database_Schema.md)** - Database schema design (for future Supabase integration)

#### Implementation References
- **[Schema_Review_Changes.md](./Docs/Schema_Review_Changes.md)** - Schema review and modifications
- **[Migration_003_Implementation_Summary.md](./Docs/Migration_003_Implementation_Summary.md)** - Migration 003 details
- **[Implementation_Fixes_Summary.md](./Docs/Implementation_Fixes_Summary.md)** - Implementation fixes log

#### Archived Documentation (`/Docs/Archive`)
- Phase completion reports (1.1, 1.2, 1.3, 2.0)
- Component quality audits
- Visual validation checklists
- Outdated integration plans

### Key Application Directories

```
/app                    # Next.js App Router pages
├── (auth)/            # Authentication pages (login, signup)
├── (app)/             # Main authenticated app routes
└── api/               # API routes (recipe extraction, status checks)

/components            # React components
├── ui/               # Base UI primitives (shadcn)
├── primitives/       # Custom primitives (Button, Input, Card)
├── composites/       # Reusable composites (RecipeCard, CollectionCard)
└── layout/           # Layout components (AppShell, BottomNav, TopBar)

/lib                   # Core utilities and business logic
├── auth/             # Authentication utilities (dev bypass)
├── hooks/            # React Query hooks (useRecipes, useCollections)
├── mocks/            # Mock data and MockDataStore
├── repositories/     # Data access layer (environment-aware)
├── supabase/         # Supabase client setup (for future use)
└── types/            # TypeScript type definitions

/supabase              # Supabase configuration
└── migrations/       # SQL migration files (for future Supabase setup)
```

## 🎯 Current Implementation Status

### ✅ Completed Phases (All 4 Complete)

**Phase 1: Data Layer + Mock Processing** ✅
- MockDataStore with localStorage persistence
- Environment-aware repositories (dev/prod branching)
- Mock recipe processing simulation
- Full CRUD operations

**Phase 2: Essential Features** ✅
- Favorite/unfavorite recipes
- Recipe editing (notes, timing, cuisine)
- Collections management (create, edit, delete)
- Add/remove recipes from collections
- Platform and favorites filtering
- Toast notifications, empty states, loading states

**Phase 3: Polish & Enhancement** ✅
- Micro-interactions & animations
- Responsive design
- Accessibility (WCAG AA)
- Cook mode enhancements
- Settings page (export/import)
- Performance optimization
- Error boundaries, Dark mode

**Phase 4: Production Integration** ✅ **COMPLETE** (December 2024)
- ✅ Python Recipe Extraction Service (`recipe-extraction/`)
- ✅ Redis queue integration
- ✅ OpenAI Whisper + GPT-4o-mini pipeline
- ✅ Supabase database integration
- ✅ Real authentication
- ✅ Multi-user support
- ✅ Cloud storage + vector embeddings

### 📍 Current State

**Status**: All phases complete. App is production-ready with full recipe extraction pipeline.

**Key architecture**:
- Frontend: Next.js with dev mode toggle (`NEXT_PUBLIC_DEV_MODE`)
- Data: Supabase PostgreSQL (prod) / localStorage (dev)
- Extraction: Python worker + Redis queue
- See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for latest details

## 🔧 Development Mode

The app currently runs in **dev mode** with:
- `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
- MockDataStore providing all data via localStorage
- No database required
- Dev user bypass for authentication
- Simulated recipe processing

## 📚 Documentation Hierarchy

**Read in this order based on your task:**

1. **This file** (PROJECT_STRUCTURE.md) → Get oriented
2. **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** ← Go here for detailed tasks
3. **[TECHNICAL_STRATEGY.md](./TECHNICAL_STRATEGY.md)** ← Go here for architectural decisions
4. **[CLAUDE.md](./CLAUDE.md)** ← Go here for development setup & guidelines
5. **[Docs/](./Docs/)** ← Specific domain documentation (Database_Schema, PRD, UI specs)

## 📖 Documentation Quick Links

| Document | Purpose | When to Read |
|----------|---------|-------------|
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | ⭐ Source of truth for development | Planning work, assigning tasks |
| [TECHNICAL_STRATEGY.md](./TECHNICAL_STRATEGY.md) | System architecture & design patterns | Understanding system design, making arch decisions |
| [CLAUDE.md](./CLAUDE.md) | Development guidelines & project context | Setting up dev environment, understanding architecture |
| [Docs/Database_Schema.md](./Docs/Database_Schema.md) | Database schema design | Working with Supabase, understanding data model |
| [Docs/PRD.md](./Docs/PRD.md) | Product requirements | Understanding product vision |
| [Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md](./Docs/AUDIO_PIPELINE_INTEGRATION_PLAN.md) | Recipe extraction details | Working on extraction pipeline |

## 🗑️ Archived Files

Old completion reports, audits, and outdated plans are in `/Docs/Archive` for historical reference.

---

**Last Updated**: December 29, 2025
**Status**: Phase 4 Complete ✅ (All phases finished)
**Source of Truth**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
