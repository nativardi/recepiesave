// Description: Mock Supabase client for browser/client-side usage
// TODO: Replace with real Supabase client in Phase 2

/**
 * Mock auth data structures
 */
type AuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
} | null;

type AuthResponse = {
  data: { user: AuthUser; session: any };
  error: Error | null;
};

type UserResponse = {
  data: { user: AuthUser };
  error: Error | null;
};

/**
 * Mock Supabase client type
 * This is a placeholder until full Supabase integration
 */
export type MockSupabaseClient = {
  auth: {
    signUp: (options: {
      email: string;
      password: string;
      options?: { data?: Record<string, any> };
    }) => Promise<AuthResponse>;
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<AuthResponse>;
    signInWithOAuth: (options: {
      provider: string;
      options?: { redirectTo?: string };
    }) => Promise<{ data: any; error: Error | null }>;
    signOut: () => Promise<{ error: Error | null }>;
    getUser: () => Promise<UserResponse>;
  };
  from: (table: string) => {
    select: (columns?: string) => any;
    insert: (data: any) => any;
    update: (data: any) => any;
    delete: () => any;
    eq: (column: string, value: any) => any;
    single: () => any;
  };
};

/**
 * Creates a mock Supabase client for development
 * Returns a client that throws errors for all operations
 */
export function createClient(): MockSupabaseClient {
  const notImplementedError = new Error(
    "Supabase integration not yet implemented. Full backend integration coming in Phase 2."
  );

  const mockAuthResponse: AuthResponse = {
    data: { user: null, session: null },
    error: notImplementedError,
  };

  const mockUserResponse: UserResponse = {
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

/**
 * Singleton instance for convenience
 */
let supabaseInstance: MockSupabaseClient | null = null;

export function getSupabase(): MockSupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}
