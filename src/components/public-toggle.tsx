"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  roomId: string;
  initialIsPublic: boolean;
}

export default function PublicToggle({ roomId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const router = useRouter();

  const toggle = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
        toast.success(`Room is now ${!isPublic ? "public" : "private"}`);
        router.refresh();
      } else {
        throw new Error("Failed to update room visibility");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update room visibility");
    }
  };

  return (
    <div className="p-4 border-t flex items-center justify-between">
      <span
        className={
          isPublic
            ? "inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
            : "inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
        }
      >
        {isPublic ? "Public" : "Private"}
      </span>
      <button
        onClick={toggle}
        className="text-sm underline hover:text-indigo-600"
      >
        {isPublic ? "Make Private" : "Make Public"}
      </button>
    </div>
  );
}
