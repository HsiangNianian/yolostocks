import type {
  AgentPersonality,
  DecisionAction,
  DecisionSource,
} from "@/lib/agent/types";
import type { DecisionEngineStatus } from "@/lib/game/types";
import type {
  MarketStyle,
  NewsAccuracy,
  NewsEvent,
  NewsTone,
  WorldEventKind,
  WorldEventScope,
} from "@/lib/market/types";

export type Locale = "en" | "zh";
export type LocaleMode = "auto" | "manual";

export interface LocalizedText {
  en: string;
  zh: string;
}

const messages = {
  en: {
    "lang.auto": "AUTO",
    "lang.english": "EN",
    "lang.chinese": "中文",
    "lang.mode.auto": "Browser detected",
    "lang.mode.manual": "Manual",
    "app.title": "YOLO AGENT",
    "app.tagline":
      "Hire an AI-driven trading degenerate, watch the tape mutate in real time, and decide whether to interfere before the broker does.",
    "app.museumLink": "Enter Liquidation Museum",
    "idle.badge": "Vertical Slice",
    "idle.heading": "Build the casino first.",
    "idle.body1":
      "V1 ships one full play loop: agent selection, live market generation, manual intervention, margin calls, and a persistent museum of wreckage.",
    "idle.body2":
      "Refreshing the page during a run counts as surrender. Only the museum survives.",
    "idle.seedLabel": "Optional Seed",
    "idle.seedPlaceholder": "daily-swan-001",
    "metric.agent": "Agent",
    "metric.time": "Time",
    "metric.equity": "Equity",
    "metric.reserve": "Reserve",
    "metric.engine": "Engine",
    "metric.source": "Source",
    "metric.style": "Style",
    "metric.cash": "Cash",
    "metric.borrowed": "Borrowed",
    "metric.seed": "Seed",
    "panel.chooseAgent": "Choose an agent to start the tape.",
    "panel.greed": "Greed",
    "panel.fear": "Fear",
    "bubble.title": "Agent Pulse",
    "chart.subtitle": "Live Candlestick",
    "positions.title": "Positions",
    "positions.empty": "No open position. That will not last.",
    "actions.buy": "FORCE BUY",
    "actions.buyDesc": "Manual add-to-position",
    "actions.sell": "CUT LOSS",
    "actions.sellDesc": "Manual forced liquidation",
    "actions.clock": "{speed}X CLOCK",
    "actions.clockDesc": "Scale the real-time tape",
    "actions.sound.on": "SOUND",
    "actions.sound.off": "MUTED",
    "actions.soundDesc": "Audio hooks are wired in",
    "actions.swapHint": "Agent swapping is only allowed before the run starts.",
    "news.title": "News Wire",
    "news.active": "{count} active",
    "news.empty": "The tape is quiet. That usually means trouble is late, not absent.",
    "news.accuracy.real": "verified whisper",
    "news.accuracy.fake": "fabricated whisper",
    "museum.title": "LIQUIDATION MUSEUM",
    "museum.body":
      "Every blown-up agent is archived locally. Refreshing the site cannot save a run, but it cannot erase the wreckage either.",
    "museum.back": "Back To Trading Floor",
    "museum.emptyTitle": "No Casualties Yet",
    "museum.emptyBody": "Someone still needs to press too hard on leverage.",
    "museum.finalEquity": "Final Equity",
    "museum.seed": "Seed",
    "museum.lastWords": "Last Words",
    "event.margin.title": "MARGIN CALL",
    "event.margin.body": "{message} Accepting will move cash from your reserve into the account.",
    "event.margin.primary": "Inject Margin",
    "event.margin.secondary": "Let It Die",
    "event.gameOver.primary": "Back To Lobby",
    "event.gameOver.secondary": "Museum",
    "engine.hint": "Server-side AI runs on the Vercel route. Local heuristics only take over if the model call fails.",
  },
  zh: {
    "lang.auto": "自动",
    "lang.english": "EN",
    "lang.chinese": "中文",
    "lang.mode.auto": "跟随浏览器",
    "lang.mode.manual": "手动切换",
    "app.title": "梭哈代理人",
    "app.tagline":
      "雇一个 AI 驱动的炒股疯子，看着行情在浏览器里实时变形，然后决定要不要在券商先动手前强行干预。",
    "app.museumLink": "进入爆仓博物馆",
    "idle.badge": "首个垂直切片",
    "idle.heading": "先把赌场搭起来。",
    "idle.body1":
      "V1 已经落下完整一局：选 Agent、生成实时市场、手动干预、追加保证金，以及可持久化的死亡博物馆。",
    "idle.body2":
      "刷新页面就算认输。只有博物馆会留下来。",
    "idle.seedLabel": "可选种子",
    "idle.seedPlaceholder": "daily-swan-001",
    "metric.agent": "代理人",
    "metric.time": "时间",
    "metric.equity": "净值",
    "metric.reserve": "后备金",
    "metric.engine": "决策引擎",
    "metric.source": "决策来源",
    "metric.style": "市场风格",
    "metric.cash": "现金",
    "metric.borrowed": "借款",
    "metric.seed": "种子",
    "panel.chooseAgent": "先选一个代理人，让磁带开始转动。",
    "panel.greed": "贪婪",
    "panel.fear": "恐惧",
    "bubble.title": "代理脉冲",
    "chart.subtitle": "实时K线",
    "positions.title": "当前持仓",
    "positions.empty": "当前没有持仓。但这不会持续太久。",
    "actions.buy": "强行加仓",
    "actions.buyDesc": "玩家手动继续买入",
    "actions.sell": "立即割肉",
    "actions.sellDesc": "玩家手动强制平仓",
    "actions.clock": "{speed}倍时钟",
    "actions.clockDesc": "调节实时行情流速",
    "actions.sound.on": "音效开启",
    "actions.sound.off": "静音",
    "actions.soundDesc": "音效触发点已接好",
    "actions.swapHint": "换 Agent 只能在开局前进行。",
    "news.title": "新闻带",
    "news.active": "{count} 条激活",
    "news.empty": "盘面很安静。通常这只意味着麻烦还没到，不代表它不存在。",
    "news.accuracy.real": "真实风声",
    "news.accuracy.fake": "假消息",
    "museum.title": "爆仓博物馆",
    "museum.body":
      "每一个被抬出去的 Agent 都会被本地归档。刷新页面救不了一局，但也擦不掉残局。",
    "museum.back": "回到交易大厅",
    "museum.emptyTitle": "还没有阵亡者",
    "museum.emptyBody": "总得有人先把杠杆按得太狠。",
    "museum.finalEquity": "最终净值",
    "museum.seed": "种子",
    "museum.lastWords": "遗言",
    "event.margin.title": "追加保证金",
    "event.margin.body": "{message} 若接受，将从后备金里划钱进账户。",
    "event.margin.primary": "补保证金",
    "event.margin.secondary": "让它死",
    "event.gameOver.primary": "回到大厅",
    "event.gameOver.secondary": "查看博物馆",
    "engine.hint": "服务端 AI 跑在 Vercel 路由里。只有模型调用失败时，才会退回本地启发式策略。",
  },
} as const;

const marketStyleLabels: Record<MarketStyle, LocalizedText> = {
  slow_bull: {
    en: "slow bull",
    zh: "慢牛",
  },
  chop: {
    en: "chop",
    zh: "猴市",
  },
  black_swan: {
    en: "black swan",
    zh: "黑天鹅",
  },
};

const personalityLabels: Record<AgentPersonality, LocalizedText> = {
  martingale: {
    en: "martingale",
    zh: "马丁格尔",
  },
  technician: {
    en: "technician",
    zh: "技术派",
  },
  insider: {
    en: "insider",
    zh: "内幕派",
  },
  deadhand: {
    en: "dead hand",
    zh: "死扛流",
  },
};

const actionLabels: Record<DecisionAction, LocalizedText> = {
  BUY: {
    en: "BUY",
    zh: "买入",
  },
  SELL: {
    en: "SELL",
    zh: "卖出",
  },
  HOLD: {
    en: "HOLD",
    zh: "观望",
  },
  LEVERAGE: {
    en: "LEVERAGE",
    zh: "上杠杆",
  },
  PANIC_SELL: {
    en: "PANIC SELL",
    zh: "恐慌卖出",
  },
};

const decisionEngineStatusLabels: Record<DecisionEngineStatus, LocalizedText> = {
  idle: {
    en: "idle",
    zh: "空闲",
  },
  thinking: {
    en: "thinking",
    zh: "思考中",
  },
  ready: {
    en: "ready",
    zh: "已接线",
  },
  fallback: {
    en: "fallback",
    zh: "本地兜底",
  },
  error: {
    en: "error",
    zh: "错误",
  },
};

const decisionSourceLabels: Record<DecisionSource, LocalizedText> = {
  ai: {
    en: "AI",
    zh: "AI",
  },
  fallback: {
    en: "fallback",
    zh: "本地兜底",
  },
  player: {
    en: "player",
    zh: "玩家",
  },
};

const toneLabels: Record<NewsTone, LocalizedText> = {
  bullish: {
    en: "BULLISH",
    zh: "利多",
  },
  bearish: {
    en: "BEARISH",
    zh: "利空",
  },
};

const worldEventKindLabels: Record<WorldEventKind, LocalizedText> = {
  news: {
    en: "News",
    zh: "新闻",
  },
  policy: {
    en: "Policy",
    zh: "政策",
  },
  liquidity: {
    en: "Liquidity",
    zh: "流动性",
  },
  meme: {
    en: "Meme",
    zh: "情绪",
  },
};

const worldEventScopeLabels: Record<WorldEventScope, LocalizedText> = {
  ticker: {
    en: "single name",
    zh: "单票",
  },
  market: {
    en: "market-wide",
    zh: "全场",
  },
};

const newsVerbs: Record<NewsTone, string[]> = {
  bullish: [
    "secures mystery funding",
    "teases a strategic partnership",
    "leaks a surprise product demo",
    "announces a tokenized buyback",
  ],
  bearish: [
    "faces a sudden regulatory review",
    "misses a guidance whisper number",
    "freezes withdrawals for maintenance",
    "gets hit by a supplier panic",
  ],
};

const newsVerbsZh: Record<NewsTone, string[]> = {
  bullish: [
    "获得神秘融资",
    "暗示重大合作",
    "泄露意外产品演示",
    "宣布代币化回购",
  ],
  bearish: [
    "遭遇突发监管审查",
    "低于市场风声预期",
    "以维护为由冻结提现",
    "被供应链恐慌波及",
  ],
};

export function makeText(en: string, zh: string): LocalizedText {
  return { en, zh };
}

export function resolveText(locale: Locale, text: LocalizedText): string {
  return text[locale];
}

export function pickText(locale: Locale, en: string, zh: string): string {
  return locale === "zh" ? zh : en;
}

export function detectLocale(languages?: readonly string[]): Locale {
  const preferred = languages ?? [];
  return preferred.some((language) => language.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

export function t(
  locale: Locale,
  key: keyof (typeof messages)["en"],
  variables?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages.en[key];
  if (!variables) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(variables[token] ?? ""));
}

export function getMarketStyleLabel(locale: Locale, style: MarketStyle): string {
  return resolveText(locale, marketStyleLabels[style]);
}

export function getPersonalityLabel(locale: Locale, personality: AgentPersonality): string {
  return resolveText(locale, personalityLabels[personality]);
}

export function getActionLabel(locale: Locale, action: DecisionAction): string {
  return resolveText(locale, actionLabels[action]);
}

export function getDecisionEngineStatusLabel(
  locale: Locale,
  status: DecisionEngineStatus,
): string {
  return resolveText(locale, decisionEngineStatusLabels[status]);
}

export function getDecisionSourceLabel(
  locale: Locale,
  source: DecisionSource | null,
): string {
  if (!source) {
    return locale === "zh" ? "无" : "none";
  }

  return resolveText(locale, decisionSourceLabels[source]);
}

export function getNewsToneLabel(locale: Locale, tone: NewsTone): string {
  return resolveText(locale, toneLabels[tone]);
}

export function getWorldEventKindLabel(
  locale: Locale,
  kind: WorldEventKind,
): string {
  return resolveText(locale, worldEventKindLabels[kind]);
}

export function getWorldEventScopeLabel(
  locale: Locale,
  scope: WorldEventScope,
): string {
  return resolveText(locale, worldEventScopeLabels[scope]);
}

export function getNewsSubjectLabel(locale: Locale, event: NewsEvent): string {
  if (event.scope === "market") {
    return locale === "zh" ? "全场" : "MARKET";
  }

  return event.ticker;
}

export function getNewsAccuracyLabel(locale: Locale, accuracy: NewsAccuracy): string {
  return t(locale, accuracy === "real" ? "news.accuracy.real" : "news.accuracy.fake");
}

export function formatNewsHeadline(locale: Locale, event: NewsEvent): string {
  if (locale === "zh") {
    return event.headlineZh || `${event.ticker}${newsVerbsZh[event.tone][event.headlineVariant % newsVerbsZh[event.tone].length]!}`;
  }

  return event.headline || `${event.ticker} ${newsVerbs[event.tone][event.headlineVariant % newsVerbs[event.tone].length]!}`;
}
