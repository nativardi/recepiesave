# SaveIt Recipe App - Project Structure

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

### ✅ Completed Phases

**Phase 1: Data Layer + Mock Processing**
- MockDataStore with localStorage persistence
- Environment-aware repositories (dev/prod branching)
- Mock recipe processing simulation
- Full CRUD operations

**Phase 2: Essential Features**
- Favorite/unfavorite recipes
- Recipe editing (notes, timing, cuisine)
- Collections management (create, edit, delete)
- Add/remove recipes from collections
- Platform and favorites filtering
- Toast notifications
- Empty states polish
- Loading states

### 🚧 Current Phase

**Phase 3: Polish & Enhancement** (Optional - 23 hours)
- Micro-interactions & animations
- Responsive design gaps
- Accessibility (WCAG AA)
- Cook mode enhancements
- Settings page (export/import)
- Performance optimization
- Error boundaries
- Dark mode

### ⏸️ Future Phases

**Phase 4: Production Integration** (Future - 13 hours)
- External Python/Flask service integration
- Supabase database migration
- Real authentication
- Multi-user support
- Cloud storage
- Vector search

## 🔧 Development Mode

The app currently runs in **dev mode** with:
- `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
- MockDataStore providing all data via localStorage
- No database required
- Dev user bypass for authentication
- Simulated recipe processing

## 📚 Key References

- **Implementation Plan**: See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed task breakdown
- **Technical Strategy**: See [TECHNICAL_STRATEGY.md](./TECHNICAL_STRATEGY.md) for architecture
- **Database Schema**: See [Docs/Database_Schema.md](./Docs/Database_Schema.md) for future Supabase setup

## 🗑️ Archived Files

Old completion reports, audits, and outdated plans are moved to `/Docs/Archive` for historical reference but are no longer actively used.

---

**Last Updated**: December 24, 2025
**Active Plan**: IMPLEMENTATION_PLAN.md (Phase 3 in progress)
