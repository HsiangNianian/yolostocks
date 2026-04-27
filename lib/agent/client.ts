import type { AgentDecisionRequest } from "@/lib/agent/ai-contract";
import type { Decision, RunningAgentState } from "@/lib/agent/types";
import { getTickerPrice } from "@/lib/agent/decision";
import { formatNewsHeadline, resolveText, type Locale } from "@/lib/i18n";
import type { Position } from "@/lib/game/types";
import type { Market, NewsEvent } from "@/lib/market/types";

export function buildAgentDecisionRequest(input: {
  locale: Locale;
  currentAgent: RunningAgentState;
  market: Market;
  positions: Position[];
  newsQueue: NewsEvent[];
  currentTick: number;
  cash: number;
  reserveCash: number;
  borrowed: number;
  selectedTicker: string | null;
}): AgentDecisionRequest {
  const board = input.market.tickers.map((ticker) => {
    const price = getTickerPrice(input.market, ticker.symbol, input.currentTick);
    const anchorShort = getTickerPrice(input.market, ticker.symbol, Math.max(0, input.currentTick - 4));
    const anchorMedium = getTickerPrice(input.market, ticker.symbol, Math.max(0, input.currentTick - 12));
    const ma5 = movingAverage(ticker.symbol, input.market, input.currentTick, 5);
    const ma20 = movingAverage(ticker.symbol, input.market, input.currentTick, 20);

    return {
      symbol: ticker.symbol,
      name: ticker.name,
      price,
      moveShort: anchorShort === 0 ? 0 : price / anchorShort - 1,
      moveMedium: anchorMedium === 0 ? 0 : price / anchorMedium - 1,
      ma5Gap: ma5 === 0 ? 0 : price / ma5 - 1,
      ma20Gap: ma20 === 0 ? 0 : price / ma20 - 1,
    };
  });

  const exposure = input.positions.reduce(
    (sum, position) =>
      sum + position.quantity * getTickerPrice(input.market, position.ticker, input.currentTick),
    0,
  );
  const equity = input.cash + exposure - input.borrowed;

  return {
    locale: input.locale,
    currentTick: input.currentTick,
    selectedTicker: input.selectedTicker,
    agent: {
      id: input.currentAgent.id,
      name: resolveText(input.locale, input.currentAgent.name),
      personality: input.currentAgent.personality,
      intro: resolveText(input.locale, input.currentAgent.intro),
      greed: input.currentAgent.greed,
      fear: input.currentAgent.fear,
      emotionalGreed: input.currentAgent.emotionalState.greed,
      emotionalFear: input.currentAgent.emotionalState.fear,
      level: input.currentAgent.level,
      lastThought: input.currentAgent.lastThought,
    },
    portfolio: {
      cash: input.cash,
      reserveCash: input.reserveCash,
      borrowed: input.borrowed,
      equity,
    },
    positions: input.positions.map((position) => {
      const price = getTickerPrice(input.market, position.ticker, input.currentTick);
      const unrealizedPnl = (price - position.avgPrice) * position.quantity;
      return {
        ticker: position.ticker,
        quantity: position.quantity,
        avgPrice: position.avgPrice,
        leverage: position.leverage,
        unrealizedPnl,
        pnlRatio: position.avgPrice === 0 ? 0 : price / position.avgPrice - 1,
      };
    }),
    market: {
      seed: input.market.seed,
      style: input.market.style,
      featuredTicker: input.market.featuredTicker,
      board,
    },
    news: input.newsQueue
      .slice(-4)
      .reverse()
      .map((item) => ({
        ticker: item.ticker,
        headline: formatNewsHeadline(input.locale, item),
        kind: item.kind,
        scope: item.scope,
        sourceAgent: item.sourceAgent,
        tone: item.tone,
        accuracy: item.accuracy,
        ageTicks: Math.max(0, input.currentTick - item.tick),
      })),
  };
}

export async function fetchAgentDecision(
  request: AgentDecisionRequest,
): Promise<{ decision: Decision; source: "ai" }> {
  const response = await fetch("/api/agent-decision", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? `Agent decision request failed with ${response.status}`);
  }

  return (await response.json()) as { decision: Decision; source: "ai" };
}

function movingAverage(
  symbol: string,
  market: Market,
  currentTick: number,
  length: number,
): number {
  const ticker = market.tickers.find((item) => item.symbol === symbol);
  if (!ticker) {
    return 0;
  }

  const start = Math.max(0, currentTick - length + 1);
  const sample = ticker.candles.slice(start, currentTick + 1);
  const sum = sample.reduce((accumulator, candle) => accumulator + candle.close, 0);
  return sample.length === 0 ? 0 : sum / sample.length;
}
