import type { GamePhase, MarginCall, DecisionEngineState } from "@/lib/game/types";
import type { Market, NewsEvent } from "@/lib/market/types";
import type { RunningAgentState } from "@/lib/agent/types";

export const AI_DECISION_INTERVAL_TICKS = 12;
export const AI_DECISION_STALE_TICKS = 8;

export function shouldRequestAgentDecision(input: {
  force?: boolean;
  phase: GamePhase;
  currentTick: number;
  market: Market | null;
  currentAgent: RunningAgentState | null;
  marginCall: MarginCall | null;
  decisionEngine: DecisionEngineState;
  newsQueue: NewsEvent[];
}): boolean {
  if (
    input.phase !== "running" ||
    !input.market ||
    !input.currentAgent ||
    input.marginCall ||
    input.decisionEngine.status === "thinking"
  ) {
    return false;
  }

  if (input.force) {
    return true;
  }

  if (input.currentTick === 0 && input.decisionEngine.lastAppliedTick === null) {
    return true;
  }

  const latestNews = input.newsQueue.at(-1);
  if (
    latestNews &&
    latestNews.tick === input.currentTick &&
    input.decisionEngine.lastRequestedTick !== input.currentTick
  ) {
    return true;
  }

  const anchorTick = input.decisionEngine.lastAppliedTick ?? -AI_DECISION_INTERVAL_TICKS;
  return input.currentTick - anchorTick >= AI_DECISION_INTERVAL_TICKS;
}
