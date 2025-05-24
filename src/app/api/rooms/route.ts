// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Session } from "next-auth";

interface CustomSession extends Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export async function POST(req: NextRequest) {
  // pass the current request so the helper can read cookies / headers
  const session = (await getServerSession({
    req,
    ...authOptions,
  })) as CustomSession | null;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { title, bpm, keySig, isPublic } = await req.json();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();

    const room = await prisma.room.create({
      data: {
        title,
        bpm,
        keySig,
        isPublic,
        hostId: session.user.id,
        code,
      },
    });

    return NextResponse.json({
      success: true,
      room,
      message: "Room created successfully",
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
