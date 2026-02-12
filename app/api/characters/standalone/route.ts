import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const characters = await prisma.character.findMany({
    where: { isStandalone: true },
    select: {
      id: true,
      name: true,
      illustratedAvatar: true,
      speakingVideoUrl: true,
      videoStatus: true,
      sourceTitle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(characters);
}
