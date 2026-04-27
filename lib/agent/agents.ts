import type { AgentTemplate } from "@/lib/agent/types";
import { makeText } from "@/lib/i18n";

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "double-down-devil",
    name: makeText("Martingale Fiend", "马丁怪"),
    avatar: "🦂",
    personality: "martingale",
    greed: 0.78,
    fear: 0.18,
    luck: 0.55,
    level: 1,
    isAlive: true,
    intro: makeText(
      "The deeper it falls, the cheaper the chips. One more layer and we are back.",
      "跌得越深，筹码越便宜。再补一层，我们就赢了。",
    ),
    quotePool: [
      makeText("Mean reversion never truly misses an appointment.", "均值回归从不缺席。"),
      makeText("Losses are just invitations to better odds.", "亏损只是更高赔率的邀请函。"),
      makeText("Average down once more and the edge comes back.", "再补一次，胜率就回来了。"),
    ],
  },
  {
    id: "cross-over-hermit",
    name: makeText("Chart Hermit", "K线仙"),
    avatar: "🧿",
    personality: "technician",
    greed: 0.52,
    fear: 0.36,
    luck: 0.48,
    level: 1,
    isAlive: true,
    intro: makeText(
      "The pattern has already spoken. What remains is execution.",
      "形态已经说话，剩下的是执行纪律。",
    ),
    quotePool: [
      makeText("The 5-day just crossed the 20-day. The air has shifted.", "五日线上穿二十日线，气运到了。"),
      makeText("Death cross confirmed. Step back before the crowd does.", "死叉已成，先退半步再说。"),
      makeText("The prettier the setup, the harder it begs for a bet.", "图形越漂亮，越值得一搏。"),
    ],
  },
  {
    id: "rumor-vampire",
    name: makeText("Rumor Vampire", "内幕哥"),
    avatar: "🕶️",
    personality: "insider",
    greed: 0.67,
    fear: 0.29,
    luck: 0.62,
    level: 1,
    isAlive: true,
    intro: makeText(
      "The premarket whisper landed. I will say it once. Do not ask the source.",
      "盘前消息到了，我只说一句，别问来源。",
    ),
    quotePool: [
      makeText("The whisper is real. The tape will confirm it for me.", "风声是真的，盘口会替我证明。"),
      makeText("The rumor may be wrong, but the market may believe first.", "消息不一定对，但市场会先信。"),
      makeText("You want answers, not compliance.", "你要的是答案，不是合规。"),
    ],
  },
  {
    id: "bag-holder-saint",
    name: makeText("Bagholder Saint", "死扛侠"),
    avatar: "🪨",
    personality: "deadhand",
    greed: 0.41,
    fear: 0.12,
    luck: 0.51,
    level: 1,
    isAlive: true,
    intro: makeText(
      "If I have not sold, it is not a loss yet. Time can defend the position.",
      "没卖就不算亏，仓位会替时间说话。",
    ),
    quotePool: [
      makeText("If it will not go green yet, I can still keep holding.", "红不了就继续扛。"),
      makeText("If the trend is not finished, neither am I.", "趋势没结束，我也不会。"),
      makeText("The bounce will come. The only question is whether we survive it.", "反弹总会来，只是人要先活着。"),
    ],
  },
];
