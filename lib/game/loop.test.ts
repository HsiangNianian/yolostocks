import {
  BASE_TICK_MS,
  MARKET_TICK_MS,
  consumeRealtimeLoop,
  getSessionTimestampMs,
} from "@/lib/game/loop";

describe("game loop timing", () => {
  it("converts real elapsed time and speed into discrete ticks", () => {
    expect(
      consumeRealtimeLoop({
        accumulatorMs: 0,
        elapsedMs: BASE_TICK_MS,
        speed: 2,
      }),
    ).toEqual({
      ticks: 2,
      remainderMs: 0,
    });
  });

  it("maps session ticks onto a real-time clock", () => {
    expect(getSessionTimestampMs(1_700_000_000_000, 5)).toBe(
      1_700_000_000_000 + 5 * MARKET_TICK_MS,
    );
  });
});
