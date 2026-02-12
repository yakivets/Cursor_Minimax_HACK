import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { characterId: string } }
) {
  const character = await prisma.character.findUnique({
    where: { id: params.characterId },
    include: {
      book: {
        select: { id: true, title: true, author: true, userId: true },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json(character);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { characterId: string } }
) {
  try {
    await prisma.character.delete({
      where: { id: params.characterId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
}

