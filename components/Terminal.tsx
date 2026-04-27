import type { ReactNode } from "react";

export function Terminal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`scanlines terminal-grid relative overflow-hidden rounded-[28px] border border-phosphor/25 bg-screen/85 shadow-terminal backdrop-blur ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-phosphor/70 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
