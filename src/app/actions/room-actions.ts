"use server";

import { prisma } from "@/lib/prisma";

export async function togglePublicRoom(formData: FormData) {
  const roomId = formData.get("roomId") as string;
  const makePublic = formData.get("makePublic") === "true";

  await prisma.room.update({
    where: { id: roomId },
    data: { isPublic: makePublic },
  });
}
