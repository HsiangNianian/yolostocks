import type { Locale } from "@/lib/i18n";
import { pickText, resolveText } from "@/lib/i18n";
import {
  WORLD_AGENT_TRAITS,
  getWorldAgentDisplayName,
  getWorldAgentPreset,
  type WorldAgentConfig,
} from "@/lib/world/agent";

export function WorldAgentPanel({
  locale,
  worldAgent,
}: {
  locale: Locale;
  worldAgent: WorldAgentConfig | null;
}) {
  if (!worldAgent) {
    return null;
  }

  const preset = getWorldAgentPreset(worldAgent.presetId);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber/25 bg-amber/10 text-2xl">
          {preset.avatar}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-amber/70">
            {pickText(locale, "World Agent", "系统 Agent")}
          </div>
          <div className="mt-2 font-pixel text-sm text-amber">
            {getWorldAgentDisplayName(locale, worldAgent)}
          </div>
          <div className="mt-1 text-sm text-white/65">
            {resolveText(locale, preset.label)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs text-white/65">
        <Stat
          label={resolveText(locale, WORLD_AGENT_TRAITS.drama)}
          value={`${Math.round(worldAgent.drama * 100)}%`}
        />
        <Stat
          label={resolveText(locale, WORLD_AGENT_TRAITS.tempo)}
          value={`${Math.round(worldAgent.tempo * 100)}%`}
        />
        <Stat
          label={resolveText(locale, WORLD_AGENT_TRAITS.bias)}
          value={`${worldAgent.bias > 0 ? "+" : ""}${Math.round(worldAgent.bias * 100)}`}
        />
        <Stat
          label={resolveText(locale, WORLD_AGENT_TRAITS.coordination)}
          value={`${Math.round(worldAgent.coordination * 100)}%`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.24em] text-white/35">{label}</div>
      <div className="mt-2 text-sm text-white/78">{value}</div>
    </div>
  );
}
