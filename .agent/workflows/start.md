---
description: Start the entire application and its dependencies
---

This workflow starts the Next.js frontend, the Python worker, and the Redis database (if in production mode).

The startup script uses `concurrently` to provide color-coded, prefixed logs for easy debugging.

// turbo
1. Run the unified startup command:
```bash
npm run dev:all
```

**What happens:**
- **Dev Mode**: Only Next.js starts (uses mock data)
- **Production Mode**: Redis (blue), Python worker (magenta), and Next.js (green) all start with color-coded logs

**Note:** The script automatically detects your mode by reading `.env.local`. Press `Ctrl+C` to stop all services.
