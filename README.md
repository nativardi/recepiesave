# SaveIt: Recipe Edition

Turn social media recipes into your personal cookbook.

## 🚀 Quick Start

Currently running in **dev mode** (no database required):

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Ensure dev mode is enabled in `.env.local`:
```bash
NEXT_PUBLIC_DEV_MODE=true
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📖 Documentation

- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Active development plan (Phases 1-4)
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Project organization guide
- **[TECHNICAL_STRATEGY.md](./TECHNICAL_STRATEGY.md)** - Technical architecture
- **[Docs/](./Docs/)** - Additional documentation (PRD, UI specs, schema)
- **[SECURITY_FINDINGS.md](./SECURITY_FINDINGS.md)** - Security audit findings
- **[Docs/SECURITY.md](./Docs/SECURITY.md)** - Security documentation

## 🎯 Current Status

### ✅ Completed (Phases 1 & 2)
- MockDataStore with localStorage persistence
- All UI pages built (14/14)
- Full CRUD operations (recipes, collections)
- Favorites, filtering, toast notifications
- Recipe editing and collection management

### 🚧 Current Phase
**Phase 3: Polish & Enhancement** (Optional)
- Animations, accessibility, dark mode, performance optimization

### ⏸️ Future
**Phase 4: Production Integration**
- External Python/Flask service for video processing
- Supabase database migration
- Real authentication and multi-user support

## 🏗️ Architecture

```
Frontend (Next.js 14)
    ↓
React Query Hooks
    ↓
Repository Layer (Environment-aware)
    ↓
├─→ Dev Mode: MockDataStore → localStorage
└─→ Prod Mode: Supabase → PostgreSQL (future)
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query (TanStack Query)
- **Data**: MockDataStore (dev) / Supabase (future)
- **Types**: TypeScript (strict mode)

## 📝 Development Workflow

1. **Dev Mode**: Use mock data via `NEXT_PUBLIC_DEV_MODE=true`
2. **Component-First**: Build UI components with mock data
3. **Repository Pattern**: Environment-aware data access
4. **Progressive Enhancement**: Add features incrementally

For detailed implementation steps, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
