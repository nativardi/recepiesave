# Quick Start Guide

## Running the Application

### One-Command Startup (Recommended)
```bash
npm run dev:all
```

This automatically detects your environment and starts the right services:
- **Dev Mode**: Next.js only (mock data)
- **Production Mode**: Redis + Python Worker + Next.js (with color-coded logs)

### Individual Services (Advanced)

If you need to start services separately:

```bash
# Just Next.js
npm run dev

# Production mode with all services
npm run dev:prod

# Individual services
npm run redis    # Start Redis only
npm run worker   # Start Python worker only
```

## First-Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **For Production Mode, set up Python:**
   ```bash
   cd extraction
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ../recipe-extraction
   pip install -r requirements.txt
   ```

4. **Start the app:**
   ```bash
   npm run dev:all
   ```

## Switching Modes

Edit `.env.local`:

```bash
# Dev Mode (mock data, no services needed)
NEXT_PUBLIC_DEV_MODE=true

# Production Mode (full pipeline)
NEXT_PUBLIC_DEV_MODE=false
```

Then restart with `npm run dev:all`.

## Troubleshooting

### "Docker is not running"
- Start Docker Desktop before running in production mode
- Or switch to dev mode if you don't need the full pipeline

### "Python virtual environment not found"
- Run the Python setup from "First-Time Setup" above
- Make sure you're in the project root when running `npm run dev:all`

### Logs are mixed/hard to read
- The `concurrently` setup provides color-coded logs:
  - 🔵 Blue = Redis
  - 🟣 Magenta = Python Worker  
  - 🟢 Green = Next.js

### Need to restart just one service
- Press `Ctrl+C` to stop all
- Use individual service commands (see "Individual Services" above)
