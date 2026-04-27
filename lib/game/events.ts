import type { NewsEvent } from "@/lib/market/types";

export function getTriggeredNews(
  scheduledEvents: NewsEvent[],
  previousTick: number,
  currentTick: number,
): NewsEvent[] {
  return scheduledEvents.filter(
    (event) => event.tick > previousTick && event.tick <= currentTick,
  );
}
