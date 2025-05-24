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
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

// Loading skeleton for stats
function StatsSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-700 rounded" />
              <div className="h-9 w-9 bg-gray-700 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-gray-700 rounded" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

// Loading skeleton for recent rooms
function RecentRoomsSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Cache analytics data fetching
const getAnalytics = unstable_cache(
  async (userId: string) => {
    const [hostedRooms, userLoops, userMixdowns, roomsWithLoops] =
      await Promise.all([
        prisma.room.count({
          where: { hostId: userId },
        }),
        prisma.loop.count({
          where: { userId },
        }),
        prisma.mixdown.count({
          where: { userId },
        }),
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

    const averageLoops =
      roomsWithLoops.length > 0
        ? (
            roomsWithLoops.reduce((sum, room) => sum + room._count.loops, 0) /
            roomsWithLoops.length
          ).toFixed(1)
        : "0";

    return {
      hostedRooms,
      userLoops,
      userMixdowns,
      averageLoops,
    };
  },
  ["analytics"],
  { revalidate: 60 } // Revalidate every minute
);

// Cache recent rooms fetching
const getRecentRooms = unstable_cache(
  async (userId: string) => {
    const rooms = await prisma.room.findMany({
      where: {
        OR: [{ hostId: userId }, { loops: { some: { userId } } }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        bpm: true,
        keySig: true,
        createdAt: true,
      },
    });

    return rooms.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
    }));
  },
  ["recent-rooms"],
  { revalidate: 60 }
);

// Analytics content component
async function AnalyticsContent({ userId }: { userId: string }) {
  const { hostedRooms, userLoops, userMixdowns, averageLoops } =
    await getAnalytics(userId);

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
    <>
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
    </>
  );
}

// Recent rooms content component
async function RecentRoomsContent({ userId }: { userId: string }) {
  const recentRooms = await getRecentRooms(userId);

  return (
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
                    dateTime={room.createdAt}
                    className="text-sm text-gray-400"
                  >
                    {new Date(room.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}

export default async function Dashboard() {
  const session = (await getServerSession(authOptions)) as Session;
  if (!session?.user?.id) {
    redirect("/login");
  }

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

      {/* Stats with loading state */}
      <Suspense fallback={<StatsSkeleton />}>
        <AnalyticsContent userId={session.user.id} />
      </Suspense>

      {/* Recent Rooms with loading state */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-indigo-300">
            Recent Jam Rooms
          </h2>
        </div>
        <Suspense fallback={<RecentRoomsSkeleton />}>
          <RecentRoomsContent userId={session.user.id} />
        </Suspense>
      </section>
    </div>
  );
}
