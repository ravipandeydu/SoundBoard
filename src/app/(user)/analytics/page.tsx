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
        <Card
          key={i}
          className="bg-black/40 border-white/5 backdrop-blur-sm animate-pulse"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-9 w-9 bg-white/10 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-white/10 rounded" />
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
        <Card key={i} className="bg-black/40 border-white/5 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
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
      color: "from-violet-500 to-fuchsia-600",
      glowColor: "violet",
    },
    {
      title: "Total Loops Recorded",
      value: userLoops,
      icon: MusicalNoteIcon,
      color: "from-fuchsia-500 to-pink-600",
      glowColor: "fuchsia",
    },
    {
      title: "Total Mixdowns Exported",
      value: userMixdowns,
      icon: Square2StackIcon,
      color: "from-pink-500 to-rose-600",
      glowColor: "pink",
    },
    {
      title: "Average Loops per Session",
      value: averageLoops,
      icon: ArrowTrendingUpIcon,
      color: "from-rose-500 to-red-600",
      glowColor: "rose",
    },
  ];

  return (
    <>
      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ title, value, icon: Icon, color, glowColor }) => (
          <Card
            key={title}
            className="group relative bg-black/40 border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all duration-300"
          >
            <div
              className={`absolute inset-0 rounded-xl bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />
            <div
              className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
            />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-white/80 transition-colors">
                  {title}
                </CardTitle>
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${color} group-hover:shadow-lg group-hover:shadow-${glowColor}-500/20 transition-all duration-300`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                {value}
              </div>
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
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <p className="text-zinc-400">No rooms yet 🎸</p>
          </CardContent>
        </Card>
      ) : (
        recentRooms.map((room) => (
          <Link key={room.id} href={`/rooms/${room.id}`}>
            <Card className="group relative bg-black/40 border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-300" />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 blur-xl transition-all duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-violet-300 group-hover:text-violet-200 transition-colors">
                      {room.title}
                    </p>
                    <p className="text-sm text-zinc-400 group-hover:text-zinc-300 mt-1">
                      {room.bpm} BPM
                      {room.keySig ? ` • ${room.keySig}` : ""}
                    </p>
                  </div>
                  <time
                    dateTime={room.createdAt}
                    className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors"
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
    <div className="space-y-8">
      <div>
        <div className="relative">
          <h1 className="text-4xl font-bold">
            <span className="relative">
              <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                Profile Analytics
              </span>
            </span>
          </h1>
          <p className="text-zinc-400 mt-2">
            Track your musical journey and collaboration stats
          </p>
        </div>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <AnalyticsContent userId={session.user.id} />
      </Suspense>

      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Recent Rooms</h2>
        <Suspense fallback={<RecentRoomsSkeleton />}>
          <RecentRoomsContent userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
