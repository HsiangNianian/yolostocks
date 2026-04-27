export const BASE_TICK_MS = 1_000;
export const MARKET_TICK_MS = 1_000;

export function consumeRealtimeLoop(input: {
  accumulatorMs: number;
  elapsedMs: number;
  speed: number;
}): {
  ticks: number;
  remainderMs: number;
} {
  const totalMs =
    Math.max(0, input.accumulatorMs) +
    Math.max(0, input.elapsedMs) * Math.max(0, input.speed);
  const ticks = Math.floor(totalMs / BASE_TICK_MS);

  return {
    ticks,
    remainderMs: totalMs - ticks * BASE_TICK_MS,
  };
}

export function getSessionTimestampMs(
  sessionStartedAt: number | null,
  currentTick: number,
): number | null {
  if (sessionStartedAt === null) {
    return null;
  }

  return sessionStartedAt + currentTick * MARKET_TICK_MS;
}
