"use client";
import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
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
  const { data: loops, mutate: mutateLoops } = useSWR<Loop[]>(
    `/api/loops?roomId=${roomId}`,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );
  const { data: roomMeta, mutate: mutateRoomMeta } = useSWR<RoomMeta>(
    `/api/rooms/${roomId}`,
    fetcher
  );

  const isHost = hostId === userId;
  const isPublic = roomMeta?.isPublic;
  const [trackName, setTrackName] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  // Add new state for tempo matching
  const [tempoMatchEnabled, setTempoMatchEnabled] = useState(false);

  const toggleRoomPublic = async () => {
    if (!roomMeta) return;
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
      }
    } catch {
      toast.error("Failed to update room visibility");
    }
  };

  const [recording, setRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const [settings, setSettings] = useState<
    Record<string, { enabled: boolean; volume: number }>
  >({});
  const [mixing, setMixing] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!loops) return;
    const updated: Record<string, { enabled: boolean; volume: number }> = {};
    loops.forEach((l) => {
      updated[l.id] = { enabled: l.enabled, volume: l.volume ?? 1.0 };
      if (audioRefs.current[l.id]) {
        audioRefs.current[l.id]!.volume = l.volume ?? 1.0;
      }
    });
    setSettings(updated);
  }, [loops]);

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

    const analyzer = analyzerRef.current;
    analyzer.fftSize = 2048;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function draw() {
      if (!recording || !ctx) return;
      requestAnimationFrame(draw);

      analyzer.getByteTimeDomainData(dataArray);
      ctx.fillStyle = "rgb(20, 24, 33)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(129, 140, 248)";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    draw();
  }

  const toggleLoop = async (id: string) => {
    try {
      setSettings((prev) => {
        const enabled = !prev[id].enabled;
        fetch(`/api/loops/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled, volume: prev[id].volume }),
        });
        return { ...prev, [id]: { enabled, volume: prev[id].volume } };
      });
    } catch {
      toast.error("Failed to toggle loop");
    }
  };

  const changeVolume = async (id: string, volume: number) => {
    try {
      setSettings((prev) => {
        fetch(`/api/loops/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: prev[id].enabled, volume }),
        });
        return { ...prev, [id]: { enabled: prev[id].enabled, volume } };
      });
    } catch {
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

        await Promise.all([
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

        mutateLoops();
      } else if (
        direction === "down" &&
        currentIndex < sortedLoops.length - 1
      ) {
        const nextLoop = sortedLoops[currentIndex + 1];
        const nextOrder = nextLoop.order;
        const currentOrder = currentLoop.order;

        await Promise.all([
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

        mutateLoops();
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-700">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
            {title}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-gray-400">
            <span>Hosted by {hostName}</span>
            <span>•</span>
            <span>{bpm} BPM</span>
            {keySig && (
              <>
                <span>•</span>
                <span>{keySig}</span>
              </>
            )}
            {code && (
              <>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-gray-800 px-2 py-1 rounded text-indigo-300">
                    {code}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success("Room code copied to clipboard!");
                    }}
                    className="text-gray-400 hover:text-indigo-300"
                  >
                    <ClipboardIcon className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isHost && roomMeta && (
            <div className="flex items-center gap-3">
              <Switch
                checked={isPublic}
                onCheckedChange={toggleRoomPublic}
                className="data-[state=checked]:bg-indigo-600"
              />
              <span className="text-sm font-medium text-gray-300">
                {isPublic ? "Public Room" : "Private Room"}
              </span>
            </div>
          )}
          {isHost && <InviteModal code={code} />}
        </div>
      </div>

      {/* Musical Helpers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeySignatureHelper keySig={keySig} />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Metronome bpm={bpm} />
            <Switch
              checked={tempoMatchEnabled}
              onCheckedChange={setTempoMatchEnabled}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className="text-sm text-gray-400">Tempo Match</span>
          </div>
          <PitchDetector isRecording={recording} keySig={keySig} />
        </div>
      </div>

      {/* Recording Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="text"
            placeholder="Track name (optional)"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            className="max-w-xs bg-gray-800 border-gray-700 text-gray-100"
            disabled={recording}
          />
          <Button
            onClick={recording ? stopRec : startRec}
            className={`${
              recording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white gap-2 min-w-[160px]`}
          >
            <MicrophoneIcon className="w-5 h-5" />
            {recording ? `Stop (${30 - recordingTime}s)` : "Start Recording"}
          </Button>
          <Button
            disabled={mixing}
            onClick={exportMixdown}
            variant="outline"
            className="border-indigo-400 text-indigo-400 hover:bg-indigo-950 gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {mixing ? "Mixing…" : "Export Mixdown"}
          </Button>
          {sortedLoops.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsReordering(!isReordering)}
              className={`border-gray-600 text-gray-400 hover:bg-gray-800 gap-2 ${
                isReordering ? "bg-gray-800" : ""
              }`}
            >
              <ArrowsUpDownIcon className="w-5 h-5" />
              {isReordering ? "Done Reordering" : "Reorder Tracks"}
            </Button>
          )}
        </div>

        {recording && (
          <div className="relative h-24 bg-gray-800 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              width={1200}
              height={96}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-red-600/90 rounded-full text-white font-medium animate-pulse">
                Recording... {30 - recordingTime}s
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loops */}
      <div className="grid gap-6">
        {sortedLoops.map((l) => {
          const setting = settings[l.id] || { enabled: true, volume: 1 };
          const time = new Date(l.createdAt).toLocaleString();
          return (
            <Card
              key={l.id}
              className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      {isReordering && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reorderLoop(l.id, "up")}
                            disabled={l.order === 0 || reorderLoading}
                            className="px-2 hover:bg-gray-700"
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reorderLoop(l.id, "down")}
                            disabled={
                              l.order === sortedLoops.length - 1 ||
                              reorderLoading
                            }
                            className="px-2 hover:bg-gray-700"
                          >
                            ↓
                          </Button>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <MusicalNoteIcon className="w-5 h-5 text-indigo-400" />
                          <span className="text-gray-300 font-medium">
                            {l.name || l.user.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            by {l.user.name}
                          </span>
                        </div>
                        <time
                          dateTime={l.createdAt}
                          className="text-sm text-gray-500 mt-1 block"
                        >
                          {time}
                        </time>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">Enable</span>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={() => toggleLoop(l.id)}
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      {(isHost || l.user.id === userId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLoop(l.id)}
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <audio
                    src={l.url}
                    controls
                    muted={!setting.enabled}
                    ref={(el) => {
                      audioRefs.current[l.id] = el;
                      if (el) el.volume = setting.volume;
                    }}
                    className="w-full rounded bg-gray-700"
                  />

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 min-w-[4rem]">
                      Volume
                    </span>
                    <Slider
                      value={[setting.volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([value]) => changeVolume(l.id, value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {sortedLoops.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">
                No loops recorded yet. Start by recording one!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
