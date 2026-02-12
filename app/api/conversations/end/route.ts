import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { conversationId, durationSecs } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        endedAt: new Date(),
        durationSecs: durationSecs || 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End conversation error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
