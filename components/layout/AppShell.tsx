// Description: Main app shell layout wrapper for authenticated routes - includes TopBar and BottomNav

import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SkipNav } from "../ui/skip-nav";

interface AppShellProps {
  children: ReactNode;
  topBar?: {
    title?: string;
    logoSrc?: string;
    showBack?: boolean;
    rightAction?: ReactNode;
  };
}

export function AppShell({ children, topBar }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SkipNav />
      {topBar && (
        <TopBar
          title={topBar.title}
          logoSrc={topBar.logoSrc}
          showBack={topBar.showBack}
          rightAction={topBar.rightAction}
        />
      )}
      <main id="main-content" className="flex-1 pb-28" role="main">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
