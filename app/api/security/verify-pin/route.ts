import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }

    const userId = await getAnonymousUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { parentPin: true },
    });

    // If no PIN set yet, the first PIN entry creates the PIN
    if (!user?.parentPin) {
      const hashed = await bcrypt.hash(pin, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { parentPin: hashed },
      });
      return NextResponse.json({ success: true, pinCreated: true });
    }

    // Verify existing PIN
    const isValid = await bcrypt.compare(pin, user.parentPin);

    if (isValid) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
