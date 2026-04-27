import type { MuseumRecord } from "@/lib/game/types";
import type { Locale } from "@/lib/i18n";
import { getPersonalityLabel, resolveText, t } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils/formatters";

export function MuseumCard({
  record,
  locale,
}: {
  record: MuseumRecord;
  locale: Locale;
}) {
  const values = record.equityHistory;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y =
        max === min
          ? 50
          : 100 - ((value - min) / Math.max(1, max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="font-pixel text-sm text-phosphor">
            {resolveText(locale, record.agentSnapshot.name)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
            {getPersonalityLabel(locale, record.agentSnapshot.personality)}
          </div>
        </div>
        <div className="text-3xl">{record.agentSnapshot.avatar}</div>
      </div>
      <div className="mb-4 rounded-2xl border border-white/10 bg-[#04110a] p-3">
        <svg viewBox="0 0 100 100" className="h-24 w-full">
          <polyline
            fill="none"
            stroke="rgba(255,93,93,0.88)"
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
      <div className="grid gap-2 text-sm text-white/70">
        <div className="flex justify-between">
          <span>{t(locale, "museum.finalEquity")}</span>
          <span className="text-danger">{formatCurrency(record.finalEquity, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t(locale, "museum.seed")}</span>
          <span className="truncate pl-4 text-phosphor/70">{record.seed}</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger/90">
        <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-danger/70">
          {t(locale, "museum.lastWords")}
        </div>
        <p>{record.lastWords}</p>
      </div>
      <div className="mt-4 text-sm text-white/55">{record.deathReason}</div>
    </div>
  );
}
