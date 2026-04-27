export type MarketStyle = "slow_bull" | "chop" | "black_swan";
export type NewsTone = "bullish" | "bearish";
export type NewsAccuracy = "real" | "fake";
export type WorldEventKind = "news" | "policy" | "liquidity" | "meme";
export type WorldEventScope = "ticker" | "market";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  basePrice?: number;
  candles: Candle[];
}

export interface NewsEvent {
  id: string;
  tick: number;
  ticker: string;
  headline: string;
  headlineZh: string;
  headlineVariant: number;
  tone: NewsTone;
  accuracy: NewsAccuracy;
  impact: number;
  kind: WorldEventKind;
  scope: WorldEventScope;
  affectedTickers: string[];
  sourceAgent: string;
}

export interface Market {
  seed: string;
  worldClockKey: string;
  style: MarketStyle;
  totalDays: number;
  ticksPerDay: number;
  totalTicks: number;
  tickers: MarketTicker[];
  featuredTicker: string;
  scheduledEvents: NewsEvent[];
  startTimestampSec?: number;
  sourceAgentName?: string;
}
