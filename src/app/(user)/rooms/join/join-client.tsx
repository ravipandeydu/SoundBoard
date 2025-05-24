"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function JoinClient() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (!token) return router.replace("/");

    fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.roomId) {
          toast.success("Successfully joined the room!");
          router.replace(`/rooms/${data.roomId}`);
        } else {
          toast.error("Failed to join room");
          router.replace("/");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to join room");
        router.replace("/");
      });
  }, [token, router]);

  return (
    <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-t-violet-500 border-r-fuchsia-500 border-b-pink-500 border-l-violet-500 rounded-full animate-spin" />
          <p className="text-zinc-400">Joining room...</p>
        </div>
      </CardContent>
    </Card>
  );
}
