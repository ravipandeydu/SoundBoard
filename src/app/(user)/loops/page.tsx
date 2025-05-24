"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlayIcon,
  PauseIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/solid";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

// Loop with nested room title
interface Loop {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  volume: number;
  room: { id: string; title: string };
}

export default function LoopsPage() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    fetchLoops();
  }, []);

  const fetchLoops = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/loops");
      if (!res.ok) throw new Error("Failed to load loops");
      const data: Loop[] = await res.json();
      setLoops(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (loop: Loop) => {
    const audio = audioRefs.current[loop.id];
    if (!audio) return;
    if (playingId === loop.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause other
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }
      // Reset and initialize progress immediately
      setProgress((p) => ({ ...p, [loop.id]: 0 }));
      // Set time update handler before play
      audio.ontimeupdate = () => {
        setProgress((p) => ({
          ...p,
          [loop.id]: audio.currentTime / (audio.duration || 1),
        }));
      };
      audio.onended = () => setPlayingId(null);
      audio.currentTime = 0;
      setPlayingId(loop.id);
      audio.play();
    }
  };

  const setEnabled = async (loop: Loop, enabled: boolean) => {
    try {
      const res = await fetch(`/api/loops/${loop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, volume: loop.volume }),
      });
      if (!res.ok) throw new Error("Failed to update loop");
      await fetchLoops();
      toast.success(`Loop ${enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update loop status");
    }
  };

  const setVolume = async (loop: Loop, volume: number) => {
    const audio = audioRefs.current[loop.id];
    if (audio) audio.volume = volume;
    try {
      await fetch(`/api/loops/${loop.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: loop.enabled, volume }),
      });
    } catch {
      toast.error("Failed to update volume");
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          <span className="relative">
            <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
            <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
              My Loops
            </span>
          </span>
        </h1>
        <p className="text-zinc-400 mt-2">
          Manage your recorded loops across all jam rooms
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="bg-black/40 border-white/5 backdrop-blur-xl animate-pulse"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 bg-white/10 rounded" />
                  <div>
                    <div className="h-5 w-32 bg-white/10 rounded mb-2" />
                    <div className="h-4 w-24 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="h-12 bg-white/10 rounded" />
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 bg-white/10 rounded" />
                  <div className="h-2 flex-1 bg-white/10 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : loops.length === 0 ? (
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <MusicalNoteIcon className="w-12 h-12 text-zinc-500 mx-auto" />
              <p className="text-zinc-400">
                You haven&apos;t recorded any loops yet. Head to a jam room to
                start recording!
              </p>
              <Link
                href="/rooms"
                className="inline-block mt-4 text-violet-400 hover:text-violet-300 transition-colors"
              >
                Browse Jam Rooms →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map((loop) => (
            <Card
              key={loop.id}
              className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-300" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 blur-xl transition-all duration-300" />
              <CardHeader className="pb-2 relative">
                <CardTitle className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-violet-300 group-hover:text-violet-200 transition-colors">
                      {loop.name}
                    </div>
                    <Link
                      href={`/rooms/${loop.room.id}`}
                      className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors"
                    >
                      {loop.room.title}
                    </Link>
                  </div>
                  <button
                    onClick={() => togglePlay(loop)}
                    className="p-2 bg-black/40 hover:bg-white/5 border border-white/10 rounded-full transition-all"
                  >
                    {playingId === loop.id ? (
                      <PauseIcon className="w-5 h-5 text-violet-400" />
                    ) : (
                      <PlayIcon className="w-5 h-5 text-violet-400" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                {/* Progress bar */}
                <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-100"
                    style={{ width: `${(progress[loop.id] || 0) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      Volume
                    </span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[loop.volume || 1]}
                      onValueChange={([v]) => setVolume(loop, v)}
                      className="flex-1"
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Switch
                          checked={loop.enabled}
                          onCheckedChange={(enabled) =>
                            setEnabled(loop, enabled)
                          }
                          className="data-[state=checked]:bg-violet-500"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {loop.enabled
                            ? "Disable in jam room"
                            : "Enable in jam room"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <audio
                  ref={(el) => {
                    if (el) audioRefs.current[loop.id] = el;
                  }}
                  src={loop.url}
                  preload="metadata"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
