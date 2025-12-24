// Description: Chip component for filter pills and tags - reusable primitive with variants

"use client";

import { cn } from "@/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-charcoal hover:bg-gray-200",
        accent: "bg-primary/10 text-primary hover:bg-primary/20",
        selected: "bg-primary text-white hover:bg-primary-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
}

export function Chip({
  className,
  variant,
  selected,
  children,
  ...props
}: ChipProps) {
  const effectiveVariant = selected ? "selected" : variant;

  return (
    <button
      className={cn(chipVariants({ variant: effectiveVariant }), className)}
      aria-pressed={selected}
      tabIndex={0}
      {...props}
    >
      {children}
    </button>
  );
}
