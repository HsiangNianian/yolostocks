import { z } from "zod";

const decisionActionSchema = z.enum(["BUY", "SELL", "HOLD", "LEVERAGE", "PANIC_SELL"]);

export const agentDecisionMarketBoardSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  moveShort: z.number(),
  moveMedium: z.number(),
  ma5Gap: z.number(),
  ma20Gap: z.number(),
});

export const agentDecisionRequestSchema = z.object({
  locale: z.enum(["en", "zh"]),
  currentTick: z.number().int().nonnegative(),
  selectedTicker: z.string().nullable(),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    personality: z.enum(["martingale", "technician", "insider", "deadhand"]),
    intro: z.string(),
    greed: z.number(),
    fear: z.number(),
    emotionalGreed: z.number(),
    emotionalFear: z.number(),
    level: z.number(),
    lastThought: z.string(),
  }),
  portfolio: z.object({
    cash: z.number(),
    reserveCash: z.number(),
    borrowed: z.number(),
    equity: z.number(),
  }),
  positions: z.array(
    z.object({
      ticker: z.string(),
      quantity: z.number(),
      avgPrice: z.number(),
      leverage: z.number(),
      unrealizedPnl: z.number(),
      pnlRatio: z.number(),
    }),
  ),
  market: z.object({
    seed: z.string(),
    style: z.enum(["slow_bull", "chop", "black_swan"]),
    featuredTicker: z.string(),
    board: z.array(agentDecisionMarketBoardSchema).min(1),
  }),
  news: z.array(
    z.object({
      ticker: z.string(),
      headline: z.string(),
      tone: z.enum(["bullish", "bearish"]),
      accuracy: z.enum(["real", "fake"]),
      ageTicks: z.number().int().nonnegative(),
    }),
  ),
});

export const agentDecisionResponseSchema = z.object({
  action: decisionActionSchema,
  ticker: z.string(),
  confidence: z.number(),
  sizeDelta: z.number().optional().default(0),
  leverageDelta: z.number().optional().default(0),
  reason: z.string().min(4).max(220),
});

export type AgentDecisionRequest = z.infer<typeof agentDecisionRequestSchema>;
