"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { LockClosedIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  roomId: string;
  initialIsPublic: boolean;
}

export default function PublicToggle({ roomId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-700/50">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`p-1.5 rounded-lg cursor-help ${
                isPublic ? "bg-emerald-500/10" : "bg-gray-500/10"
              }`}
            >
              {isPublic ? (
                <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <LockClosedIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPublic
                ? "This room is visible to everyone"
                : "This room is only visible to invited members"}
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="flex flex-col">
          <span
            className={`text-sm font-medium ${
              isPublic ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            {isPublic ? "Public Room" : "Private Room"}
          </span>
          <span className="text-xs text-gray-500">
            {isPublic ? "Anyone can join" : "Invite only"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Switch
              checked={isPublic}
              onCheckedChange={toggle}
              disabled={isLoading}
              className={`${
                isPublic
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-gray-700 hover:bg-gray-600"
              } ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              } transition-colors duration-200`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to make room {isPublic ? "private" : "public"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
