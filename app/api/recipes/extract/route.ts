// Description: API route to trigger recipe extraction from URL - creates recipe with pending status

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper to detect platform from URL
function detectPlatform(url: string): "tiktok" | "instagram" | "youtube" | "facebook" | null {
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) {
    return "tiktok";
  }
  if (url.includes("instagram.com")) {
    return "instagram";
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "youtube";
  }
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    return "facebook";
  }
  return null;
}

// Helper to validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Supabase (server-side)
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Detect platform
    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { error: "Unsupported platform. Only TikTok, Instagram, YouTube, and Facebook are supported." },
        { status: 400 }
      );
    }

    // Create recipe with pending status using authenticated user's ID
    const { data: recipe, error: createError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        original_url: url,
        platform,
        title: "Processing...",
        status: "pending",
      })
      .select()
      .single();

    if (createError || !recipe) {
      console.error("Error creating recipe:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to create recipe" },
        { status: 500 }
      );
    }

    // TODO: In real implementation, enqueue job to Redis/RQ worker here
    // For now, we simulate async processing with a delayed status update

    // Simulate starting processing
    setTimeout(async () => {
      try {
        await supabase
          .from("recipes")
          .update({ status: "processing" })
          .eq("id", recipe.id);
      } catch (err) {
        console.error("Error updating recipe status in background:", err);
      }
    }, 1000);

    return NextResponse.json({
      recipe_id: recipe.id,
      status: recipe.status,
      message: "Recipe extraction started",
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create recipe";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
