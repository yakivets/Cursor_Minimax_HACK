import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function POST() {
  try {
    const userId = await getAnonymousUserId();

    await prisma.user.update({
      where: { id: userId },
      data: { parentPin: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
