// app/api/rooms/join/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    // Find the room by code
    const room = await prisma.room.findUnique({
      where: { code },
      select: { id: true, isPublic: true, hostId: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if the room is public or if the user is the host
    if (!room.isPublic && room.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "This room is private" },
        { status: 403 }
      );
    }

    return NextResponse.json({ roomId: room.id }, { status: 200 });
  } catch (error) {
    console.error("JOIN_ROOM_ERROR:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
