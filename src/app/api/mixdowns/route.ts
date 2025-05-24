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

export async function GET(req: NextRequest) {
  const session = (await getServerSession({
    req,
    ...authOptions,
  })) as CustomSession | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const mixdowns = await prisma.mixdown.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      roomId: true,
      url: true,
    },
  });

  return NextResponse.json(mixdowns);
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession({
    req,
    ...authOptions,
  })) as CustomSession | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const { roomId, url } = await req.json();
    if (!roomId || !url) {
      return NextResponse.json(
        { error: "Missing roomId or url in request body" },
        { status: 400 }
      );
    }

    const mixdown = await prisma.mixdown.create({
      data: {
        userId: session.user.id,
        roomId,
        url,
      },
    });

    return NextResponse.json({
      success: true,
      mixdown,
      message: "Mixdown saved successfully",
    });
  } catch (error) {
    console.error("Error saving mixdown:", error);
    return NextResponse.json(
      { error: "Failed to save mixdown" },
      { status: 500 }
    );
  }
}
