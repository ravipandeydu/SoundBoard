import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Session } from "next-auth";

import RoomClient from "./room-client";

export default async function JamRoom({ params }: { params: { id: string } }) {
  // 1️⃣ Fetch session (Next-Auth v4)
  const session = (await getServerSession(authOptions)) as Session | null;

  // 2️⃣ No session → redirect to login
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const roomId = params.id;

  // 3️⃣ Fetch the full room record
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      host: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(room, "rrrr");

  // 4️⃣ If room doesn't exist → 404
  if (!room || !room.host.name) notFound();

  // 5️⃣ Ensure code field exists or handle absence
  const code = room.code as string | undefined;

  // 6️⃣ Render client component with required props
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <RoomClient
        roomId={room.id}
        userId={userId}
        hostId={room.hostId}
        code={code ?? ""}
        title={room.title ?? "Untitled Room"}
        hostName={room.host.name}
        bpm={room.bpm ?? 120}
        keySig={room.keySig ?? "C"}
      />
    </div>
  );
}
