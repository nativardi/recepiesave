# Master UI Generation Spec: SaveIt (Recipe Edition)

**Context for AI Generator:**
You are building a high-end, mobile-first web application called **SaveIt**. It is a personal "Digital Cookbook" that extracts recipes from social media video URLs.

**Goal:** Create an interface that feels like a clean, modern culinary workspace ("Mise en place"). It should be warm, readable, and distraction-free.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Supabase.

**Icon System:** Material Symbols initially (for speed), Lucide Icons as target (for consistency and modern feel).

---

## 1. Design System & Theming

### A. Color Palette
Use a "Natural Kitchen" palette. Clean, crisp, and modern. All colors should be defined as design tokens in a central configuration file.

| Token | Tailwind Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas** | `bg-white` | `#FFFFFF` | Main app background (Pure White) |
| **Surface** | `bg-white` | `#FFFFFF` | Cards, Modals (defined by borders/shadows) |
| **Surface Alt** | `bg-stone-50` | `#FAFAF9` | Inputs, Secondary areas, subtle differentiation |
| **Primary** | `bg-orange-600` | `#EA580C` | Primary Actions (Save, Cook Mode), Brand color |
| **Primary Hover** | `bg-orange-700` | `#C2410C` | Primary button hover state |
| **Primary Fg** | `text-white` | `#FFFFFF` | Text on primary buttons |
| **Secondary** | `bg-stone-100` | `#F5F5F4` | Secondary buttons, tags, dividers |
| **Text Main** | `text-stone-900` | `#1F2937` | Headings, Primary Content (AAA contrast) |
| **Text Muted** | `text-stone-500` | `#78716C` | Subtitles, Meta data, Icons |
| **Accent** | `text-emerald-600` | `#059669` | Vegetarian/Vegan tags, Success states |
| **Border** | `border-stone-100` | `#F5F5F4` | Subtle separation |
| **Border Focus** | `border-stone-300` | `#D6D3D1` | Input focus state |

### B. Typography
Modern, geometric, and highly readable. Must pass AAA contrast standards for accessibility.

- **Font Family:** **Urbanist** (target font for production)
  - **Note:** During initial build, Inter may be used temporarily, but Urbanist is the design target.
  - Import via `next/font/google`: `import { Urbanist } from 'next/font/google'`
  - Weights: `400` (Regular), `500` (Medium), `600` (Semibold), `700` (Bold)
  - Used for both Headings and Body text

- **Typography Scale:**
  - **H1:** `text-3xl font-bold tracking-tight` (Page titles, hero headings)
  - **H2:** `text-xl font-semibold` (Section headers)
  - **H3:** `text-lg font-semibold` (Subsection headers)
  - **Body:** `text-base leading-relaxed font-medium` (Primary content)
  - **Body Small:** `text-sm leading-normal font-medium` (Secondary content)
  - **Caption:** `text-xs text-stone-500` (Meta data, timestamps)
  - **Button:** `text-base font-semibold` (Button labels)

- **Line Heights:**
  - Headings: `leading-tight` or `leading-snug`
  - Body: `leading-relaxed` (1.6-1.75 for readability)
  - Instructions (Cook Mode): `leading-loose` (1.8+ for kitchen readability)

### C. Shapes & Depth
Soft, modern feel with consistent radius and subtle depth.

- **Border Radius:**
  - Cards & Modals: `rounded-2xl` (16px)
  - Buttons & Inputs: `rounded-full` (pill shape)
  - Small elements: `rounded-lg` (8px)
  - Tabs: `rounded-xl` (12px)

- **Shadows:**
  - Cards: `shadow-sm` (subtle elevation)
  - Floating elements: `shadow-lg` (modals, elevated buttons)
  - Focus states: `ring-2 ring-orange-200` (accessibility)

- **Borders:**
  - Default: `border border-stone-100` (subtle separation)
  - Focus: `border-stone-300` (input focus)
  - Divider: `border-t border-stone-100` (section separation)

### D. Spacing System
Consistent spacing using Tailwind's scale (4px base unit).

- **Container Padding:** `px-4` (mobile), `px-6` (tablet+)
- **Section Spacing:** `py-6` (between major sections)
- **Component Spacing:** `gap-4` (grid gaps), `mb-4` (vertical spacing)
- **Touch Targets:** Minimum `h-12` (48px) for interactive elements

---

## 2. Core Layout & Shell

### App Shell (Mobile First)
The app shell provides consistent navigation and layout structure across all authenticated pages.

- **Top Bar (App Header):**
  - Height: `h-16` (64px)
  - Background: `bg-white`
  - Border: `border-b border-stone-100`
  - Layout: Flex container with centered logo and right-aligned user avatar
  - Logo: Bold, centered text or icon
  - User Avatar: Right-aligned, circular, `w-8 h-8`

- **Bottom Navigation:**
  - Fixed position: `fixed bottom-0 left-0 right-0`
  - Height: `h-16 bg-white border-t border-stone-100`
  - Layout: Flex container with equal-width items
  - Items: Home, Search, Add (+), Cookbooks, Profile
  - **"Add" Button (Center):**
    - Elevated: `bg-orange-600 rounded-full p-4 -mt-6 shadow-xl ring-4 ring-white`
    - Icon: `Plus` (Material Symbols initially, Lucide target)
    - Size: `w-14 h-14` (larger than other nav items)
    - Z-index: Higher than other nav items

- **Content Area:**
  - Padding: `pb-20` (to account for bottom nav)
  - Padding: `pt-4` (top spacing)
  - Max width: Full width on mobile, constrained on larger screens

---

## 3. Page Specifications

### PAGE 1: Dashboard (Home) - `/dashboard`
**Vibe:** "What are we eating today?" - Welcoming, appetizing, action-oriented.

**Layout Structure:**
1. **Hero Section:**
   - **Greeting:** "Good evening, [User]." or "What are we cooking today?"
     - Style: `text-2xl font-bold text-stone-900`
     - Dynamic based on time of day
   - **The Pantry Input:**
     - Large input field: `h-14 rounded-full shadow-sm border border-stone-200 bg-stone-50 pl-12 pr-4`
     - Icon: `Link` icon inside left (`absolute left-4`)
     - Placeholder: "Paste a TikTok or Instagram link..."
     - **Interaction States:**
       - Default: `bg-stone-50 border-stone-200`
       - Focus: `bg-white border-stone-300 ring-2 ring-orange-200`
       - Error: `border-red-300 bg-red-50`
     - **Submit:** On paste/enter, show processing state

2. **Recent Cravings (Horizontal Scroll):**
   - Section Title: "Recent Saves" (`text-lg font-semibold mb-3`)
   - Container: Horizontal scrollable container (`flex overflow-x-auto gap-4 pb-2`)
   - **Component: RecipeThumbnailCard**
     - Dimensions: `w-40 h-56 flex-shrink-0`
     - Style: `rounded-2xl overflow-hidden relative border border-stone-100`
     - Image: Full cover (`object-cover w-full h-full`)
     - Gradient Overlay: `bg-gradient-to-t from-black/60 to-transparent absolute inset-0`
     - Text Container: `absolute bottom-0 left-0 right-0 p-3`
     - Title: White text, `font-semibold text-sm`, truncate 2 lines
     - Platform Badge: Small icon in top-right corner

3. **Library Feed (Masonry/Grid):**
   - Layout: Two-column grid on mobile (`grid grid-cols-2 gap-4`)
   - Tablet+: `md:grid-cols-3`, Desktop: `lg:grid-cols-4`
   - **Component: StandardRecipeCard**
     - Image: Aspect ratio `aspect-[4/5]` (portrait, matches TikTok/Reels format)
     - Image Style: `rounded-2xl overflow-hidden`
     - Content: Below image, `p-3`
     - Title: `font-bold text-lg leading-snug text-stone-900` (truncate 2 lines)
     - Meta Row: `flex items-center gap-2 text-xs text-stone-500 mt-1`
       - `Clock` icon + "15m"
       - `Utensils` icon + "Italian"
       - Optional: Dietary tags (Vegetarian, Vegan, etc.)

**Empty State:**
- Illustration: Subtle line-drawing icon (ChefHat or similar)
- Copy: "Your cookbook is open. Paste a link to fill the pages."
- CTA: Focus on the Pantry Input

**Loading State:**
- Skeleton cards matching the grid layout
- Shimmer effect: `animate-pulse bg-stone-200`

### PAGE 2: Recipe Detail View - `/recipe/[id]`
**Vibe:** Distraction-free, utilitarian, high contrast. "Cook Mode" ready.

**Layout Structure:**
1. **Header (Sticky on Scroll):**
   - Position: `sticky top-0 z-10 bg-white/95 backdrop-blur-sm`
   - Height: `h-14`
   - Layout: Flex with back button left, actions right
   - Left: Back Button (`ChevronLeft` icon, `p-2`)
   - Right: Action buttons (`Heart` for favorite, `Share` for sharing)
   - **Hero Image:**
     - Position: Top section, `h-[30vh]` (30% of viewport height)
     - Style: Full bleed, `object-cover w-full`
     - **Floating Action:** `Play` button overlaying image center
       - Style: `absolute inset-0 flex items-center justify-center`
       - Button: `bg-black/50 rounded-full p-4 backdrop-blur-sm`
       - Links to original video source

2. **Title Block:**
   - Padding: `px-4 pt-4`
   - H1 Title: `text-3xl font-bold tracking-tight text-stone-900`
   - Meta Tags: Flex container with pills
     - Style: `bg-stone-50 border border-stone-100 text-xs px-3 py-1 rounded-full`
     - Spacing: `gap-2 flex-wrap`
   - **Primary CTA:** "Start Cooking" Button
     - Style: `w-full bg-orange-600 text-white h-12 rounded-2xl mt-4 font-semibold shadow-lg shadow-orange-200`
     - **Behavior:** 
       - Enters "Cook Mode" (maximizes brightness, hides nav bar)
       - Increases instruction font size by 10%
       - Keeps screen awake

3. **The Tabs (Shadcn Tabs):**
   - Container: `bg-stone-50 p-1 rounded-xl mx-4 mt-4`
   - Tabs: [Ingredients] [Instructions] [Notes] (optional)
   - Active Tab: `bg-white shadow-sm rounded-lg`
   - Inactive Tab: `text-stone-600`
   - Tab Content: `px-4 py-6`

4. **Tab Content: Ingredients:**
   - **Component: IngredientChecklistRow**
     - Container: `flex items-center justify-between py-3 border-b border-stone-100`
     - Left: Quantity (`font-bold text-stone-900`)
     - Right: Item Name (`text-stone-700`)
     - **Interaction:**
       - Tap entire row toggles checked state
       - Checked: `line-through text-stone-300`
       - Haptic feedback on mobile
       - Touch target: Minimum `h-12` (48px)
     - **Accessibility:** Proper `<input type="checkbox">` with labels

5. **Tab Content: Instructions:**
   - **Component: StepCard**
     - Container: `mb-8` (plenty of breathing room)
     - Layout: Flex row with number and text
     - Number: `text-orange-600 font-bold text-2xl w-10 flex-shrink-0`
     - Text: `text-lg leading-loose font-medium text-stone-900`
     - **Cook Mode:** Font size increases by 10%, line height increases

6. **Tab Content: Notes (Optional):**
   - Textarea for user modifications
   - Placeholder: "Add your tweaks, substitutions, or notes..."
   - Auto-save functionality

**Responsive Behavior:**
- Mobile: Single column, tabs for switching views
- Tablet+ (`md:`): Two-column layout (Ingredients left, Instructions right)
- Desktop: Maintains two-column with larger spacing

### PAGE 3: The Pantry (Search) - `/search`
**Vibe:** Helpful utility, AI-powered assistant.

**Layout Structure:**
1. **Search Input:**
   - Position: Sticky top (`sticky top-0 z-10 bg-white border-b border-stone-100`)
   - Style: `h-14 rounded-none border-0 border-b bg-white px-4`
   - Auto-focus on page load
   - Icon: `Search` icon on left
   - Clear button: Appears when text is entered

2. **"Pantry Chat" Mode Toggle:**
   - Toggle: "Ask Chef" switch or button
   - When active, transforms search into chat interface

3. **Chat Interface (When "Ask Chef" Active):**
   - **Message Bubbles:**
     - User Messages: `bg-orange-100 text-orange-900 rounded-2xl rounded-tr-none p-3 mb-2 ml-auto max-w-[80%]`
     - AI Messages: `bg-stone-50 border border-stone-100 rounded-2xl rounded-tl-none p-3 mb-2 mr-auto max-w-[80%]`
   - Input: Sticky bottom input with send button
   - Examples: "I have eggs and tomatoes. What can I make?"

4. **Search Results:**
   - Layout: List view (simpler than grid for scanning)
   - **Component: SearchResultRow**
     - Layout: Flex row
     - Left: Thumbnail (Square, `w-16 h-16 rounded-lg`)
     - Right: Title + Matching ingredients highlighted
     - Highlight: Matching text in `bg-orange-100`
     - Touch target: Full row, minimum `h-16`

**Empty State:**
- When no results: "No recipes found. Try different keywords or ask the chef!"
- When no search: "Search your cookbook or ask the chef what to make."

### PAGE 4: My Cookbooks (Collections) - `/collections`
**Vibe:** Organized, folder-like structure.

**Layout Structure:**
1. **Header:**
   - Title: "My Cookbooks"
   - Action: "Create Cookbook" button (top right)

2. **Cookbooks Grid:**
   - Layout: Two-column grid (`grid grid-cols-2 gap-4`)
   - **Component: CookbookCard**
     - Style: `rounded-2xl border border-stone-100 p-4`
     - Visual: 2x2 grid preview of recipe thumbnails OR folder icon
     - Label: Collection Name (`font-semibold text-lg`)
     - Meta: Item count (`text-sm text-stone-500`)
     - Touch target: Full card

**Empty State:**
- Illustration: Folder icon
- Copy: "Create your first cookbook to organize recipes."
- CTA: "Create Cookbook" button

### PAGE 5: Cookbook Detail - `/collections/[id]`
**Vibe:** Collection view, similar to library feed.

**Layout Structure:**
1. **Header:**
   - Back button + Collection name
   - Action: "Add Recipes" button

2. **Recipe Grid:**
   - Same grid layout as Dashboard Library Feed
   - Uses `StandardRecipeCard` component

### PAGE 6: Add Recipe - `/add`
**Vibe:** Focused, single-purpose screen.

**Layout Structure:**
1. **Header:** "Add Recipe"

2. **URL Input:**
   - Large, centered input
   - Same style as Dashboard Pantry Input
   - Processing state with progress indicator

3. **Processing State:**
   - "Sous Chef" loading card
   - Icon: Spinning loader
   - Text: "Extracting ingredients..."
   - Progress bar: `h-1 bg-stone-200` with `bg-orange-600` fill

---

## 4. Components & Micro-Interactions

### Component Library Philosophy
**Minimize components, maximize reuse.** Prefer variants over new components. Only create new components when they appear on 2+ screens or have complex interactive behavior.

**Component Structure:**
- `components/ui/` - Thin wrappers (shadcn + our variants)
- `components/primitives/` - Opinionated primitives (Button, Input, Card, Chip, ListRow)
- `components/composites/` - Reused 2+ screens (RecipeCard, RecipeThumbnailCard, IngredientChecklistRow)
- `components/layout/` - Shell pieces (BottomNav, AppHeader)

**Target Minimal Component Set:**
- **Primitives:** Button (variants), Input, Card, Tabs, Toggle, Chip, ListRow
- **Composites:** RecipeCard, RecipeThumbnailCard, IngredientChecklistRow, BottomNav

### Loading States
- **Skeleton:** `animate-pulse bg-stone-200 rounded`
  - Match the layout of the final content
  - Use for cards, lists, images
- **"Sous Chef" Loading Card:**
  - Distinct card in feed during processing
  - Icon: Spinning `Loader2` or similar
  - Text: "Extracting ingredients..."
  - Progress Bar: `h-1 bg-stone-200` with animated `bg-orange-600` fill
  - Style: `border-2 border-dashed border-stone-300`

### Empty States
Never use empty voids. Always provide guidance and next steps.

- **Illustration:** Subtle line-drawing icon (Lucide `ChefHat` or similar, stroke thin)
- **Copy:** Contextual, helpful message
  - Dashboard: "Your cookbook is open. Paste a link to fill the pages."
  - Search: "No recipes found. Try different keywords or ask the chef!"
  - Collections: "Create your first cookbook to organize recipes."
- **CTA:** When appropriate, provide a clear action button

### Error States
- **Network Error:** "Something went wrong. Please try again."
- **Invalid URL:** "This link doesn't appear to be a recipe video. Try a TikTok or Instagram link."
- **Processing Failed:** "We couldn't extract this recipe. Try another link or check back later."
- **Style:** Red accent color, clear error message, retry action

### Micro-Interactions
- **Button Hover:** Subtle scale (`scale-105`) or shadow increase
- **Card Tap:** Slight scale down (`scale-95`) on press
- **Checklist Toggle:** Smooth transition, haptic feedback on mobile
- **Tab Switch:** Smooth transition between tab content
- **Page Transitions:** Optional `framer-motion` for smooth page transitions

### The "Cook Mode" Toggle
When "Start Cooking" is activated:

1. **UI Changes:**
   - Hide Bottom Navigation
   - Increase instruction font size by 10%
   - Increase line height for better readability
   - Maximize screen brightness (simulated via CSS filter)

2. **Functional Changes:**
   - Keep screen awake (NoSleep.js or similar hook)
   - Disable auto-lock
   - Full-screen mode (optional)

3. **Exit:** Back button or swipe gesture to exit Cook Mode

---

## 5. Technical Implementation Notes

### Dependencies
- **Core:**
  - `next` (App Router)
  - `react`, `react-dom`
  - `typescript`
  - `tailwindcss`
  - `clsx` and `tailwind-merge` for dynamic classes

- **UI Components:**
  - `shadcn/ui` (used as primitives)
  - `lucide-react` (target icon library)
  - `material-symbols` (initial icon set for speed)

- **State & Data:**
  - `@tanstack/react-query` (client caching, mutations)
  - `@supabase/supabase-js` (database, auth)
  - `@supabase/auth-helpers-nextjs` (auth helpers)

- **Optional Enhancements:**
  - `framer-motion` (page transitions, animations)
  - `react-hook-form` (form handling)
  - `zod` (validation)

### Data Mocking
Generate realistic recipe data JSON for development:

```json
{
  "id": "recipe-1",
  "title": "Creamy Tuscan Chicken",
  "description": "A rich and flavorful one-pan dinner",
  "prepTime": "10m",
  "cookTime": "25m",
  "totalTime": "35m",
  "servings": 4,
  "cuisine": "Italian",
  "tags": ["Dinner", "Chicken", "One-Pan"],
  "dietary": ["Gluten-Free"],
  "ingredients": [
    { "quantity": "4", "unit": "pieces", "item": "Chicken breasts" },
    { "quantity": "2", "unit": "cups", "item": "Heavy cream" }
  ],
  "instructions": [
    { "step": 1, "text": "Season chicken with salt and pepper." },
    { "step": 2, "text": "Heat oil in a large skillet over medium-high heat." }
  ],
  "sourceUrl": "https://tiktok.com/@chef/...",
  "thumbnailUrl": "https://...",
  "platform": "tiktok"
}
```

### Responsive Breakpoints
- **Mobile:** Default (up to 768px)
  - Single column layouts
  - Bottom navigation
  - Full-width cards

- **Tablet (`md:`):** 768px and up
  - Recipe Detail: Two-column (Ingredients | Instructions)
  - Grid: 3 columns
  - Side padding increases

- **Desktop (`lg:`):** 1024px and up
  - Grid: 4 columns
  - Max-width container for content
  - Larger touch targets maintained

### Font Installation
Ensure **Urbanist** is imported via `next/font/google`:

```typescript
import { Urbanist } from 'next/font/google'

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-urbanist',
})

// Apply to body in layout
```

**Note:** During initial build, Inter may be used temporarily, but Urbanist is the design target.

### Accessibility Requirements
- **Contrast:** All text must meet AAA standards (minimum 7:1 for normal text, 4.5:1 for large text)
- **Touch Targets:** Minimum 48px (h-12) for all interactive elements
- **Keyboard Navigation:** All interactive elements must be keyboard accessible
- **Screen Readers:**
  - Proper semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)
  - ARIA labels where needed
  - Ingredients list as proper `<ul>` with `<li>`
  - Form labels for all inputs
- **Focus States:** Visible focus indicators (`ring-2 ring-orange-200`)

### Performance Considerations
- **Image Optimization:** Use Next.js `Image` component with proper sizing
- **Code Splitting:** Route-based code splitting (automatic with App Router)
- **Lazy Loading:** Images and below-the-fold content
- **Bundle Size:** Keep component library minimal, tree-shake unused code

---

## 6. Quality Gates

### Per-Component Checklist
- [ ] Renders correctly with empty data
- [ ] Handles long text (truncation/ellipsis)
- [ ] Handles missing images (fallback/placeholder)
- [ ] Keyboard accessible (tab navigation, Enter/Space activation)
- [ ] No duplicated token-like class clusters (use variants instead)
- [ ] Proper TypeScript types
- [ ] Accessible (ARIA labels, semantic HTML)

### Per-Screen Checklist
- [ ] Matches design spec layout
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Responsive on mobile, tablet, desktop
- [ ] Navigation works correctly
- [ ] Data flows correctly (mock → real)

### Release Gate Checklist
- [ ] Auth flow works (login/signup/logout)
- [ ] URL paste creates processing recipe row
- [ ] Dashboard shows recipes from database
- [ ] Recipe detail renders ingredients/instructions from DB
- [ ] Search functionality works
- [ ] Collections can be created and recipes added
- [ ] Cook Mode toggle works correctly

---

## 7. Build Sequencing

**Wave 1 — Core Navigation + Core Value:**
1. Dashboard / Home
2. Recipe Detail
3. Cookbooks list
4. Cookbook details

**Wave 2 — High-utility screens:**
5. Pantry / Search chat
6. Add recipe (URL paste)
7. Processing state

**Wave 3 — Management flows:**
8. Create cookbook
9. Add recipes to cookbook
10. Review/Edit recipe

**Wave 4 — Public + Auth:**
11. Landing page
12. Login / Signup

---

## 8. Maintenance Guidelines

### Code Ownership Rules
- Any repeated UI pattern → becomes a variant or shared primitive
- Any screen-specific layout that's not reused stays in the page file
- Keep files small and focused (ideally <200 lines)
- If a component grows, split it by responsibility

### Naming Conventions
- **Handlers:** `handleClick`, `handleSubmit`, `handleToggle`
- **Components:** Nouns (`RecipeCard`, `BottomNav`)
- **Variants:** Consistent (`variant="primary"`, `size="lg"`)
- **Files:** PascalCase for components, kebab-case for utilities

### Data Access Pattern
- UI components do not call Supabase directly
- Pages/hooks call a repository layer (mock → Supabase)
- This allows iteration without rewrites

---

**End of Specification**

