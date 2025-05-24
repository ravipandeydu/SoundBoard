"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JoinRoomModal } from "./join-room-modal";

export function JoinRoomButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-36 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
      >
        Join Room
      </Button>

      <JoinRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
