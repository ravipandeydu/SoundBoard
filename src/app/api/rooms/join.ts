// pages/api/rooms/join.ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });

  const { code } = req.body;
  const room = await prisma.room.findUnique({ where: { code } });
  console.log(room, "r11111111111");
  if (!room) return res.status(404).json({ error: "Invalid invite link" });

  // Optionally record that user joined (e.g. create a Participant record)
  return res.status(200).json({ roomId: room.id });
}
