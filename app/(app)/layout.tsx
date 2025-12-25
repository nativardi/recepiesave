// Description: Layout for authenticated app routes - wraps all app pages with AppShell and ErrorBoundary

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AppShell>{children}</AppShell>
    </ErrorBoundary>
  );
}
