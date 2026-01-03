// Description: Modern search bar with glassmorphism and smooth animations
// Features: Focus glow, AI assistant button, enhanced micro-interactions

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={cn("relative", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect on focus */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-primary/15 via-accent/15 to-primary/15 rounded-3xl blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Main search container */}
      <div className="relative flex items-center bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
        {/* Subtle gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Search icon */}
        <div className="pl-5 pr-3">
          <Search
            size={18}
            className={cn(
              "transition-colors duration-300",
              isFocused ? "text-primary" : "text-stone-400"
            )}
          />
        </div>

        {/* Input field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "flex-1 h-12 bg-transparent text-sm text-charcoal placeholder:text-stone-400",
            "focus:outline-none focus:placeholder:text-stone-300",
            "transition-all duration-200",
            showAiAction ? "pr-14" : "pr-5"
          )}
        />

        {/* AI Action Button */}
        {showAiAction && (
          <motion.button
            type="button"
            onClick={onAiClick}
            className={cn(
              "absolute right-2 w-9 h-9 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-accent to-accent/90",
              "shadow-md shadow-accent/20",
              "text-white",
              "hover:shadow-lg hover:shadow-accent/30",
              "transition-all duration-300"
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="AI search"
          >
            <Sparkles size={16} className="fill-current" />
          </motion.button>
        )}
      </div>
    </motion.form>
  );
}






