import { describe, expect, it } from "vitest";
import { buildNextAutoFreeTitle } from "./free-mode-title";

describe("buildNextAutoFreeTitle", () => {
  it("kişisel zikirlerdeki en büyük numaranın bir fazlasını verir", () => {
    const items = [
      { source: "personal" as const, name: "Zikir 2" },
      { source: "personal" as const, name: "", transliteration: "zikir 7" },
      { source: "ready" as const, name: "Zikir 40" },
      { source: "personal" as const, name: "Zikir 3 ek" }
    ];
    expect(buildNextAutoFreeTitle(items, "Zikir", "tr")).toBe("Zikir 8");
  });

  it("eşleşme yoksa 1'den başlar", () => {
    expect(buildNextAutoFreeTitle([], "Dhikr", "en")).toBe("Dhikr 1");
  });
});
