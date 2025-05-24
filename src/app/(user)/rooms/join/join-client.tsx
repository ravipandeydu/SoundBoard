"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

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

  return <p>Joining…</p>;
}
