// Description: Central icon component using Lucide React SVG icons
// Provides a mapping from semantic names to Lucide icon components

"use client";

import { cn } from "@/lib/utils/cn";
import {
  Home,
  Search,
  PlusCircle,
  BookOpen,
  User,
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bookmark,
  Share,
  Play,
  Timer,
  ChefHat,
  Utensils,
  MoreVertical,
  MoreHorizontal,
  Sparkles,
  Video,
  Heart,
  Trash2,
  Edit,
  Clock,
  Users,
  LucideIcon,
} from "lucide-react";

// Map semantic icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  // Navigation
  home: Home,
  search: Search,
  add_circle: PlusCircle,
  add: Plus,
  menu_book: BookOpen,
  account_circle: User,
  arrow_back: ArrowLeft,
  chevron_right: ChevronRight,

  // Actions
  check: Check,
  close: X,
  settings: Settings,
  help: HelpCircle,
  logout: LogOut,
  bookmark: Bookmark,
  bookmark_border: Bookmark,
  ios_share: Share,
  share: Share,
  play_arrow: Play,
  smart_display: Video,
  more_vert: MoreVertical,
  more_horiz: MoreHorizontal,
  delete: Trash2,
  edit: Edit,
  favorite: Heart,

  // Form
  mail: Mail,
  lock: Lock,
  visibility: Eye,
  visibility_off: EyeOff,
  person: User,

  // Recipe/Food
  restaurant: Utensils,
  restaurant_menu: ChefHat,
  timer: Timer,
  skillet: ChefHat,
  library_add: BookOpen,

  // Misc
  auto_awesome: Sparkles,
  schedule: Clock,
  group: Users,
};

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
}

export function Icon({
  name,
  size = 24,
  strokeWidth = 2,
  className,
  filled = false,
}: IconProps) {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    // Fallback: render a placeholder for unmapped icons
    console.warn(`Icon "${name}" not found in icon map`);
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={cn(filled && "fill-current", className)}
    />
  );
}

// Export individual icons for direct use
export {
  Home,
  Search,
  PlusCircle,
  BookOpen,
  User,
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bookmark,
  Share,
  Play,
  Timer,
  ChefHat,
  Utensils,
  MoreVertical,
  MoreHorizontal,
  Sparkles,
  Video,
  Heart,
  Trash2,
  Edit,
  Clock,
  Users,
};

export type { LucideIcon };



