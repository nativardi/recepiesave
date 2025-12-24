// Description: Ingredient checklist row component - reusable ingredient item with checkbox

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

interface IngredientChecklistRowProps {
  ingredient: {
    raw_text: string;
    quantity?: number | null;
    unit?: string | null;
    item?: string | null;
  };
  checked?: boolean;
  onToggle?: (checked: boolean) => void;
}

export function IngredientChecklistRow({
  ingredient,
  checked: controlledChecked,
  onToggle,
}: IngredientChecklistRowProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleToggle = () => {
    const newChecked = !checked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onToggle?.(newChecked);
  };

  // Extract quantity and unit from raw_text if not provided
  const displayText = ingredient.raw_text;
  const parts = displayText.match(/^([\d./\s]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
  const quantityPart = parts?.[1]?.trim() || "";
  const restOfText = parts?.[3] || displayText;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg p-3 bg-surface shadow-sm",
        checked && "opacity-60"
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          checked
            ? "border-primary bg-primary text-white"
            : "border-gray-300 hover:border-primary"
        )}
        aria-label={checked ? "Uncheck ingredient" : "Check ingredient"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </button>
      <p
        className={cn(
          "flex-1 text-base text-charcoal",
          checked && "line-through"
        )}
      >
        {quantityPart && (
          <span className="font-bold text-accent">{quantityPart} </span>
        )}
        {restOfText}
      </p>
    </div>
  );
}
