# SaveIt: Recipe Edition - Product Requirements Document (PRD)

## 1. Elevator Pitch

**SaveIt: Recipe Edition** is a specialized personal cookbook builder for the social media age. It solves the problem of discovering delicious recipes on TikTok, Instagram, and YouTube but losing them in the endless scroll. Unlike general bookmarking tools, this app acts as an intelligent culinary assistant: users paste a video URL, and the system automatically extracts the ingredients, cooking instructions, and key tips, turning fleeting video clips into a structured, searchable, and permanent recipe collection. It’s a "digital recipe box" that builds itself.

## 2. Who is this app for

- **The Home Cook:** Individuals who cook daily and look for new ideas on social media.
- **The Meal Prepper:** Users who plan their weekly nutrition and need to organize recipes by type (e.g., "High Protein", "Quick Dinner").
- **The Foodie:** Enthusiasts who follow chefs and want to catalog techniques or dishes to try later.
- **The Shopper:** Users who need to quickly check ingredients for a saved recipe while at the grocery store.

## 3. Functional Requirements

### Core Backend (Recipe Extraction Focus)

- **Ingestion:** System accepts URLs from Instagram Reels, TikTok, YouTube Shorts, and Facebook Reels.
- **Processing:** Utilizes the Python/Flask pipeline with specialized prompts to:
    -   Download audio and thumbnails.
    -   Transcribe audio.
    -   **Recipe Analysis (New Focus):**
        -   Extract **Ingredients List** (with quantities if available).
        -   Extract **Cooking Steps** (sequential instructions).
        -   Identify **Cuisine** (e.g., Italian, Thai).
        -   Estimate **Prep/Cook Time**.
        -   Detect **Dietary Tags** (e.g., Vegetarian, Gluten-Free).
    -   **Multilingual Support:**
        -   Automatically detect language from transcript (Hebrew, Arabic, Chinese, Japanese, Korean, Russian, Thai, etc.)
        -   Extract recipe data in original language (no unwanted translation)
        -   Fix spelling/grammar errors while preserving language
- **Storage:** Store structured recipe data (JSON), public URLs, and embeddings in Supabase.

### User-Facing Features

- **Quick Save:** Prominent input for video URLs.
- **Recipe Organization:**
    -   **Cookbooks (Collections):** Users can create custom collections (e.g., "Thanksgiving", "Weeknight Meals").
    -   **Smart Tags:** Auto-tagging based on ingredients and cuisine.
    -   **Favorites:** "Heart" for tried-and-true recipes.
    -   **Notes:** Space for user modifications (e.g., "Use less salt", "Substitute chicken for tofu").
- **Search & Retrieval:**
    -   **Ingredient Search:** "Show me recipes with chicken and mushrooms."
    -   **Cuisine Search:** "Thai food ideas."
    -   **AI Kitchen Assistant:** Chat interface to query the library (e.g., "What can I cook in under 20 minutes from my saved list?").
- **Content Consumption:**
    -   **Recipe Card View:** Clean layout displaying ingredients and steps clearly, separate from the video.
    -   **Video Reference:** Access to the original video/thumbnail for visual cues.
    -   **Deep Link:** "Watch on [Platform]" to see the chef in action.

## 4. User Stories

- **Story 1 (Ingestion):** As a home cook, I want to paste a TikTok link of a lasagna recipe so that I have the ingredients list saved without having to re-watch the video ten times.
- **Story 2 (Shopping):** As a user in the grocery store, I want to search "feta pasta ingredients" and instantly see the list so I buy the right items.
- **Story 3 (Cooking):** As a user in the kitchen, I want a readable view of the cooking steps so I can follow along without my phone locking or the video looping.
- **Story 4 (Planning):** As a meal planner, I want to organize 5 videos into a "Next Week's Dinners" collection.
- **Story 5 (Discovery):** As a user with leftover spinach, I want to ask "What can I make with spinach?" and see relevant recipes from my saved library.

## 5. User Interface (Mobile-First)

The UI should feel like a modern, clean digital cookbook.

### Key Screens

1.  **Kitchen Dashboard (Home):**
    -   **Top:** "Add Recipe" input bar.
    -   **Body:** "Recent Cravings" (Recently saved).
    -   **Feed:** Visual grid of food thumbnails.
2.  **Recipe Detail (The "Cook Mode"):**
    -   **Header:** Appetizing video thumbnail.
    -   **Tabs:** "Ingredients" vs "Instructions".
    -   **Actions:** Add to Collection, Edit Notes, Open Original.
3.  **My Cookbooks (Collections):**
    -   Grid of folders (e.g., "Desserts", "Breakfast").
4.  **Search/Pantry Chef:**
    -   Search bar for specific dishes.
    -   Chat interface for "I have X, what can I make?" queries.

## 6. Technical Stack Recommendation

-   **Frontend:** Next.js (React) + Tailwind CSS + shadcn/ui.
-   **Design:** Urbanist font family, White background, Modern clean aesthetic.
-   **State Management:** TanStack Query.
-   **Backend:** Python/Flask (Specialized Prompts for Recipe Parsing).
-   **Database:** Supabase (PostgreSQL + Vector).


