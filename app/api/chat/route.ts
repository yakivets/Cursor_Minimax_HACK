import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatWithCharacter, detectEmotion } from "@/lib/ai/openai";
import { generateSpeech, pickVoiceForCharacter } from "@/lib/ai/elevenlabs";

/**
 * Infer gender and archetype from character info to auto-select a voice.
 */
function autoPickVoice(name: string, description: string | null, personality: string | null): string {
  const text = `${name} ${description || ""} ${personality || ""}`.toLowerCase();

  // Detect gender from textual cues
  const femaleSignals = ["she", "her ", "woman", "lady", "girl", "daughter", "mother", "wife", "queen", "princess", "miss", "mrs", "madam", "heroine", "female", "sister", "aunt", "niece"];
  const maleSignals = ["he ", "his ", "him ", "man", "gentleman", "boy", "son", "father", "husband", "king", "prince", "mr.", "sir", "lord", "hero", "male", "brother", "uncle", "nephew"];

  const femaleScore = femaleSignals.filter(s => text.includes(s)).length;
  const maleScore = maleSignals.filter(s => text.includes(s)).length;
  const gender: "male" | "female" = femaleScore > maleScore ? "female" : "male";

  // Detect archetype
  let archetype = "default";
  if (/wise|old|sage|mentor|elder|professor|scholar|bookish|father/.test(text)) archetype = "wise";
  else if (/young|child|boy|girl|innocent|youthful|bright|student/.test(text)) archetype = "young";
  else if (/dark|brooding|villain|sinister|mysterious|haunted|intense|melanchol/.test(text)) archetype = "dark";
  else if (/charm|suave|smooth|elegant|refined|witty|gallant|dashing/.test(text)) archetype = "charming";
  else if (/gentle|soft|kind|tender|sweet|delicate|fragile|quiet/.test(text)) archetype = "gentle";
  else archetype = "hero";

  return pickVoiceForCharacter(gender, archetype);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: `Chat with ${character.name}`,
          userId: session.user.id,
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

    // Generate AI response
    const aiResponse = await chatWithCharacter(
      character.name,
      character.personality || "",
      character.book.title,
      previousMessages,
      message
    );

    // Detect emotion of the response
    const emotion = await detectEmotion(aiResponse);

    // Generate audio if ElevenLabs is configured
    let audioBase64: string | null = null;
    const voiceSettings = character.voiceSettings
      ? JSON.parse(character.voiceSettings)
      : undefined;

    // Auto-pick a voice if character doesn't have one assigned yet
    let voiceId = character.voiceId;
    if (!voiceId) {
      voiceId = autoPickVoice(character.name, character.description, character.personality);
      // Save it so we use the same voice next time
      await prisma.character.update({
        where: { id: character.id },
        data: { voiceId },
      });
    }

    const audioBuffer = await generateSpeech(
      aiResponse,
      voiceId,
      voiceSettings
    );

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
