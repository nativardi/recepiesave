// Description: Edit Cookbook screen - form to update collection name and description

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { Collection } from "@/lib/types/database";
import { BookOpen } from "lucide-react";

export default function EditCookbookPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCollection() {
      setIsLoading(true);
      const data = await collectionRepository.getById(collectionId);
      if (data) {
        setCollection(data);
        setName(data.name);
        setDescription(data.description || "");
      }
      setIsLoading(false);
    }
    loadCollection();
  }, [collectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a cookbook name");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await collectionRepository.update(collectionId, {
        name: name.trim(),
        description: description.trim() || null,
      });

      router.push(`/collections/${collectionId}`);
    } catch (err) {
      console.error("Error updating cookbook:", err);
      setError("Failed to update cookbook. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell topBar={{ title: "Edit Cookbook", showBack: true }}>
        <main className="p-4">
          <div className="space-y-6">
            <div className="flex justify-center py-6">
              <div className="w-24 h-24 rounded-2xl bg-gray-200 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell topBar={{ title: "Edit Cookbook", showBack: true }}>
        <main className="p-4">
          <p className="text-center text-muted">Cookbook not found.</p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell topBar={{ title: "Edit Cookbook", showBack: true }}>
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
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </main>
    </AppShell>
  );
}
