import { Howl } from "howler";

export type SoundCue = "buy" | "sell" | "alert" | "cash";

const SOUND_SOURCES: Record<SoundCue, string> = {
  buy: "/sounds/buy.mp3",
  sell: "/sounds/sell.mp3",
  alert: "/sounds/alert.mp3",
  cash: "/sounds/cash.mp3",
};

const cache = new Map<SoundCue, Howl>();

export function playSound(cue: SoundCue, muted: boolean): void {
  if (muted || typeof window === "undefined") {
    return;
  }

  if (window.navigator.userAgent.toLowerCase().includes("jsdom")) {
    return;
  }

  try {
    const existing = cache.get(cue);
    if (existing) {
      existing.play();
      return;
    }

    const howl = new Howl({
      src: [SOUND_SOURCES[cue]],
      volume: cue === "alert" ? 0.4 : 0.22,
      html5: false,
      preload: false,
    });

    cache.set(cue, howl);
    howl.play();
  } catch {
    // Missing placeholder assets should not block the game loop.
  }
}
