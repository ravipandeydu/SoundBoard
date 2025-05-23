// app/api/rooms/[roomId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  // 1️⃣ Auth
  const session = await getServerSession({ req, ...authOptions });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2️⃣ Fetch room
  const { roomId } = params;
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      title: true,
      bpm: true,
      keySig: true,
      code: true,
      isPublic: true,
      hostId: true,
      createdAt: true,
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // 3️⃣ Return
  return NextResponse.json(room);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  // 1️⃣ Auth
  const session = await getServerSession({ req, ...authOptions });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { roomId } = params;
  // 2️⃣ Ensure the user is the host
  const existing = await prisma.room.findUnique({
    where: { id: roomId },
    select: { hostId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (existing.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3️⃣ Parse updates
  const { title, bpm, keySig, isPublic } = await req.json();
  const data: Record<string, any> = {};
  if (title !== undefined) data.title = title;
  if (bpm !== undefined) data.bpm = bpm;
  if (keySig !== undefined) data.keySig = keySig;
  if (isPublic !== undefined) data.isPublic = isPublic;

  // 4️⃣ Perform update
  const updated = await prisma.room.update({
    where: { id: roomId },
    data,
    select: {
      id: true,
      title: true,
      bpm: true,
      keySig: true,
      code: true,
      isPublic: true,
      hostId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
