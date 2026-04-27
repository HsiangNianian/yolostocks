"use client";

import { motion } from "framer-motion";

export function EventModal({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  tone = "danger",
}: {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  tone?: "danger" | "amber";
}) {
  const primaryClass =
    tone === "danger"
      ? "border-danger/40 bg-danger/15 text-danger"
      : "border-amber/40 bg-amber/15 text-amber";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#08130d] p-6 shadow-terminal"
      >
        <div className="font-pixel text-sm text-phosphor">{title}</div>
        <p className="mt-4 leading-7 text-white/80">{body}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPrimary}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition hover:opacity-90 ${primaryClass}`}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
