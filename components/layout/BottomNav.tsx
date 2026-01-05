// Description: Modern bottom navigation with glassmorphism, floating FAB, and sliding indicator
// Features: Next.js routing integration, smooth animations, accessibility support

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  Home,
  Search,
  Plus,
  BookOpen,
  User,
  LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isFab?: boolean;
}

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav in cook mode for distraction-free cooking
  const isCookMode = pathname?.includes("/cook");
  if (isCookMode) {
    return null;
  }

  // All 5 nav items including Add in the center
  const allNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/add", label: "Add", icon: Plus, isFab: true },
    { href: "/collections", label: "Cookbooks", icon: BookOpen },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const activeIndex = allNavItems.findIndex((item) => pathname === item.href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-lg px-4 pb-6">
        {/* Glass Navigation Bar */}
        <div className="glass-nav relative rounded-3xl border border-border/50 shadow-2xl shadow-primary/5">
          {/* Animated Sliding Indicator - centered under active icon */}
          {activeIndex !== -1 && (
            <div
              className="absolute left-0 top-0 h-full transition-all duration-500 ease-out pointer-events-none"
              style={{
                width: `${100 / allNavItems.length}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            >
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-primary transition-all duration-300" />
            </div>
          )}

          {/* Navigation Items */}
          <div className="relative flex items-center justify-around px-4 py-3">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isFab = item.isFab;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative flex flex-col items-center gap-1.5 transition-all duration-300"
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Icon Container - FAB is larger */}
                  <div
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-all duration-300",
                      isFab
                        ? "h-14 w-14 bg-primary shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:scale-105"
                        : "h-10 w-10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-300",
                        isFab
                          ? "h-6 w-6 text-white"
                          : isActive
                            ? "h-6 w-6 text-primary"
                            : "h-6 w-6 text-muted"
                      )}
                    />
                  </div>

                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
