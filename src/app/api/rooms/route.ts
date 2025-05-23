// app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // pass the current request so the helper can read cookies / headers
  const session = await getServerSession({ req, ...authOptions });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

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

  return NextResponse.json(room);
}
