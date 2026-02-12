import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateCharacterProfile,
  generateCharacterPortrait,
} from "@/lib/ai/openai";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function POST(request: Request) {
  try {
    const userId = await getAnonymousUserId();
    const { name, sourceTitle, sourceType, description } = await request.json();

    if (!name || !sourceTitle) {
      return NextResponse.json(
        { error: "Character name and source title are required" },
        { status: 400 }
      );
    }

    // Use OpenAI to generate a full character profile, enriched with user-provided description
    const profile = await generateCharacterProfile(name, sourceTitle, sourceType || "cartoon", description);

    // Merge: prefer the user-provided description if given, otherwise use the AI-generated one
    const finalDescription = description?.trim() || profile.description || null;

    // Save to database
    const character = await prisma.character.create({
      data: {
        name,
        sourceTitle,
        sourceType: sourceType || "cartoon",
        isStandalone: true,
        description: finalDescription,
        personality: profile.personality || null,
        gender: profile.gender || "unknown",
        videoStatus: "none",
        // No bookId — standalone character
      },
    });

    // Generate character portrait in background (fast, ~10s via DALL-E)
    generateCharacterPortrait(
      name,
      sourceTitle,
      finalDescription,
      profile.personality
    )
      .then(async (dataUrl) => {
        if (dataUrl) {
          await prisma.character.update({
            where: { id: character.id },
            data: { illustratedAvatar: dataUrl },
          });
        }
      })
      .catch((err) => console.error(`Portrait gen failed for ${name}:`, err));

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error("Add manual character error:", error);
    return NextResponse.json(
      { error: "Failed to create character" },
      { status: 500 }
    );
  }
}
