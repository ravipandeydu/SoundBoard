// components/InviteModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface InviteModalProps {
  code: string;
}

export function InviteModal({ code }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    // Only run in the browser
    if (typeof window !== "undefined") {
      setLink(`${window.location.origin}/rooms/join?token=${code}`);
    }
  }, [code]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Jam Room!", url: link });
      } catch {}
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Share Invite</Button>
      </DialogTrigger>
      <DialogContent className="space-y-4">
        <h3 className="text-lg font-medium">Invite Collaborators</h3>
        <Input
          readOnly
          value={link}
          onClick={copyLink}
          className="cursor-pointer"
        />
        <div className="flex gap-2">
          <Button onClick={copyLink}>Copy Link</Button>
          <Button onClick={shareLink}>Share</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
