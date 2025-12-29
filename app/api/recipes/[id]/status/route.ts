// Description: API route to check recipe extraction status

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = params.id;

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: recipe, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (error || !recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }

    // Calculate progress based on status
    // Status flow: pending -> downloading -> extracting_audio -> transcribing -> analyzing -> completed
    const progressMap: Record<string, number> = {
      pending: 5,
      downloading: 15,
      extracting_audio: 35,
      transcribing: 55,
      analyzing: 80,
      completed: 100,
      failed: 0,
    };

    return NextResponse.json({
      recipe_id: recipe.id,
      status: recipe.status,
      progress: progressMap[recipe.status] || 0,
      title: recipe.title,
      thumbnail_url: recipe.thumbnail_url,
      updated_at: recipe.created_at,
    });
  } catch (error) {
    console.error("Error fetching recipe status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch recipe status";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
