import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeSource } from "@/lib/ai/openai";
import { getAnonymousUserId } from "@/lib/anonymousUser";
import { generateCharacterSpeakingVideo } from "@/lib/ai/minimax-video";

export async function GET() {
  const userId = await getAnonymousUserId();

  const books = await prisma.book.findMany({
    where: { userId },
    include: {
      characters: {
        select: {
          id: true,
          name: true,
          illustratedAvatar: true,
          speakingVideoUrl: true,
          videoStatus: true,
        },
      },
      _count: { select: { characters: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const userId = await getAnonymousUserId();

  try {
    const { title, author, description, coverImage, sourceType } = await request.json();

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author/creator are required" },
        { status: 400 }
      );
    }

    const type = sourceType || "book";

    // Create the book/source
    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        coverImage,
        sourceType: type,
        userId,
      },
    });

    // Analyze with AI and create characters
    try {
      const analysis = await analyzeSource(title, author, type, description);

      // Update book with analysis
      await prisma.book.update({
        where: { id: book.id },
        data: { analysis: analysis.analysis },
      });

      // Create characters from analysis and trigger video generation
      if (analysis.characters && analysis.characters.length > 0) {
        for (const charData of analysis.characters) {
          const character = await prisma.character.create({
            data: {
              name: charData.name,
              description: charData.description,
              personality: charData.personality,
              gender: charData.gender || "unknown",
              sourceType: type,
              sourceTitle: title,
              videoStatus: "pending",
              bookId: book.id,
            },
          });

          // Fire-and-forget video generation
          if (charData.description) {
            generateCharacterSpeakingVideo(
              character.id,
              charData.description
            ).catch((err) => {
              console.error(`Video gen failed for ${charData.name}:`, err);
            });
          }
        }
      }
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
    }

    // Return the book with characters
    const fullBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        characters: true,
        _count: { select: { characters: true } },
      },
    });

    return NextResponse.json(fullBook);
  } catch (error) {
    console.error("Book creation error:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
