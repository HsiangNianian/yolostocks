import type { Locale } from "@/lib/i18n";

function getIntlLocale(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en-US";
}

export function formatCurrency(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${value >= 0 ? "+" : ""}${formatter.format(value * 100)}%`;
}

export function formatMultiplier(value: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return `${formatter.format(value)}x`;
}

export function formatTickTime(currentTick: number, ticksPerDay: number, locale: Locale): string {
  const day = Math.floor(currentTick / ticksPerDay) + 1;
  const minute = currentTick % ticksPerDay;
  if (locale === "zh") {
    return `第${day.toString().padStart(2, "0")}天 · 第${minute
      .toString()
      .padStart(2, "0")}分`;
  }

  return `DAY ${day.toString().padStart(2, "0")} · M${minute.toString().padStart(2, "0")}`;
}
