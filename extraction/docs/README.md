# Documentation

This directory contains comprehensive documentation for the Audio Processing Pipeline project.

## 📚 Documentation Index

### Getting Started
- **[Main README](../README.md)** - Quick start guide, installation, and usage
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database schema and storage bucket setup

### Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, data flow diagrams, and component overview
- **[INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)** - Integration guide for embedding into SaaS platforms

### Developer Guides
- **[PLATFORM_HANDLER_GUIDE.md](./PLATFORM_HANDLER_GUIDE.md)** - How to add support for new video platforms
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and validation steps

## 🎯 Quick Navigation

### For Integrators
1. Start with [INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md) for API contracts and environment setup
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system flow
3. Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database configuration

### For Contributors
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how the pipeline works
2. Use [PLATFORM_HANDLER_GUIDE.md](./PLATFORM_HANDLER_GUIDE.md) to add new platforms
3. Run tests following [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## 🔧 Key Concepts

### Pipeline Flow
```
Client Request → Flask API → Redis Queue → RQ Worker → Platform Handler
                                                     ↓
                                        ┌───────────────────────┐
                                        │  Processing Pipeline  │
                                        │  1. Download Video    │
                                        │  2. Extract Audio     │
                                        │  3. Upload to Storage │
                                        │  4. Transcribe        │
                                        │  5. Analyze (AI)      │
                                        │  6. Generate Embeddings│
                                        └───────────────────────┘
                                                     ↓
                                              Supabase Storage + DB
```

### Platform Handler Interface
All platforms (Instagram, TikTok, YouTube, Facebook) implement the same interface:
- `validate_url()` - Check if URL is valid
- `extract_id()` - Extract video ID
- `fetch_metadata()` - Get video information
- `download_video()` - Download video file
- `get_platform_name()` - Return platform name

### Configuration
Environment variables control all external services:
- **Supabase:** Database and file storage
- **OpenAI:** Transcription, analysis, embeddings
- **Redis:** Job queue management

## 📖 Documentation Standards

All documentation follows these principles:
1. **Clear examples** - Every feature includes code examples
2. **Step-by-step guides** - Complex processes are broken down
3. **Error handling** - Common issues and solutions are documented
4. **Up-to-date** - Documentation is maintained with code changes

## 🤝 Contributing to Documentation

When updating documentation:
1. Use clear, concise language
2. Include code examples with comments
3. Add diagrams for complex flows (ASCII art is fine)
4. Test all code examples before committing
5. Update this index if adding new docs

## 📝 Documentation Changelog

- **2025-01-15** - Consolidated all documentation into `/docs` folder
- **2025-01-15** - Added ARCHITECTURE.md with system diagrams
- **2025-01-15** - Created PLATFORM_HANDLER_GUIDE.md for extensibility
- **2025-01-15** - Enhanced INTEGRATION_PLAN.md with API contracts

