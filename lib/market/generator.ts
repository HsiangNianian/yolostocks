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

export const INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS = 90;
export const LIVE_WORLD_EVENT_LOOKAHEAD_TICKS = 90;
const FALLBACK_START_TIMESTAMP_SEC = 1_700_000_000;

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
  const allScheduledEvents = buildScheduledWorldEvents({
    tickers,
    totalTicks,
    style,
    featuredTicker,
    worldSeed,
    worldAgent,
    sourceAgentName,
  });
  const scheduledEvents = allScheduledEvents.filter(
    (event) => event.tick <= Math.min(totalTicks - 1, INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS),
  );
  const enrichedTickers = rebuildTickers({
    tickers,
    scheduledEvents,
    style,
    totalTicks,
    startTimestampSec,
    worldSeed,
  });

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
    startTimestampSec,
    sourceAgentName,
  };
}

export function rebuildMarketWithScheduledEvents(
  market: Market,
  scheduledEvents: NewsEvent[],
): Market {
  const startTimestampSec =
    market.startTimestampSec ?? market.tickers[0]?.candles[0]?.time ?? FALLBACK_START_TIMESTAMP_SEC;
  const worldSeed = `${market.seed}:${market.worldClockKey}`;

  return {
    ...market,
    tickers: rebuildTickers({
      tickers: market.tickers,
      scheduledEvents,
      style: market.style,
      totalTicks: market.totalTicks,
      startTimestampSec,
      worldSeed,
    }),
    scheduledEvents: scheduledEvents.sort((left, right) => left.tick - right.tick),
    startTimestampSec,
  };
}

export function extendMarketWorldEvents(input: {
  market: Market;
  worldAgent: WorldAgentConfig | null | undefined;
  uptoTick: number;
  sourceAgentName?: string;
}): Market {
  if (!input.worldAgent) {
    return input.market;
  }

  const worldSeed = `${input.market.seed}:${input.market.worldClockKey}`;
  const allScheduledEvents = buildScheduledWorldEvents({
    tickers: input.market.tickers,
    totalTicks: input.market.totalTicks,
    style: input.market.style,
    featuredTicker: input.market.featuredTicker,
    worldSeed,
    worldAgent: input.worldAgent,
    sourceAgentName: input.sourceAgentName ?? input.market.sourceAgentName ?? "House Dealer",
  });
  const targetTick = Math.max(0, Math.min(input.market.totalTicks - 1, input.uptoTick));
  const nextScheduledEvents = allScheduledEvents.filter((event) => event.tick <= targetTick);

  if (
    nextScheduledEvents.length === input.market.scheduledEvents.length &&
    nextScheduledEvents.every(
      (event, index) => input.market.scheduledEvents[index]?.id === event.id,
    )
  ) {
    return input.market;
  }

  return rebuildMarketWithScheduledEvents(input.market, nextScheduledEvents);
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
      basePrice,
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

function buildScheduledWorldEvents(input: {
  tickers: MarketTicker[];
  totalTicks: number;
  style: MarketStyle;
  featuredTicker: string;
  worldSeed: string;
  worldAgent?: WorldAgentConfig;
  sourceAgentName: string;
}): NewsEvent[] {
  if (!input.worldAgent) {
    return [];
  }

  return buildWorldEvents({
    ...input,
    worldAgent: input.worldAgent,
  }).sort((left, right) => left.tick - right.tick);
}

function rebuildTickers(input: {
  tickers: MarketTicker[];
  scheduledEvents: NewsEvent[];
  style: MarketStyle;
  totalTicks: number;
  startTimestampSec: number;
  worldSeed: string;
}): MarketTicker[] {
  return input.tickers.map((ticker) => ({
    ...ticker,
    candles: buildTickerSeries({
      basePrice: ticker.basePrice ?? ticker.candles[0]?.open ?? ticker.candles[0]!.close,
      style: input.style,
      totalTicks: input.totalTicks,
      startTimestampSec: input.startTimestampSec,
      events: input.scheduledEvents.filter((event) =>
        event.affectedTickers.includes(ticker.symbol),
      ),
      rng: createRng(`${input.worldSeed}:${ticker.symbol}:series`),
    }),
  }));
}
