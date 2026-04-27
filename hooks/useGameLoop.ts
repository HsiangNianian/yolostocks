"use client";

import { useEffect } from "react";

import { getLoopInterval } from "@/lib/game/loop";
import { useGameStore } from "@/store/gameStore";

export function useGameLoop(): void {
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const marginCall = useGameStore((state) => state.marginCall);
  const tick = useGameStore((state) => state.tick);

  useEffect(() => {
    if (phase !== "running" || marginCall) {
      return;
    }

    const handle = window.setInterval(() => {
      tick();
    }, getLoopInterval(speed));

    return () => {
      window.clearInterval(handle);
    };
  }, [marginCall, phase, speed, tick]);
}
