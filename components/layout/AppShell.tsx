// Description: Main app shell layout wrapper for authenticated routes - includes TopBar and BottomNav

import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  topBar?: {
    title?: string;
    showBack?: boolean;
    rightAction?: ReactNode;
  };
}

export function AppShell({ children, topBar }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {topBar && (
        <TopBar
          title={topBar.title}
          showBack={topBar.showBack}
          rightAction={topBar.rightAction}
        />
      )}
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
