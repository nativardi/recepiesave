# SaveIt: Recipe Edition - User Interface Design Document

## 1. Design Philosophy
**"Modern Mise en place"** - The interface should be pristine, organized, and breathable. We move away from the "rustic" cookbook feel to a modern, digital culinary assistant. The background is white, lines are subtle, and typography is geometric and friendly (Urbanist). It feels like a high-end smart kitchen appliance.

## 2. Layout Structure

### Global Navigation
Bottom Tab Bar (Mobile PWA):
-   **Home:** Dashboard & Feed.
-   **Search:** Pantry search & AI Chef.
-   **Add:** Central, prominent "+" button for URL pasting.
-   **Cookbooks:** Collections.
-   **Profile:** Settings.

### The Recipe Card (Feed Item)
-   **Aspect Ratio:** Vertical (portrait) to match TikTok/Reels format, or Square.
-   **Visual:** Full-bleed image (thumbnail).
-   **Overlay (Bottom Gradient):**
    -   **Title:** White text, clear typography.
    -   **Badges:** "Quick (15m)", "Vegetarian" (Green pill).
    -   **Platform:** Tiny icon (TikTok/IG) in corner.

## 3. Core Components

### A. "The Pantry" Input
-   Floating/Sticky input field.
-   Style: Rounded-full, `bg-stone-50` on default to contrast with white background.
-   Placeholder: "Paste recipe link..."
-   State Change: When analyzing, shows a progress bar "Extracting ingredients...".

### B. Recipe Detail View (The Kitchen View)
Designed for utility.

**Header Section:**
-   **Video Preview:** 16:9 or 9:16 player/thumbnail at the top.
-   **Source Link:** "Recipe by @chefname" (Clickable).

**Ingredients Widget:**
-   **Style:** Card-based list.
-   **Interaction:** Tap row to strike-through (checklist behavior).
-   **Layout:** Quantity aligned left, Ingredient aligned right (or standard flow).

**Instructions Widget:**
-   **Style:** Numbered steps.
-   **Typography:** Large size (18px+), comfortable line height (1.6).
-   **Spacing:** Significant whitespace between steps to prevent reading errors while cooking.

### C. Cookbook Folders
-   **Visual:** Folder icon or 2x2 grid preview of recipes inside.
-   **Label:** Collection Name + Item Count.

## 4. Visual Design & Typography

### Palette
-   **Background:** Pure White (#FFFFFF). Clean, minimal canvas.
-   **Primary Action:** Burnt Orange (#EA580C) - Appetizing, high energy.
-   **Text:** Dark Charcoal (#1F2937) for primary text, Stone Grey (#78716C) for secondary.
-   **Surface/Inputs:** Very Light Stone (#FAFAF9) for subtle differentiation.

### Typography
-   **Font Family:** **Urbanist**.
-   **Style:** Modern, geometric sans-serif.
-   **Usage:**
    -   **Headings:** Bold/SemiBold weights. Clean and approachable.
    -   **Body:** Medium/Regular weights. Highly legible at small sizes.
    -   **Why:** Urbanist offers a contemporary, tech-forward yet friendly feel that aligns with a "modern digital tool" rather than a traditional cookbook.

## 5. Interaction Patterns

### Ingestion (The Save)
-   **Action:** User pastes URL.
-   **Feedback:** "Reading recipe..." -> "Found 12 ingredients and 5 steps."
-   **Success:** Recipe card pops into the "Recent" feed.

### Cooking Mode
-   **Action:** Toggle "Cook Mode".
-   **Result:** Screen stays awake (prevent sleep), UI simplifies to just the current step and next step, text enlarges.

## 6. Accessibility
-   **Contrast:** Ingredients text must pass AAA standards.
-   **Touch Targets:** Checklist items must be easily tappable with a thumb (min height 48px).
-   **Screen Readers:** Ingredients list properly formatted as `<ul>` with `<li>`.


