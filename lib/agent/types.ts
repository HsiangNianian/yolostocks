import type { NewsEvent } from "@/lib/market/types";
import type { LocalizedText } from "@/lib/i18n";

export type AgentPersonality = "martingale" | "technician" | "insider" | "deadhand";
export type DecisionAction = "BUY" | "SELL" | "HOLD" | "LEVERAGE" | "PANIC_SELL";
export type DecisionSource = "ai" | "fallback" | "player";

export interface AgentTemplate {
  id: string;
  name: LocalizedText;
  avatar: string;
  personality: AgentPersonality;
  greed: number;
  fear: number;
  luck: number;
  level: number;
  isAlive: boolean;
  intro: LocalizedText;
  quotePool: LocalizedText[];
}

export interface AgentEmotionState {
  greed: number;
  fear: number;
}

export interface Decision {
  action: DecisionAction;
  ticker: string;
  confidence: number;
  reason: string;
  sizeDelta: number;
  leverageDelta: number;
  sourceNewsId?: string;
}

export interface RunningAgentState extends AgentTemplate {
  emotionalState: AgentEmotionState;
  lastThought: string;
  lastDecision: Decision | null;
  lastNews: NewsEvent | null;
  realizedPnl: number;
  streak: number;
}
