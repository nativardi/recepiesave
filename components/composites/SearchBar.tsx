// Description: Search bar component - search input with optional AI action button
// Uses Lucide SVG icons

"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { Search, Sparkles } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  showAiAction?: boolean;
  onAiClick?: () => void;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  showAiAction = false,
  onAiClick,
  className,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex items-center", className)}
    >
      <Search size={20} className="absolute left-4 text-muted" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-12", showAiAction ? "pr-12" : "pr-4")}
      />
      {showAiAction && (
        <button
          type="button"
          onClick={onAiClick}
          className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background text-accent hover:bg-gray-100 transition-colors"
          aria-label="AI search"
          tabIndex={0}
        >
          <Sparkles size={18} className="fill-current" />
        </button>
      )}
    </form>
  );
}





