import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function GET(
  _request: Request,
  { params }: { params: { characterId: string } }
) {
  const userId = await getAnonymousUserId();

  const conversations = await prisma.conversation.findMany({
    where: {
      characterId: params.characterId,
      userId,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 1,
  });

  return NextResponse.json(conversations[0] || null);
}

