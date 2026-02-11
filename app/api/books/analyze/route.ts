import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  analyzeBook,
  fetchBookSummary,
  getBookCoverUrl,
} from "@/lib/openai";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, author } = await req.json();

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    // Check if book already exists
    const existingBook = await prisma.book.findUnique({
      where: { title_author: { title, author } },
      include: { characters: true },
    });

    if (existingBook) {
      return NextResponse.json({
        book: existingBook,
        characters: existingBook.characters,
        message: "Book already exists",
      });
    }

    // Fetch book summary from Open Library
    const [summary, coverUrl] = await Promise.all([
      fetchBookSummary(title, author),
      getBookCoverUrl(title, author),
    ]);

    // Analyze book with OpenAI
    const analysis = await analyzeBook(title, author, summary || undefined);

    // Create book in database
    const book = await prisma.book.create({
      data: {
        title,
        author,
        summary: analysis.summary || summary,
        coverImageUrl: coverUrl,
        genre: analysis.genre,
        addedById: (session.user as any).id,
      },
    });

    // Create characters
    const characters = await Promise.all(
      analysis.characters.map((char) =>
        prisma.character.create({
          data: {
            bookId: book.id,
            name: char.name,
            role: char.role,
            personalityTraits: JSON.stringify(char.personalityTraits),
            speakingStyle: char.speakingStyle,
            background: char.memorableMoments?.join(". ") || "",
            relationships: JSON.stringify(char.relationships),
            memorableQuotes: JSON.stringify(char.memorableMoments),
          },
        })
      )
    );

    return NextResponse.json({ book, characters }, { status: 201 });
  } catch (error: any) {
    console.error("Book analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze book" },
      { status: 500 }
    );
  }
}
