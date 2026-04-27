"use client";

import { playSound, type SoundCue } from "@/lib/sound";
import { useGameStore } from "@/store/gameStore";

export function useSound() {
  const muted = useGameStore((state) => state.settings.muted);

  return {
    muted,
    play: (cue: SoundCue) => playSound(cue, muted),
  };
}
