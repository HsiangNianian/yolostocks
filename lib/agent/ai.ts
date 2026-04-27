import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import type { Decision } from "@/lib/agent/types";
import {
  agentDecisionResponseSchema,
  type AgentDecisionRequest,
} from "@/lib/agent/ai-contract";
import { clamp } from "@/lib/utils/random";

export async function generateAgentDecision(
  input: AgentDecisionRequest,
): Promise<Decision> {
  const client = new OpenAI({
    baseURL: getRequiredEnv("OPENAI_BASE_URL"),
    apiKey: getRequiredEnv("OPENAI_API_KEY"),
    timeout: 12_000,
  });

  const completion = await client.chat.completions.create({
    model: getRequiredEnv("OPENAI_MODEL"),
    temperature: 0.7,
    max_tokens: 220,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(input),
      },
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content;
  const rawJson = Array.isArray(rawContent)
    ? rawContent
        .map((part) => ("text" in part ? part.text : ""))
        .join("")
    : rawContent ?? "";

  const parsed = agentDecisionResponseSchema.parse(parseJsonContent(rawJson));
  return normalizeDecision(parsed, input);
}

function buildSystemPrompt(input: AgentDecisionRequest): string {
  const persona = getPersonaDirectives(input.agent.personality, input.locale);
  const languageLine =
    input.locale === "zh"
      ? "Return the reason in Simplified Chinese."
      : "Return the reason in concise English.";

  return [
    "You are an AI stock-gambling agent inside a browser game called YOLO Agent.",
    "You must stay in character and make exactly one trading decision at a time.",
    "Reply with strict JSON only. No markdown. No prose outside the JSON object.",
    "Respect the current portfolio, cash, leverage, and market snapshot.",
    "If selling makes no sense because there is no matching position, choose HOLD instead.",
    "If buying makes no sense because the portfolio is already stressed, HOLD is acceptable.",
    languageLine,
    persona,
  ].join("\n");
}

function buildUserPrompt(input: AgentDecisionRequest): string {
  const board = input.market.board
    .map(
      (ticker) =>
        `${ticker.symbol} (${ticker.name}) price=${ticker.price.toFixed(2)} short=${formatPct(
          ticker.moveShort,
        )} medium=${formatPct(ticker.moveMedium)} ma5Gap=${formatPct(
          ticker.ma5Gap,
        )} ma20Gap=${formatPct(ticker.ma20Gap)}`,
    )
    .join("\n");

  const positions =
    input.positions.length === 0
      ? "none"
      : input.positions
          .map(
            (position) =>
              `${position.ticker} qty=${position.quantity.toFixed(2)} avg=${position.avgPrice.toFixed(
                2,
              )} lev=${position.leverage.toFixed(2)} unrealized=${position.unrealizedPnl.toFixed(
                2,
              )} pnl=${formatPct(position.pnlRatio)}`,
          )
          .join("\n");

  const news =
    input.news.length === 0
      ? "none"
      : input.news
          .map(
            (item) =>
              `${item.ticker} ${item.headline} tone=${item.tone} accuracy=${item.accuracy} age=${item.ageTicks}`,
          )
          .join("\n");

  return [
    `tick=${input.currentTick}`,
    `marketStyle=${input.market.style}`,
    `featuredTicker=${input.market.featuredTicker}`,
    `selectedTicker=${input.selectedTicker ?? "none"}`,
    `agent=${input.agent.name} personality=${input.agent.personality} greed=${input.agent.greed.toFixed(
      2,
    )} fear=${input.agent.fear.toFixed(2)} emotionalGreed=${input.agent.emotionalGreed.toFixed(
      2,
    )} emotionalFear=${input.agent.emotionalFear.toFixed(2)} level=${input.agent.level}`,
    `agentIntro=${input.agent.intro}`,
    `agentLastThought=${input.agent.lastThought}`,
    `cash=${input.portfolio.cash.toFixed(2)} reserve=${input.portfolio.reserveCash.toFixed(
      2,
    )} borrowed=${input.portfolio.borrowed.toFixed(2)} equity=${input.portfolio.equity.toFixed(2)}`,
    "BOARD:",
    board,
    "POSITIONS:",
    positions,
    "NEWS:",
    news,
    'Return JSON with keys: action, ticker, confidence, sizeDelta, leverageDelta, reason.',
    'action must be one of BUY, SELL, HOLD, LEVERAGE, PANIC_SELL.',
    "confidence must be between 0 and 1.",
    "sizeDelta should usually be between 0 and 0.45.",
    "leverageDelta should usually be between 0 and 1.5.",
  ].join("\n");
}

function getPersonaDirectives(
  personality: AgentDecisionRequest["agent"]["personality"],
  locale: AgentDecisionRequest["locale"],
): string {
  const enMap = {
    martingale:
      "Persona: a martingale addict. When underwater, you are biased toward averaging down and sometimes levering harder. You hate admitting defeat.",
    technician:
      "Persona: a chart mystic. You over-index on moving-average structure and visual trend continuation. You sell when the tape looks broken.",
    insider:
      "Persona: a rumor trader. Fresh news should heavily influence you, especially if it sounds tradable before the crowd fully prices it.",
    deadhand:
      "Persona: a stubborn bag holder. You avoid selling losing positions unless fear is extreme. You prefer enduring pain over admitting a mistake.",
  } satisfies Record<AgentDecisionRequest["agent"]["personality"], string>;

  const zhMap = {
    martingale:
      "人格：马丁加仓狂。浮亏越重越倾向补仓，偶尔会上更高杠杆。你极度讨厌认输。",
    technician:
      "人格：K线神棍。你过度依赖均线、形态和趋势延续感。图坏了就更愿意卖。",
    insider:
      "人格：消息交易员。新鲜新闻应该强烈影响你，尤其是那种市场还没完全交易进去的风声。",
    deadhand:
      "人格：死扛派。除非恐惧极端，否则你不愿意卖出亏损仓位。你宁愿忍痛，也不愿承认犯错。",
  } satisfies Record<AgentDecisionRequest["agent"]["personality"], string>;

  return locale === "zh" ? zhMap[personality] : enMap[personality];
}

function normalizeDecision(
  decision: z.infer<typeof agentDecisionResponseSchema>,
  input: AgentDecisionRequest,
): Decision {
  const validTickers = new Set(input.market.board.map((item) => item.symbol));
  const heldTickers = new Set(input.positions.map((item) => item.ticker));
  let action = decision.action;
  let ticker = validTickers.has(decision.ticker)
    ? decision.ticker
    : input.selectedTicker ?? input.market.board[0]!.symbol;

  if ((action === "SELL" || action === "PANIC_SELL") && !heldTickers.has(ticker)) {
    if (heldTickers.size > 0) {
      ticker = [...heldTickers][0]!;
    } else {
      action = "HOLD";
    }
  }

  if ((action === "BUY" || action === "LEVERAGE") && input.portfolio.equity <= 0) {
    action = "HOLD";
  }

  return {
    action,
    ticker,
    confidence: clamp(decision.confidence, 0.05, 0.99),
    sizeDelta: normalizeSize(action, decision.sizeDelta),
    leverageDelta: normalizeLeverage(action, decision.leverageDelta),
    reason: decision.reason.trim(),
  };
}

function normalizeSize(action: Decision["action"], sizeDelta: number): number {
  if (action === "HOLD") {
    return 0;
  }

  if (action === "SELL" || action === "PANIC_SELL") {
    return clamp(sizeDelta || 1, 0.15, 1);
  }

  return clamp(sizeDelta || 0.18, 0.05, 0.45);
}

function normalizeLeverage(action: Decision["action"], leverageDelta: number): number {
  if (action !== "LEVERAGE") {
    return clamp(leverageDelta || 0, 0, 1.5);
  }

  return clamp(leverageDelta || 0.45, 0.15, 1.5);
}

function parseJsonContent(content: string): unknown {
  const trimmed = content.trim().replace(/^```json\s*/u, "").replace(/^```\s*/u, "").replace(/```$/u, "");
  return JSON.parse(trimmed);
}

function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function getRequiredEnv(name: "OPENAI_BASE_URL" | "OPENAI_API_KEY" | "OPENAI_MODEL"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
