import { AGENT_TEMPLATES } from "@/lib/agent/agents";
import { createRuntimeAgent } from "@/lib/agent/decision";
import {
  AI_DECISION_INTERVAL_TICKS,
  shouldRequestAgentDecision,
} from "@/lib/game/decisionLoop";
import type { DecisionEngineState } from "@/lib/game/types";
import type { Market } from "@/lib/market/types";

const market: Market = {
  seed: "test-seed",
  style: "chop",
  totalDays: 1,
  ticksPerDay: 24,
  totalTicks: 48,
  featuredTicker: "AAA1",
  tickers: [
    {
      symbol: "AAA1",
      name: "AAA1",
      candles: Array.from({ length: 48 }, (_, index) => ({
        time: 1_700_000_000 + index * 60,
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 1_000,
      })),
    },
  ],
  scheduledEvents: [],
};

const currentAgent = createRuntimeAgent(AGENT_TEMPLATES[0]!, "en");

function makeDecisionEngine(
  overrides: Partial<DecisionEngineState> = {},
): DecisionEngineState {
  return {
    status: "idle",
    lastSource: null,
    lastError: null,
    lastRequestedTick: null,
    lastAppliedTick: null,
    ...overrides,
  };
}

describe("shouldRequestAgentDecision", () => {
  it("requests immediately on a fresh run", () => {
    expect(
      shouldRequestAgentDecision({
        phase: "running",
        currentTick: 0,
        market,
        currentAgent,
        marginCall: null,
        decisionEngine: makeDecisionEngine(),
        newsQueue: [],
      }),
    ).toBe(true);
  });

  it("blocks duplicate requests while thinking", () => {
    expect(
      shouldRequestAgentDecision({
        phase: "running",
        currentTick: 5,
        market,
        currentAgent,
        marginCall: null,
        decisionEngine: makeDecisionEngine({
          status: "thinking",
          lastRequestedTick: 5,
        }),
        newsQueue: [],
      }),
    ).toBe(false);
  });

  it("requests again when the interval threshold is reached", () => {
    expect(
      shouldRequestAgentDecision({
        phase: "running",
        currentTick: 10 + AI_DECISION_INTERVAL_TICKS,
        market,
        currentAgent,
        marginCall: null,
        decisionEngine: makeDecisionEngine({
          status: "ready",
          lastAppliedTick: 10,
        }),
        newsQueue: [],
      }),
    ).toBe(true);
  });

  it("requests on fresh news at the current tick", () => {
    expect(
      shouldRequestAgentDecision({
        phase: "running",
        currentTick: 17,
        market,
        currentAgent,
        marginCall: null,
        decisionEngine: makeDecisionEngine({
          status: "ready",
          lastAppliedTick: 12,
          lastRequestedTick: 16,
        }),
        newsQueue: [
          {
            id: "n1",
            tick: 17,
            ticker: "AAA1",
            headline: "AAA1 secures mystery funding",
            headlineVariant: 0,
            tone: "bullish",
            accuracy: "real",
            impact: 0.04,
          },
        ],
      }),
    ).toBe(true);
  });
});
