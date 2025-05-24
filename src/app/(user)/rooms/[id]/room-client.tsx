"use client";
import useSWR from "swr";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { InviteModal } from "@/components/invite-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MicrophoneIcon,
  MusicalNoteIcon,
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
  ClipboardIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { Metronome } from "@/components/Metronome";
import { KeySignatureHelper } from "@/components/KeySignatureHelper";
import { PitchDetector } from "@/components/PitchDetector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PreviewMixdown } from "@/components/audio/PreviewMixdown";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Loop {
  id: string;
  url: string;
  name: string;
  createdAt: string;
  enabled: boolean;
  volume: number;
  order: number;
  user: {
    id: string;
    name: string;
  };
}

interface RoomClientProps {
  roomId: string;
  userId: string;
  hostId: string;
  code: string;
  title: string;
  hostName: string;
  bpm: number;
  keySig: string;
}

interface RoomMeta {
  isPublic: boolean;
}

// Loading skeleton for loops
function LoopSkeleton() {
  return (
    <Card className="bg-black/40 border-white/5 backdrop-blur-xl animate-pulse">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/10 rounded" />
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-4 w-24 bg-white/10 rounded" />
                </div>
                <div className="h-3 w-24 bg-white/10 rounded mt-2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-12 bg-white/10 rounded" />
              <div className="h-6 w-10 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-12 bg-white/10 rounded" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-white/10 rounded" />
            <div className="h-2 flex-1 bg-white/10 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="p-6 rounded-lg bg-rose-500/10 border border-rose-500/20">
      <p className="text-rose-400 text-center">{message}</p>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        className="mt-4 mx-auto block border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
      >
        Try Again
      </Button>
    </div>
  );
}

// Wrap button with tooltip helper
function TooltipButton({
  tooltip,
  children,
  ...props
}: { tooltip: string } & React.ComponentPropsWithoutRef<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Add debounce utility function at the top level
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function RoomClient({
  roomId,
  userId,
  hostId,
  code,
  title,
  hostName,
  bpm,
  keySig,
}: RoomClientProps) {
  const {
    data: loops,
    mutate: mutateLoops,
    error: loopsError,
    isLoading: isLoopsLoading,
  } = useSWR<Loop[]>(`/api/loops?roomId=${roomId}`, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    errorRetryCount: 3,
  });

  const {
    data: roomMeta,
    mutate: mutateRoomMeta,
    error: roomMetaError,
    isLoading: isRoomMetaLoading,
  } = useSWR<RoomMeta>(`/api/rooms/${roomId}`, fetcher, {
    errorRetryCount: 3,
  });

  const isHost = hostId === userId;
  const isPublic = roomMeta?.isPublic;
  const [trackName, setTrackName] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [tempoMatchEnabled, setTempoMatchEnabled] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const [settings, setSettings] = useState<
    Record<string, { enabled: boolean; volume: number }>
  >({});
  const [mixing, setMixing] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioContexts, setAudioContexts] = useState<
    Record<string, AudioContext>
  >({});
  const [visualizers, setVisualizers] = useState<Record<string, AnalyserNode>>(
    {}
  );
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [connectedElements, setConnectedElements] = useState<Set<string>>(
    new Set()
  );
  const audioSourceNodes = useRef<Record<string, MediaElementAudioSourceNode>>(
    {}
  );

  // Create a ref to store the debounced API calls
  const debouncedApiCalls = useRef<Record<string, (volume: number) => void>>(
    {}
  );

  const [previewTracks, setPreviewTracks] = useState<
    { audioBuffer: AudioBuffer; volume: number; isMuted: boolean }[]
  >([]);
  const [isPreviewReady, setIsPreviewReady] = useState(false);

  // Initialize debounced API calls for each loop
  useEffect(() => {
    if (!loops) return;

    loops.forEach((loop) => {
      if (!debouncedApiCalls.current[loop.id]) {
        debouncedApiCalls.current[loop.id] = debounce(
          async (volume: number) => {
            try {
              const res = await fetch(`/api/loops/${loop.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  enabled: settings[loop.id]?.enabled ?? false,
                  volume,
                }),
              });

              if (!res.ok) throw new Error("Failed to update volume");
            } catch (error) {
              console.error("Volume update error:", error);
              toast.error("Failed to update volume");
            }
          },
          500
        ); // 500ms debounce delay
      }
    });
  }, [loops, settings]);

  // Initialize settings when loops change
  useEffect(() => {
    if (!loops) return;

    const newSettings: Record<string, { enabled: boolean; volume: number }> =
      {};
    loops.forEach((loop) => {
      newSettings[loop.id] = settings[loop.id] || {
        enabled: loop.enabled,
        volume: loop.volume ?? 1.0,
      };
    });
    setSettings(newSettings);
  }, [loops]);

  useEffect(() => {
    return () => {
      // Cleanup audio contexts when component unmounts
      Object.values(audioContexts).forEach((ctx) => {
        if (ctx.state !== "closed") {
          ctx.close();
        }
      });
      Object.values(audioSourceNodes.current).forEach((source) => {
        source.disconnect();
      });
      audioSourceNodes.current = {};
      setConnectedElements(new Set());
    };
  }, [audioContexts]);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const fd = new FormData();
          fd.append("file", blob);
          fd.append("roomId", roomId);
          fd.append("name", trackName || `Track ${Date.now()}`);
          fd.append("order", String(loops?.length ?? 0));

          const res = await fetch("/api/loops", { method: "POST", body: fd });
          if (res.ok) {
            toast.success("Loop recorded successfully!");
            mutateLoops();
          } else {
            throw new Error("Failed to save recording");
          }
        } catch {
          toast.error("Failed to save recording");
        }
      };

      recRef.current = rec;
      rec.start();
      setRecording(true);
      setRecordingTime(0);
      recordingTimer.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            stopRec();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

      setTimeout(() => rec.stop(), 30000);
    } catch {
      toast.error("Failed to start recording");
    }
  }

  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
    clearInterval(recordingTimer.current);
    setRecordingTime(0);
  }

  const toggleLoop = async (id: string) => {
    try {
      setSettings((prev) => {
        const enabled = !prev[id].enabled;
        const audioEl = audioRefs.current[id];

        if (audioEl) {
          if (enabled) {
            const playPromise = audioEl.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.error("Playback failed:", error);
                toast.error("Failed to play audio");
              });
            }
          } else {
            audioEl.pause();
          }
        }

        fetch(`/api/loops/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled, volume: prev[id].volume }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to toggle loop");
            toast.success(`Loop ${enabled ? "enabled" : "disabled"}`);
          })
          .catch(() => {
            toast.error("Failed to toggle loop");
            return prev;
          });
        return { ...prev, [id]: { enabled, volume: prev[id].volume } };
      });
    } catch (error) {
      console.error("Toggle loop error:", error);
      toast.error("Failed to toggle loop");
    }
  };

  const changeVolume = async (id: string, volume: number) => {
    try {
      setSettings((prev) => {
        const audio = audioRefs.current[id];
        if (audio) {
          audio.volume = volume;
        }
        return { ...prev, [id]: { enabled: prev[id].enabled, volume } };
      });

      debouncedApiCalls.current[id]?.(volume);
    } catch (error) {
      console.error("Change volume error:", error);
      toast.error("Failed to update volume");
    }
  };

  const deleteLoop = async (id: string) => {
    try {
      const res = await fetch(`/api/loops/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Loop deleted");
        mutateLoops();
      }
    } catch {
      toast.error("Failed to delete loop");
    }
  };

  const reorderLoop = async (id: string, direction: "up" | "down") => {
    if (!loops || reorderLoading) return;

    setReorderLoading(true);
    try {
      const currentLoop = loops.find((l) => l.id === id);
      if (!currentLoop) return;

      const sortedLoops = [...loops].sort((a, b) => a.order - b.order);
      const currentIndex = sortedLoops.findIndex((l) => l.id === id);

      if (direction === "up" && currentIndex > 0) {
        const prevLoop = sortedLoops[currentIndex - 1];
        const prevOrder = prevLoop.order;
        const currentOrder = currentLoop.order;

        const responses = await Promise.all([
          fetch(`/api/loops/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: prevOrder }),
          }),
          fetch(`/api/loops/${prevLoop.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: currentOrder }),
          }),
        ]);

        if (responses.every((res) => res.ok)) {
          toast.success(`Moved "${currentLoop.name}" up`);
          mutateLoops();
        } else {
          throw new Error("Failed to reorder tracks");
        }
      } else if (
        direction === "down" &&
        currentIndex < sortedLoops.length - 1
      ) {
        const nextLoop = sortedLoops[currentIndex + 1];
        const nextOrder = nextLoop.order;
        const currentOrder = currentLoop.order;

        const responses = await Promise.all([
          fetch(`/api/loops/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: nextOrder }),
          }),
          fetch(`/api/loops/${nextLoop.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: currentOrder }),
          }),
        ]);

        if (responses.every((res) => res.ok)) {
          toast.success(`Moved "${currentLoop.name}" down`);
          mutateLoops();
        } else {
          throw new Error("Failed to reorder tracks");
        }
      }
    } catch {
      toast.error("Failed to reorder tracks");
    } finally {
      setReorderLoading(false);
    }
  };

  const preparePreview = async () => {
    if (!loops) return;
    const active = loops.filter((l) => settings[l.id]?.enabled);
    if (!active.length) {
      toast.error("No active loops to preview");
      return;
    }

    setMixing(true);
    try {
      const buffers = await Promise.all(
        active.map((l) => fetch(l.url).then((r) => r.arrayBuffer()))
      );
      const decodeCtx = new AudioContext();
      const decoded: AudioBuffer[] = [];
      for (let i = 0; i < buffers.length; i++) {
        const audioBuf = await decodeCtx.decodeAudioData(buffers[i]);
        decoded.push(audioBuf);
      }
      await decodeCtx.close();

      setPreviewTracks(
        active.map((loop, index) => ({
          audioBuffer: decoded[index],
          volume: settings[loop.id]?.volume ?? 1,
          isMuted: !settings[loop.id]?.enabled,
        }))
      );
      setIsPreviewReady(true);
      toast.success("Preview ready!");
    } catch (err) {
      console.error("Preview preparation failed:", err);
      toast.error("Could not prepare preview. Please try again.");
    } finally {
      setMixing(false);
    }
  };

  const exportMixdown = async () => {
    if (!loops) return;
    const active = loops.filter((l) => settings[l.id]?.enabled);
    if (!active.length) {
      toast.error("No active loops to export");
      return;
    }

    setMixing(true);
    try {
      const buffers = await Promise.all(
        active.map((l) => fetch(l.url).then((r) => r.arrayBuffer()))
      );
      const decodeCtx = new AudioContext();
      const decoded: AudioBuffer[] = [];
      for (let i = 0; i < buffers.length; i++) {
        const audioBuf = await decodeCtx.decodeAudioData(buffers[i]);
        decoded.push(audioBuf);
      }
      await decodeCtx.close();

      const sampleRate = decoded[0].sampleRate;
      const numChannels = decoded[0].numberOfChannels;
      const totalLength = decoded.reduce((sum, buf) => sum + buf.length, 0);
      const offCtx = new OfflineAudioContext(
        numChannels,
        totalLength,
        sampleRate
      );

      let offsetFrames = 0;
      decoded.forEach((audioBuf, idx) => {
        const src = offCtx.createBufferSource();
        src.buffer = audioBuf;
        const gain = offCtx.createGain();
        gain.gain.value = settings[active[idx].id]?.volume ?? 1;
        src.connect(gain).connect(offCtx.destination);
        src.start(offsetFrames / sampleRate);
        offsetFrames += audioBuf.length;
      });

      const mixed = await offCtx.startRendering();
      const wavBlob = audioBufferToWav(mixed);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}_mixdown_${Date.now()}.wav`;
      a.click();

      await fetch("/api/mixdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, url }),
      });

      toast.success("Mixdown exported successfully!");
    } catch (err) {
      console.error("Mixdown failed:", err);
      toast.error("Could not export mixdown. Please try again.");
    } finally {
      setMixing(false);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChan = buffer.numberOfChannels;
    const length = buffer.length * numChan * 2 + 44;
    const arrBuf = new ArrayBuffer(length);
    const view = new DataView(arrBuf);
    const writeStr = (s: string, o: number) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    writeStr("RIFF", 0);
    view.setUint32(4, length - 8, true);
    writeStr("WAVEfmt ", 8);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numChan * 2, true);
    view.setUint16(32, numChan * 2, true);
    view.setUint16(34, 16, true);
    writeStr("data", 36);
    view.setUint32(40, length - 44, true);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChan; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }
    }
    return new Blob([view], { type: "audio/wav" });
  };

  const sortedLoops = loops?.sort((a, b) => a.order - b.order) ?? [];

  const toggleRoomPublic = async () => {
    if (!roomMeta || isUpdatingVisibility) return;

    setIsUpdatingVisibility(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !roomMeta.isPublic }),
      });
      if (res.ok) {
        mutateRoomMeta({ isPublic: !roomMeta.isPublic }, false);
        toast.success(
          `Room is now ${!roomMeta.isPublic ? "public" : "private"}`
        );
      } else {
        throw new Error("Failed to update room visibility");
      }
    } catch {
      toast.error("Failed to update room visibility");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // If both data fetching operations have errors, show error state
  if (loopsError && roomMetaError) {
    return (
      <ErrorDisplay message="Failed to load room data. Please try again later." />
    );
  }

  // Show loading state while initial data is being fetched
  if ((isLoopsLoading || isRoomMetaLoading) && !loops && !roomMeta) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-700 rounded mb-4" />
          <div className="flex items-center gap-3">
            <div className="h-4 w-32 bg-gray-700 rounded" />
            <div className="h-4 w-4 bg-gray-700 rounded" />
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
        </div>

        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <LoopSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="relative">
                <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
                <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                  {title}
                </span>
              </span>
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">
              Hosted by {hostName} • {bpm} BPM • {keySig}
            </p>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            {isHost && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={isPublic}
                  onCheckedChange={toggleRoomPublic}
                  disabled={isUpdatingVisibility}
                  className="data-[state=checked]:bg-violet-500"
                />
                <span className="text-zinc-400 text-sm">Public</span>
              </div>
            )}
            <InviteModal code={code} />
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Recording Card */}
            <Card className="group relative overflow-hidden bg-[#1a1625] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent transition-all duration-300" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent blur-xl transition-all duration-300" />
              <CardContent className="relative p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#2a1f3d]">
                    <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Recording
                  </h2>
                </div>
                <div className="space-y-4">
                  <Input
                    placeholder="Track name"
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    className="bg-[#12101a] border-white/10 text-white focus:ring-violet-500/30 focus:border-violet-500/30 placeholder:text-zinc-500 rounded-lg sm:rounded-xl h-10 sm:h-12 px-3 sm:px-4"
                  />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <TooltipButton
                      tooltip={recording ? "Stop recording" : "Start recording"}
                      onClick={recording ? stopRec : startRec}
                      className={`relative group/btn overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300 w-full sm:w-auto ${
                        recording
                          ? "text-rose-400 hover:text-rose-300"
                          : "text-violet-400 hover:text-violet-300"
                      }`}
                    >
                      <span className="relative flex items-center justify-center gap-3">
                        {recording ? (
                          <>
                            <XMarkIcon className="w-5 h-5" />
                            <span className="font-medium flex items-center gap-2">
                              Stop ({30 - recordingTime}s)
                              <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                            </span>
                          </>
                        ) : (
                          <>
                            <MicrophoneIcon className="w-5 h-5" />
                            <span className="font-medium">Record</span>
                          </>
                        )}
                      </span>
                    </TooltipButton>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Switch
                        checked={tempoMatchEnabled}
                        onCheckedChange={setTempoMatchEnabled}
                        className="data-[state=checked]:bg-violet-500"
                      />
                      <span className="text-zinc-400 text-sm font-medium">
                        Tempo Match
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tools Card */}
            <Card className="group relative overflow-hidden bg-[#1a1625] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-pink-500/5 to-transparent transition-all duration-300" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-fuchsia-500/10 via-pink-500/10 to-transparent blur-xl transition-all duration-300" />
              <CardContent className="relative p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#2a1f3d]">
                    <MusicalNoteIcon className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    Tools
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Metronome bpm={bpm} />
                  <KeySignatureHelper keySig={keySig} />
                  {recording && (
                    <div className="md:col-span-2">
                      <PitchDetector isRecording={recording} keySig={keySig} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Column */}
          <div className="lg:col-span-1">
            <Card className="group relative overflow-hidden bg-[#1a1625] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300 lg:sticky lg:top-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-transparent transition-all duration-300" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-transparent blur-xl transition-all duration-300" />
              <CardContent className="relative p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#2a1f3d]">
                      <ArrowDownTrayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      Export
                    </h2>
                  </div>
                  {isPreviewReady && (
                    <div className="text-sm text-zinc-400">
                      {previewTracks.length} Track
                      {previewTracks.length !== 1 ? "s" : ""} Selected
                    </div>
                  )}
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {isPreviewReady && previewTracks.length > 0 ? (
                    <>
                      <div className="relative p-3 sm:p-4 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-sm border border-white/5">
                        <PreviewMixdown tracks={previewTracks} bpm={bpm} />
                      </div>

                      <TooltipButton
                        tooltip="Export all enabled tracks as a single audio file"
                        onClick={exportMixdown}
                        disabled={mixing}
                        className="relative group/btn overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-lg sm:rounded-xl w-full px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300"
                      >
                        <span className="relative flex items-center gap-3 justify-center text-pink-400 group-hover/btn:text-pink-300">
                          {mixing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-t-pink-500 border-r-rose-500 border-b-pink-500 border-l-rose-500 rounded-full animate-spin" />
                              <span className="font-medium">Exporting...</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownTrayIcon className="w-5 h-5" />
                              <span className="font-medium">
                                Export Mixdown
                              </span>
                            </>
                          )}
                        </span>
                      </TooltipButton>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative p-4 sm:p-6 rounded-lg sm:rounded-xl bg-black/40 backdrop-blur-sm border border-white/5">
                        <div className="flex flex-col items-center justify-center text-center space-y-3">
                          <div className="p-2 sm:p-3 rounded-full bg-[#2a1f3d]">
                            <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-medium text-gray-200">
                              Preview Your Mix
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-400">
                              Enable the tracks you want to include and click
                              preview
                            </p>
                          </div>
                        </div>
                      </div>

                      <TooltipButton
                        tooltip="Preview the mixdown before exporting"
                        onClick={preparePreview}
                        disabled={mixing}
                        className="relative group/btn overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-lg sm:rounded-xl w-full px-4 sm:px-6 py-2 sm:py-3 transition-all duration-300"
                      >
                        <span className="relative flex items-center gap-3 justify-center text-pink-400 group-hover/btn:text-pink-300">
                          {mixing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-t-pink-500 border-r-rose-500 border-b-pink-500 border-l-rose-500 rounded-full animate-spin" />
                              <span className="font-medium">
                                Preparing Preview...
                              </span>
                            </>
                          ) : (
                            <>
                              <PlayIcon className="w-5 h-5" />
                              <span className="font-medium">
                                Preview Mixdown
                              </span>
                            </>
                          )}
                        </span>
                      </TooltipButton>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loops */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">
                <span className="relative">
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
                  <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                    Recorded Loops
                  </span>
                </span>
              </h2>
              {loops && loops.length > 0 && (
                <TooltipButton
                  tooltip={isReordering ? "Save order" : "Reorder loops"}
                  onClick={() => {
                    if (isReordering && reorderLoading) return;
                    setIsReordering(!isReordering);
                  }}
                  className="relative group overflow-hidden bg-black/40 hover:bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 transition-all duration-300" />
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 blur-xl transition-all duration-300" />
                  <span className="relative flex items-center gap-2">
                    <ArrowsUpDownIcon className="w-5 h-5" />
                    {isReordering ? "Save Order" : "Reorder"}
                  </span>
                </TooltipButton>
              )}
            </div>
          </div>

          {isLoopsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <LoopSkeleton key={i} />
              ))}
            </div>
          ) : loopsError ? (
            <ErrorDisplay message="Failed to load loops" />
          ) : loops?.length === 0 ? (
            <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
              <CardContent className="p-6">
                <p className="text-zinc-400 text-center">
                  No loops recorded yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {loops?.map((loop) => (
                <Card
                  key={loop.id}
                  className="group relative overflow-hidden bg-black/40 border-white/5 backdrop-blur-xl hover:bg-white/5 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-300" />
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/10 group-hover:to-fuchsia-500/10 blur-xl transition-all duration-300" />
                  <CardContent className="relative p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={settings[loop.id]?.enabled ?? false}
                            onCheckedChange={(checked) => toggleLoop(loop.id)}
                            className="data-[state=checked]:bg-violet-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-violet-300 group-hover:text-violet-200 transition-colors">
                                {loop.name}
                              </h3>
                              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                by {loop.user.name}
                              </span>
                            </div>
                            <time
                              dateTime={loop.createdAt}
                              className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors"
                            >
                              {new Date(loop.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isReordering ? (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => reorderLoop(loop.id, "up")}
                                disabled={reorderLoading}
                                className="p-2 h-auto bg-black/40 hover:bg-white/5 border border-white/10"
                              >
                                ↑
                              </Button>
                              <Button
                                onClick={() => reorderLoop(loop.id, "down")}
                                disabled={reorderLoading}
                                className="p-2 h-auto bg-black/40 hover:bg-white/5 border border-white/10"
                              >
                                ↓
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => deleteLoop(loop.id)}
                                className="p-2 h-auto bg-black/40 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-all"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(loop.url);
                                  toast.success("URL copied to clipboard");
                                }}
                                className="p-2 h-auto bg-black/40 hover:bg-white/5 border border-white/10"
                              >
                                <ClipboardIcon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <audio
                        key={loop.id}
                        ref={(el) => {
                          if (el) {
                            audioRefs.current[loop.id] = el;
                            el.volume = settings[loop.id]?.volume ?? 1.0;
                          } else {
                            audioRefs.current[loop.id] = null;
                          }
                        }}
                        src={loop.url}
                        controls
                        className="w-full"
                        preload="auto"
                      />
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">Volume</span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[settings[loop.id]?.volume ?? 1]}
                          onValueChange={(v) => changeVolume(loop.id, v[0])}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
