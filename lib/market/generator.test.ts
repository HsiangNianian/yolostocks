import { generateMarket } from "@/lib/market/generator";
import { createDefaultWorldAgentConfig } from "@/lib/world/agent";

describe("generateMarket", () => {
  it("replays the same market for the same seed", () => {
    const worldAgent = createDefaultWorldAgentConfig();
    const left = generateMarket("museum-seed-01", 1_700_000_000, worldAgent, "House Dealer");
    const right = generateMarket("museum-seed-01", 1_700_000_000, worldAgent, "House Dealer");

    expect(left.style).toBe(right.style);
    expect(left.worldClockKey).toBe(right.worldClockKey);
    expect(left.featuredTicker).toBe(right.featuredTicker);
    expect(left.tickers.map((ticker) => ticker.symbol)).toEqual(
      right.tickers.map((ticker) => ticker.symbol),
    );
    expect(left.scheduledEvents).toEqual(right.scheduledEvents);
    expect(left.tickers[0]?.candles.slice(0, 8)).toEqual(right.tickers[0]?.candles.slice(0, 8));
  });
});
