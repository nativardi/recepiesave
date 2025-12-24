// Description: Create New Cookbook screen - form to create a new collection

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-user";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { BookOpen } from "lucide-react";

export default function CreateCookbookPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a cookbook name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = await getCurrentUser();
      const collection = await collectionRepository.create({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
      });

      router.push(`/collections/${collection.id}`);
    } catch (err) {
      console.error("Error creating cookbook:", err);
      setError("Failed to create cookbook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell topBar={{ title: "Create Cookbook", showBack: true }}>
      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icon Preview */}
          <div className="flex justify-center py-6">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={48} className="text-primary" />
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
              Cookbook Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weeknight Dinners"
              className="h-12"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of recipes will go in this cookbook?"
              className="flex w-full rounded-lg border border-gray-300 bg-surface px-4 py-3 text-base text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
            />
          </div>

          {error && <p className="text-accent text-sm text-center">{error}</p>}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-14"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Cookbook"}
          </Button>
        </form>
      </main>
    </AppShell>
  );
}
