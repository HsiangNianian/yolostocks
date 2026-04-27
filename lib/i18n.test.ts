import { detectLocale, formatNewsHeadline } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("detects zh from browser language preferences", () => {
    expect(detectLocale(["zh-CN", "en-US"])).toBe("zh");
    expect(detectLocale(["en-US", "ja-JP"])).toBe("en");
  });

  it("formats news headlines by locale", () => {
    const event = {
      id: "AAA1-10-bullish",
      tick: 10,
      ticker: "AAA1",
      headline: "AAA1 secures mystery funding",
      headlineZh: "AAA1获得神秘融资",
      headlineVariant: 0,
      tone: "bullish" as const,
      accuracy: "real" as const,
      impact: 0.03,
      kind: "news" as const,
      scope: "ticker" as const,
      affectedTickers: ["AAA1"],
      sourceAgent: "House Dealer",
    };

    expect(formatNewsHeadline("en", event)).toBe("AAA1 secures mystery funding");
    expect(formatNewsHeadline("zh", event)).toBe("AAA1获得神秘融资");
  });
});
