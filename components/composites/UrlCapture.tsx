// Description: Modern URL capture component with glassmorphism and engaging animations
// Used in Dashboard (inline variant) and Add Recipe page (standalone variant)
// Now supports inline processing state with ProcessingIndicator

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Link2 } from "lucide-react";
import { ProcessingState } from "@/lib/types/processing";
import { ProcessingIndicator } from "./ProcessingIndicator";

export interface UrlCaptureProps {
  onSubmit: (url: string) => void;
  placeholder?: string;
  variant?: "inline" | "standalone";
  isLoading?: boolean;
  buttonLabel?: string;
  className?: string;
  processingState?: ProcessingState;
}

export function UrlCapture({
  onSubmit,
  placeholder = "Paste a recipe link...",
  variant = "inline",
  isLoading = false,
  buttonLabel,
  className,
  processingState,
}: UrlCaptureProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onSubmit(urlInput.trim());
      setUrlInput("");
    }
  };

  // Check if we should show processing UI
  const isProcessingActive =
    processingState &&
    (processingState.status === "processing" ||
      processingState.status === "success" ||
      processingState.status === "error");

  // Inline variant: Modern elevated card design
  if (variant === "inline") {
    return (
      <div className={cn("relative", className)}>
        <AnimatePresence mode="wait">
          {isProcessingActive ? (
            // Show processing indicator
            <motion.div
              key="processing"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProcessingIndicator processingState={processingState} />
            </motion.div>
          ) : (
            // Show input form
            <motion.form
              key="input"
              onSubmit={handleSubmit}
              className="relative group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* Glow effect on focus */}
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              {/* Main container with enhanced glassmorphism */}
              <div className="relative flex items-center bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                {/* Gradient accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Link icon */}
                <div className="pl-6 pr-3">
                  <Link2
                    size={20}
                    className={cn(
                      "transition-colors duration-300",
                      isFocused ? "text-primary" : "text-stone-400"
                    )}
                  />
                </div>

                {/* Input field */}
                <input
                  type="text"
                  placeholder={placeholder}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 h-16 bg-transparent text-base text-stone-800 placeholder:text-stone-400",
                    "focus:outline-none focus:placeholder:text-stone-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200"
                  )}
                />

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !urlInput.trim()}
                  className={cn(
                    "m-2 w-12 h-12 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-primary to-primary/90",
                    "shadow-lg shadow-primary/30",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/40 hover:scale-105"
                  )}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Save recipe link"
                >
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ) : (
                    <Plus size={22} className="text-white" strokeWidth={2.5} />
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Standalone variant: Centered hero style
  return (
    <motion.form
      onSubmit={handleSubmit}
      className={cn("flex w-full max-w-md flex-col gap-4", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Input container */}
      <div className="relative group">
        {/* Glow on focus */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        <div className="relative bg-white/90 backdrop-blur-sm border border-stone-200/80 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="flex items-center px-6">
            <Link2
              size={20}
              className={cn(
                "mr-3 transition-colors duration-300",
                isFocused ? "text-primary" : "text-stone-400"
              )}
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 h-16 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={isLoading || !urlInput.trim()}
        className={cn(
          "h-14 w-full rounded-3xl font-semibold text-base",
          "bg-gradient-to-r from-primary to-primary/90",
          "text-white shadow-lg shadow-primary/30",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "hover:shadow-xl hover:shadow-primary/40",
          "transition-all duration-300"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Extracting...
          </div>
        ) : (
          buttonLabel || "Extract Recipe"
        )}
      </motion.button>
    </motion.form>
  );
}






