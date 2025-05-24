import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import CreateRoom from "@/components/create-room";
import { JoinRoomButton } from "@/components/rooms/join-room-button";
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
          className="h-40 bg-black/40 animate-pulse rounded-xl border border-white/5 backdrop-blur-xl"
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
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-all duration-300">
            <Music2 className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-2xl font-semibold">
            <span className="relative">
              <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                Hosted by You
              </span>
            </span>
          </h2>
        </div>
        {hosted.length === 0 ? (
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardContent className="p-6">
              <p className="text-zinc-400 text-center">
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
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 group-hover:from-fuchsia-500/20 group-hover:to-pink-500/20 transition-all duration-300">
            <Users2 className="w-6 h-6 text-fuchsia-400" />
          </div>
          <h2 className="text-2xl font-semibold">
            <span className="relative">
              <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-fuchsia-200 via-pink-200 to-rose-200 bg-clip-text text-transparent">
                Collaborating
              </span>
            </span>
          </h2>
        </div>
        {collaborated.length === 0 ? (
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardContent className="p-6">
              <p className="text-zinc-400 text-center">
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
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 group-hover:from-pink-500/20 group-hover:to-rose-500/20 transition-all duration-300">
            <Globe className="w-6 h-6 text-pink-400" />
          </div>
          <h2 className="text-2xl font-semibold">
            <span className="relative">
              <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-pink-200 via-rose-200 to-red-200 bg-clip-text text-transparent">
                Public Jam Rooms
              </span>
            </span>
          </h2>
        </div>
        {publicRooms.length === 0 ? (
          <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
            <CardContent className="p-6">
              <p className="text-zinc-400 text-center">
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
    <div className="min-h-screen space-y-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="relative">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
                <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                  Your Jam Rooms
                </span>
              </span>
            </h1>
            <p className="text-zinc-400 mt-2">
              Create, collaborate, and make music together
            </p>
          </div>
          <div className="flex gap-4">
            <CreateRoom />
            <JoinRoomButton />
          </div>
        </div>

        {/* Rooms List */}
        <Suspense fallback={<RoomsSkeleton />}>
          <RoomsContent userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
