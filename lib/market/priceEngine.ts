import type { Candle, MarketStyle, NewsEvent } from "@/lib/market/types";
import { clamp, randomBetween, randomNormal, type Rng } from "@/lib/utils/random";

const STYLE_PROFILE: Record<
  MarketStyle,
  {
    drift: number;
    volatility: number;
    cycle: number;
    trendMemory: number;
  }
> = {
  slow_bull: {
    drift: 0.0017,
    volatility: 0.0065,
    cycle: 0.0016,
    trendMemory: 0.84,
  },
  chop: {
    drift: 0.00015,
    volatility: 0.0115,
    cycle: 0.0032,
    trendMemory: 0.72,
  },
  black_swan: {
    drift: 0.00055,
    volatility: 0.0084,
    cycle: 0.0024,
    trendMemory: 0.78,
  },
};

export interface BuildTickerSeriesInput {
  basePrice: number;
  style: MarketStyle;
  totalTicks: number;
  startTimestampSec: number;
  events: NewsEvent[];
  rng: Rng;
}

export function buildTickerSeries({
  basePrice,
  style,
  totalTicks,
  startTimestampSec,
  events,
  rng,
}: BuildTickerSeriesInput): Candle[] {
  const profile = STYLE_PROFILE[style];
  const amplitude = randomBetween(rng, 0.6, 1.35);
  const cycleOffset = randomBetween(rng, 0, Math.PI);
  const candles: Candle[] = [];
  let close = basePrice;
  let trend = randomBetween(rng, -profile.volatility, profile.volatility);

  for (let tick = 0; tick < totalTicks; tick += 1) {
    const open = close;
    const localEvents = events.filter((event) => event.tick === tick);
    const cycle = Math.sin((tick / totalTicks) * Math.PI * 6 * amplitude + cycleOffset);
    trend = clamp(
      trend * profile.trendMemory + randomNormal(rng, 0, profile.volatility * 0.18),
      -profile.volatility * 2.4,
      profile.volatility * 2.4,
    );

    let delta =
      profile.drift +
      randomNormal(rng, 0, profile.volatility) +
      trend +
      cycle * profile.cycle;

    for (const event of localEvents) {
      const directionalImpact = event.tone === "bullish" ? 1 : -1;
      const accuracyModifier = event.accuracy === "real" ? 1 : -0.78;
      delta += directionalImpact * event.impact * accuracyModifier;
    }

    delta = clamp(delta, -0.28, 0.24);
    close = Math.max(1, open * (1 + delta));

    const wickFactor = Math.abs(randomNormal(rng, 0, profile.volatility * 0.55));
    const high = Math.max(open, close) * (1 + wickFactor);
    const low = Math.max(0.5, Math.min(open, close) * (1 - wickFactor * 0.92));
    const volume = Math.floor(1_200 + Math.abs(delta) * 140_000 + rng() * 6_000);

    candles.push({
      time: startTimestampSec + tick,
      open: roundPrice(open),
      high: roundPrice(high),
      low: roundPrice(low),
      close: roundPrice(close),
      volume,
    });
  }

  return candles;
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}
