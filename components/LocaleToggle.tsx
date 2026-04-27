"use client";

import { t } from "@/lib/i18n";
import { useGameStore } from "@/store/gameStore";

export function LocaleToggle() {
  const locale = useGameStore((state) => state.settings.locale);
  const localeMode = useGameStore((state) => state.settings.localeMode);
  const setLocale = useGameStore((state) => state.setLocale);
  const useAutoLocale = useGameStore((state) => state.useAutoLocale);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3">
      <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
        {localeMode === "auto" ? t(locale, "lang.mode.auto") : t(locale, "lang.mode.manual")}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useAutoLocale}
          className={`rounded-full border px-3 py-2 text-xs transition ${
            localeMode === "auto"
              ? "border-amber/45 bg-amber/10 text-amber"
              : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
          }`}
        >
          {t(locale, "lang.auto")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("zh")}
          className={`rounded-full border px-3 py-2 text-xs transition ${
            localeMode === "manual" && locale === "zh"
              ? "border-phosphor/45 bg-phosphor/10 text-phosphor"
              : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
          }`}
        >
          {t(locale, "lang.chinese")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full border px-3 py-2 text-xs transition ${
            localeMode === "manual" && locale === "en"
              ? "border-phosphor/45 bg-phosphor/10 text-phosphor"
              : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
          }`}
        >
          {t(locale, "lang.english")}
        </button>
      </div>
    </div>
  );
}
