"use client";

import type { Locale } from "@/lib/i18n";
import { pickText, resolveText } from "@/lib/i18n";
import {
  WORLD_AGENT_PRESETS,
  WORLD_AGENT_TRAITS,
  getWorldAgentPreset,
  type WorldAgentConfig,
  type WorldAgentPresetId,
} from "@/lib/world/agent";

export function WorldAgentConfigurator({
  locale,
  worldAgent,
  onApplyPreset,
  onAliasChange,
  onTraitChange,
}: {
  locale: Locale;
  worldAgent: WorldAgentConfig;
  onApplyPreset: (presetId: WorldAgentPresetId) => void;
  onAliasChange: (alias: string) => void;
  onTraitChange: (
    trait: "drama" | "tempo" | "bias" | "coordination" | "deception",
    value: number,
  ) => void;
}) {
  const activePreset = getWorldAgentPreset(worldAgent.presetId);

  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-6">
      <div className="text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
        {pickText(locale, "World Agent", "系统 Agent")}
      </div>
      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber/25 bg-amber/10 text-3xl">
          {activePreset.avatar}
        </div>
        <div>
          <div className="font-pixel text-sm text-amber">
            {resolveText(locale, activePreset.label)}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/70">
            {resolveText(locale, activePreset.intro)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {WORLD_AGENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              preset.id === worldAgent.presetId
                ? "border-amber/40 bg-amber/10"
                : "border-white/10 bg-black/20 hover:border-amber/20 hover:bg-black/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{preset.avatar}</div>
              <div className="text-sm text-white/85">{resolveText(locale, preset.label)}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <label className="block text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
          {pickText(locale, "Alias", "别名")}
        </label>
        <input
          value={worldAgent.alias}
          onChange={(event) => onAliasChange(event.target.value)}
          placeholder={pickText(locale, "Optional narrator name", "可选主持人名字")}
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-amber/35"
        />
      </div>

      <div className="mt-5 grid gap-4">
        <TraitSlider
          locale={locale}
          label={resolveText(locale, WORLD_AGENT_TRAITS.drama)}
          value={worldAgent.drama}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onTraitChange("drama", value)}
        />
        <TraitSlider
          locale={locale}
          label={resolveText(locale, WORLD_AGENT_TRAITS.tempo)}
          value={worldAgent.tempo}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onTraitChange("tempo", value)}
        />
        <TraitSlider
          locale={locale}
          label={resolveText(locale, WORLD_AGENT_TRAITS.bias)}
          value={worldAgent.bias}
          min={-1}
          max={1}
          step={0.01}
          onChange={(value) => onTraitChange("bias", value)}
          formatter={(value) =>
            `${value > 0 ? "+" : ""}${Math.round(value * 100)}`
          }
        />
        <TraitSlider
          locale={locale}
          label={resolveText(locale, WORLD_AGENT_TRAITS.coordination)}
          value={worldAgent.coordination}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onTraitChange("coordination", value)}
        />
        <TraitSlider
          locale={locale}
          label={resolveText(locale, WORLD_AGENT_TRAITS.deception)}
          value={worldAgent.deception}
          min={0}
          max={1}
          step={0.01}
          onChange={(value) => onTraitChange("deception", value)}
        />
      </div>
    </div>
  );
}

function TraitSlider({
  locale,
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatter,
}: {
  locale: Locale;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
}) {
  const text = formatter
    ? formatter(value)
    : `${Math.round(value * 100)}${pickText(locale, "%", "%")}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-white/80">
        <span>{label}</span>
        <span className="font-mono text-xs text-amber">{text}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#f5ae58]"
      />
    </div>
  );
}
