// app/api/loops/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import type { Session } from "next-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loopId = params.id;
  const { enabled, volume, order } = await req.json();

  // Validate the payload
  if (
    (enabled !== undefined && typeof enabled !== "boolean") ||
    (volume !== undefined && typeof volume !== "number") ||
    (order !== undefined && typeof order !== "number")
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid payload: enabled must be boolean, volume and order must be numbers.",
      },
      { status: 400 }
    );
  }

  // Check if user has permission to update this loop
  const loop = await prisma.loop.findUnique({
    where: { id: loopId },
    include: { room: { select: { hostId: true } } },
  });

  if (!loop) {
    return NextResponse.json({ error: "Loop not found" }, { status: 404 });
  }

  // Only allow loop owner or room host to update the loop
  if (loop.userId !== session.user.id && loop.room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build update data
  const data: Record<string, any> = {};
  if (enabled !== undefined) data.enabled = enabled;
  if (volume !== undefined) data.volume = volume;
  if (order !== undefined) data.order = order;

  const updated = await prisma.loop.update({
    where: { id: loopId },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loopId = params.id;

  // Check if user has permission to delete this loop
  const loop = await prisma.loop.findUnique({
    where: { id: loopId },
    include: { room: { select: { hostId: true } } },
  });

  if (!loop) {
    return NextResponse.json({ error: "Loop not found" }, { status: 404 });
  }

  // Only allow loop owner or room host to delete the loop
  if (loop.userId !== session.user.id && loop.room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.loop.delete({
    where: { id: loopId },
  });

  return NextResponse.json({ success: true });
}
