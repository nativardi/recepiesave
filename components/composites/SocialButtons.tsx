// Description: Social login buttons component - Google and Apple OAuth buttons with divider
// Used in Login and Signup pages

"use client";

import { cn } from "@/lib/utils/cn";

export interface SocialButtonsProps {
  onGoogleClick?: () => void;
  onAppleClick?: () => void;
  className?: string;
}

export function SocialButtons({
  onGoogleClick,
  onAppleClick,
  className,
}: SocialButtonsProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-muted text-sm font-medium">
          Or continue with
        </span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onGoogleClick}
          className="flex items-center justify-center gap-2.5 h-12 bg-surface border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-charcoal font-medium"
          aria-label="Continue with Google"
          tabIndex={0}
        >
          <span className="text-lg">G</span>
          <span>Google</span>
        </button>
        <button
          type="button"
          onClick={onAppleClick}
          className="flex items-center justify-center gap-2.5 h-12 bg-surface border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-charcoal font-medium"
          aria-label="Continue with Apple"
          tabIndex={0}
        >
          <span className="text-lg"></span>
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
}






