import { generateMarket } from "@/lib/market/generator";

describe("generateMarket", () => {
  it("replays the same market for the same seed", () => {
    const left = generateMarket("museum-seed-01");
    const right = generateMarket("museum-seed-01");

    expect(left.style).toBe(right.style);
    expect(left.featuredTicker).toBe(right.featuredTicker);
    expect(left.tickers.map((ticker) => ticker.symbol)).toEqual(
      right.tickers.map((ticker) => ticker.symbol),
    );
    expect(left.scheduledEvents).toEqual(right.scheduledEvents);
    expect(left.tickers[0]?.candles.slice(0, 8)).toEqual(right.tickers[0]?.candles.slice(0, 8));
  });
});
