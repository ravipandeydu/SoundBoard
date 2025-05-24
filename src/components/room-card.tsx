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
    <Card className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 group-hover:from-indigo-600/10 group-hover:to-purple-600/10 transition-all duration-300" />
      <div className="relative">
        <Link href={`/rooms/${room.id}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300">
                  {room.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-400">
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
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-indigo-300 group-hover:border-indigo-400/30 transition-colors duration-300">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">{room.bpm} BPM</span>
              </div>
              {room.keySig && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-indigo-300 group-hover:border-indigo-400/30 transition-colors duration-300">
                  <Music2 className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{room.keySig}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 text-purple-300 group-hover:border-purple-400/30 transition-colors duration-300">
                <Users2 className="w-3.5 h-3.5" />
                <span className="text-sm font-medium">
                  {isHosted ? "Host" : "Member"}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
        {isHosted && room.isPublic !== undefined && (
          <div className="relative mt-5">
            <PublicToggle roomId={room.id} initialIsPublic={room.isPublic} />
          </div>
        )}
      </div>
    </Card>
  );
}
