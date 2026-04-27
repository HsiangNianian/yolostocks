import type { Position } from "@/lib/game/types";
import type { Locale } from "@/lib/i18n";
import { formatCurrency, formatMultiplier, formatPercent } from "@/lib/utils/formatters";

export function PositionCard({
  position,
  currentPrice,
  locale,
}: {
  position: Position;
  currentPrice: number;
  locale: Locale;
}) {
  const pnl = (currentPrice - position.avgPrice) * position.quantity;
  const pnlRatio = position.avgPrice === 0 ? 0 : currentPrice / position.avgPrice - 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-pixel text-xs text-phosphor">{position.ticker}</div>
        <div
          className={`text-xs font-semibold ${
            pnl >= 0 ? "text-phosphor" : "text-danger"
          }`}
        >
          {formatCurrency(pnl, locale)}
        </div>
      </div>
      <div className="grid gap-1 text-xs text-phosphor/70">
        <div className="flex justify-between">
          <span>{locale === "zh" ? "数量" : "Qty"}</span>
          <span>{position.quantity.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{locale === "zh" ? "成本" : "Avg"}</span>
          <span>{formatCurrency(position.avgPrice, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{locale === "zh" ? "现价" : "Mark"}</span>
          <span>{formatCurrency(currentPrice, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{locale === "zh" ? "盈亏比" : "PnL"}</span>
          <span>{formatPercent(pnlRatio, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span>{locale === "zh" ? "杠杆" : "Lev"}</span>
          <span>{formatMultiplier(position.leverage, locale)}</span>
        </div>
      </div>
    </div>
  );
}
