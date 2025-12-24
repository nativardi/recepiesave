// Description: Get current user for client-side usage - returns dev user in dev mode, otherwise fetches from Supabase

import { DEV_USER } from "./dev-user";
import { createClient } from "@/lib/supabase/client";

export async function getCurrentUser(): Promise<User> {
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

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};
