"use client";

import { useEffect, useRef } from "react";

import { consumeRealtimeLoop } from "@/lib/game/loop";
import { useGameStore } from "@/store/gameStore";

export function useGameLoop(): void {
  const phase = useGameStore((state) => state.phase);
  const speed = useGameStore((state) => state.speed);
  const marginCall = useGameStore((state) => state.marginCall);
  const tick = useGameStore((state) => state.tick);
  const requestAgentDecisionIfNeeded = useGameStore(
    (state) => state.requestAgentDecisionIfNeeded,
  );
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    if (phase !== "running" || marginCall) {
      return;
    }

    accumulatorRef.current = 0;
    lastFrameRef.current = null;

    const step = (frameTime: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = frameTime;
        frameRef.current = window.requestAnimationFrame(step);
        return;
      }

      const elapsedMs = frameTime - lastFrameRef.current;
      lastFrameRef.current = frameTime;

      const { ticks, remainderMs } = consumeRealtimeLoop({
        accumulatorMs: accumulatorRef.current,
        elapsedMs,
        speed,
      });
      accumulatorRef.current = remainderMs;

      const { market, currentTick } = useGameStore.getState();
      const remainingTicks = market
        ? Math.max(0, market.totalTicks - 1 - currentTick)
        : 0;
      const ticksToAdvance = Math.min(ticks, remainingTicks);

      for (let index = 0; index < ticksToAdvance; index += 1) {
        tick();
      }

      if (ticksToAdvance > 0) {
        void requestAgentDecisionIfNeeded();
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      lastFrameRef.current = null;
      accumulatorRef.current = 0;
    };
  }, [
    marginCall,
    phase,
    requestAgentDecisionIfNeeded,
    speed,
    tick,
  ]);

  useEffect(() => {
    if (phase !== "running" || marginCall) {
      return;
    }

    void requestAgentDecisionIfNeeded(true);
  }, [marginCall, phase, requestAgentDecisionIfNeeded]);
}
