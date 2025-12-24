// Description: Mock Supabase client for server-side usage (Server Components, Route Handlers)
// TODO: Replace with real Supabase client in Phase 2

import type { MockSupabaseClient } from "./client";

/**
 * Creates a mock Supabase client for server-side usage
 * Returns a client that throws errors for all operations
 */
export async function createServerSupabaseClient(): Promise<MockSupabaseClient> {
  const notImplementedError = new Error(
    "Supabase integration not yet implemented. Full backend integration coming in Phase 2."
  );

  const mockAuthResponse = {
    data: { user: null, session: null },
    error: notImplementedError,
  };

  const mockUserResponse = {
    data: { user: null },
    error: notImplementedError,
  };

  // Create a chainable query builder mock
  const createQueryBuilder = () => {
    const builder: any = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      single: () => Promise.resolve({ data: null, error: notImplementedError }),
      then: (resolve: any) =>
        resolve({ data: null, error: notImplementedError }),
    };
    return builder;
  };

  return {
    auth: {
      signUp: async () => mockAuthResponse,
      signInWithPassword: async () => mockAuthResponse,
      signInWithOAuth: async () => ({ data: null, error: notImplementedError }),
      signOut: async () => ({ error: notImplementedError }),
      getUser: async () => mockUserResponse,
    },
    from: () => createQueryBuilder(),
  };
}
