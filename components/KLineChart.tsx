"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LogicalRange,
  type MouseEventParams,
  type SeriesMarker,
  type SeriesMarkerPosition,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";

import type { Locale } from "@/lib/i18n";
import {
  getActionLabel,
  getDecisionSourceLabel,
  getNewsAccuracyLabel,
  formatNewsHeadline,
  getNewsSubjectLabel,
  getNewsToneLabel,
  getWorldEventKindLabel,
  getWorldEventScopeLabel,
  pickText,
  t,
} from "@/lib/i18n";
import type { Candle, NewsEvent } from "@/lib/market/types";
import type { TradeAnnotation } from "@/lib/game/types";
import { formatCurrency, formatPercent, formatPrice } from "@/lib/utils/formatters";

type ChartAnnotation =
  | { kind: "world"; event: NewsEvent }
  | { kind: "trade"; trade: TradeAnnotation };

export function KLineChart({
  candles,
  symbol,
  events,
  trades,
  currentTick,
  locale,
}: {
  candles: Candle[];
  symbol: string;
  events: NewsEvent[];
  trades: TradeAnnotation[];
  currentTick: number;
  locale: Locale;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const syncingRef = useRef(false);
  const autoFollowRef = useRef(true);
  const annotationsByTimeRef = useRef<Map<number, ChartAnnotation[]>>(new Map());
  const candleCountRef = useRef(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [hoveredAnnotations, setHoveredAnnotations] = useState<ChartAnnotation[]>([]);

  autoFollowRef.current = autoFollow;

  const annotationsByTime = useMemo(
    () => {
      const map = new Map<number, ChartAnnotation[]>();

      for (const event of events) {
        const time = candles[event.tick]?.time ?? event.tick;
        const bucket = map.get(time) ?? [];
        bucket.push({ kind: "world", event });
        map.set(time, bucket);
      }

      for (const trade of trades) {
        const time = candles[trade.tick]?.time ?? trade.tick;
        const bucket = map.get(time) ?? [];
        bucket.push({ kind: "trade", trade });
        map.set(time, bucket);
      }

      return map;
    },
    [candles, events, trades],
  );
  const currentMarkPrice = candles.at(-1)?.close ?? 0;

  annotationsByTimeRef.current = annotationsByTime;
  candleCountRef.current = candles.length;

  useEffect(() => {
    setAutoFollow(true);
    setHoveredAnnotations([]);
  }, [symbol]);

  useEffect(() => {
    if (!rootRef.current || chartRef.current) {
      return;
    }

    const chart = createChart(rootRef.current, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: "#06110b",
        },
        textColor: "rgba(216,255,226,0.72)",
      },
      grid: {
        vertLines: {
          color: "rgba(125,255,155,0.08)",
        },
        horzLines: {
          color: "rgba(125,255,155,0.08)",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(125,255,155,0.12)",
      },
      timeScale: {
        borderColor: "rgba(125,255,155,0.12)",
        timeVisible: true,
        secondsVisible: true,
      },
      crosshair: {
        vertLine: {
          color: "rgba(245,174,88,0.55)",
        },
        horzLine: {
          color: "rgba(245,174,88,0.55)",
        },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#7dff9b",
      downColor: "#ff5d5d",
      wickUpColor: "#7dff9b",
      wickDownColor: "#ff5d5d",
      borderVisible: false,
    });

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (param.time === undefined) {
        setHoveredAnnotations([]);
        return;
      }

      const key = Number(param.time);
      setHoveredAnnotations(annotationsByTimeRef.current.get(key) ?? []);
    };

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      if (!range || syncingRef.current) {
        return;
      }

      const lastIndex = Math.max(0, candleCountRef.current - 1);
      if (range.to < lastIndex - 0.75 && autoFollowRef.current) {
        setAutoFollow(false);
      }
    };

    const handleWheel = () => {
      if (autoFollowRef.current) {
        setAutoFollow(false);
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    rootRef.current.addEventListener("wheel", handleWheel, { passive: true });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      rootRef.current?.removeEventListener("wheel", handleWheel);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) {
      return;
    }

    const data: CandlestickData[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    const markers: SeriesMarker<UTCTimestamp>[] = [
      ...events.map((event) => ({
        time: (candles[event.tick]?.time ?? event.tick) as UTCTimestamp,
        position: getWorldMarkerPosition(event),
        color: getWorldMarkerColor(event),
        shape: getWorldMarkerShape(event),
        text: getWorldMarkerText(event),
      })),
      ...trades.map((trade) => ({
        time: (candles[trade.tick]?.time ?? trade.tick) as UTCTimestamp,
        position: getTradeMarkerPosition(trade),
        color: getTradeMarkerColor(trade),
        shape: getTradeMarkerShape(trade),
        text: getTradeMarkerText(trade),
      })),
    ];

    seriesRef.current.setData(data);
    seriesRef.current.setMarkers(markers);

    if (!autoFollow || candles.length === 0) {
      return;
    }

    syncingRef.current = true;
    const to = candles.length + 3;
    const from = Math.max(0, to - 72);
    chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
    window.requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [autoFollow, candles, currentTick, events, trades]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="font-pixel text-sm text-phosphor">{symbol}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
            {t(locale, "chart.subtitle")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAutoFollow((value) => !value)}
          className={`rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.24em] transition ${
            autoFollow
              ? "border-phosphor/35 bg-phosphor/10 text-phosphor"
              : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
          }`}
        >
          {autoFollow
            ? pickText(locale, "Auto Follow On", "自动跟踪开")
            : pickText(locale, "Auto Follow Off", "自动跟踪关")}
        </button>
      </div>
      {hoveredAnnotations.length > 0 ? (
        <div className="mb-3 rounded-2xl border border-amber/25 bg-amber/10 p-3 text-sm">
          <div className="space-y-3">
            {hoveredAnnotations.map((annotation, index) =>
              annotation.kind === "world" ? (
                <div key={`world-${annotation.event.id}-${index}`}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-amber/75">
                    <span>{getWorldEventKindLabel(locale, annotation.event.kind)}</span>
                    <span>{getWorldEventScopeLabel(locale, annotation.event.scope)}</span>
                    <span>{getNewsToneLabel(locale, annotation.event.tone)}</span>
                    <span>{getNewsAccuracyLabel(locale, annotation.event.accuracy)}</span>
                  </div>
                  <div className="mt-2 text-white/85">
                    {getNewsSubjectLabel(locale, annotation.event)} ·{" "}
                    {formatNewsHeadline(locale, annotation.event)}
                  </div>
                  <div className="mt-2 text-xs text-white/45">
                    {pickText(locale, "Issued by ", "出题人：")}
                    {annotation.event.sourceAgent}
                  </div>
                </div>
              ) : (
                <div key={`trade-${annotation.trade.id}-${index}`}>
                  {(() => {
                    const pnl = getTradeRunningPnl(annotation.trade, currentMarkPrice);
                    const pnlRatio = getTradeRunningPnlRatio(annotation.trade, currentMarkPrice);

                    return (
                      <>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-amber/75">
                    <span>{pickText(locale, "Trade", "交易")}</span>
                    <span>{getActionLabel(locale, annotation.trade.action)}</span>
                    <span>{getDecisionSourceLabel(locale, annotation.trade.source)}</span>
                  </div>
                  <div className="mt-2 text-white/85">
                    {annotation.trade.ticker} · {formatPrice(annotation.trade.executedPrice, locale)} ·{" "}
                    {pickText(locale, "Qty", "数量")} {annotation.trade.executedQuantity.toFixed(2)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                    <span>
                      {pickText(locale, "Now ", "现价")}
                      {formatPrice(currentMarkPrice, locale)}
                    </span>
                    <span className={pnl >= 0 ? "text-phosphor" : "text-danger"}>
                      {pickText(locale, "Current PnL ", "当前盈亏")}
                      {formatCurrency(pnl, locale)} ({formatPercent(pnlRatio, locale)})
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-white/45">
                    {annotation.trade.reason}
                  </div>
                      </>
                    );
                  })()}
                </div>
              ),
            )}
          </div>
        </div>
      ) : null}
      {!autoFollow ? (
        <div className="mb-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/50">
          {pickText(
            locale,
            "Auto follow is paused while you inspect older candles.",
            "你正在查看旧 K 线，自动跟踪已暂停。",
          )}
        </div>
      ) : null}
      <div ref={rootRef} className="h-[360px] w-full" />
    </div>
  );
}

function getWorldMarkerColor(event: NewsEvent): string {
  if (event.kind === "policy") {
    return "#f5ae58";
  }

  if (event.kind === "liquidity") {
    return "#67e8f9";
  }

  if (event.kind === "meme") {
    return "#f472b6";
  }

  return event.tone === "bullish" ? "#7dff9b" : "#ff5d5d";
}

function getWorldMarkerShape(event: NewsEvent): "circle" | "square" | "arrowUp" | "arrowDown" {
  if (event.kind === "meme") {
    return "circle";
  }

  if (event.kind === "policy") {
    return "square";
  }

  return event.tone === "bullish" ? "arrowUp" : "arrowDown";
}

function getWorldMarkerText(event: NewsEvent): string {
  switch (event.kind) {
    case "policy":
      return "P";
    case "liquidity":
      return "L";
    case "meme":
      return "M";
    default:
      return "N";
  }
}

function getWorldMarkerPosition(event: NewsEvent): SeriesMarkerPosition {
  return event.tone === "bullish" ? "belowBar" : "aboveBar";
}

function getTradeMarkerColor(trade: TradeAnnotation): string {
  if (trade.source === "player") {
    return "#f5ae58";
  }

  if (trade.source === "fallback") {
    return "#67e8f9";
  }

  return trade.action === "BUY" || trade.action === "LEVERAGE" ? "#7dff9b" : "#ff5d5d";
}

function getTradeMarkerShape(
  trade: TradeAnnotation,
): "circle" | "square" | "arrowUp" | "arrowDown" {
  if (trade.source === "player") {
    return "circle";
  }

  if (trade.source === "fallback") {
    return "square";
  }

  return trade.action === "BUY" || trade.action === "LEVERAGE" ? "arrowUp" : "arrowDown";
}

function getTradeMarkerText(trade: TradeAnnotation): string {
  switch (trade.action) {
    case "LEVERAGE":
      return "L";
    case "SELL":
      return "S";
    case "PANIC_SELL":
      return "P";
    case "BUY":
    default:
      return "B";
  }
}

function getTradeMarkerPosition(trade: TradeAnnotation): SeriesMarkerPosition {
  return trade.action === "BUY" || trade.action === "LEVERAGE"
    ? "belowBar"
    : "aboveBar";
}

function getTradeRunningPnl(trade: TradeAnnotation, currentPrice: number): number {
  const direction = trade.action === "BUY" || trade.action === "LEVERAGE" ? 1 : -1;
  return Math.round((currentPrice - trade.executedPrice) * trade.executedQuantity * direction * 100) / 100;
}

function getTradeRunningPnlRatio(trade: TradeAnnotation, currentPrice: number): number {
  if (trade.executedPrice <= 0) {
    return 0;
  }

  const direction = trade.action === "BUY" || trade.action === "LEVERAGE" ? 1 : -1;
  return (currentPrice / trade.executedPrice - 1) * direction;
}
