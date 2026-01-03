// Description: React Query hook for fetching and caching current user data

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DEV_USER } from "@/lib/auth/dev-user";

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

async function fetchCurrentUser(): Promise<User> {
  // In development mode, return mock user
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    return DEV_USER;
  }

  // Get authenticated user from Supabase (browser client)
  const supabase = createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new Error("Not authenticated");
  }

  // Fetch profile data from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", authUser.id)
    .single();

  // If profile doesn't exist, create it (workaround for trigger issue)
  if (profileError && profileError.code === "PGRST116") {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || "",
      avatar_url: authUser.user_metadata?.avatar_url || "",
    });

    if (insertError) {
      console.error("Failed to create profile for user:", authUser.id, insertError);
    }

    // Return user data from auth metadata after creating profile
    return {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    };
  }

  if (profileError) {
    console.error("Error fetching user profile:", profileError);
    // Fallback to auth user data if profile doesn't exist
    return {
      id: authUser.id,
      email: authUser.email || "",
      full_name: authUser.user_metadata?.full_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
    };
  }

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  };
}

/**
 * React Query hook for current user data
 * Caches user across the app to eliminate redundant DB calls
 */
export function useCurrentUser() {
  return useQuery<User, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
    retry: 1,
  });
}
