"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";
import { Card, CardContent } from "@/components/ui/card";

interface MetronomeProps {
  bpm: number;
}

export function Metronome({ bpm }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const currentBeatRef = useRef<number>(0);
  const [currentBeat, setCurrentBeat] = useState(0);

  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerIDRef.current) {
        window.clearTimeout(timerIDRef.current);
      }
    };
  }, []);

  const scheduleNote = (beatNumber: number, time: number) => {
    const osc = audioContextRef.current!.createOscillator();
    const gainNode = audioContextRef.current!.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current!.destination);

    // Use different frequencies for strong and weak beats
    osc.frequency.value = beatNumber % 4 === 0 ? 880.0 : 440.0;
    gainNode.gain.value = 0.1; // Reduce volume

    osc.start(time);
    osc.stop(time + 0.1);

    // Update visual beat indicator
    const scheduledTime = time - audioContextRef.current!.currentTime;
    setTimeout(() => setCurrentBeat(beatNumber % 4), scheduledTime * 1000);
  };

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTimeRef.current += secondsPerBeat;
    currentBeatRef.current++;
    if (currentBeatRef.current === 4) {
      currentBeatRef.current = 0;
    }
  };

  const scheduler = () => {
    while (
      nextNoteTimeRef.current <
      audioContextRef.current!.currentTime + 0.1
    ) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
      nextNote();
    }
    timerIDRef.current = window.setTimeout(scheduler, 25.0);
  };

  const startStop = () => {
    if (isPlaying) {
      if (timerIDRef.current) {
        window.clearTimeout(timerIDRef.current);
        timerIDRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      if (audioContextRef.current!.state === "suspended") {
        audioContextRef.current!.resume();
      }
      currentBeatRef.current = 0;
      nextNoteTimeRef.current = audioContextRef.current!.currentTime;
      scheduler();
      setIsPlaying(true);
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-[#12101a] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-transparent transition-all duration-300" />
      <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-transparent blur-xl transition-all duration-300" />
      <CardContent className="relative p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2a1f3d]">
              <div className="w-4 h-4 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded" />
            </div>
            <span className="text-lg font-semibold text-white">{bpm} BPM</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((beat) => (
              <div
                key={beat}
                className={`w-1.5 h-8 rounded-full transition-all duration-150 ${
                  isPlaying && currentBeat === beat
                    ? "bg-gradient-to-b from-violet-400 to-fuchsia-400 scale-100"
                    : "bg-white/10 scale-75"
                }`}
              />
            ))}
          </div>
        </div>
        <Button
          onClick={startStop}
          className="relative group/btn w-full overflow-hidden bg-[#2a1f3d] hover:bg-[#382952] border-0 rounded-xl px-6 py-3 transition-all duration-300"
        >
          <span className="relative flex items-center gap-3 justify-center text-violet-400 group-hover/btn:text-violet-300">
            {isPlaying ? (
              <>
                <PauseIcon className="w-5 h-5" />
                <span className="font-medium">Stop</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                <span className="font-medium">Start</span>
              </>
            )}
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
