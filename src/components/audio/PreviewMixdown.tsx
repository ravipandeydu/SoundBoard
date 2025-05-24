"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface PreviewMixdownProps {
  tracks: {
    audioBuffer: AudioBuffer;
    volume: number;
    isMuted: boolean;
  }[];
  bpm: number;
  className?: string;
}

export function PreviewMixdown({
  tracks,
  bpm,
  className,
}: PreviewMixdownProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (tracks.length > 0) {
      setDuration(tracks[0].audioBuffer.duration);
      drawWaveform();
    }
  }, [tracks]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || tracks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const buffer = tracks[0].audioBuffer;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, amp);

    // Draw the waveform
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Create gradient effect based on progress
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#6366f1"); // indigo-500
      gradient.addColorStop(0.5, "#a855f7"); // purple-500
      gradient.addColorStop(1, "#ec4899"); // pink-500

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      const x = i;
      ctx.moveTo(x, (1 + min) * amp);
      ctx.lineTo(x, (1 + max) * amp);
    }

    ctx.stroke();

    // Draw progress overlay
    if (progress > 0) {
      ctx.fillStyle = "rgba(99, 102, 241, 0.2)"; // indigo-500 with opacity
      ctx.fillRect(0, 0, canvas.width * (progress / 100), canvas.height);
    }
  };

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !startTimeRef.current) return;

    const time = audioContextRef.current.currentTime - startTimeRef.current;
    const totalDuration = tracks[0]?.audioBuffer.duration || 0;

    setProgress((time / totalDuration) * 100);
    setCurrentTime(time);

    if (time >= totalDuration) {
      stopPlayback();
    } else {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    drawWaveform();
  };

  const startPlayback = async () => {
    setupAudioContext();
    if (!audioContextRef.current || !gainNodeRef.current) return;

    stopPlayback();
    gainNodeRef.current.gain.value = isMuted ? 0 : volume;

    sourceNodesRef.current = tracks.map((track) => {
      const source = audioContextRef.current!.createBufferSource();
      const trackGain = audioContextRef.current!.createGain();

      source.buffer = track.audioBuffer;
      source.connect(trackGain);
      trackGain.gain.value = track.isMuted ? 0 : track.volume;
      trackGain.connect(gainNodeRef.current!);

      return source;
    });

    startTimeRef.current = audioContextRef.current.currentTime;
    sourceNodesRef.current.forEach((source) => source.start());
    setIsPlaying(true);
    updateProgress();
  };

  const stopPlayback = () => {
    sourceNodesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        console.error("Error stopping playback:", e);
        // Ignore errors if source was already stopped
      }
    });
    sourceNodesRef.current = [];
    setIsPlaying(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const seekTo = (percent: number) => {
    if (isPlaying) {
      stopPlayback();
    }
    setProgress(percent);
    setCurrentTime((percent / 100) * duration);
    if (isPlaying) {
      startPlayback();
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const toggleMute = () => {
    if (!gainNodeRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    gainNodeRef.current.gain.value = newMuted ? 0 : volume;
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (!isMuted && gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  };

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={100}
          className="w-full h-16 sm:h-24 rounded-lg bg-gray-900/50 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            seekTo((x / rect.width) * 100);
          }}
        />
        <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-gray-900/80 text-[10px] sm:text-xs font-medium text-gray-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-1 sm:px-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlayback}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 hover:text-gray-300"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20 sm:w-24"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-gray-400">
          <Music2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>
            {tracks.length} Track{tracks.length !== 1 ? "s" : ""}
          </span>
          <span>•</span>
          <span>{bpm} BPM</span>
        </div>
      </div>
    </div>
  );
}
