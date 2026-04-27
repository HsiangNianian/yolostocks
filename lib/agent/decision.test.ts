import { AGENT_TEMPLATES } from "@/lib/agent/agents";
import { createRuntimeAgent, decideAction } from "@/lib/agent/decision";
import type { Market } from "@/lib/market/types";

function fixedRng(value: number) {
  return (() => value) as any;
}

function buildMarket(closesByTicker: Record<string, number[]>): Market {
  const tickers = Object.entries(closesByTicker).map(([symbol, closes]) => ({
    symbol,
    name: symbol,
    candles: closes.map((close, index) => ({
      time: 1_700_000_000 + index * 60,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1_000,
    })),
  }));

  return {
    seed: "test-seed",
    style: "chop",
    totalDays: 1,
    ticksPerDay: 10,
    totalTicks: tickers[0]?.candles.length ?? 0,
    tickers,
    featuredTicker: tickers[0]?.symbol ?? "AAA1",
    scheduledEvents: [],
  };
}

describe("decideAction", () => {
  it("lets insider buy on a bullish real headline with enough conviction", () => {
    const market = buildMarket({
      AAA1: [100, 101, 103, 104],
      BBB2: [90, 89, 88, 87],
    });
    const agent = createRuntimeAgent(
      AGENT_TEMPLATES.find((template) => template.personality === "insider")!,
    );

    const decision = decideAction({
      agent,
      market,
      currentTick: 3,
      positions: [],
      newsQueue: [
        {
          id: "n1",
          tick: 2,
          ticker: "AAA1",
          headline: "AAA1 teases a strategic partnership",
          headlineVariant: 1,
          tone: "bullish",
          accuracy: "real",
          impact: 0.08,
        },
      ],
      equity: 10_000,
      cash: 10_000,
      borrowed: 0,
      locale: "en",
      rng: fixedRng(0.1),
    });

    expect(decision.action).toBe("BUY");
    expect(decision.ticker).toBe("AAA1");
  });

  it("pushes martingale into leverage on a deep underwater position", () => {
    const market = buildMarket({
      AAA1: [100, 92, 84, 78],
      BBB2: [50, 50, 50, 50],
    });
    const agent = createRuntimeAgent(
      AGENT_TEMPLATES.find((template) => template.personality === "martingale")!,
    );

    const decision = decideAction({
      agent,
      market,
      currentTick: 3,
      positions: [
        {
          ticker: "AAA1",
          quantity: 10,
          avgPrice: 100,
          leverage: 1,
        },
      ],
      newsQueue: [],
      equity: 8_500,
      cash: 2_500,
      borrowed: 0,
      locale: "en",
      rng: fixedRng(0.05),
    });

    expect(decision.action).toBe("LEVERAGE");
    expect(decision.ticker).toBe("AAA1");
  });
});
