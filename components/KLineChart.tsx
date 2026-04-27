"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import type { Candle } from "@/lib/market/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function KLineChart({
  candles,
  symbol,
  locale,
}: {
  candles: Candle[];
  symbol: string;
  locale: Locale;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

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

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }

    const data: CandlestickData[] = candles.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles, symbol]);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-pixel text-sm text-phosphor">{symbol}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-phosphor/55">
            {t(locale, "chart.subtitle")}
          </div>
        </div>
      </div>
      <div ref={rootRef} className="h-[360px] w-full" />
    </div>
  );
}
