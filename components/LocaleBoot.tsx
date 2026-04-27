"use client";

import { useEffect } from "react";

import { useGameStore } from "@/store/gameStore";

export function LocaleBoot() {
  const locale = useGameStore((state) => state.settings.locale);
  const hydrateLocale = useGameStore((state) => state.hydrateLocale);

  useEffect(() => {
    hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return null;
}
