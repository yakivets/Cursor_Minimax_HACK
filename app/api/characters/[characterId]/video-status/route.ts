import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { characterId: string } }
) {
  const character = await prisma.character.findUnique({
    where: { id: params.characterId },
    select: { videoStatus: true, speakingVideoUrl: true },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json(character);
}
