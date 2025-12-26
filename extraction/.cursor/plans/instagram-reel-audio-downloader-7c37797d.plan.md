<!-- 7c37797d-0209-4f02-a2f3-e7da3bd5068b 709c5521-f52d-405f-a8e4-8ced7c443032 -->
# Multi-Platform Audio Downloader Extension

## Architecture Overview

Create a modular platform abstraction layer that:

- Detects platform from URL (Instagram, TikTok, YouTube Shorts)
- Routes to platform-specific handlers
- Keeps existing Instagram code completely intact
- Uses yt-dlp for all platforms (it supports TikTok and YouTube)

## Implementation Strategy

### Phase 1: Platform Detection & Routing Layer

1. **Create platform detector** (`utils/platform_detector.py`)

   - Detect platform from URL patterns
   - Return platform enum/string (instagram, tiktok, youtube)
   - Validate platform-specific URL formats

2. **Create platform router** (`utils/platform_router.py`)

   - Route requests to appropriate platform handler
   - Maintain unified interface for all platforms
   - Handle platform-specific errors

### Phase 2: Platform-Specific Handlers (Keep Instagram Intact)

3. **Refactor Instagram handler** (`utils/platforms/instagram_handler.py`)

   - Move existing Instagram logic here (copy, don't modify original)
   - Keep original `utils/downloader.py` and `utils/url_parser.py` as-is for backward compatibility
   - Create wrapper that uses existing functions

4. **Create TikTok handler** (`utils/platforms/tiktok_handler.py`)

   - URL validation for TikTok (tiktok.com, vm.tiktok.com)
   - Use yt-dlp for TikTok metadata extraction
   - Handle TikTok-specific URL formats

5. **Create YouTube Shorts handler** (`utils/platforms/youtube_handler.py`)

   - URL validation for YouTube Shorts (youtube.com/shorts/...)
   - Use yt-dlp for YouTube metadata extraction
   - Handle YouTube-specific URL formats

### Phase 3: Unified Interface

6. **Create platform interface** (`utils/platforms/base_handler.py`)

   - Abstract base class for all platform handlers
   - Unified methods: `validate_url()`, `extract_id()`, `fetch_metadata()`
   - Ensures consistent behavior across platforms

7. **Update main API endpoint** (`app.py`)

   - Detect platform from URL
   - Route to appropriate platform handler
   - Keep existing Instagram flow as fallback
   - Maintain backward compatibility

### Phase 4: Frontend Updates

8. **Update frontend validation** (`static/js/main.js`)

   - Accept TikTok and YouTube Shorts URLs
   - Update validation patterns
   - Update error messages

9. **Update UI** (`templates/index.html`)

   - Update placeholder text to show all supported platforms
   - Update instructions
   - Add platform indicators (optional)

### Phase 5: Testing & Documentation

10. **Update documentation** (`README.md`)

    - Document all supported platforms
    - Add examples for each platform
    - Update installation/setup if needed

## File Structure

```
IG Downloader/
├── app.py                          # Updated: Add platform routing
├── utils/
│   ├── __init__.py
│   ├── platform_detector.py       # NEW: Platform detection
│   ├── platform_router.py         # NEW: Request routing
│   ├── url_parser.py              # KEEP AS-IS (Instagram only)
│   ├── downloader.py              # KEEP AS-IS (Instagram only)
│   ├── audio_processor.py         # KEEP AS-IS (platform-agnostic)
│   └── platforms/                 # NEW: Platform handlers
│       ├── __init__.py
│       ├── base_handler.py        # NEW: Abstract base class
│       ├── instagram_handler.py   # NEW: Instagram wrapper
│       ├── tiktok_handler.py      # NEW: TikTok handler
│       └── youtube_handler.py     # NEW: YouTube handler
├── static/js/main.js              # Updated: Multi-platform validation
├── templates/index.html           # Updated: UI text
└── README.md                      # Updated: Documentation
```

## Key Design Principles

1. **Zero Breaking Changes**: All existing Instagram code remains functional
2. **Modular Design**: Each platform is isolated in its own handler
3. **Unified Interface**: All platforms use the same abstract interface
4. **Backward Compatible**: Existing Instagram URLs continue to work
5. **Extensible**: Easy to add more platforms in the future

## Platform-Specific Details

### TikTok

- URL patterns: `tiktok.com/@user/video/ID`, `vm.tiktok.com/...`
- yt-dlp extractor: `tiktok`
- Special considerations: May require cookies for some content

### YouTube Shorts

- URL patterns: `youtube.com/shorts/VIDEO_ID`, `youtu.be/VIDEO_ID` (if short)
- yt-dlp extractor: `youtube`
- Special considerations: Need to detect if video is a Short (< 60 seconds)

### Instagram (Existing)

- Keep all existing code paths
- No modifications to current implementation
- All existing functionality preserved

## Error Handling

- Platform-specific error messages
- Fallback to generic errors if platform detection fails
- Maintain existing Instagram error handling
- Clear user feedback for unsupported URLs

## Testing Strategy

- Test Instagram URLs (ensure nothing breaks)
- Test TikTok URLs
- Test YouTube Shorts URLs
- Test invalid URLs for each platform
- Test edge cases (private videos, deleted content, etc.)

### To-dos

- [ ] Create project structure, requirements.txt, .gitignore, and initialize Python environment
- [ ] Build utils/url_parser.py to validate Instagram URLs and extract Reel IDs
- [ ] Build utils/downloader.py using yt-dlp to fetch Instagram Reel metadata and video URLs
- [ ] Build utils/audio_processor.py to download video and extract MP3 audio using ffmpeg
- [ ] Build app.py with Flask server, /download endpoint, rate limiting, error handling, and CORS
- [ ] Create templates/index.html with Tailwind CSS UI for URL input, download button, and legal disclaimer
- [ ] Create static/js/main.js for API calls, form handling, file downloads, and user feedback
- [ ] Create static/css/globals.css with Tailwind setup and custom styles for loading/error states
- [ ] Integrate frontend with backend API, test end-to-end flow, and handle all error cases
- [ ] Update README.md with setup instructions, ffmpeg installation guide, and testing examples