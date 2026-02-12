import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatWithCharacter, detectEmotion } from "@/lib/ai/openai";
import {
  generateMinimaxVoice,
  inferGender,
  type CharacterGender,
} from "@/lib/ai/minimax-voice";
import { getAnonymousUser } from "@/lib/anonymousUser";

export async function POST(request: Request) {
  try {
    const user = await getAnonymousUser();
    const userId = user.id;
    const { characterId, conversationId, message } = await request.json();

    if (!characterId || !message) {
      return NextResponse.json(
        { error: "Character ID and message are required" },
        { status: 400 }
      );
    }

    // Get the character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: { book: { select: { title: true } } },
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const bookTitle = character.book?.title || character.sourceTitle || "Unknown";

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: `Chat with ${character.name}`,
          userId,
          characterId: character.id,
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: "user",
        conversationId: conversation.id,
      },
    });

    // Get previous messages for context
    const previousMessages = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build kid context from parent-provided profile
    let kidContext: string | null = null;
    if (user.kidProfile) {
      try {
        const kp = JSON.parse(user.kidProfile);
        const parts: string[] = [];
        if (kp.name) parts.push(`Their name is ${kp.name}.`);
        if (kp.age) parts.push(`They are ${kp.age} years old.`);
        if (kp.interests) parts.push(`Interests & hobbies: ${kp.interests}.`);
        if (kp.favourites) parts.push(`Favourite things: ${kp.favourites}.`);
        if (kp.notes) parts.push(`Extra info: ${kp.notes}.`);
        if (parts.length > 0) kidContext = parts.join(" ");
      } catch { /* ignore bad JSON */ }
    }

    // Generate AI response
    const aiResponse = await chatWithCharacter(
      character.name,
      character.personality || "",
      bookTitle,
      previousMessages,
      message,
      kidContext
    );

    // Determine gender — use stored value or infer it
    let gender: CharacterGender =
      character.gender === "female" ? "female" : "male";

    if (character.gender === "unknown") {
      gender = inferGender(character.name, character.description, character.personality);
      // Save for next time (fire-and-forget)
      prisma.character.update({
        where: { id: character.id },
        data: { gender },
      }).catch(() => {});
    }

    // Run emotion detection + TTS in parallel for speed
    const [emotion, audioBuffer] = await Promise.all([
      detectEmotion(aiResponse),
      generateMinimaxVoice(aiResponse, gender, "neutral"),
    ]);

    let audioBase64: string | null = null;
    if (audioBuffer) {
      audioBase64 = Buffer.from(audioBuffer).toString("base64");
    }

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        emotionalState: emotion,
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
      emotion,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
