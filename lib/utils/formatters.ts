import type { Locale } from "@/lib/i18n";
import { getSessionTimestampMs } from "@/lib/game/loop";

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

export function formatPrice(value: number, locale: Locale): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

export function formatSessionTime(
  sessionStartedAt: number | null,
  currentTick: number,
  locale: Locale,
): string {
  const timestamp = getSessionTimestampMs(sessionStartedAt, currentTick);
  if (timestamp === null) {
    return "--";
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
