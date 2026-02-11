import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import openai, { buildCharacterSystemPrompt } from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Conversation ID and message are required" },
        { status: 400 }
      );
    }

    // Fetch conversation with character info
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        character: { include: { book: true } },
        messages: {
          orderBy: { timestamp: "asc" },
          take: 20, // last 20 messages for context
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { character } = conversation;

    // Save user message
    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: message,
      },
    });

    // Build system prompt
    const systemPrompt = buildCharacterSystemPrompt(
      character.name,
      character.book.title,
      character.book.author,
      character.personalityTraits || "",
      character.speakingStyle || "",
      character.background || "",
      character.relationships || ""
    );

    // Build message history
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation history
    for (const msg of conversation.messages) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      stream: true,
      temperature: 0.85,
      max_tokens: 1000,
    });

    // Set up streaming response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant message to database
          await prisma.message.create({
            data: {
              conversationId,
              role: "assistant",
              content: fullResponse,
            },
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
