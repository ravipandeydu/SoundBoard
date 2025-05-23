"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import PublicToggle from "@/components/public-toggle";
import { Music2, Clock, Hash } from "lucide-react";

interface Room {
  id: string;
  title: string;
  createdAt: Date;
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
  return (
    <Card className="group relative overflow-hidden bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:bg-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 group-hover:from-indigo-600/10 group-hover:to-purple-600/10 transition-all duration-300" />
      <Link href={`/rooms/${room.id}`} className="block relative">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300">
                {room.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <time dateTime={room.createdAt.toISOString()}>
                  {room.createdAt.toLocaleDateString()}
                </time>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-800/50 border border-gray-600 text-indigo-300 group-hover:border-indigo-400/50 transition-colors duration-300">
              <Hash className="w-3.5 h-3.5" />
              <span className="text-sm">{room.bpm} BPM</span>
            </div>
            {room.keySig && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-800/50 border border-gray-600 text-indigo-300 group-hover:border-indigo-400/50 transition-colors duration-300">
                <Music2 className="w-3.5 h-3.5" />
                <span className="text-sm">{room.keySig}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
      {isHosted && room.isPublic !== undefined && (
        <div className="px-6 pb-4 relative">
          <PublicToggle roomId={room.id} initialIsPublic={room.isPublic} />
        </div>
      )}
    </Card>
  );
}
