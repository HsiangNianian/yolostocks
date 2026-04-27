import type { Market, MarketStyle, MarketTicker, NewsAccuracy, NewsEvent, NewsTone } from "@/lib/market/types";
import { buildTickerSeries } from "@/lib/market/priceEngine";
import { buildWorldEvents, type WorldAgentConfig } from "@/lib/world/agent";
import {
  createRng,
  pickOne,
  randomBetween,
  shuffle,
  weightedPick,
} from "@/lib/utils/random";

const COMPANY_PREFIXES = [
  "NOVA",
  "LUNA",
  "BYTE",
  "KAI",
  "CRYO",
  "AERO",
  "VANTA",
  "ATOM",
  "BRICK",
  "VOID",
];

const COMPANY_SUFFIXES = [
  "CORE",
  "WORKS",
  "LABS",
  "MOTIVE",
  "HOLDINGS",
  "GRID",
  "STACK",
  "DYNAMICS",
  "CAPITAL",
  "MATRIX",
];

const STYLE_WEIGHTS: { value: MarketStyle; weight: number }[] = [
  { value: "slow_bull", weight: 0.36 },
  { value: "chop", weight: 0.42 },
  { value: "black_swan", weight: 0.22 },
];

export function generateMarket(
  seed?: string,
  startTimestampSec = 1_700_000_000,
  worldAgent?: WorldAgentConfig,
  sourceAgentName = "House Dealer",
): Market {
  return generateMarketWithStart(seed, startTimestampSec, worldAgent, sourceAgentName);
}

export function generateMarketWithStart(
  seed?: string,
  startTimestampSec = 1_700_000_000,
  worldAgent?: WorldAgentConfig,
  sourceAgentName = "House Dealer",
): Market {
  const resolvedSeed = seed?.trim() || `seed-${Date.now()}`;
  const worldClockKey = Math.floor(startTimestampSec / 60).toString();
  const worldSeed = `${resolvedSeed}:${worldClockKey}`;
  const rng = createRng(worldSeed);
  const style = weightedPick(rng, STYLE_WEIGHTS);
  const totalDays = 30;
  const ticksPerDay = 30;
  const totalTicks = totalDays * ticksPerDay;

  const tickers = buildTickers(rng, totalTicks, style, startTimestampSec);
  const featuredTicker = pickOne(rng, tickers).symbol;
  const scheduledEvents = worldAgent
    ? buildWorldEvents({
        tickers,
        totalTicks,
        style,
        featuredTicker,
        worldSeed,
        worldAgent,
        sourceAgentName,
      })
    : [];
  const enrichedTickers = tickers.map((ticker) => ({
    ...ticker,
    candles: buildTickerSeries({
      basePrice: ticker.candles[0]!.close,
      style,
      totalTicks,
      startTimestampSec,
      events: scheduledEvents.filter((event) => event.affectedTickers.includes(ticker.symbol)),
      rng: createRng(`${worldSeed}:${ticker.symbol}:series`),
    }),
  }));

  return {
    seed: resolvedSeed,
    worldClockKey,
    style,
    totalDays,
    ticksPerDay,
    totalTicks,
    tickers: enrichedTickers,
    featuredTicker,
    scheduledEvents: scheduledEvents.sort((left, right) => left.tick - right.tick),
  };
}

function buildTickers(
  rng: ReturnType<typeof createRng>,
  totalTicks: number,
  style: MarketStyle,
  startTimestampSec: number,
): MarketTicker[] {
  const combinations = shuffle(
    rng,
    COMPANY_PREFIXES.flatMap((prefix) =>
      COMPANY_SUFFIXES.map((suffix) => `${prefix} ${suffix}`),
    ),
  ).slice(0, 5);

  return combinations.map((name, index) => {
    const symbol = name
      .split(" ")
      .map((segment) => segment.slice(0, 2))
      .join("")
      .slice(0, 4)
      .toUpperCase();

    const basePrice =
      style === "slow_bull"
        ? randomBetween(rng, 18, 55)
        : style === "black_swan"
          ? randomBetween(rng, 32, 110)
          : randomBetween(rng, 8, 78);

    return {
      symbol: `${symbol}${index + 1}`,
      name,
      candles: [
        {
          time: startTimestampSec,
          open: basePrice,
          high: basePrice,
          low: basePrice,
          close: basePrice,
          volume: totalTicks,
        },
      ],
    };
  });
}
