import {
  extendMarketWorldEvents,
  generateMarket,
  INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS,
  LIVE_WORLD_EVENT_LOOKAHEAD_TICKS,
} from "@/lib/market/generator";
import { applyWorldAgentPreset, createDefaultWorldAgentConfig } from "@/lib/world/agent";

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

  it("extends world events during runtime without changing earlier candles", () => {
    const worldAgent = applyWorldAgentPreset("macro", createDefaultWorldAgentConfig());
    const market = generateMarket("museum-live-seed", 1_700_000_000, worldAgent, "House Dealer");
    const extended = extendMarketWorldEvents({
      market,
      worldAgent,
      sourceAgentName: "House Dealer",
      uptoTick: INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS + LIVE_WORLD_EVENT_LOOKAHEAD_TICKS,
    });

    expect(
      market.scheduledEvents.every(
        (event) => event.tick <= INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS,
      ),
    ).toBe(true);
    expect(extended.scheduledEvents.length).toBeGreaterThanOrEqual(market.scheduledEvents.length);
    expect(
      extended.scheduledEvents.every(
        (event) =>
          event.tick <=
          INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS + LIVE_WORLD_EVENT_LOOKAHEAD_TICKS,
      ),
    ).toBe(true);
    expect(extended.tickers[0]?.candles.slice(0, INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS)).toEqual(
      market.tickers[0]?.candles.slice(0, INITIAL_WORLD_EVENT_LOOKAHEAD_TICKS),
    );
  });
});
