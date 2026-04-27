import type { RunningAgentState } from "@/lib/agent/types";
import type { Locale } from "@/lib/i18n";
import { getActionLabel, getPersonalityLabel, resolveText, t } from "@/lib/i18n";

import { AgentBubble } from "@/components/AgentBubble";

function Meter({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-phosphor/60">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${
            danger ? "bg-danger/80" : "bg-phosphor"
          }`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function AgentPanel({
  agent,
  locale,
}: {
  agent: RunningAgentState | null;
  locale: Locale;
}) {
  if (!agent) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-phosphor/70">
        {t(locale, "panel.chooseAgent")}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-phosphor/35 bg-phosphor/10 text-4xl shadow-[0_0_24px_rgba(125,255,155,0.12)]">
          {agent.avatar}
        </div>
        <div className="space-y-2">
          <div className="font-pixel text-sm text-phosphor">{resolveText(locale, agent.name)}</div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-phosphor/55">
            {getPersonalityLabel(locale, agent.personality)}
          </div>
          <div className="text-sm text-phosphor/75">{resolveText(locale, agent.intro)}</div>
        </div>
      </div>
      <div className="grid gap-4">
        <Meter label={t(locale, "panel.greed")} value={agent.emotionalState.greed} />
        <Meter label={t(locale, "panel.fear")} value={agent.emotionalState.fear} danger />
      </div>
      <AgentBubble
        thought={agent.lastThought}
        action={agent.lastDecision ? getActionLabel(locale, agent.lastDecision.action) : null}
        confidence={agent.lastDecision?.confidence}
        locale={locale}
      />
    </div>
  );
}
