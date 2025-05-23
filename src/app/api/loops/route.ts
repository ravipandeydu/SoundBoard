// app/api/loops/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { uploadBlob } from "@/lib/blob";
import { Session } from "next-auth";

interface CustomSession extends Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

/* ------------------------------------------------------------------ */
/*  POST /api/loops  – upload a recorded blob and create Loop record  */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as CustomSession | null;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const fd = await req.formData();

  const file = fd.get("file") as Blob | null;
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const roomId = fd.get("roomId") as string;
  const name = (fd.get("name") ?? "Untitled") as string;
  const order = Number(fd.get("order") ?? 0);

  try {
    // Run file upload and database operation in parallel
    const [url, loop] = await Promise.all([
      uploadBlob(file),
      prisma.loop.create({
        data: {
          roomId,
          userId: session.user.id,
          name,
          order,
          // Temporary URL that will be updated
          url: "",
        },
      }),
    ]);

    // Update the loop with the actual URL
    const updatedLoop = await prisma.loop.update({
      where: { id: loop.id },
      data: { url },
      select: {
        id: true,
        name: true,
        url: true,
        enabled: true,
        order: true,
        volume: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLoop);
  } catch (error) {
    console.error("Error creating loop:", error);
    return NextResponse.json(
      { error: "Failed to create loop" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/loops?roomId=…  – list loops for a room                   */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  // Optimize the query by selecting only necessary fields
  const baseSelect = {
    id: true,
    name: true,
    url: true,
    enabled: true,
    order: true,
    volume: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  try {
    if (roomId) {
      const loops = await prisma.loop.findMany({
        where: { roomId },
        orderBy: { order: "asc" },
        select: baseSelect,
      });

      // Cache the response for 5 seconds
      return new NextResponse(JSON.stringify(loops), {
        headers: {
          "Cache-Control": "public, s-maxage=5",
        },
      });
    }

    const session = (await getServerSession(
      authOptions
    )) as CustomSession | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const loops = await prisma.loop.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        ...baseSelect,
        roomId: true,
        room: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(loops);
  } catch (error) {
    console.error("Error fetching loops:", error);
    return NextResponse.json(
      { error: "Failed to fetch loops" },
      { status: 500 }
    );
  }
}
