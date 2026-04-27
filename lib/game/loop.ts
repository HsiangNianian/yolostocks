export const BASE_TICK_MS = 850;

export function getLoopInterval(speed: number): number {
  return Math.max(120, Math.floor(BASE_TICK_MS / speed));
}
