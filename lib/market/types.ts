export type MarketStyle = "slow_bull" | "chop" | "black_swan";
export type NewsTone = "bullish" | "bearish";
export type NewsAccuracy = "real" | "fake";

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
  candles: Candle[];
}

export interface NewsEvent {
  id: string;
  tick: number;
  ticker: string;
  headline: string;
  headlineVariant: number;
  tone: NewsTone;
  accuracy: NewsAccuracy;
  impact: number;
}

export interface Market {
  seed: string;
  style: MarketStyle;
  totalDays: number;
  ticksPerDay: number;
  totalTicks: number;
  tickers: MarketTicker[];
  featuredTicker: string;
  scheduledEvents: NewsEvent[];
}
