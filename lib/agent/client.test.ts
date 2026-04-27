import { AGENT_TEMPLATES } from "@/lib/agent/agents";
import { buildAgentDecisionRequest } from "@/lib/agent/client";
import { createRuntimeAgent } from "@/lib/agent/decision";
import type { Market } from "@/lib/market/types";

const market: Market = {
  seed: "request-seed",
  worldClockKey: "28333333",
  style: "slow_bull",
  totalDays: 1,
  ticksPerDay: 24,
  totalTicks: 24,
  featuredTicker: "AAA1",
  tickers: [
    {
      symbol: "AAA1",
      name: "Alpha",
      candles: [100, 102, 104, 106, 108].map((close, index) => ({
        time: 1_700_000_000 + index * 60,
        open: close,
        high: close + 1,
        low: close - 1,
        close,
        volume: 1_000,
      })),
    },
    {
      symbol: "BBB2",
      name: "Beta",
      candles: [90, 89, 88, 87, 86].map((close, index) => ({
        time: 1_700_000_000 + index * 60,
        open: close,
        high: close + 1,
        low: close - 1,
        close,
        volume: 1_100,
      })),
    },
  ],
  scheduledEvents: [],
};

describe("buildAgentDecisionRequest", () => {
  it("shapes the agent, portfolio, board, and news payload for the server route", () => {
    const currentAgent = createRuntimeAgent(
      AGENT_TEMPLATES.find((agent) => agent.personality === "insider")!,
      "en",
    );
    const request = buildAgentDecisionRequest({
      locale: "en",
      currentAgent,
      market,
      positions: [
        {
          ticker: "AAA1",
          quantity: 10,
          avgPrice: 100,
          leverage: 1.2,
        },
      ],
      newsQueue: [
        {
          id: "n1",
          tick: 3,
          ticker: "AAA1",
          headline: "AAA1 secures mystery funding",
          headlineZh: "AAA1获得神秘融资",
          headlineVariant: 0,
          tone: "bullish",
          accuracy: "real",
          impact: 0.04,
          kind: "news",
          scope: "ticker",
          affectedTickers: ["AAA1"],
          sourceAgent: "House Dealer",
        },
      ],
      currentTick: 4,
      cash: 8_500,
      reserveCash: 2_500,
      borrowed: 500,
      selectedTicker: "BBB2",
    });

    expect(request.agent.personality).toBe("insider");
    expect(request.portfolio.equity).toBe(9_080);
    expect(request.positions[0]).toMatchObject({
      ticker: "AAA1",
      leverage: 1.2,
      unrealizedPnl: 80,
    });
    expect(request.market.board).toHaveLength(2);
    expect(request.market.board[0]).toMatchObject({
      symbol: "AAA1",
      price: 108,
    });
    expect(request.market.board[0]!.moveShort).toBeCloseTo(0.08, 5);
    expect(request.news[0]).toMatchObject({
      ticker: "AAA1",
      kind: "news",
      scope: "ticker",
      sourceAgent: "House Dealer",
      tone: "bullish",
      accuracy: "real",
      ageTicks: 1,
    });
  });
});
