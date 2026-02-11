import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET: list user's conversations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        character: {
          include: { book: true },
        },
        messages: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST: create a new conversation
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { characterId } = await req.json();

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 }
      );
    }

    // Check if there's an existing conversation
    const existing = await prisma.conversation.findFirst({
      where: { userId, characterId },
      include: {
        character: { include: { book: true } },
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { book: true },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        characterId,
        title: `Chat with ${character.name}`,
      },
      include: {
        character: { include: { book: true } },
        messages: true,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
