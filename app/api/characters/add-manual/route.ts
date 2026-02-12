import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCharacterProfile } from "@/lib/ai/openai";
import { generateCharacterSpeakingVideo } from "@/lib/ai/minimax-video";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function POST(request: Request) {
  try {
    const userId = await getAnonymousUserId();
    const { name, sourceTitle, sourceType } = await request.json();

    if (!name || !sourceTitle) {
      return NextResponse.json(
        { error: "Character name and source title are required" },
        { status: 400 }
      );
    }

    // Use OpenAI to generate a full character profile
    const profile = await generateCharacterProfile(name, sourceTitle, sourceType || "cartoon");

    // Save to database
    const character = await prisma.character.create({
      data: {
        name,
        sourceTitle,
        sourceType: sourceType || "cartoon",
        isStandalone: true,
        description: profile.description || null,
        personality: profile.personality || null,
        gender: profile.gender || "unknown",
        videoStatus: "pending",
        // No bookId — standalone character
      },
    });

    // Trigger Minimax video generation in background
    if (profile.description) {
      generateCharacterSpeakingVideo(character.id, profile.description).catch(
        (err) => console.error(`Video gen failed for ${name}:`, err)
      );
    }

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error("Add manual character error:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}
