import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getAnonymousUserId();

  const book = await prisma.book.findFirst({
    where: { id: params.id, userId },
    include: {
      characters: true,
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getAnonymousUserId();

  await prisma.book.deleteMany({
    where: { id: params.id, userId },
  });

  return NextResponse.json({ success: true });
}

