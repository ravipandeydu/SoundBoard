"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PitchDetectorProps {
  isRecording: boolean;
  keySig: string;
}

// Frequency ranges for each note (in Hz)
const NOTE_FREQUENCIES: Record<string, [number, number]> = {
  C: [261.63 - 5, 261.63 + 5],
  "C#": [277.18 - 5, 277.18 + 5],
  D: [293.66 - 5, 293.66 + 5],
  "D#": [311.13 - 5, 311.13 + 5],
  E: [329.63 - 5, 329.63 + 5],
  F: [349.23 - 5, 349.23 + 5],
  "F#": [369.99 - 5, 369.99 + 5],
  G: [392.0 - 5, 392.0 + 5],
  "G#": [415.3 - 5, 415.3 + 5],
  A: [440.0 - 5, 440.0 + 5],
  "A#": [466.16 - 5, 466.16 + 5],
  B: [493.88 - 5, 493.88 + 5],
};

export function PitchDetector({ isRecording, keySig }: PitchDetectorProps) {
  const [currentNote, setCurrentNote] = useState<string>("");
  const [isInKey, setIsInKey] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const startPitchDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);

      const detectPitch = () => {
        if (!analyserRef.current || !isRecording) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        analyserRef.current.getFloatTimeDomainData(dataArray);

        const ac = autoCorrelate(
          dataArray,
          audioContextRef.current!.sampleRate
        );
        if (ac !== -1) {
          const note = getNoteFromFrequency(ac);
          setCurrentNote(note);
          setIsInKey(isNoteInKey(note, keySig));
        }

        requestAnimationFrame(detectPitch);
      };

      detectPitch();
    } catch (error) {
      console.error("Error starting pitch detection:", error);
    }
  }, [isRecording, keySig]);

  useEffect(() => {
    if (isRecording) {
      startPitchDetection();
    } else {
      stopPitchDetection();
    }
  }, [isRecording, startPitchDetection]);

  const stopPitchDetection = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setCurrentNote("");
    setIsInKey(false);
  };

  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;

    // Calculate RMS
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    // Find auto-correlation
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
      if (correlation > 0.9) {
        foundGoodCorrelation = true;
        break;
      }
    }

    if (foundGoodCorrelation) {
      return sampleRate / bestOffset;
    }
    return -1;
  };

  const getNoteFromFrequency = (frequency: number): string => {
    for (const [note, [minFreq, maxFreq]] of Object.entries(NOTE_FREQUENCIES)) {
      if (frequency >= minFreq && frequency <= maxFreq) {
        return note;
      }
    }
    return "";
  };

  const isNoteInKey = (note: string, key: string): boolean => {
    const scaleNotes = {
      C: ["C", "D", "E", "F", "G", "A", "B"],
      G: ["G", "A", "B", "C", "D", "E", "F#"],
      // Add other scales as needed
    }[key] || ["C", "D", "E", "F", "G", "A", "B"];

    return scaleNotes.includes(note);
  };

  if (!isRecording) return null;

  return (
    <Card className="group relative overflow-hidden bg-[#12101a] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-transparent transition-all duration-300" />
      <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-transparent blur-xl transition-all duration-300" />
      <CardContent className="relative p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2a1f3d]">
              <div className="w-4 h-4 bg-gradient-to-br from-pink-400 to-rose-400 rounded" />
            </div>
            <span className="text-lg font-semibold text-white">
              Pitch Detection
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentNote
                  ? isInKey
                    ? "bg-gradient-to-br from-emerald-400 to-teal-400"
                    : "bg-gradient-to-br from-amber-400 to-orange-400"
                  : "bg-white/20"
              }`}
            />
            <span
              className={`font-mono text-xl font-medium transition-colors ${
                currentNote
                  ? isInKey
                    ? "text-emerald-400"
                    : "text-amber-400"
                  : "text-zinc-600"
              }`}
            >
              {currentNote || "-"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
