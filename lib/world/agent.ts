import type { LocalizedText, Locale } from "@/lib/i18n";
import { makeText, resolveText } from "@/lib/i18n";
import type {
  MarketStyle,
  MarketTicker,
  NewsAccuracy,
  NewsEvent,
  NewsTone,
  WorldEventKind,
  WorldEventScope,
} from "@/lib/market/types";
import {
  chance,
  clamp,
  createRng,
  pickOne,
  randomBetween,
  randomInt,
  type Rng,
} from "@/lib/utils/random";

export type WorldAgentPresetId =
  | "house"
  | "chaos"
  | "macro"
  | "meme";

export interface WorldAgentConfig {
  presetId: WorldAgentPresetId;
  alias: string;
  drama: number;
  tempo: number;
  bias: number;
  coordination: number;
  deception: number;
}

export interface WorldAgentPreset {
  id: WorldAgentPresetId;
  avatar: string;
  label: LocalizedText;
  intro: LocalizedText;
  defaults: Omit<WorldAgentConfig, "presetId" | "alias">;
}

export const WORLD_AGENT_PRESETS: WorldAgentPreset[] = [
  {
    id: "house",
    avatar: "🎛️",
    label: makeText("House Dealer", "盘口庄家"),
    intro: makeText(
      "Runs a balanced room. A few whispers, a few policy nudges, not too much blood on the floor.",
      "维持一个相对平衡的房间。偶尔放风声，偶尔拨政策，不让地板上全是血。",
    ),
    defaults: {
      drama: 0.42,
      tempo: 0.38,
      bias: 0.08,
      coordination: 0.44,
      deception: 0.22,
    },
  },
  {
    id: "chaos",
    avatar: "🪓",
    label: makeText("Chaos Editor", "乱流编导"),
    intro: makeText(
      "Prefers sharp reversals, fakeouts, and perfectly timed accidents.",
      "偏爱急转弯、假动作和精心安排的意外。",
    ),
    defaults: {
      drama: 0.82,
      tempo: 0.74,
      bias: -0.06,
      coordination: 0.58,
      deception: 0.71,
    },
  },
  {
    id: "macro",
    avatar: "🏛️",
    label: makeText("Macro Proctor", "宏观考官"),
    intro: makeText(
      "Moves the whole room with policy, liquidity, and blunt top-down pressure.",
      "更喜欢用政策、流动性和自上而下的压力同时拨动整个房间。",
    ),
    defaults: {
      drama: 0.61,
      tempo: 0.34,
      bias: -0.12,
      coordination: 0.84,
      deception: 0.14,
    },
  },
  {
    id: "meme",
    avatar: "📣",
    label: makeText("Meme Ringmaster", "情绪团长"),
    intro: makeText(
      "Summons raids, retail stampedes, and absurd one-name squeezes.",
      "擅长召唤情绪冲锋、散户踩踏和单票离谱逼空。",
    ),
    defaults: {
      drama: 0.67,
      tempo: 0.69,
      bias: 0.18,
      coordination: 0.27,
      deception: 0.48,
    },
  },
];

const WORLD_EVENT_TEMPLATES: Record<
  WorldEventKind,
  Record<NewsTone, Array<{ en: string; zh: string }>>
> = {
  news: {
    bullish: [
      { en: "{ticker} leaks a funding rumor right into the open", zh: "{ticker} 把融资风声直接泄到台面上" },
      { en: "{ticker} is suddenly tied to a strategic partnership whisper", zh: "{ticker} 突然被卷入战略合作风声" },
      { en: "{ticker} gets a conveniently timed product hype cycle", zh: "{ticker} 正好赶上一轮产品吹风" },
    ],
    bearish: [
      { en: "{ticker} gets dragged into a fresh regulatory scare", zh: "{ticker} 被拖进一轮新的监管惊吓" },
      { en: "{ticker} is hit by a whispered miss on guidance", zh: "{ticker} 被风声指向业绩指引失手" },
      { en: "{ticker} becomes the center of an overnight trust crisis", zh: "{ticker} 一夜之间成了信任危机中心" },
    ],
  },
  policy: {
    bullish: [
      { en: "Policy desks open a relief window for risk assets", zh: "政策桌面给风险资产开了一扇喘息窗" },
      { en: "A macro circular suddenly eases pressure across the tape", zh: "一纸宏观口风突然放松了整条盘面" },
      { en: "The room hears that top-down pressure has been softened", zh: "市场听说自上而下的压力被松了一手" },
    ],
    bearish: [
      { en: "Policy desks tighten the room all at once", zh: "政策桌面一下子收紧了整个房间" },
      { en: "A macro headline turns the whole tape defensive", zh: "一条宏观标题把整条盘面压回防守状态" },
      { en: "Top-down pressure hits every bid in the hall", zh: "自上而下的压力砸向了大厅里的每一档买盘" },
    ],
  },
  liquidity: {
    bullish: [
      { en: "Liquidity shows up at the exact moment the tape needed it", zh: "流动性在盘面最需要的时候突然出现" },
      { en: "A hidden bid starts absorbing fear across the board", zh: "一股隐藏买盘开始全场吸收恐慌" },
      { en: "Funding pressure eases and the room exhales together", zh: "资金压力松了一口，整个房间一起回气" },
    ],
    bearish: [
      { en: "Funding stress starts draining the room bar by bar", zh: "资金紧张开始一根一根抽干这个房间" },
      { en: "Liquidity vanishes and every pullback cuts deeper", zh: "流动性一退，所有回撤都开始更深" },
      { en: "Borrow gets tight and weak hands begin to skid", zh: "借贷变紧，脆弱筹码开始打滑" },
    ],
  },
  meme: {
    bullish: [
      { en: "{ticker} gets raided by a fresh wave of momentum pilgrims", zh: "{ticker} 被新一波情绪信徒直接冲塔" },
      { en: "{ticker} suddenly becomes the room's favorite absurd chase", zh: "{ticker} 突然变成全场最荒唐也最热门的追涨目标" },
      { en: "{ticker} is dragged into a retail squeeze carnival", zh: "{ticker} 被拉进一场散户逼空嘉年华" },
    ],
    bearish: [
      { en: "{ticker} becomes the punchline after a meme unwind", zh: "{ticker} 在情绪退潮后成了全场笑柄" },
      { en: "{ticker} loses the crowd and the floor drops out fast", zh: "{ticker} 一失去人群，地板就迅速塌了" },
      { en: "{ticker} gets dumped the moment the joke stops working", zh: "{ticker} 笑话一失效就被立刻砸盘" },
    ],
  },
};

export const WORLD_AGENT_TRAITS = {
  drama: makeText("Drama", "戏剧性"),
  tempo: makeText("Tempo", "出题频率"),
  bias: makeText("Bias", "方向偏置"),
  coordination: makeText("Coordination", "联动程度"),
  deception: makeText("Deception", "迷惑性"),
} as const;

export function createDefaultWorldAgentConfig(): WorldAgentConfig {
  const preset = WORLD_AGENT_PRESETS[0]!;
  return {
    presetId: preset.id,
    alias: "",
    ...preset.defaults,
  };
}

export function applyWorldAgentPreset(
  presetId: WorldAgentPresetId,
  previous: WorldAgentConfig,
): WorldAgentConfig {
  const preset = getWorldAgentPreset(presetId);
  return {
    ...previous,
    presetId,
    ...preset.defaults,
  };
}

export function getWorldAgentPreset(presetId: WorldAgentPresetId): WorldAgentPreset {
  return WORLD_AGENT_PRESETS.find((preset) => preset.id === presetId) ?? WORLD_AGENT_PRESETS[0]!;
}

export function getWorldAgentDisplayName(
  locale: Locale,
  config: WorldAgentConfig,
): string {
  return config.alias.trim() || resolveText(locale, getWorldAgentPreset(config.presetId).label);
}

export function serializeWorldAgentConfig(config: WorldAgentConfig): string {
  return [
    config.presetId,
    config.alias.trim(),
    config.drama.toFixed(3),
    config.tempo.toFixed(3),
    config.bias.toFixed(3),
    config.coordination.toFixed(3),
    config.deception.toFixed(3),
  ].join(":");
}

export function buildWorldEvents(input: {
  tickers: MarketTicker[];
  totalTicks: number;
  style: MarketStyle;
  featuredTicker: string;
  worldSeed: string;
  worldAgent: WorldAgentConfig;
  sourceAgentName: string;
}): NewsEvent[] {
  const rng = createRng(`${input.worldSeed}:${serializeWorldAgentConfig(input.worldAgent)}`);
  const count = resolveEventCount(rng, input.totalTicks, input.worldAgent);
  const events: NewsEvent[] = [];

  for (let index = 0; index < count; index += 1) {
    const scope = chance(rng, 0.18 + input.worldAgent.coordination * 0.72)
      ? "market"
      : "ticker";
    const kind = chooseEventKind(rng, input.worldAgent, scope);
    const tone = chooseTone(rng, input.worldAgent);
    const accuracy = chance(rng, 0.88 - input.worldAgent.deception * 0.62)
      ? "real"
      : "fake";
    const primaryTicker =
      scope === "market"
        ? input.featuredTicker
        : pickOne(rng, input.tickers).symbol;
    const affectedTickers =
      scope === "market"
        ? input.tickers.map((ticker) => ticker.symbol)
        : [primaryTicker];
    const impact = clamp(
      randomBetween(rng, 0.016, 0.055) * (0.75 + input.worldAgent.drama * 1.1),
      0.012,
      0.16,
    );
    const tick = pickEventTick(rng, input.totalTicks, index, count);

    events.push(
      createWorldEvent({
        rng,
        tick,
        ticker: primaryTicker,
        tone,
        accuracy,
        impact,
        kind,
        scope,
        affectedTickers,
        sourceAgent: input.sourceAgentName,
      }),
    );
  }

  if (input.style === "black_swan" && input.worldAgent.drama > 0.58) {
    events.push(
      createWorldEvent({
        rng,
        tick: Math.floor(input.totalTicks * 0.62),
        ticker: input.featuredTicker,
        tone: "bearish",
        accuracy: "real",
        impact: clamp(0.1 + input.worldAgent.drama * 0.08, 0.1, 0.18),
        kind: "liquidity",
        scope: "market",
        affectedTickers: input.tickers.map((ticker) => ticker.symbol),
        sourceAgent: input.sourceAgentName,
      }),
    );
  }

  return dedupeWorldEvents(events).sort((left, right) => left.tick - right.tick);
}

function resolveEventCount(
  rng: Rng,
  totalTicks: number,
  worldAgent: WorldAgentConfig,
): number {
  const base = totalTicks / 120;
  return Math.max(
    4,
    Math.round(base * (1.1 + worldAgent.tempo * 2.2) + randomBetween(rng, -1, 1)),
  );
}

function chooseEventKind(
  rng: Rng,
  worldAgent: WorldAgentConfig,
  scope: WorldEventScope,
): WorldEventKind {
  if (scope === "market") {
    const weights = {
      policy: 0.44 + worldAgent.coordination * 0.18,
      liquidity: 0.38 + worldAgent.drama * 0.14,
      meme: 0.08 + worldAgent.deception * 0.08,
    };

    switch (worldAgent.presetId) {
      case "chaos":
        weights.liquidity += 0.08;
        weights.meme += 0.16;
        break;
      case "macro":
        weights.policy += 0.26;
        weights.liquidity += 0.1;
        break;
      case "meme":
        weights.meme += 0.3;
        break;
      default:
        weights.policy += 0.12;
        break;
    }

    return weightedWorldKind(rng, weights, "policy");
  }

  const weights = {
    news: 0.35,
    policy: 0.08,
    liquidity: 0.18 + worldAgent.coordination * 0.14,
    meme: 0.12 + worldAgent.deception * 0.16,
  };

  switch (worldAgent.presetId) {
    case "chaos":
      weights.liquidity += 0.08;
      weights.meme += 0.16;
      break;
    case "macro":
      weights.policy += 0.26;
      weights.liquidity += 0.1;
      break;
    case "meme":
      weights.meme += 0.3;
      weights.news += 0.08;
      break;
    default:
      weights.news += 0.12;
      break;
  }

  return weightedWorldKind(rng, weights, "news");
}

function chooseTone(rng: Rng, worldAgent: WorldAgentConfig): NewsTone {
  const bullishChance = clamp(0.5 + worldAgent.bias * 0.35, 0.12, 0.88);
  return chance(rng, bullishChance) ? "bullish" : "bearish";
}

function weightedWorldKind<T extends WorldEventKind>(
  rng: Rng,
  weights: Record<T, number>,
  fallback: T,
): T {
  const total = (Object.values(weights) as number[]).reduce(
    (sum, value) => sum + value,
    0,
  );
  let cursor = rng() * total;

  for (const [kind, weight] of Object.entries(weights) as Array<[T, number]>) {
    cursor -= weight;
    if (cursor <= 0) {
      return kind;
    }
  }

  return fallback;
}

function pickEventTick(
  rng: Rng,
  totalTicks: number,
  index: number,
  totalEvents: number,
): number {
  const window = totalTicks / Math.max(1, totalEvents);
  const anchor = Math.floor(window * index);
  return clamp(
    Math.round(anchor + randomInt(rng, 18, Math.max(24, Math.floor(window)))),
    10,
    totalTicks - 12,
  );
}

function createWorldEvent(input: {
  rng: Rng;
  tick: number;
  ticker: string;
  tone: NewsTone;
  accuracy: NewsAccuracy;
  impact: number;
  kind: WorldEventKind;
  scope: WorldEventScope;
  affectedTickers: string[];
  sourceAgent: string;
}): NewsEvent {
  const templates = WORLD_EVENT_TEMPLATES[input.kind][input.tone];
  const template = pickOne(input.rng, templates);
  const displayTicker = input.scope === "market" ? "MARKET" : input.ticker;
  const target =
    input.scope === "market" && input.kind !== "meme"
      ? { en: "THE ROOM", zh: "全场" }
      : { en: input.ticker, zh: input.ticker };

  return {
    id: `${input.kind}:${input.scope}:${displayTicker}:${input.tick}`,
    tick: input.tick,
    ticker: displayTicker,
    headline: template.en.replaceAll("{ticker}", target.en),
    headlineZh: template.zh.replaceAll("{ticker}", target.zh),
    headlineVariant: input.tick % 4,
    tone: input.tone,
    accuracy: input.accuracy,
    impact: input.impact,
    kind: input.kind,
    scope: input.scope,
    affectedTickers: input.affectedTickers,
    sourceAgent: input.sourceAgent,
  };
}

function dedupeWorldEvents(events: NewsEvent[]): NewsEvent[] {
  const map = new Map<string, NewsEvent>();

  for (const event of events) {
    const key = `${event.tick}:${event.scope}:${event.kind}:${event.ticker}`;
    map.set(key, event);
  }

  return [...map.values()];
}
