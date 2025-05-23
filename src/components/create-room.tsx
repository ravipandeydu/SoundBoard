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
    } catch (error) {
      toast.error("Failed to create room");
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        <PlusIcon className="w-5 h-5" />
        Create Room
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-gray-100 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <MusicalNoteIcon className="w-6 h-6 text-indigo-400" />
              Create a Jam Room
            </DialogTitle>
            <DialogDescription className="text-gray-400">
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
                    <FormLabel className="text-gray-200">Room Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Funky Jam"
                        {...field}
                        className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Give your jam session a catchy name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BPM */}
              <FormField
                control={form.control}
                name="bpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">
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
                    <FormDescription className="text-gray-400">
                      Beats Per Minute - sets the speed of your jam. 120 BPM is
                      a common tempo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Key Signature */}
              <FormField
                control={form.control}
                name="keySig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200">
                      Key Signature
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                          <SelectValue placeholder="Select a key" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {KEY_SIGNATURES.map((key) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="text-gray-100 focus:bg-gray-700 focus:text-gray-100"
                          >
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-400">
                      The musical key for your jam. Helps players stay in
                      harmony.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
