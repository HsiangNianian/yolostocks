import type { Market, MarketStyle, MarketTicker, NewsAccuracy, NewsEvent, NewsTone } from "@/lib/market/types";
import { buildTickerSeries } from "@/lib/market/priceEngine";
import {
  chance,
  createRng,
  pickOne,
  randomBetween,
  randomInt,
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

const HEADLINE_VERBS = {
  bullish: [
    "secures mystery funding",
    "teases a strategic partnership",
    "leaks a surprise product demo",
    "announces a tokenized buyback",
  ],
  bearish: [
    "faces a sudden regulatory review",
    "misses a guidance whisper number",
    "freezes withdrawals for maintenance",
    "gets hit by a supplier panic",
  ],
};

const STYLE_WEIGHTS: { value: MarketStyle; weight: number }[] = [
  { value: "slow_bull", weight: 0.36 },
  { value: "chop", weight: 0.42 },
  { value: "black_swan", weight: 0.22 },
];

export function generateMarket(seed?: string): Market {
  const resolvedSeed = seed?.trim() || `seed-${Date.now()}`;
  const rng = createRng(resolvedSeed);
  const style = weightedPick(rng, STYLE_WEIGHTS);
  const totalDays = 30;
  const ticksPerDay = 30;
  const totalTicks = totalDays * ticksPerDay;

  const tickers = buildTickers(rng, totalTicks, style);
  const featuredTicker = pickOne(rng, tickers).symbol;
  const scheduledEvents = buildEvents(rng, tickers, totalTicks, style, featuredTicker);
  const enrichedTickers = tickers.map((ticker) => ({
    ...ticker,
    candles: buildTickerSeries({
      basePrice: ticker.candles[0]!.close,
      style,
      totalTicks,
      events: scheduledEvents.filter((event) => event.ticker === ticker.symbol),
      rng: createRng(`${resolvedSeed}:${ticker.symbol}:series`),
    }),
  }));

  return {
    seed: resolvedSeed,
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
          time: 1_700_000_000,
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

function buildEvents(
  rng: ReturnType<typeof createRng>,
  tickers: MarketTicker[],
  totalTicks: number,
  style: MarketStyle,
  featuredTicker: string,
): NewsEvent[] {
  const events: NewsEvent[] = [];
  const baselineCount = style === "chop" ? 6 : 5;

  for (let index = 0; index < baselineCount; index += 1) {
    const ticker = pickOne(rng, tickers);
    const tone = chance(rng, 0.5) ? "bullish" : "bearish";
    const accuracy = chance(rng, 0.63) ? "real" : "fake";
    const tick = randomInt(rng, 30, totalTicks - 40);

    events.push(
      createEvent({
        tick,
        ticker: ticker.symbol,
        tone,
        accuracy,
        impact: randomBetween(rng, 0.018, 0.06),
      }),
    );
  }

  if (style === "slow_bull") {
    events.push(
      createEvent({
        tick: Math.floor(totalTicks * 0.58),
        ticker: featuredTicker,
        tone: "bullish",
        accuracy: "real",
        impact: 0.09,
      }),
    );
  }

  if (style === "black_swan") {
    const swanTick = Math.floor(totalTicks * 0.63);
    for (const ticker of tickers) {
      events.push(
        createEvent({
          tick: swanTick + randomInt(rng, -4, 4),
          ticker: ticker.symbol,
          tone: "bearish",
          accuracy: "real",
          impact: ticker.symbol === featuredTicker ? 0.11 : 0.16,
        }),
      );
    }

    events.push(
      createEvent({
        tick: Math.floor(totalTicks * 0.76),
        ticker: featuredTicker,
        tone: "bullish",
        accuracy: "real",
        impact: 0.13,
      }),
    );
  }

  return dedupeEvents(events);
}

function createEvent(input: {
  tick: number;
  ticker: string;
  tone: NewsTone;
  accuracy: NewsAccuracy;
  impact: number;
}): NewsEvent {
  const verbPool = HEADLINE_VERBS[input.tone];
  const headlineVariant = input.tick % verbPool.length;
  const verb = verbPool[headlineVariant]!;
  return {
    id: `${input.ticker}-${input.tick}-${input.tone}`,
    tick: input.tick,
    ticker: input.ticker,
    tone: input.tone,
    accuracy: input.accuracy,
    impact: input.impact,
    headline: `${input.ticker} ${verb}`,
    headlineVariant,
  };
}

function dedupeEvents(events: NewsEvent[]): NewsEvent[] {
  const eventMap = new Map<string, NewsEvent>();
  for (const event of events) {
    eventMap.set(`${event.ticker}-${event.tick}`, event);
  }
  return [...eventMap.values()];
}
