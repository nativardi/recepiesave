# SaveIt: Recipe Edition - UI/UX Map & User Flow Analysis

This map outlines the user experience for a personal recipe collection app. The focus is on clarity, appetite appeal, and utility in the kitchen.

---

## 🎯 Core User Journeys

### **Journey 1: The Hungry Collector**
*"I see a delicious dish on TikTok and want to save the recipe for later."*
-   **Goal:** Capture the recipe details (ingredients, steps) instantly from a video link.
-   **Pain Point:** Re-watching a fast-paced video to write down ingredients.
-   **Solution:** One-tap save that extracts the text automatically.

### **Journey 2: The Grocery Shopper**
*"I'm at the store and need to know what to buy for that chicken dish I saved."*
-   **Goal:** Fast access to the ingredients list.
-   **Context:** Mobile usage, on the go, limited time.
-   **Solution:** "Ingredients First" view in the recipe details.

### **Journey 3: The Active Cook**
*"I'm in the kitchen, hands dirty, trying to follow the steps."*
-   **Goal:** Clear, readable instructions without distractions.
-   **Context:** Phone on counter, messy hands.
-   **Solution:** Clean "Cook View" with large text and simplified steps.

---

## 📱 Complete Page Structure

### **PUBLIC PAGES** (Before Login)

#### **1. Landing Page** `/`
-   **Hero:** "Turn TikToks into Your Personal Cookbook."
-   **Value Prop:** "Never lose a recipe again. We extract ingredients and steps from videos automatically."
-   **Demo:** "Paste a food video link" -> Show extracted recipe card.

#### **2. Auth Pages** `/login`, `/signup`
-   Standard secure authentication.

---

### **AUTHENTICATED PAGES** (After Login)

#### **3. Kitchen Dashboard (Home)** `/dashboard`
-   **Header:** "What are we cooking today?"
-   **Primary Action:** Large "Paste Recipe URL" bar.
-   **Section: Recent Saves:** Horizontal scroll of latest recipe cards (Food Thumbnail + Title).
-   **Section: Quick Categories:** Chips for "Breakfast", "Dinner", "Dessert" (Auto-categorized).
-   **Processing State:** "Sous Chef working..." skeleton card for items being analyzed.

#### **4. My Cookbooks (Collections)** `/collections`
-   **Layout:** Grid of folders.
-   **Examples:** "Sunday Roast", "Quick & Easy", "Party Food".
-   **Action:** Create New Cookbook.

#### **5. All Recipes (Library)** `/library`
-   **View:** Masonry grid of food images.
-   **Filters:** Cuisine (Italian, Mexican), Diet (Vegetarian, Keto), Time (<30 mins).
-   **Sort:** Most Recent, Last Cooked (if tracked), Favorites.

#### **6. Recipe Detail View** `/recipe/[id]`
This is the core value screen.

-   **Header:**
    -   High-res Video Thumbnail.
    -   Platform Icon (TikTok/IG) + Link to Original.
    -   Title (e.g., "Creamy Garlic Chicken").
    -   Meta: Prep Time, Servings (if detected).
-   **Tabs/Sections:**
    -   **Tab 1: Ingredients (Default for Shoppers):**
        -   Checklist format (e.g., "▢ 200g Chicken Breast").
        -   "Copy to Clipboard" button.
    -   **Tab 2: Instructions (Cook Mode):**
        -   Step-by-step numbered list.
        -   Large, legible font.
    -   **Tab 3: Notes:**
        -   User's personal tweaks.
-   **Floating Action:** "Start Cooking" (Enters distraction-free full screen mode).

#### **7. Search & Pantry Chat** `/search`
-   **Search Bar:** "Avocado toast", "Spicy noodles".
-   **AI Chat:**
    -   User: "I have eggs and tomatoes. What can I make?"
    -   AI: Suggests recipes from the library with those ingredients.

#### **8. Profile/Settings** `/settings`
-   Dietary Preferences (e.g., "Highlight Gluten-Free recipes").
-   Measurement System (Metric vs. Imperial toggle).

---

## 🔄 Key User Flows

### **Flow 1: The Quick Capture**
1.  User copies link from Instagram.
2.  Opens SaveIt Recipe App.
3.  App detects link on clipboard -> "Save this recipe?" toast.
4.  User taps "Save".
5.  Item appears in Dashboard with "Extracting ingredients..." badge.
6.  Notification: "Recipe Ready: Spicy Tuna Roll".

### **Flow 2: The Shopping Trip**
1.  User opens app in supermarket.
2.  Searches "Tuna".
3.  Taps "Spicy Tuna Roll" recipe.
4.  Views **Ingredients** tab.
5.  Checks off items as they are put in the basket.

### **Flow 3: The Cooking Session**
1.  User props phone on kitchen counter.
2.  Opens recipe.
3.  Taps "Instructions" or "Start Cooking".
4.  Reads Step 1.
5.  Follows along.
6.  (Optional) Taps "Watch Video" for a specific technique check.

---

## 🎨 UX Principles for Recipes

-   **Appetite Appeal:** Use high-quality thumbnails. Food should look good.
-   **Readability:** High contrast text for ingredients and steps. Kitchens can be bright/glare-prone.
-   **Efficiency:** Ingredients list should be essentially a checklist.
-   **Attribution:** Always link back to the original creator/video clearly.


