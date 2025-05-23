"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";

interface MetronomeProps {
  bpm: number;
}

export function Metronome({ bpm }: MetronomeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const currentBeatRef = useRef<number>(0);

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
    <Button
      onClick={startStop}
      variant="outline"
      className="gap-2 border-indigo-400 text-indigo-400 hover:bg-indigo-950"
    >
      {isPlaying ? (
        <>
          <PauseIcon className="w-5 h-5" />
          Stop Metronome
        </>
      ) : (
        <>
          <PlayIcon className="w-5 h-5" />
          Start Metronome
        </>
      )}
    </Button>
  );
}
