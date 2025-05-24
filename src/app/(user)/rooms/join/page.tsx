import { Suspense } from "react";
import JoinClient from "./join-client";

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense
        fallback={<div className="text-zinc-400 animate-pulse">Loading...</div>}
      >
        <JoinClient />
      </Suspense>
    </div>
  );
}
