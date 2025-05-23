// app/api/rooms/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse invite code (you called it “code” in your fetch)
  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  // 3. Lookup room
  const room = await prisma.room.findUnique({
    where: { code },
  });
  if (!room) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  // 4. (Optional) Record participant entry here…

  // 5. Success → return the roomId
  return NextResponse.json({ roomId: room.id });
}
