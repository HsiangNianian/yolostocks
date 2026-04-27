"use client";

import { motion } from "framer-motion";

import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function AgentBubble({
  thought,
  action,
  confidence,
  locale,
}: {
  thought: string;
  action?: string | null;
  confidence?: number | null;
  locale: Locale;
}) {
  return (
    <motion.div
      key={`${action}-${thought}`}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-2xl border border-amber/35 bg-amber/10 p-4 text-sm text-amber"
    >
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-amber/70">
        <span>{t(locale, "bubble.title")}</span>
        <span>{action ?? "HOLD"}</span>
      </div>
      <p className="leading-6 text-amber/95">{thought}</p>
      {typeof confidence === "number" ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber/10">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: `${Math.max(10, Math.round(confidence * 100))}%` }}
          />
        </div>
      ) : null}
    </motion.div>
  );
}
