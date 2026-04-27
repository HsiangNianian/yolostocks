import type { RunningAgentState } from "@/lib/agent/types";

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
