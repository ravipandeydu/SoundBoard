import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import CreateRoom from "@/components/create-room";
import { Music2, Users2, Globe } from "lucide-react";
import type { Session } from "next-auth";
import { RoomCard } from "@/components/room-card";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";

// Cache duration in seconds
const CACHE_DURATION = 60;

// Loading skeleton component
function RoomsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50"
        />
      ))}
    </div>
  );
}

// Cache the room fetching
const getRooms = unstable_cache(
  async (userId: string) => {
    const [rooms, allPublic] = await Promise.all([
      prisma.room.findMany({
        where: {
          OR: [{ hostId: userId }, { loops: { some: { userId } } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          bpm: true,
          keySig: true,
          hostId: true,
          isPublic: true,
        },
        take: 10,
      }),
      prisma.room.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          bpm: true,
          keySig: true,
          hostId: true,
        },
        take: 10,
      }),
    ]);

    // Convert dates to ISO strings
    const serializedRooms = rooms.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
    }));

    const serializedPublicRooms = allPublic.map((room) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
    }));

    return {
      rooms: serializedRooms,
      publicRooms: serializedPublicRooms.filter(
        (r) => !serializedRooms.some((ur) => ur.id === r.id)
      ),
    };
  },
  ["rooms"],
  { revalidate: CACHE_DURATION }
);

// Async component to fetch and display rooms
async function RoomsContent({ userId }: { userId: string }) {
  const { rooms, publicRooms } = await getRooms(userId);

  const hosted = rooms.filter((r) => r.hostId === userId);
  const collaborated = rooms.filter((r) => r.hostId !== userId);

  return (
    <>
      {/* Hosted */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <Music2 className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold text-indigo-300">
            Hosted by You
          </h2>
        </div>
        {hosted.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-6">
              <p className="text-gray-400 text-center">
                You haven&apos;t created any rooms yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hosted.map((room) => (
              <RoomCard key={room.id} room={room} isHosted />
            ))}
          </div>
        )}
      </section>

      {/* Collaborating */}
      <section className="space-y-6 mt-12">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Users2 className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-semibold text-purple-300">
            Collaborating
          </h2>
        </div>
        {collaborated.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-6">
              <p className="text-gray-400 text-center">
                Not collaborating in any rooms yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collaborated.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>

      {/* Public Rooms */}
      <section className="space-y-6 mt-12">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <Globe className="w-6 h-6 text-pink-400" />
          </div>
          <h2 className="text-2xl font-semibold text-pink-300">
            Public Jam Rooms
          </h2>
        </div>
        {publicRooms.length === 0 ? (
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
            <CardContent className="p-6">
              <p className="text-gray-400 text-center">
                No public rooms available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default async function RoomsPage() {
  const session = (await getServerSession(authOptions)) as Session;

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 space-y-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
              Your Jam Rooms
            </h1>
            <p className="text-gray-400">
              Create, collaborate, and make music together
            </p>
          </div>
          <CreateRoom />
        </div>

        <Suspense fallback={<RoomsSkeleton />}>
          <RoomsContent userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
