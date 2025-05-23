// app/profile/page.tsx  (server component)

import { prisma } from "@/lib/prisma";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Profile() {
  // 🔐 1. Read the session (v4 helper)
  const session = await getServerSession(authOptions);

  // 🔒 2. Kick unauthenticated users to /login
  if (!session?.user?.id) {
    redirect("/login"); // or return null if you prefer a blank page
  }

  // 🗂 3. Aggregate user stats
  const userId = session.user.id;

  const [hosted, loops, mix] = await Promise.all([
    prisma.room.count({ where: { hostId: userId } }),
    prisma.loop.count({ where: { userId } }),
    0, // placeholder for future mix-down count
  ]);

  // 📊 4. Render the profile numbers
  return (
    <div className="p-8 space-y-4">
      <p>Total Jam Rooms hosted: {hosted}</p>
      <p>Total loops recorded: {loops}</p>
      <p>Total mixdowns exported: {mix}</p>
    </div>
  );
}
