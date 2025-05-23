"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
        if (data.roomId) router.replace(`/rooms/${data.roomId}`);
        else router.replace("/");
      });
  }, [token, router]);

  return <p>Joining…</p>;
}
