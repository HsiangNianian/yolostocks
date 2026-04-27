import type { AgentTemplate, Decision, RunningAgentState } from "@/lib/agent/types";
import type { Position } from "@/lib/game/types";
import type { Locale } from "@/lib/i18n";
import type { Market, MarketTicker, NewsEvent } from "@/lib/market/types";
import { pickText, resolveText } from "@/lib/i18n";
import { clamp, pickOne, type Rng } from "@/lib/utils/random";

export interface DecisionContext {
  agent: RunningAgentState;
  market: Market;
  currentTick: number;
  positions: Position[];
  newsQueue: NewsEvent[];
  equity: number;
  cash: number;
  borrowed: number;
  locale: Locale;
  rng: Rng;
}

export function decideAction({
  agent,
  market,
  currentTick,
  positions,
  newsQueue,
  equity,
  cash,
  borrowed,
  locale,
  rng,
}: DecisionContext): Decision {
  const latestNews = [...newsQueue]
    .reverse()
    .find((event) => currentTick - event.tick <= 24);
  const totalUnrealized = positions.reduce((sum, position) => {
    const price = getTickerPrice(market, position.ticker, currentTick);
    return sum + (price - position.avgPrice) * position.quantity;
  }, 0);
  const drawdown = equity <= 0 ? -1 : totalUnrealized / equity;

  if (positions.length > 0 && agent.emotionalState.fear > 0.86 && drawdown < -0.18) {
    const worst = [...positions].sort((left, right) => {
      const leftPrice = getTickerPrice(market, left.ticker, currentTick);
      const rightPrice = getTickerPrice(market, right.ticker, currentTick);
      const leftPnl = (leftPrice - left.avgPrice) * left.quantity;
      const rightPnl = (rightPrice - right.avgPrice) * right.quantity;
      return leftPnl - rightPnl;
    })[0]!;

    return {
      action: "PANIC_SELL",
      ticker: worst.ticker,
      confidence: 0.94,
      reason: pickText(
        locale,
        "Volatility is beyond tolerance. Dump the position that hurts the most first.",
        "波动超出承受范围，先把最痛的仓位砍掉。",
      ),
      sizeDelta: 1,
      leverageDelta: 0,
    };
  }

  switch (agent.personality) {
    case "martingale":
      return decideMartingale({ agent, market, currentTick, positions, locale, rng });
    case "technician":
      return decideTechnician({ agent, market, currentTick, positions, locale, rng });
    case "insider":
      return decideInsider({ agent, market, currentTick, positions, latestNews, locale, rng });
    case "deadhand":
      return decideDeadhand({ agent, market, currentTick, positions, cash, borrowed, locale, rng });
    default:
      return holdDecision(
        market.tickers[0]!.symbol,
        pickText(locale, "Too much noise. Watch one more candle first.", "噪音太多，先看一根。"),
      );
  }
}

export function evolveAgentEmotion(
  agent: RunningAgentState,
  equityDelta: number,
  unrealizedPnl: number,
): RunningAgentState {
  const greedShift = equityDelta > 0 ? 0.035 : -0.02;
  const fearShift = equityDelta < 0 ? 0.045 : -0.018;
  const latentStress = unrealizedPnl < 0 ? 0.018 : -0.012;

  return {
    ...agent,
    emotionalState: {
      greed: clamp(agent.emotionalState.greed + greedShift, 0.05, 0.98),
      fear: clamp(agent.emotionalState.fear + fearShift + latentStress, 0.05, 0.98),
    },
  };
}

function decideMartingale(input: {
  agent: RunningAgentState;
  market: Market;
  currentTick: number;
  positions: Position[];
  locale: Locale;
  rng: Rng;
}): Decision {
  const losingPosition = [...input.positions]
    .filter((position) => getTickerPrice(input.market, position.ticker, input.currentTick) < position.avgPrice)
    .sort((left, right) => {
      const leftGap =
        getTickerPrice(input.market, left.ticker, input.currentTick) / left.avgPrice - 1;
      const rightGap =
        getTickerPrice(input.market, right.ticker, input.currentTick) / right.avgPrice - 1;
      return leftGap - rightGap;
    })[0];

  if (losingPosition) {
    const price = getTickerPrice(input.market, losingPosition.ticker, input.currentTick);
    const drawdown = 1 - price / losingPosition.avgPrice;

    if (drawdown > 0.12 && input.rng() < 0.68) {
      return {
        action: "LEVERAGE",
        ticker: losingPosition.ticker,
        confidence: 0.88,
        reason: pickText(
          input.locale,
          "The drawdown is widening. Lower the cost basis or there is no way back.",
          "跌幅扩大，摊低成本线才有翻身机会。",
        ),
        sizeDelta: clamp(0.18 + drawdown, 0.2, 0.42),
        leverageDelta: clamp(0.6 + drawdown * 1.8, 0.6, 1.4),
      };
    }

    return {
      action: "BUY",
      ticker: losingPosition.ticker,
      confidence: 0.78,
      reason: pickText(
        input.locale,
        "It has deviated too far from the mean. Not adding now hurts more.",
        "已经偏离均值太远，现在不补更亏。",
      ),
      sizeDelta: clamp(0.16 + drawdown * 0.85, 0.16, 0.34),
      leverageDelta: 0,
    };
  }

  const weakest = [...input.market.tickers].sort(
    (left, right) =>
      getMomentum(left, input.currentTick) - getMomentum(right, input.currentTick),
  )[0]!;

  return {
    action: "BUY",
    ticker: weakest.symbol,
    confidence: 0.62,
    reason: pickText(
      input.locale,
      "Short-term oversold. The next snapback is worth catching.",
      "短线超跌，下一根反抽值得拿。",
    ),
    sizeDelta: 0.16,
    leverageDelta: 0,
  };
}

function decideTechnician(input: {
  agent: RunningAgentState;
  market: Market;
  currentTick: number;
  positions: Position[];
  locale: Locale;
  rng: Rng;
}): Decision {
  const scored = input.market.tickers.map((ticker) => {
    const ma5 = movingAverage(ticker, input.currentTick, 5);
    const ma20 = movingAverage(ticker, input.currentTick, 20);
    return {
      ticker,
      signal: ma20 === 0 ? 0 : ma5 / ma20 - 1,
    };
  });

  const strongest = [...scored].sort((left, right) => right.signal - left.signal)[0]!;
  const weakest = [...scored].sort((left, right) => left.signal - right.signal)[0]!;
  const heldWeakest = input.positions.find((position) => position.ticker === weakest.ticker.symbol);

  if (heldWeakest && weakest.signal < -0.018) {
    return {
      action: "SELL",
      ticker: weakest.ticker.symbol,
      confidence: 0.84,
      reason: pickText(
        input.locale,
        "Short average broke below the long average. Death cross. Step out first.",
        "短均线跌穿长均线，死叉形成，先撤。",
      ),
      sizeDelta: 1,
      leverageDelta: 0,
    };
  }

  if (strongest.signal > 0.014 || input.rng() < 0.18) {
    return {
      action: "BUY",
      ticker: strongest.ticker.symbol,
      confidence: clamp(0.58 + strongest.signal * 11, 0.58, 0.9),
      reason: pickText(
        input.locale,
        "The 5-day is still riding above the 20-day. Trend extension is intact.",
        "五日线压着二十日线上方，趋势还在延展。",
      ),
      sizeDelta: clamp(0.12 + strongest.signal * 4, 0.12, 0.28),
      leverageDelta: 0,
    };
  }

  return holdDecision(
    strongest.ticker.symbol,
    pickText(
      input.locale,
      "The setup is not fully confirmed yet. Wait for the next candle.",
      "形态没完全确认，等下一根K线。",
    ),
  );
}

function decideInsider(input: {
  agent: RunningAgentState;
  market: Market;
  currentTick: number;
  positions: Position[];
  latestNews?: NewsEvent;
  locale: Locale;
  rng: Rng;
}): Decision {
  if (!input.latestNews) {
    const momentumWinner = [...input.market.tickers].sort(
      (left, right) => getMomentum(right, input.currentTick) - getMomentum(left, input.currentTick),
    )[0]!;
    return holdDecision(
      momentumWinner.symbol,
      pickText(
        input.locale,
        "The source is quiet. The tape will not tell the truth on its own.",
        "消息源沉默，盘口自己不会说真话。",
      ),
    );
  }

  const conviction = input.latestNews.accuracy === "real" ? 0.72 : 0.28;
  const isBullish = input.latestNews.tone === "bullish";

  if (isBullish && input.rng() < conviction) {
    return {
      action: "BUY",
      ticker: input.latestNews.ticker,
      confidence: clamp(0.52 + conviction * 0.4, 0.58, 0.9),
      reason: pickText(
        input.locale,
        `The whisper on ${input.latestNews.ticker} is solid. The market has not fully priced it in.`,
        `${input.latestNews.ticker} 的风声够硬，市场还没 fully price in。`,
      ),
      sizeDelta: 0.22,
      leverageDelta: input.latestNews.accuracy === "real" ? 0.3 : 0,
      sourceNewsId: input.latestNews.id,
    };
  }

  if (!isBullish && input.rng() < conviction) {
    return {
      action: "SELL",
      ticker: input.latestNews.ticker,
      confidence: clamp(0.5 + conviction * 0.42, 0.55, 0.88),
      reason: pickText(
        input.locale,
        `${input.latestNews.ticker} has a cold whisper on it. Exit first, verify later.`,
        `${input.latestNews.ticker} 的消息偏冷，先离场再看真假。`,
      ),
      sizeDelta: 1,
      leverageDelta: 0,
      sourceNewsId: input.latestNews.id,
    };
  }

  return holdDecision(
    input.latestNews.ticker,
    pickText(
      input.locale,
      "The tip is here, but I still want one more look at the order flow.",
      "消息有了，但我还想再看一手盘口。",
    ),
  );
}

function decideDeadhand(input: {
  agent: RunningAgentState;
  market: Market;
  currentTick: number;
  positions: Position[];
  cash: number;
  borrowed: number;
  locale: Locale;
  rng: Rng;
}): Decision {
  const losingPosition = input.positions.find(
    (position) => getTickerPrice(input.market, position.ticker, input.currentTick) < position.avgPrice,
  );

  if (losingPosition) {
    const price = getTickerPrice(input.market, losingPosition.ticker, input.currentTick);
    const drawdown = 1 - price / losingPosition.avgPrice;

    if (drawdown > 0.08 && input.rng() < 0.38 && input.cash > 500 && input.borrowed < input.cash) {
      return {
        action: "BUY",
        ticker: losingPosition.ticker,
        confidence: 0.69,
        reason: pickText(
          input.locale,
          "The position looks ugly, but these chips cannot be thrown away here.",
          "仓位难看，但筹码不能在这里扔。",
        ),
        sizeDelta: 0.1,
        leverageDelta: 0,
      };
    }

    return holdDecision(
      losingPosition.ticker,
      pickText(
        input.locale,
        "As long as nobody carries me out, I am not conceding this position.",
        "只要没被抬出去，这个仓位我就不认输。",
      ),
    );
  }

  const leader = [...input.market.tickers].sort(
    (left, right) => getMomentum(right, input.currentTick) - getMomentum(left, input.currentTick),
  )[0]!;

  if (getMomentum(leader, input.currentTick) > 0.05 && input.rng() < 0.3) {
    return {
      action: "BUY",
      ticker: leader.symbol,
      confidence: 0.6,
      reason: pickText(
        input.locale,
        "If it is the strongest thing on the board, follow the strongest thing first.",
        "既然它最硬，那就先跟着最硬的走。",
      ),
      sizeDelta: 0.12,
      leverageDelta: 0,
    };
  }

  return holdDecision(
    leader.symbol,
    pickText(
      input.locale,
      "Keep carrying it. Volatility has not pinned me to the wall yet.",
      "先扛着，波动还没把我逼到墙角。",
    ),
  );
}

function holdDecision(ticker: string, reason: string): Decision {
  return {
    action: "HOLD",
    ticker,
    confidence: 0.48,
    reason,
    sizeDelta: 0,
    leverageDelta: 0,
  };
}

function movingAverage(ticker: MarketTicker, currentTick: number, length: number): number {
  const start = Math.max(0, currentTick - length + 1);
  const sample = ticker.candles.slice(start, currentTick + 1);
  const sum = sample.reduce((accumulator, candle) => accumulator + candle.close, 0);
  return sample.length === 0 ? 0 : sum / sample.length;
}

function getMomentum(ticker: MarketTicker, currentTick: number): number {
  const currentPrice = ticker.candles[currentTick]?.close ?? ticker.candles.at(-1)?.close ?? 0;
  const anchorPrice =
    ticker.candles[Math.max(0, currentTick - 12)]?.close ?? ticker.candles[0]?.close ?? 1;
  return currentPrice / anchorPrice - 1;
}

export function getTickerPrice(market: Market, ticker: string, currentTick: number): number {
  const match = market.tickers.find((item) => item.symbol === ticker);
  if (!match) {
    return 0;
  }

  return match.candles[currentTick]?.close ?? match.candles.at(-1)?.close ?? 0;
}

export function createRuntimeAgent(template: AgentTemplate, locale: Locale = "en"): RunningAgentState {
  return {
    ...template,
    emotionalState: {
      greed: template.greed,
      fear: template.fear,
    },
    lastThought: resolveText(locale, template.intro),
    lastDecision: null,
    lastNews: null,
    realizedPnl: 0,
    streak: 0,
  };
}

export function pickAgentQuote(agent: RunningAgentState, rng: Rng, locale: Locale = "en"): string {
  return resolveText(locale, pickOne(rng, agent.quotePool));
}
