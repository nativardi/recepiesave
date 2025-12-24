// Description: URL capture component - input field with submit button for pasting recipe links
// Used in Dashboard (inline variant) and Add Recipe page (standalone variant)

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Plus } from "lucide-react";

export interface UrlCaptureProps {
  onSubmit: (url: string) => void;
  placeholder?: string;
  variant?: "inline" | "standalone";
  isLoading?: boolean;
  buttonLabel?: string;
  className?: string;
}

export function UrlCapture({
  onSubmit,
  placeholder = "Paste a recipe link...",
  variant = "inline",
  isLoading = false,
  buttonLabel,
  className,
}: UrlCaptureProps) {
  const [urlInput, setUrlInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onSubmit(urlInput.trim());
      setUrlInput("");
    }
  };

  // Inline variant: input and button side by side
  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-0", className)}>
        <Input
          type="text"
          placeholder={placeholder}
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="rounded-r-none border-r-0 h-14"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="rounded-l-none px-4 h-14"
          aria-label="Save recipe link"
          disabled={isLoading}
        >
          <Plus size={24} />
        </Button>
      </form>
    );
  }

  // Standalone variant: full-width input with button below
  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full max-w-sm flex-col gap-4", className)}
    >
      <Input
        type="text"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        placeholder={placeholder}
        className="h-14"
        disabled={isLoading}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="h-14 w-full"
        disabled={isLoading}
      >
        {isLoading ? "Extracting..." : buttonLabel || "Extract Recipe"}
      </Button>
    </form>
  );
}



