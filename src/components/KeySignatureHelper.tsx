"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span className="text-lg text-indigo-300">Key of {keySig}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-indigo-300"
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Scale Notes
              </h3>
              <div className="flex flex-wrap gap-2">
                {scale.map((note) => (
                  <span
                    key={note}
                    className="px-2 py-1 bg-gray-700 rounded text-sm text-indigo-200"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Common Chords
              </h3>
              <div className="flex flex-wrap gap-2">
                {chords.map((chord) => (
                  <span
                    key={chord}
                    className="px-2 py-1 bg-gray-700 rounded text-sm text-indigo-200"
                  >
                    {chord}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
