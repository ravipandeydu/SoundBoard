// app/(your-folder)/dashboard/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  HomeIcon,
  MusicalNoteIcon,
  ArrowTrendingUpIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";

export default async function Dashboard() {
  // 🔐 Fetch session
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  // Fetch analytics data
  const [hostedRooms, userLoops, userMixdowns, roomsWithLoops] =
    await Promise.all([
      // Total rooms hosted
      prisma.room.count({
        where: { hostId: userId },
      }),
      // Total loops recorded
      prisma.loop.count({
        where: { userId },
      }),
      // Total mixdown exports
      prisma.mixdown.count({
        where: { userId },
      }),
      // Rooms with their loop counts for average calculation
      prisma.room.findMany({
        where: {
          OR: [{ hostId: userId }, { loops: { some: { userId } } }],
        },
        include: {
          _count: {
            select: { loops: true },
          },
        },
      }),
    ]);

  // Calculate average loops per session
  const averageLoops =
    roomsWithLoops.length > 0
      ? (
          roomsWithLoops.reduce((sum, room) => sum + room._count.loops, 0) /
          roomsWithLoops.length
        ).toFixed(1)
      : "0";

  // Fetch recent rooms (keep existing code)
  const recentRooms = await prisma.room.findMany({
    where: {
      OR: [{ hostId: userId }, { loops: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    {
      title: "Total Jam Rooms Hosted",
      value: hostedRooms,
      icon: HomeIcon,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Total Loops Recorded",
      value: userLoops,
      icon: MusicalNoteIcon,
      color: "from-purple-500 to-pink-600",
    },
    {
      title: "Total Mixdowns Exported",
      value: userMixdowns,
      icon: Square2StackIcon,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Average Loops per Session",
      value: averageLoops,
      icon: ArrowTrendingUpIcon,
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
          Profile Analytics
        </h1>
        <p className="text-gray-400 mt-2">
          Track your musical journey and collaboration stats
        </p>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ title, value, icon: Icon, color }) => (
          <Card
            key={title}
            className="bg-gray-800 border-gray-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {title}
                </CardTitle>
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-10`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-100">{value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Rooms */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-indigo-300">
            Recent Jam Rooms
          </h2>
        </div>
        <div className="grid gap-4">
          {recentRooms.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <p className="text-gray-400">No rooms yet 🎸</p>
              </CardContent>
            </Card>
          ) : (
            recentRooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all hover:shadow-xl hover:shadow-indigo-500/10 group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-indigo-300 group-hover:text-indigo-200">
                          {room.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {room.bpm} BPM
                          {room.keySig ? ` • ${room.keySig}` : ""}
                        </p>
                      </div>
                      <time
                        dateTime={room.createdAt.toISOString()}
                        className="text-sm text-gray-400"
                      >
                        {room.createdAt.toLocaleDateString()}
                      </time>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
