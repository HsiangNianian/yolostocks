"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AGENT_TEMPLATES } from "@/lib/agent/agents";
import { buildAgentDecisionRequest, fetchAgentDecision } from "@/lib/agent/client";
import {
  createRuntimeAgent,
  decideAction,
  evolveAgentEmotion,
  getTickerPrice,
  pickAgentQuote,
} from "@/lib/agent/decision";
import type {
  AgentTemplate,
  Decision,
  DecisionSource,
  RunningAgentState,
} from "@/lib/agent/types";
import {
  AI_DECISION_STALE_TICKS,
  shouldRequestAgentDecision,
} from "@/lib/game/decisionLoop";
import { getTriggeredNews } from "@/lib/game/events";
import type {
  DecisionEngineState,
  GamePhase,
  GameResult,
  MarginCall,
  MuseumRecord,
  Position,
} from "@/lib/game/types";
import { detectLocale, type Locale, type LocaleMode, pickText } from "@/lib/i18n";
import { generateMarket } from "@/lib/market/generator";
import type { Market, NewsEvent } from "@/lib/market/types";
import { createRng } from "@/lib/utils/random";

const STARTING_CASH = 10_000;
const STARTING_RESERVE = 2_500;
const MAX_BORROW_MULTIPLIER = 1.4;

export interface GameStoreState {
  phase: GamePhase;
  agents: AgentTemplate[];
  currentAgent: RunningAgentState | null;
  market: Market | null;
  positions: Position[];
  cash: number;
  reserveCash: number;
  borrowed: number;
  equityHistory: number[];
  newsQueue: NewsEvent[];
  speed: 1 | 2 | 5;
  selectedTicker: string | null;
  currentTick: number;
  marginCall: MarginCall | null;
  decisionEngine: DecisionEngineState;
  museumRecords: MuseumRecord[];
  settings: {
    muted: boolean;
    locale: Locale;
    localeMode: LocaleMode;
  };
  gameResult: GameResult | null;
  startGame: (agentId: string, seed?: string) => void;
  tick: () => void;
  requestAgentDecisionIfNeeded: (force?: boolean) => Promise<void>;
  forceBuy: () => void;
  forceSell: () => void;
  selectTicker: (ticker: string) => void;
  cycleSpeed: () => void;
  setMuted: (muted: boolean) => void;
  setLocale: (locale: Locale) => void;
  useAutoLocale: () => void;
  hydrateLocale: () => void;
  resolveMarginCall: (accept: boolean) => void;
  returnToLobby: () => void;
}

type GameStoreActionKeys =
  | "startGame"
  | "tick"
  | "requestAgentDecisionIfNeeded"
  | "forceBuy"
  | "forceSell"
  | "selectTicker"
  | "cycleSpeed"
  | "setMuted"
  | "setLocale"
  | "useAutoLocale"
  | "hydrateLocale"
  | "resolveMarginCall"
  | "returnToLobby";

type GameStoreData = Omit<GameStoreState, GameStoreActionKeys>;

function createInitialDecisionEngine(): DecisionEngineState {
  return {
    status: "idle",
    lastSource: null,
    lastError: null,
    lastRequestedTick: null,
    lastAppliedTick: null,
  };
}

const initialState: GameStoreData = {
  phase: "idle",
  agents: AGENT_TEMPLATES,
  currentAgent: null,
  market: null,
  positions: [],
  cash: STARTING_CASH,
  reserveCash: STARTING_RESERVE,
  borrowed: 0,
  equityHistory: [],
  newsQueue: [],
  speed: 1,
  selectedTicker: null,
  currentTick: 0,
  marginCall: null,
  decisionEngine: createInitialDecisionEngine(),
  museumRecords: [],
  settings: {
    muted: false,
    locale: "en",
    localeMode: "auto",
  },
  gameResult: null,
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      startGame: (agentId, seed) => {
        const agentTemplate =
          get().agents.find((agent) => agent.id === agentId) ?? AGENT_TEMPLATES[0];
        const market = generateMarket(seed);
        const locale = get().settings.locale;

        set({
          phase: "running",
          currentAgent: createRuntimeAgent(agentTemplate, locale),
          market,
          positions: [],
          cash: STARTING_CASH,
          reserveCash: STARTING_RESERVE,
          borrowed: 0,
          equityHistory: [STARTING_CASH],
          newsQueue: [],
          speed: 1,
          selectedTicker: market.tickers[0]?.symbol ?? null,
          currentTick: 0,
          marginCall: null,
          decisionEngine: createInitialDecisionEngine(),
          gameResult: null,
        });
      },
      tick: () => {
        set((state) => {
          if (
            state.phase !== "running" ||
            !state.market ||
            !state.currentAgent ||
            state.marginCall
          ) {
            return state;
          }

          const previousTick = state.currentTick;
          const nextTick = Math.min(previousTick + 1, state.market.totalTicks - 1);
          const triggeredNews = getTriggeredNews(
            state.market.scheduledEvents,
            previousTick,
            nextTick,
          );
          const newsQueue = [...state.newsQueue, ...triggeredNews].slice(-8);
          const latestNews = triggeredNews.at(-1) ?? state.newsQueue.at(-1) ?? null;
          const beforeSnapshot = getPortfolioSnapshot(
            state.market,
            state.positions,
            previousTick,
            state.cash,
            state.borrowed,
          );
          const afterSnapshot = getPortfolioSnapshot(
            state.market,
            state.positions,
            nextTick,
            state.cash,
            state.borrowed,
          );

          const currentAgent = {
            ...evolveAgentEmotion(
              {
                ...state.currentAgent,
                lastNews: latestNews,
              },
              afterSnapshot.equity - beforeSnapshot.equity,
              afterSnapshot.unrealizedPnl,
            ),
            lastNews: latestNews,
          };

          const baseState: GameStoreData = {
            ...state,
            currentTick: nextTick,
            newsQueue,
            currentAgent,
            equityHistory: [...state.equityHistory, afterSnapshot.equity],
          };

          if (afterSnapshot.equity <= 0) {
            return finalizeRun(
              baseState,
              false,
              pickText(
                state.settings.locale,
                "Account equity hit zero. The broker carried you out of the hall.",
                "账户净值归零，券商把你抬出了大厅。",
              ),
            );
          }

          const marginCall = getMarginCall(
            afterSnapshot.equity,
            afterSnapshot.exposure,
            state.borrowed,
            state.settings.locale,
          );

          if (marginCall) {
            return {
              ...baseState,
              marginCall,
            };
          }

          if (nextTick >= state.market.totalTicks - 1) {
            return finalizeRun(
              baseState,
              true,
              pickText(
                state.settings.locale,
                `${state.currentAgent.name.en} walked out of 30 days of tape alive, but the eyes are wrong now.`,
                `${state.currentAgent.name.zh} 活着走出了 30 天行情，但眼神已经不对了。`,
              ),
            );
          }

          return baseState;
        });
      },
      requestAgentDecisionIfNeeded: async (force = false) => {
        const snapshot = get();
        if (
          !snapshot.market ||
          !snapshot.currentAgent ||
          !shouldRequestAgentDecision({
            force,
            phase: snapshot.phase,
            currentTick: snapshot.currentTick,
            market: snapshot.market,
            currentAgent: snapshot.currentAgent,
            marginCall: snapshot.marginCall,
            decisionEngine: snapshot.decisionEngine,
            newsQueue: snapshot.newsQueue,
          })
        ) {
          return;
        }

        const requestTick = snapshot.currentTick;
        const requestPayload = buildAgentDecisionRequest({
          locale: snapshot.settings.locale,
          currentAgent: snapshot.currentAgent,
          market: snapshot.market,
          positions: snapshot.positions,
          newsQueue: snapshot.newsQueue,
          currentTick: snapshot.currentTick,
          cash: snapshot.cash,
          reserveCash: snapshot.reserveCash,
          borrowed: snapshot.borrowed,
          selectedTicker: snapshot.selectedTicker,
        });

        set((state) => ({
          decisionEngine: {
            ...state.decisionEngine,
            status: "thinking",
            lastError: null,
            lastRequestedTick: requestTick,
          },
        }));

        try {
          const { decision, source } = await fetchAgentDecision(requestPayload);
          set((state) => {
            if (!canApplyAsyncDecision(state, requestTick)) {
              return {
                decisionEngine: settleDecisionEngine(state.decisionEngine),
              };
            }

            return applyResolvedDecision(state, decision, source, {
              status: "ready",
              lastError: null,
              lastRequestedTick: requestTick,
            });
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown agent decision request error";

          set((state) => {
            if (!canApplyAsyncDecision(state, requestTick)) {
              return {
                decisionEngine: {
                  ...settleDecisionEngine(state.decisionEngine),
                  status: "error",
                  lastError: message,
                },
              };
            }

            const market = state.market;
            const currentAgent = state.currentAgent;
            if (!market || !currentAgent) {
              return {
                decisionEngine: {
                  ...state.decisionEngine,
                  status: "error",
                  lastError: message,
                },
              };
            }

            try {
              const equity = getPortfolioSnapshot(
                market,
                state.positions,
                state.currentTick,
                state.cash,
                state.borrowed,
              ).equity;
              const fallbackDecision = decideAction({
                agent: currentAgent,
                market,
                currentTick: state.currentTick,
                positions: state.positions,
                newsQueue: state.newsQueue,
                equity,
                cash: state.cash,
                borrowed: state.borrowed,
                locale: state.settings.locale,
                rng: createRng(
                  `${market.seed}:${currentAgent.id}:${state.currentTick}:fallback`,
                ),
              });

              return applyResolvedDecision(state, fallbackDecision, "fallback", {
                status: "fallback",
                lastError: message,
                lastRequestedTick: requestTick,
              });
            } catch (fallbackError) {
              return {
                decisionEngine: {
                  ...state.decisionEngine,
                  status: "error",
                  lastError:
                    fallbackError instanceof Error ? fallbackError.message : message,
                  lastRequestedTick: requestTick,
                },
              };
            }
          });
        }
      },
      forceBuy: () => {
        set((state) => {
          if (
            state.phase !== "running" ||
            !state.market ||
            !state.currentAgent ||
            !state.selectedTicker ||
            state.marginCall
          ) {
            return state;
          }

          return applyResolvedDecision(
            state,
            {
              action: "BUY",
              ticker: state.selectedTicker,
              confidence: 1,
              reason: pickText(
                state.settings.locale,
                `You forced another buy on ${state.selectedTicker}. It did not look willing.`,
                `你强行加仓 ${state.selectedTicker}，它看起来并不情愿。`,
              ),
              sizeDelta: 0.18,
              leverageDelta: 0.15,
            },
            "player",
            {
              status:
                state.decisionEngine.status === "thinking"
                  ? "thinking"
                  : getRestingDecisionStatus(state.decisionEngine),
              lastError: null,
            },
          );
        });
      },
      forceSell: () => {
        set((state) => {
          if (
            state.phase !== "running" ||
            !state.market ||
            !state.currentAgent ||
            !state.selectedTicker ||
            state.marginCall
          ) {
            return state;
          }

          return applyResolvedDecision(
            state,
            {
              action: "SELL",
              ticker: state.selectedTicker,
              confidence: 1,
              reason: pickText(
                state.settings.locale,
                `You hit the cut-loss button and dumped ${state.selectedTicker} in one motion.`,
                `你按下割肉键，把 ${state.selectedTicker} 整个扔了出去。`,
              ),
              sizeDelta: 1,
              leverageDelta: 0,
            },
            "player",
            {
              status:
                state.decisionEngine.status === "thinking"
                  ? "thinking"
                  : getRestingDecisionStatus(state.decisionEngine),
              lastError: null,
            },
          );
        });
      },
      selectTicker: (ticker) => {
        set({
          selectedTicker: ticker,
        });
      },
      cycleSpeed: () => {
        const current = get().speed;
        set({
          speed: current === 1 ? 2 : current === 2 ? 5 : 1,
        });
      },
      setMuted: (muted) => {
        set((state) => ({
          settings: {
            ...state.settings,
            muted,
          },
        }));
      },
      setLocale: (locale) => {
        set((state) => ({
          settings: {
            ...state.settings,
            locale,
            localeMode: "manual",
          },
        }));
      },
      useAutoLocale: () => {
        const locale = detectLocale(
          typeof navigator === "undefined" ? undefined : navigator.languages,
        );
        set((state) => ({
          settings: {
            ...state.settings,
            locale,
            localeMode: "auto",
          },
        }));
      },
      hydrateLocale: () => {
        const state = get();
        if (state.settings.localeMode !== "auto") {
          return;
        }

        const locale = detectLocale(
          typeof navigator === "undefined" ? undefined : navigator.languages,
        );
        if (locale !== state.settings.locale) {
          set((current) => ({
            settings: {
              ...current.settings,
              locale,
            },
          }));
        }
      },
      resolveMarginCall: (accept) => {
        set((state) => {
          if (!state.marginCall || !state.market || state.phase !== "running") {
            return state;
          }

          if (!accept || state.reserveCash <= 0) {
            return finalizeRun(
              state,
              false,
              pickText(
                state.settings.locale,
                "You refused the margin call. The broker flattened the book before the bell finished ringing.",
                "你拒绝追加保证金，仓位在门铃响完前就被全部平掉了。",
              ),
            );
          }

          const injection = Math.min(state.reserveCash, state.marginCall.requiredCash);
          const cash = state.cash + injection;
          const reserveCash = state.reserveCash - injection;
          const snapshot = getPortfolioSnapshot(
            state.market,
            state.positions,
            state.currentTick,
            cash,
            state.borrowed,
          );

          if (
            getMarginCall(
              snapshot.equity,
              snapshot.exposure,
              state.borrowed,
              state.settings.locale,
            )
          ) {
            return finalizeRun(
              {
                ...state,
                cash,
                reserveCash,
              },
              false,
              pickText(
                state.settings.locale,
                "You fed in the last reserve dollars, but liquidation was only delayed by seconds.",
                "你把最后的保证金也塞进去了，但爆仓只晚了几秒。",
              ),
            );
          }

          return {
            ...state,
            cash,
            reserveCash,
            marginCall: null,
            currentAgent: state.currentAgent
              ? {
                  ...state.currentAgent,
                  lastThought: pickText(
                    state.settings.locale,
                    "Patch the margin first. Leave the rest to fate.",
                    "先把保证金补上，剩下的交给命。",
                  ),
                }
              : null,
          };
        });
      },
      returnToLobby: () => {
        set((state) => ({
          ...initialState,
          museumRecords: state.museumRecords,
          settings: state.settings,
        }));
      },
    }),
    {
      name: "yolo-agent-store",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<GameStoreState>;
        return {
          ...currentState,
          ...persisted,
          settings: {
            ...currentState.settings,
            ...persisted.settings,
          },
        };
      },
      partialize: (state) => ({
        museumRecords: state.museumRecords,
        settings: state.settings,
      }),
    },
  ),
);

function finalizeRun(
  state: GameStoreData,
  survived: boolean,
  description: string,
): GameStoreData {
  const finalEquity = state.market
    ? getPortfolioSnapshot(
        state.market,
        state.positions,
        state.currentTick,
        state.cash,
        state.borrowed,
      ).equity
    : (state.equityHistory.at(-1) ?? STARTING_CASH);
  const locale = state.settings.locale;
  const baseResult: GameStoreData = {
    ...state,
    phase: "gameover",
    marginCall: null,
    gameResult: {
      title: survived
        ? pickText(locale, "SESSION COMPLETE", "本局结束")
        : pickText(locale, "LIQUIDATED", "爆仓"),
      description,
      survived,
    },
  };

  if (survived || !state.currentAgent || !state.market) {
    return baseResult;
  }

  const rng = createRng(`${state.market.seed}:${state.currentAgent.id}:epitaph`);
  const agentSnapshot: RunningAgentState = {
    ...state.currentAgent,
    isAlive: false,
    lastThought: pickAgentQuote(state.currentAgent, rng, locale),
  };

  const museumRecord: MuseumRecord = {
    id: `${state.currentAgent.id}-${Date.now()}`,
    agentSnapshot,
    equityHistory: state.equityHistory,
    deathReason: description,
    lastWords: agentSnapshot.lastThought,
    createdAt: new Date().toISOString(),
    seed: state.market.seed,
    finalEquity,
  };

  return {
    ...baseResult,
    museumRecords: [museumRecord, ...state.museumRecords].slice(0, 24),
  };
}

function applyResolvedDecision(
  state: GameStoreData,
  decision: Decision,
  source: DecisionSource,
  decisionEnginePatch: Partial<DecisionEngineState>,
): GameStoreData {
  if (state.phase !== "running" || !state.market || !state.currentAgent) {
    return state;
  }

  const beforeSnapshot = getPortfolioSnapshot(
    state.market,
    state.positions,
    state.currentTick,
    state.cash,
    state.borrowed,
  );
  const tradeState = applyDecision(
    state.market,
    state.currentTick,
    state.positions,
    state.cash,
    state.borrowed,
    decision,
  );
  const afterSnapshot = getPortfolioSnapshot(
    state.market,
    tradeState.positions,
    state.currentTick,
    tradeState.cash,
    tradeState.borrowed,
  );
  const latestNews = state.newsQueue.at(-1) ?? state.currentAgent.lastNews;
  const currentAgent = {
    ...evolveAgentEmotion(
      {
        ...state.currentAgent,
        lastThought: decision.reason,
        lastDecision: decision,
        lastNews: latestNews,
      },
      afterSnapshot.equity - beforeSnapshot.equity,
      afterSnapshot.unrealizedPnl,
    ),
    lastThought: decision.reason,
    lastDecision: decision,
    lastNews: latestNews,
  };

  const baseState: GameStoreData = {
    ...state,
    positions: tradeState.positions,
    cash: tradeState.cash,
    borrowed: tradeState.borrowed,
    currentAgent,
    selectedTicker: decision.ticker || state.selectedTicker,
    marginCall: null,
    decisionEngine: {
      ...state.decisionEngine,
      ...decisionEnginePatch,
      lastSource: source,
      lastError: decisionEnginePatch.lastError ?? null,
      lastAppliedTick: state.currentTick,
    },
  };

  if (afterSnapshot.equity <= 0) {
    return finalizeRun(
      baseState,
      false,
      pickText(
        state.settings.locale,
        "Account equity hit zero. The broker carried you out of the hall.",
        "账户净值归零，券商把你抬出了大厅。",
      ),
    );
  }

  const marginCall = getMarginCall(
    afterSnapshot.equity,
    afterSnapshot.exposure,
    tradeState.borrowed,
    state.settings.locale,
  );

  if (marginCall) {
    return {
      ...baseState,
      marginCall,
    };
  }

  return baseState;
}

function canApplyAsyncDecision(state: GameStoreState, requestTick: number): boolean {
  if (
    state.phase !== "running" ||
    !state.market ||
    !state.currentAgent ||
    state.marginCall ||
    state.currentTick - requestTick > AI_DECISION_STALE_TICKS
  ) {
    return false;
  }

  return !(
    state.decisionEngine.lastSource === "player" &&
    (state.decisionEngine.lastAppliedTick ?? -1) >= requestTick
  );
}

function getRestingDecisionStatus(
  engine: DecisionEngineState,
): DecisionEngineState["status"] {
  if (engine.lastSource === "fallback") {
    return "fallback";
  }

  if (engine.lastAppliedTick === null) {
    return "idle";
  }

  return "ready";
}

function settleDecisionEngine(engine: DecisionEngineState): DecisionEngineState {
  return {
    ...engine,
    status: getRestingDecisionStatus(engine),
  };
}

function applyDecision(
  market: Market,
  currentTick: number,
  positions: Position[],
  cash: number,
  borrowed: number,
  decision: Decision,
): {
  positions: Position[];
  cash: number;
  borrowed: number;
} {
  switch (decision.action) {
    case "BUY":
      return buyTicker(
        market,
        currentTick,
        positions,
        cash,
        borrowed,
        decision.ticker,
        decision.sizeDelta,
        decision.leverageDelta,
      );
    case "LEVERAGE":
      return buyTicker(
        market,
        currentTick,
        positions,
        cash,
        borrowed,
        decision.ticker,
        decision.sizeDelta,
        Math.max(0.35, decision.leverageDelta),
      );
    case "SELL":
      return sellTicker(
        market,
        currentTick,
        positions,
        cash,
        borrowed,
        decision.ticker,
        decision.sizeDelta || 1,
      );
    case "PANIC_SELL":
      return sellTicker(market, currentTick, positions, cash, borrowed, decision.ticker, 1);
    case "HOLD":
    default:
      return {
        positions,
        cash,
        borrowed,
      };
  }
}

function buyTicker(
  market: Market,
  currentTick: number,
  positions: Position[],
  cash: number,
  borrowed: number,
  ticker: string,
  sizeDelta: number,
  leverageDelta: number,
): {
  positions: Position[];
  cash: number;
  borrowed: number;
} {
  const price = getTickerPrice(market, ticker, currentTick);
  const snapshot = getPortfolioSnapshot(market, positions, currentTick, cash, borrowed);
  const desiredNotional = Math.max(400, snapshot.equity * Math.max(0.06, sizeDelta));
  const maximumBorrow = Math.max(0, snapshot.equity * MAX_BORROW_MULTIPLIER - borrowed);
  const targetBorrow = Math.min(
    maximumBorrow,
    Math.max(0, desiredNotional * leverageDelta - cash * 0.12),
  );
  const spendable = cash + targetBorrow;
  const actualNotional = Math.min(desiredNotional, spendable);

  if (actualNotional <= 0 || price <= 0) {
    return {
      positions,
      cash,
      borrowed,
    };
  }

  const quantity = actualNotional / price;
  const ownCapitalSpent = Math.min(cash, actualNotional - targetBorrow);
  const actualBorrowUsed = Math.max(0, actualNotional - ownCapitalSpent);
  const nextBorrowed = borrowed + actualBorrowUsed;
  const nextCash = Math.max(0, cash - ownCapitalSpent);
  const nextPositions = [...positions];
  const existing = nextPositions.find((position) => position.ticker === ticker);

  if (existing) {
    const totalQuantity = existing.quantity + quantity;
    existing.avgPrice =
      (existing.avgPrice * existing.quantity + quantity * price) / totalQuantity;
    existing.quantity = totalQuantity;
    existing.leverage = Math.max(existing.leverage, 1 + leverageDelta);
  } else {
    nextPositions.push({
      ticker,
      quantity,
      avgPrice: price,
      leverage: 1 + leverageDelta,
    });
  }

  return {
    positions: nextPositions,
    cash: nextCash,
    borrowed: Math.round(nextBorrowed * 100) / 100,
  };
}

function sellTicker(
  market: Market,
  currentTick: number,
  positions: Position[],
  cash: number,
  borrowed: number,
  ticker: string,
  fraction: number,
): {
  positions: Position[];
  cash: number;
  borrowed: number;
} {
  const position = positions.find((item) => item.ticker === ticker);
  if (!position) {
    return {
      positions,
      cash,
      borrowed,
    };
  }

  const price = getTickerPrice(market, ticker, currentTick);
  const quantityToSell = position.quantity * Math.min(1, Math.max(0, fraction));
  const proceeds = quantityToSell * price;
  const exposureBefore = positions.reduce(
    (sum, item) => sum + item.quantity * getTickerPrice(market, item.ticker, currentTick),
    0,
  );
  const debtRepayment =
    exposureBefore > 0 ? Math.min(borrowed, borrowed * (proceeds / exposureBefore)) : 0;
  const nextBorrowed = Math.max(0, borrowed - debtRepayment);
  const nextCash = cash + proceeds - debtRepayment;
  const nextPositions = positions
    .map((item) =>
      item.ticker === ticker
        ? {
            ...item,
            quantity: item.quantity - quantityToSell,
          }
        : item,
    )
    .filter((item) => item.quantity > 0.0001);

  return {
    positions: nextPositions,
    cash: Math.round(nextCash * 100) / 100,
    borrowed: Math.round(nextBorrowed * 100) / 100,
  };
}

function getPortfolioSnapshot(
  market: Market,
  positions: Position[],
  currentTick: number,
  cash: number,
  borrowed: number,
): {
  exposure: number;
  unrealizedPnl: number;
  equity: number;
} {
  const exposure = positions.reduce(
    (sum, position) =>
      sum + position.quantity * getTickerPrice(market, position.ticker, currentTick),
    0,
  );
  const costBasis = positions.reduce(
    (sum, position) => sum + position.quantity * position.avgPrice,
    0,
  );
  const unrealizedPnl = exposure - costBasis;
  const equity = cash + exposure - borrowed;

  return {
    exposure: Math.round(exposure * 100) / 100,
    unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
    equity: Math.round(equity * 100) / 100,
  };
}

function getMarginCall(
  equity: number,
  exposure: number,
  borrowed: number,
  locale: Locale,
): MarginCall | null {
  if (borrowed <= 0 || exposure <= 0) {
    return null;
  }

  const ratio = equity / exposure;
  if (ratio >= 0.22) {
    return null;
  }

  const requiredCash = Math.max(300, Math.ceil(exposure * 0.26 - equity));
  return {
    requiredCash,
    message: pickText(
      locale,
      `Maintenance margin fell to ${(ratio * 100).toFixed(1)}%. You need ${requiredCash} immediately.`,
      `维持保证金跌到 ${(ratio * 100).toFixed(1)}%，需要立刻补 ${requiredCash}。`,
    ),
  };
}
