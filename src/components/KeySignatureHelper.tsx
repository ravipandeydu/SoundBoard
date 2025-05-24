"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface KeySignatureHelperProps {
  keySig: string;
}

const SCALES: Record<string, string[]> = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  A: ["A", "B", "C#", "D", "E", "F#", "G#"],
  E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
  B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  Gb: ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
};

const CHORDS: Record<string, string[]> = {
  C: ["C", "Dm", "Em", "F", "G", "Am", "Bdim"],
  G: ["G", "Am", "Bm", "C", "D", "Em", "F#dim"],
  D: ["D", "Em", "F#m", "G", "A", "Bm", "C#dim"],
  A: ["A", "Bm", "C#m", "D", "E", "F#m", "G#dim"],
  E: ["E", "F#m", "G#m", "A", "B", "C#m", "D#dim"],
  B: ["B", "C#m", "D#m", "E", "F#", "G#m", "A#dim"],
  F: ["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"],
  Bb: ["Bb", "Cm", "Dm", "Eb", "F", "Gm", "Adim"],
  Eb: ["Eb", "Fm", "Gm", "Ab", "Bb", "Cm", "Ddim"],
  Ab: ["Ab", "Bbm", "Cm", "Db", "Eb", "Fm", "Gdim"],
  Db: ["Db", "Ebm", "Fm", "Gb", "Ab", "Bbm", "Cdim"],
  Gb: ["Gb", "Abm", "Bbm", "Cb", "Db", "Ebm", "Fdim"],
};

export function KeySignatureHelper({ keySig }: KeySignatureHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const scale = SCALES[keySig] || SCALES["C"];
  const chords = CHORDS[keySig] || CHORDS["C"];

  return (
    <Card className="group relative overflow-hidden bg-[#12101a] border-white/5 backdrop-blur-xl hover:bg-[#1e1a2e] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-pink-500/5 to-transparent transition-all duration-300" />
      <div className="absolute -inset-0.5 bg-gradient-to-br from-fuchsia-500/10 via-pink-500/10 to-transparent blur-xl transition-all duration-300" />
      <CardContent className="relative p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#2a1f3d]">
              <div className="w-4 h-4 bg-gradient-to-br from-fuchsia-400 to-pink-400 rounded" />
            </div>
            <span className="text-lg font-semibold text-white">
              Key of {keySig}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative group/btn h-8 w-8 p-0 hover:bg-[#2a1f3d] rounded-lg"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-fuchsia-400 group-hover/btn:text-fuchsia-300" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-fuchsia-400 group-hover/btn:text-fuchsia-300" />
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Scale Notes
              </h3>
              <div className="flex flex-wrap gap-2">
                {scale.map((note) => (
                  <span
                    key={note}
                    className="px-3 py-1.5 text-sm font-medium bg-[#2a1f3d] rounded-lg text-fuchsia-300 hover:bg-[#382952] hover:text-fuchsia-200 transition-colors"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Common Chords
              </h3>
              <div className="flex flex-wrap gap-2">
                {chords.map((chord) => (
                  <span
                    key={chord}
                    className="px-3 py-1.5 text-sm font-medium bg-[#2a1f3d] rounded-lg text-pink-300 hover:bg-[#382952] hover:text-pink-200 transition-colors"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
