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
} from "@heroicons/react/24/outline";
import { Metronome } from "@/components/Metronome";
import { KeySignatureHelper } from "@/components/KeySignatureHelper";
import { PitchDetector } from "@/components/PitchDetector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  useEffect(() => {
    if (!loops) return;

    // Initialize settings for new loops
    const updated: Record<string, { enabled: boolean; volume: number }> = {};
    loops.forEach((l) => {
      updated[l.id] = { enabled: l.enabled, volume: l.volume ?? 1.0 };

      // Update audio element volume
      const audioEl = audioRefs.current[l.id];
      if (audioEl) {
        audioEl.volume = l.volume ?? 1.0;

        // Add error handling for audio playback
        audioEl.onerror = (e) => {
          console.error(`Audio error for loop ${l.id}:`, e);
          toast.error(
            `Failed to play audio: ${audioEl.error?.message || "Unknown error"}`
          );
        };
      }
    });
    setSettings(updated);
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
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyzerRef.current = audioContext.createAnalyser();
      source.connect(analyzerRef.current);

      // Add tempo matching if enabled
      const destinationNode = analyzerRef.current;
      if (tempoMatchEnabled) {
        const bpmInSeconds = 60 / bpm;
        const delayNode = audioContext.createDelay();
        delayNode.delayTime.value = bpmInSeconds;
        source.connect(delayNode);
        delayNode.connect(destinationNode);
      }

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

      // Start visualization
      visualize();

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

  function visualize() {
    if (!analyzerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const analyzer = analyzerRef.current;
    analyzer.fftSize = 2048;
    const waveformBufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(waveformBufferLength);

    function draw() {
      requestAnimationFrame(draw);

      if (!recording || !ctx || !analyzer) return;

      analyzer.getByteTimeDomainData(dataArray);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
      gradient.addColorStop(0, "rgba(167, 139, 250, 0.1)"); // Violet
      gradient.addColorStop(0.5, "rgba(217, 70, 239, 0.1)"); // Fuchsia
      gradient.addColorStop(1, "rgba(167, 139, 250, 0.1)"); // Violet

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw the waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(167, 139, 250, 0.8)"; // Violet
      ctx.beginPath();

      const sliceWidth = rect.width / waveformBufferLength;
      let x = 0;

      for (let i = 0; i < waveformBufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * rect.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      // Add glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(217, 70, 239, 0.5)"; // Fuchsia glow

      ctx.lineTo(rect.width, rect.height / 2);
      ctx.stroke();

      // Add reflection
      ctx.strokeStyle = "rgba(167, 139, 250, 0.2)";
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < waveformBufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = rect.height - (v * rect.height) / 2;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
    }

    draw();
  }

  const toggleLoop = async (id: string) => {
    try {
      setSettings((prev) => {
        const enabled = !prev[id].enabled;
        const audioEl = audioRefs.current[id];

        if (audioEl) {
          if (enabled) {
            // Try to play the audio
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
      // Update local state and audio immediately
      setSettings((prev) => {
        const audio = audioRefs.current[id];
        if (audio) {
          audio.volume = volume;
        }
        return { ...prev, [id]: { enabled: prev[id].enabled, volume } };
      });

      // Call the debounced API update
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

  const setupPlaybackVisualization = useCallback(
    (loopId: string, audioElement: HTMLAudioElement) => {
      // If already connected, skip setup
      if (connectedElements.has(loopId)) {
        return;
      }

      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audioElement);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        // Connect nodes
        source.connect(audioCtx.destination);
        source.connect(analyser);

        setConnectedElements((prev) => new Set([...prev, loopId]));
        setAudioContexts((prev) => ({ ...prev, [loopId]: audioCtx }));
        setVisualizers((prev) => ({ ...prev, [loopId]: analyser }));

        const canvas = canvasRefs.current[loopId];
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size to match display size
        const updateCanvasSize = () => {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * window.devicePixelRatio;
          canvas.height = rect.height * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        updateCanvasSize();

        let animationFrame: number;
        let isAnimating = false;

        const draw = () => {
          if (!isAnimating) return;

          animationFrame = requestAnimationFrame(draw);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const rect = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);

          // Create gradient background
          const gradient = ctx.createLinearGradient(0, rect.height, 0, 0);
          gradient.addColorStop(0, "rgba(236, 72, 153, 0.1)");
          gradient.addColorStop(0.5, "rgba(244, 114, 182, 0.1)");
          gradient.addColorStop(1, "rgba(236, 72, 153, 0.1)");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, rect.width, rect.height);

          const barWidth = (rect.width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * rect.height;

            const barGradient = ctx.createLinearGradient(
              0,
              rect.height - barHeight,
              0,
              rect.height
            );
            barGradient.addColorStop(0, "rgba(236, 72, 153, 0.8)");
            barGradient.addColorStop(1, "rgba(244, 114, 182, 0.4)");

            ctx.fillStyle = barGradient;
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(236, 72, 153, 0.5)";

            ctx.beginPath();
            ctx.roundRect(
              x,
              rect.height - barHeight,
              barWidth - 1,
              barHeight,
              3
            );
            ctx.fill();

            x += barWidth;
          }
        };

        const startAnimation = () => {
          if (!isAnimating) {
            isAnimating = true;
            draw();
          }
        };

        const stopAnimation = () => {
          isAnimating = false;
          cancelAnimationFrame(animationFrame);
          const rect = canvas.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
        };

        // Handle window resize
        window.addEventListener("resize", updateCanvasSize);

        // Add event listeners
        audioElement.addEventListener("play", startAnimation);
        audioElement.addEventListener("pause", stopAnimation);
        audioElement.addEventListener("ended", stopAnimation);

        // Start animation if audio is already playing
        if (!audioElement.paused) {
          startAnimation();
        }

        return () => {
          stopAnimation();
          window.removeEventListener("resize", updateCanvasSize);
          audioElement.removeEventListener("play", startAnimation);
          audioElement.removeEventListener("pause", stopAnimation);
          audioElement.removeEventListener("ended", stopAnimation);
        };
      } catch (error) {
        console.error("Error setting up visualization:", error);
        setConnectedElements((prev) => {
          const newSet = new Set(prev);
          newSet.delete(loopId);
          return newSet;
        });
      }
    },
    []
  );

  // Cleanup effect for audio contexts and connections
  useEffect(() => {
    return () => {
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
      setAudioContexts({});
      setVisualizers({});
    };
  }, []);

  // Cleanup effect for removed loops
  useEffect(() => {
    if (!loops) return;

    const currentLoopIds = new Set(loops.map((loop) => loop.id));

    // Clean up contexts for removed loops
    Object.keys(audioContexts).forEach((loopId) => {
      if (!currentLoopIds.has(loopId)) {
        const ctx = audioContexts[loopId];
        if (ctx && ctx.state !== "closed") {
          ctx.close();
        }
        if (audioSourceNodes.current[loopId]) {
          audioSourceNodes.current[loopId].disconnect();
          delete audioSourceNodes.current[loopId];
        }
        setAudioContexts((prev) => {
          const newContexts = { ...prev };
          delete newContexts[loopId];
          return newContexts;
        });
        setVisualizers((prev) => {
          const newVisualizers = { ...prev };
          delete newVisualizers[loopId];
          return newVisualizers;
        });
        setConnectedElements((prev) => {
          const newSet = new Set(prev);
          newSet.delete(loopId);
          return newSet;
        });
      }
    });
  }, [loops]);

  // Cleanup debounced calls
  useEffect(() => {
    return () => {
      Object.values(debouncedApiCalls.current).forEach((debouncedFn) => {
        if (typeof debouncedFn === "function" && "clear" in debouncedFn) {
          (debouncedFn as any).clear?.();
        }
      });
    };
  }, []);

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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="relative">
              <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
              <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                {title}
              </span>
            </span>
          </h1>
          <p className="text-zinc-400 mt-2">
            Hosted by {hostName} • {bpm} BPM • {keySig}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isHost && (
            <div className="flex items-center gap-2">
              <Switch
                checked={isPublic}
                onCheckedChange={toggleRoomPublic}
                disabled={isUpdatingVisibility}
                className="data-[state=checked]:bg-violet-500"
              />
              <span className="text-zinc-400">Public</span>
            </div>
          )}
          <InviteModal code={code} />
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recording Card */}
          <Card className="group relative overflow-hidden bg-[#1a1625] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent transition-all duration-300" />
            <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent blur-xl transition-all duration-300" />
            <CardContent className="relative p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#2a1f3d]">
                  <MicrophoneIcon className="w-6 h-6 text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Recording</h2>
              </div>
              <div className="space-y-4">
                <Input
                  placeholder="Track name"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  className="bg-[#12101a] border-white/10 text-white focus:ring-violet-500/30 focus:border-violet-500/30 placeholder:text-zinc-500 rounded-xl h-12 px-4"
                />
                {recording && (
                  <div className="relative w-full h-32 bg-[#12101a] rounded-xl overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full"
                      width={800}
                      height={200}
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <TooltipButton
                    tooltip={recording ? "Stop recording" : "Start recording"}
                    onClick={recording ? stopRec : startRec}
                    className={`relative group/btn overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-xl px-6 py-3 transition-all duration-300 ${
                      recording
                        ? "text-rose-400 hover:text-rose-300"
                        : "text-violet-400 hover:text-violet-300"
                    }`}
                  >
                    <span className="relative flex items-center gap-3">
                      {recording ? (
                        <>
                          <XMarkIcon className="w-5 h-5" />
                          <span className="font-medium">
                            Stop ({30 - recordingTime}s)
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
                  <div className="flex items-center gap-3">
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
            <CardContent className="relative p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#2a1f3d]">
                  <MusicalNoteIcon className="w-6 h-6 text-fuchsia-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Tools</h2>
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
          <Card className="group relative overflow-hidden bg-[#1a1625] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300 sticky top-6">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-transparent transition-all duration-300" />
            <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-transparent blur-xl transition-all duration-300" />
            <CardContent className="relative p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#2a1f3d]">
                  <ArrowDownTrayIcon className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Export</h2>
              </div>
              <div className="space-y-4">
                <TooltipButton
                  tooltip="Export all enabled tracks as a single audio file"
                  onClick={exportMixdown}
                  disabled={mixing}
                  className="relative group/btn overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-xl w-full px-6 py-3 transition-all duration-300"
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
                        <span className="font-medium">Export Mixdown</span>
                      </>
                    )}
                  </span>
                </TooltipButton>
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
              <p className="text-zinc-400 text-center">No loops recorded yet</p>
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
                          el.volume = settings[loop.id]?.volume ?? 1;
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
  );
}
