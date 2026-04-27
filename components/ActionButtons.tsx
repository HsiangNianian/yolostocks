"use client";

import { useSound } from "@/hooks/useSound";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function ActionButtons({
  onBuy,
  onSell,
  onSpeed,
  onMute,
  speed,
  muted,
  locale,
  disabled,
}: {
  onBuy: () => void;
  onSell: () => void;
  onSpeed: () => void;
  onMute: () => void;
  speed: number;
  muted: boolean;
  locale: Locale;
  disabled?: boolean;
}) {
  const { play } = useSound();

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            onBuy();
            play("buy");
          }}
          disabled={disabled}
          className="rounded-2xl border border-phosphor/40 bg-phosphor/10 px-4 py-4 text-left transition hover:bg-phosphor/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="font-pixel text-xs text-phosphor">{t(locale, "actions.buy")}</div>
          <div className="mt-2 text-xs text-phosphor/70">{t(locale, "actions.buyDesc")}</div>
        </button>
        <button
          type="button"
          onClick={() => {
            onSell();
            play("sell");
          }}
          disabled={disabled}
          className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-4 text-left transition hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <div className="font-pixel text-xs text-danger">{t(locale, "actions.sell")}</div>
          <div className="mt-2 text-xs text-danger/70">{t(locale, "actions.sellDesc")}</div>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSpeed}
          className="rounded-2xl border border-amber/40 bg-amber/10 px-4 py-4 text-left transition hover:bg-amber/15"
        >
          <div className="font-pixel text-xs text-amber">
            {t(locale, "actions.clock", { speed })}
          </div>
          <div className="mt-2 text-xs text-amber/70">{t(locale, "actions.clockDesc")}</div>
        </button>
        <button
          type="button"
          onClick={onMute}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
        >
          <div className="font-pixel text-xs text-white">
            {muted ? t(locale, "actions.sound.off") : t(locale, "actions.sound.on")}
          </div>
          <div className="mt-2 text-xs text-white/60">{t(locale, "actions.soundDesc")}</div>
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/50">
        {t(locale, "actions.swapHint")}
      </div>
    </div>
  );
}
