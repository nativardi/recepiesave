// Description: Mock Supabase middleware - handles session refresh
// TODO: Replace with real Supabase middleware in Phase 2

import { NextResponse, type NextRequest } from "next/server";

/**
 * Mock session update middleware
 * Currently passes through all requests without modification
 */
export async function updateSession(request: NextRequest) {
  // For now, just pass through the request
  // Real Supabase session refresh will be implemented in Phase 2
  return NextResponse.next({
    request,
  });
}
