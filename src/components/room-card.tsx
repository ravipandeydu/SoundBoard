"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import PublicToggle from "@/components/public-toggle";
import { Music2, Clock, Hash, Users2 } from "lucide-react";

interface Room {
  id: string;
  title: string;
  createdAt: string;
  bpm: number;
  keySig: string | null;
  hostId: string;
  isPublic?: boolean;
}

export function RoomCard({
  room,
  isHosted = false,
}: {
  room: Room;
  isHosted?: boolean;
}) {
  // Parse the date string to a Date object
  const createdAtDate = new Date(room.createdAt);

  return (
    <Card className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-300" />
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 blur-xl transition-all duration-300" />
      <div className="relative">
        <Link href={`/rooms/${room.id}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-violet-300 group-hover:text-violet-200 transition-colors duration-300">
                  {room.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300">
                  <Clock className="w-4 h-4" />
                  <time dateTime={createdAtDate.toISOString()}>
                    {createdAtDate.toLocaleDateString()}
                  </time>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-violet-300 group-hover:border-violet-500/30 group-hover:bg-violet-500/5 transition-all duration-300">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{room.bpm} BPM</span>
              </div>
              {room.keySig && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-fuchsia-300 group-hover:border-fuchsia-500/30 group-hover:bg-fuchsia-500/5 transition-all duration-300">
                  <Music2 className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{room.keySig}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-pink-300 group-hover:border-pink-500/30 group-hover:bg-pink-500/5 transition-all duration-300">
                <Users2 className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">
                  {isHosted ? "Host" : "Member"}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
        {isHosted && room.isPublic !== undefined && (
          <div className="relative mt-5 px-6 pb-6">
            <PublicToggle roomId={room.id} initialIsPublic={room.isPublic} />
          </div>
        )}
      </div>
    </Card>
  );
}
