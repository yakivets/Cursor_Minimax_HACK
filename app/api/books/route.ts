import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeBook } from "@/lib/ai/openai";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    include: {
      characters: {
        select: { id: true, name: true, illustratedAvatar: true },
      },
      _count: { select: { characters: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, author, description, coverImage } = await request.json();

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    // Create the book
    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        coverImage,
        userId: session.user.id,
      },
    });

    // Analyze the book with AI and create characters
    try {
      const analysis = await analyzeBook(title, author, description);

      // Update book with analysis
      await prisma.book.update({
        where: { id: book.id },
        data: { analysis: analysis.analysis },
      });

      // Create characters from analysis
      if (analysis.characters && analysis.characters.length > 0) {
        for (const charData of analysis.characters) {
          await prisma.character.create({
            data: {
              name: charData.name,
              description: charData.description,
              personality: charData.personality,
              bookId: book.id,
            },
          });
        }
      }
    } catch (aiError) {
      console.error("AI analysis error:", aiError);
      // Book is still created, just without AI analysis
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
