import { generateMarket } from "@/lib/market/generator";
import { applyWorldAgentPreset, createDefaultWorldAgentConfig } from "@/lib/world/agent";

describe("world agent market events", () => {
  it("does not generate market-wide events as single-name news rumors", () => {
    const worldAgent = applyWorldAgentPreset(
      "macro",
      createDefaultWorldAgentConfig(),
    );
    const market = generateMarket(
      "macro-world-seed",
      1_700_000_000,
      {
        ...worldAgent,
        coordination: 1,
        tempo: 0.92,
      },
      "梭哈！",
    );

    const marketWideEvents = market.scheduledEvents.filter((event) => event.scope === "market");

    expect(marketWideEvents.length).toBeGreaterThan(0);
    expect(marketWideEvents.every((event) => event.kind !== "news")).toBe(true);
  });
});
