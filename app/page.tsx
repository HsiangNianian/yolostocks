"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionButtons } from "@/components/ActionButtons";
import { AgentPanel } from "@/components/AgentPanel";
import { EventModal } from "@/components/EventModal";
import { KLineChart } from "@/components/KLineChart";
import { LocaleToggle } from "@/components/LocaleToggle";
import { NewsFeed } from "@/components/NewsFeed";
import { PositionCard } from "@/components/PositionCard";
import { Terminal } from "@/components/Terminal";
import { useGameLoop } from "@/hooks/useGameLoop";
import { getTickerPrice } from "@/lib/agent/decision";
import {
  getDecisionEngineStatusLabel,
  getDecisionSourceLabel,
  getMarketStyleLabel,
  getPersonalityLabel,
  resolveText,
  t,
} from "@/lib/i18n";
import { formatCurrency, formatSessionTime } from "@/lib/utils/formatters";
import { useGameStore } from "@/store/gameStore";

export default function HomePage() {
  useGameLoop();

  const [seedInput, setSeedInput] = useState("");
  const {
    phase,
    agents,
    currentAgent,
    market,
    positions,
    cash,
    reserveCash,
    borrowed,
    newsQueue,
    speed,
    selectedTicker,
    currentTick,
    sessionStartedAt,
    marginCall,
    decisionEngine,
    settings,
    gameResult,
    startGame,
    forceBuy,
    forceSell,
    selectTicker,
    cycleSpeed,
    setMuted,
    resolveMarginCall,
    returnToLobby,
  } = useGameStore();
  const locale = settings.locale;

  const selectedSeries = market?.tickers.find((ticker) => ticker.symbol === selectedTicker) ?? market?.tickers[0];
  const visibleCandles = selectedSeries?.candles.slice(0, currentTick + 1) ?? [];
  const exposure = useMemo(
    () =>
      positions.reduce((sum, position) => {
        if (!market) {
          return sum;
        }

        return sum + position.quantity * getTickerPrice(market, position.ticker, currentTick);
      }, 0),
    [currentTick, market, positions],
  );
  const equity = cash + exposure - borrowed;

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-pixel text-lg text-phosphor">{t(locale, "app.title")}</div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
              {t(locale, "app.tagline")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <LocaleToggle />
            <Link
              href="/museum"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
            >
              {t(locale, "app.museumLink")}
            </Link>
          </div>
        </div>

        {phase === "idle" ? (
          <Terminal className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
              <section>
                <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
                    {t(locale, "idle.badge")}
                  </div>
                  <h1 className="mt-4 font-pixel text-xl leading-relaxed text-phosphor sm:text-2xl">
                    {t(locale, "idle.heading")}
                  </h1>
                  <div className="mt-5 max-w-2xl space-y-3 text-sm leading-7 text-white/70">
                    <p>{t(locale, "idle.body1")}</p>
                    <p>{t(locale, "idle.body2")}</p>
                  </div>
                  <div className="mt-6 rounded-2xl border border-amber/30 bg-amber/10 p-4">
                    <label className="block text-[10px] uppercase tracking-[0.28em] text-amber/70">
                      {t(locale, "idle.seedLabel")}
                    </label>
                    <input
                      value={seedInput}
                      onChange={(event) => setSeedInput(event.target.value)}
                      placeholder={t(locale, "idle.seedPlaceholder")}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-phosphor/40"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => startGame(agent.id, seedInput)}
                    className="w-full rounded-[24px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-phosphor/30 hover:bg-black/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-phosphor/25 bg-phosphor/10 text-3xl">
                        {agent.avatar}
                      </div>
                      <div>
                        <div className="font-pixel text-sm text-phosphor">
                          {resolveText(locale, agent.name)}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
                          {getPersonalityLabel(locale, agent.personality)}
                        </div>
                        <p className="mt-3 text-sm text-white/70">
                          {resolveText(locale, agent.intro)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </section>
            </div>
          </Terminal>
        ) : null}

        {phase !== "idle" && market ? (
          <Terminal className="relative p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
              <aside className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label={t(locale, "metric.agent")}
                      value={currentAgent ? resolveText(locale, currentAgent.name) : "N/A"}
                    />
                    <Metric
                      label={t(locale, "metric.time")}
                      value={formatSessionTime(sessionStartedAt, currentTick, locale)}
                    />
                    <Metric label={t(locale, "metric.equity")} value={formatCurrency(equity, locale)} emphasis />
                    <Metric label={t(locale, "metric.reserve")} value={formatCurrency(reserveCash, locale)} />
                    <Metric
                      label={t(locale, "metric.engine")}
                      value={getDecisionEngineStatusLabel(locale, decisionEngine.status)}
                    />
                    <Metric
                      label={t(locale, "metric.source")}
                      value={getDecisionSourceLabel(locale, decisionEngine.lastSource)}
                    />
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/60">
                    {decisionEngine.lastError ? decisionEngine.lastError : t(locale, "engine.hint")}
                  </div>
                </div>
                <AgentPanel agent={currentAgent} locale={locale} />
              </aside>

              <section className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {market.tickers.map((ticker) => (
                      <button
                        key={ticker.symbol}
                        type="button"
                        onClick={() => selectTicker(ticker.symbol)}
                        className={`rounded-full border px-3 py-2 text-xs transition ${
                          ticker.symbol === selectedTicker
                            ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {ticker.symbol}
                      </button>
                    ))}
                  </div>
                  <KLineChart
                    symbol={selectedSeries?.symbol ?? "----"}
                    candles={visibleCandles}
                    locale={locale}
                  />
                </div>
                <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
                      <span>{t(locale, "positions.title")}</span>
                      <span>{positions.length}</span>
                    </div>
                    <div className="grid gap-3">
                      {positions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/45">
                          {t(locale, "positions.empty")}
                        </div>
                      ) : null}
                      {positions.map((position) => (
                        <PositionCard
                          key={position.ticker}
                          position={position}
                          currentPrice={getTickerPrice(market, position.ticker, currentTick)}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>
                  <ActionButtons
                    onBuy={forceBuy}
                    onSell={forceSell}
                    onSpeed={cycleSpeed}
                    onMute={() => setMuted(!settings.muted)}
                    speed={speed}
                    muted={settings.muted}
                    locale={locale}
                    disabled={phase !== "running"}
                  />
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3">
                    <Metric label={t(locale, "metric.style")} value={getMarketStyleLabel(locale, market.style)} />
                    <Metric label={t(locale, "metric.cash")} value={formatCurrency(cash, locale)} />
                    <Metric label={t(locale, "metric.borrowed")} value={formatCurrency(borrowed, locale)} />
                    <Metric label={t(locale, "metric.seed")} value={market.seed} mono />
                  </div>
                </div>
                <NewsFeed news={newsQueue} locale={locale} />
              </aside>
            </div>

            {marginCall ? (
              <EventModal
                title={t(locale, "event.margin.title")}
                body={t(locale, "event.margin.body", { message: marginCall.message })}
                primaryLabel={t(locale, "event.margin.primary")}
                secondaryLabel={t(locale, "event.margin.secondary")}
                onPrimary={() => resolveMarginCall(true)}
                onSecondary={() => resolveMarginCall(false)}
              />
            ) : null}

            {gameResult ? (
              <EventModal
                title={gameResult.title}
                body={gameResult.description}
                primaryLabel={t(locale, "event.gameOver.primary")}
                secondaryLabel={t(locale, "event.gameOver.secondary")}
                tone={gameResult.survived ? "amber" : "danger"}
                onPrimary={returnToLobby}
                onSecondary={() => {
                  window.location.href = "/museum";
                }}
              />
            ) : null}
          </Terminal>
        ) : null}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
  mono = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.28em] text-phosphor/55">{label}</div>
      <div
        className={`mt-2 text-sm ${
          emphasis ? "font-pixel text-phosphor" : "text-white/78"
        } ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
