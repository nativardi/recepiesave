// Description: Settings list row component - reusable row for settings and profile lists
// Uses Lucide SVG icons

"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronRight, LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

// Map string icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  settings: Icons.Settings,
  help: Icons.HelpCircle,
  logout: Icons.LogOut,
  user: Icons.User,
  mail: Icons.Mail,
  lock: Icons.Lock,
  bell: Icons.Bell,
  shield: Icons.Shield,
  info: Icons.Info,
  file: Icons.FileText,
};

export interface SettingsListRowProps {
  icon?: string;
  label: string;
  onClick?: () => void;
  showChevron?: boolean;
  rightContent?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export function SettingsListRow({
  icon,
  label,
  onClick,
  showChevron = true,
  rightContent,
  variant = "default",
  className,
}: SettingsListRowProps) {
  const isDestructive = variant === "destructive";
  const isClickable = !!onClick;

  // Get icon component from map
  const IconComponent = icon ? iconMap[icon.toLowerCase()] : null;

  const content = (
    <>
      {/* Icon */}
      {IconComponent && (
        <IconComponent
          size={20}
          className={isDestructive ? "text-accent" : "text-charcoal"}
        />
      )}

      {/* Label */}
      <span
        className={cn(
          "font-medium flex-1",
          isDestructive ? "text-accent" : "text-charcoal"
        )}
      >
        {label}
      </span>

      {/* Right Content or Chevron */}
      {rightContent ? (
        rightContent
      ) : showChevron && isClickable ? (
        <ChevronRight size={20} className="text-muted" />
      ) : null}
    </>
  );

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors",
          className
        )}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      {content}
    </div>
  );
}






