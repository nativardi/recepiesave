// Description: Fixed bottom navigation component for authenticated app routes
// Uses Lucide SVG icons for reliable rendering without font dependencies

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Home,
  Search,
  PlusCircle,
  BookOpen,
  User,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/collections", label: "Cookbooks", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-gray-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-24 px-4 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg",
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-charcoal"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={28}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
              />
              <span className={cn(
                "text-xs",
                isActive ? "font-bold" : "font-medium"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
