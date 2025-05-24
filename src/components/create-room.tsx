"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { PlusIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(2, "Enter a room title"),
  bpm: z.number().int().min(40, "Too slow").max(240, "Too fast"),
  keySig: z.string().regex(/^[A-G](#|b)?$/, "Invalid key signature format"),
});

type FormData = z.infer<typeof formSchema>;

// Common key signatures in western music
const KEY_SIGNATURES = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B", // Sharp keys
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb", // Flat keys
] as const;

const defaultValues: FormData = {
  title: "",
  bpm: 120,
  keySig: "C",
};

export default function CreateRoom() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          isPublic: false,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create room");
      }

      const data = await res.json();
      router.push(`/rooms/${data.id}`);
      toast.success("Room created successfully!");
    } catch {
      toast.error("Failed to create room");
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="relative group overflow-hidden bg-black/40 hover:bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 transition-all duration-300" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 blur-xl transition-all duration-300" />
        <span className="relative flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Room
        </span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                <MusicalNoteIcon className="w-6 h-6 text-violet-400" />
              </div>
              <span className="relative">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
                <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                  Create a Jam Room
                </span>
              </span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Set up your virtual jam session. BPM and key signature help keep
              everyone in sync.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">Room Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Funky Jam"
                        {...field}
                        className="bg-black/50 border-white/10 text-white focus:ring-violet-500/30 focus:border-violet-500/30 placeholder:text-zinc-500"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400">
                      Give your jam session a catchy name
                    </FormDescription>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              {/* BPM */}
              <FormField
                control={form.control}
                name="bpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">
                      Tempo (BPM): {field.value}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={40}
                        max={240}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400">
                      Beats Per Minute - sets the speed of your jam. 120 BPM is
                      a common tempo.
                    </FormDescription>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              {/* Key Signature */}
              <FormField
                control={form.control}
                name="keySig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/90">
                      Key Signature
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-white/10 text-white">
                          <SelectValue placeholder="Select a key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                        {KEY_SIGNATURES.map((key) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="text-white focus:bg-white/10 focus:text-white"
                          >
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-zinc-400">
                      The musical key for your jam. Helps players stay in
                      harmony.
                    </FormDescription>
                    <FormMessage className="text-rose-400" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative group overflow-hidden bg-black/40 hover:bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 transition-all duration-300" />
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 blur-xl transition-all duration-300" />
                  <span className="relative">
                    {loading ? "Creating..." : "Create Room"}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
