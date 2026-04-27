import type { NewsEvent } from "@/lib/market/types";
import type { Locale } from "@/lib/i18n";
import { formatNewsHeadline, getNewsAccuracyLabel, getNewsToneLabel, t } from "@/lib/i18n";

export function NewsFeed({
  news,
  locale,
}: {
  news: NewsEvent[];
  locale: Locale;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
        <span>{t(locale, "news.title")}</span>
        <span>{t(locale, "news.active", { count: news.length })}</span>
      </div>
      <div className="max-h-[240px] space-y-3 overflow-auto pr-1 scrollbar-thin">
        {news.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-phosphor/55">
            {t(locale, "news.empty")}
          </div>
        ) : null}
        {news
          .slice()
          .reverse()
          .map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-phosphor">{item.ticker}</span>
                <span
                  className={item.tone === "bullish" ? "text-phosphor/70" : "text-danger/70"}
                >
                  {getNewsToneLabel(locale, item.tone)}
                </span>
              </div>
              <div className="text-white/80">{formatNewsHeadline(locale, item)}</div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                {getNewsAccuracyLabel(locale, item.accuracy)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
