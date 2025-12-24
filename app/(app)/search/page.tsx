// Description: Search/Pantry screen - search recipes and chat with AI assistant

"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchBar } from "@/components/composites/SearchBar";
import { ErrorState } from "@/components/composites/ErrorState";
import { ListRow } from "@/components/primitives/ListRow";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Recipe } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Inlined ChatBubble component (was only used here, 38 lines)
function ChatBubble({ content, role }: { content: string; role: "user" | "assistant" }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3 shadow-sm",
          isUser ? "rounded-br-none bg-gray-200" : "rounded-bl-none bg-surface"
        )}
      >
        <p className="text-sm text-charcoal">{content}</p>
      </div>
    </div>
  );
}

// Skeleton for search results
function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface">
          <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        'What are we cooking today? Try asking me something like "What can I make with chicken and rice?"',
    },
  ]);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      const userRecipes = await recipeRepository.getAll(user.id);
      setRecipes(userRecipes);
      setFilteredRecipes(userRecipes);
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Failed to load your recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredRecipes(recipes);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(lowerQuery) ||
        recipe.cuisine?.toLowerCase().includes(lowerQuery)
    );
    setFilteredRecipes(filtered);
  };

  const handleChatSubmit = () => {
    if (!searchQuery.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: searchQuery,
    };

    // Mock assistant response
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: `I found ${filteredRecipes.length} recipe(s) that might match your search for "${searchQuery}".`,
    };

    setChatMessages((prev) => [...prev, userMessage, assistantMessage]);
    setSearchQuery("");
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleAiClick = () => {
    // TODO: Trigger AI-powered search
    console.log("AI search clicked");
  };

  return (
    <AppShell
      topBar={{
        title: "The Pantry",
        showBack: true,
      }}
    >
      <div className="flex flex-col h-full">
        {/* Search Input */}
        <div className="sticky top-14 bg-background px-4 pt-2 pb-4 z-10">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            onSubmit={handleChatSubmit}
            placeholder="Search by recipe or ingredient..."
            showAiAction
            onAiClick={handleAiClick}
          />
        </div>

        {/* Chat Messages */}
        <main className="flex-1 px-4">
          <div className="space-y-4 mb-8">
            {chatMessages.map((message) => (
              <ChatBubble
                key={message.id}
                content={message.content}
                role={message.role}
              />
            ))}
          </div>

          {/* Error State */}
          {error && (
            <ErrorState
              message={error}
              onRetry={loadRecipes}
            />
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="pb-24">
              <SearchResultsSkeleton />
            </div>
          )}

          {/* Search Results */}
          {!isLoading && !error && (
            <div className="space-y-4 pb-24">
              {filteredRecipes.map((recipe) => (
                <ListRow
                  key={recipe.id}
                  thumbnail={recipe.thumbnail_url}
                  title={recipe.title}
                  meta={recipe.cuisine || "Recipe"}
                  onClick={() => handleRecipeClick(recipe.id)}
                />
              ))}
              {filteredRecipes.length === 0 && searchQuery && (
                <p className="text-center text-muted py-8">
                  No recipes found for "{searchQuery}"
                </p>
              )}
              {filteredRecipes.length === 0 && !searchQuery && (
                <p className="text-center text-muted py-8">
                  Start typing to search your recipes
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
