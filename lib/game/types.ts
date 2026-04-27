import type {
  DecisionAction,
  DecisionSource,
  RunningAgentState,
} from "@/lib/agent/types";

export type GamePhase = "idle" | "running" | "gameover";

export interface Position {
  ticker: string;
  quantity: number;
  avgPrice: number;
  leverage: number;
}

export interface MarginCall {
  requiredCash: number;
  message: string;
}

export interface GameResult {
  title: string;
  description: string;
  survived: boolean;
}

export interface MuseumRecord {
  id: string;
  agentSnapshot: RunningAgentState;
  equityHistory: number[];
  deathReason: string;
  lastWords: string;
  createdAt: string;
  seed: string;
  finalEquity: number;
}

export interface TradeAnnotation {
  id: string;
  tick: number;
  ticker: string;
  action: DecisionAction;
  source: DecisionSource;
  reason: string;
  confidence: number;
  executedPrice: number;
  executedQuantity: number;
}

export type DecisionEngineStatus = "idle" | "thinking" | "ready" | "fallback" | "error";

export interface DecisionEngineState {
  status: DecisionEngineStatus;
  lastSource: DecisionSource | null;
  lastError: string | null;
  lastRequestedTick: number | null;
  lastAppliedTick: number | null;
}
