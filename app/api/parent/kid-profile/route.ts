import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnonymousUserId } from "@/lib/anonymousUser";

export async function GET() {
  const userId = await getAnonymousUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kidProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = user.kidProfile ? JSON.parse(user.kidProfile) : null;
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const userId = await getAnonymousUserId();
  const { profile } = await request.json();

  if (!profile || typeof profile !== "object") {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  // Only keep the fields we expect
  const clean = {
    name: String(profile.name || "").trim().slice(0, 50),
    age: String(profile.age || "").trim().slice(0, 10),
    interests: String(profile.interests || "").trim().slice(0, 500),
    favourites: String(profile.favourites || "").trim().slice(0, 500),
    notes: String(profile.notes || "").trim().slice(0, 500),
  };

  await prisma.user.update({
    where: { id: userId },
    data: { kidProfile: JSON.stringify(clean) },
  });

  return NextResponse.json({ success: true, profile: clean });
}
