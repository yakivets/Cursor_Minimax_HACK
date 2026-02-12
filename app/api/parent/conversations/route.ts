import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function GET() {
  try {
    const userId = await getAnonymousUserId();

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        character: {
          select: { name: true, sourceTitle: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.messages.length,
      0
    );
    const totalDuration = conversations.reduce(
      (sum, c) => sum + (c.durationSecs || 0),
      0
    );

    // Most frequent character
    const charCounts: Record<string, { name: string; count: number }> = {};
    for (const c of conversations) {
      const name = c.character.name;
      if (!charCounts[name]) charCounts[name] = { name, count: 0 };
      charCounts[name].count++;
    }
    const topCharacter =
      Object.values(charCounts).sort((a, b) => b.count - a.count)[0]?.name ||
      "None yet";

    return NextResponse.json({
      conversations,
      stats: {
        totalConversations,
        totalMessages,
        totalDuration,
        topCharacter,
      },
    });
  } catch (error) {
    console.error("Parent conversations error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
