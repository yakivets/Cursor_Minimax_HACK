import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCharacterPortrait } from "@/lib/ai/openai";

export async function POST(
  _request: Request,
  { params }: { params: { characterId: string } }
) {
  const character = await prisma.character.findUnique({
    where: { id: params.characterId },
    include: { book: { select: { title: true } } },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.illustratedAvatar) {
    return NextResponse.json({ avatar: character.illustratedAvatar });
  }

  const dataUrl = await generateCharacterPortrait(
    character.name,
    character.book.title,
    character.description,
    character.personality
  );

  if (!dataUrl) {
    return NextResponse.json(
      { error: "Image generation unavailable. Check OPENAI_API_KEY and DALL·E access." },
      { status: 503 }
    );
  }

  await prisma.character.update({
    where: { id: params.characterId },
    data: { illustratedAvatar: dataUrl },
  });

  return NextResponse.json({ avatar: dataUrl });
}
