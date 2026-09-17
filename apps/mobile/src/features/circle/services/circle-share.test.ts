import { describe, expect, it } from "vitest";
import { buildCircleLogPayload, buildCircleShareMessage, computeDisplayTotal, parseCircleCode } from "./circle-share";

describe("buildCircleShareMessage", () => {
  it("uses the /tr prefix and Turkish text for a tr locale", () => {
    const message = buildCircleShareMessage({ name: "Ailem", code: "ABCD2345", locale: "tr" });
    expect(message).toContain("https://zikirmatikasistan.app/tr/halka/ABCD2345");
    expect(message).toContain("Kod: ABCD2345");
    expect(message).toContain("Ailem");
  });

  it("uses no locale prefix and English text for an en locale", () => {
    const message = buildCircleShareMessage({ name: "Family", code: "ABCD2345", locale: "en" });
    expect(message).toContain("https://zikirmatikasistan.app/halka/ABCD2345");
    expect(message).toContain("Code: ABCD2345");
    expect(message).toContain("Family");
  });

  it("contains exactly one https URL", () => {
    const message = buildCircleShareMessage({ name: "Ailem", code: "ABCD2345", locale: "tr" });
    expect(message.match(/https:\/\/\S+/g)).toHaveLength(1);
  });

  it("URL path ends with the code", () => {
    const message = buildCircleShareMessage({ name: "Ailem", code: "ABCD2345", locale: "tr" });
    const [url] = message.match(/https:\/\/\S+/g) ?? [];
    expect(url?.endsWith("/ABCD2345")).toBe(true);
  });

  it("has a line containing the code", () => {
    const message = buildCircleShareMessage({ name: "Ailem", code: "ABCD2345", locale: "tr" });
    expect(message.split("\n").some((line) => line.includes("ABCD2345"))).toBe(true);
  });

  it("en locale has no /tr prefix", () => {
    const message = buildCircleShareMessage({ name: "Family", code: "ABCD2345", locale: "en" });
    expect(message).not.toContain("/tr");
  });

  it("falls back to the English message for an unknown locale (real behavior: only 'tr'-prefixed locales get Turkish text)", () => {
    const message = buildCircleShareMessage({ name: "Family", code: "ABCD2345", locale: "de" });
    expect(message).toContain("https://zikirmatikasistan.app/halka/ABCD2345");
    expect(message).toContain("Code: ABCD2345");
  });

  it("includes a circle name with quotes/emoji verbatim", () => {
    const name = `Gece "Vird" Halkası 🕌`;
    const message = buildCircleShareMessage({ name, code: "ABCD2345", locale: "tr" });
    expect(message).toContain(name);
  });
});

describe("parseCircleCode", () => {
  it("accepts a raw code, uppercasing it", () => {
    expect(parseCircleCode("abcd2345")).toBe("ABCD2345");
  });

  it("accepts a code with spaces/dashes", () => {
    expect(parseCircleCode("ab cd-23 45")).toBe("ABCD2345");
  });

  it("extracts the code from a /halka/ link", () => {
    expect(parseCircleCode("https://zikirmatikasistan.app/tr/halka/ABCD2345")).toBe("ABCD2345");
  });

  it("extracts the code from a circle/join?code= link", () => {
    expect(parseCircleCode("https://zikirmatikasistan.app/circle/join?code=ABCD2345")).toBe("ABCD2345");
  });

  it("returns null for an invalid code (contains disallowed characters like O/0/1/I)", () => {
    expect(parseCircleCode("ABCDO123")).toBeNull();
    expect(parseCircleCode("")).toBeNull();
  });

  it.each([
    ["empty string", "", null],
    ["whitespace only", "   ", null],
    ["7 chars", "ABCD234", null],
    ["9 chars", "ABCD23456", null],
    ["contains 0", "ABCD2340", null],
    ["contains O", "ABCD234O", null],
    ["contains 1", "ABCD2341", null],
    ["contains I", "ABCD234I", null],
    ["lowercase raw uppercased", "abcd2345", "ABCD2345"],
    ["dashes", "ABCD-EFGH", "ABCDEFGH"],
    ["inner spaces", "ABCD EFGH", "ABCDEFGH"],
    ["full https tr link", "https://zikirmatikasistan.app/tr/halka/ABCDEFGH", "ABCDEFGH"],
    ["en link without /tr prefix", "https://zikirmatikasistan.app/halka/ABCDEFGH", "ABCDEFGH"],
    ["link with trailing slash", "https://zikirmatikasistan.app/tr/halka/ABCDEFGH/", "ABCDEFGH"],
    ["link with query string after code", "https://zikirmatikasistan.app/tr/halka/ABCDEFGH?utm=x", "ABCDEFGH"],
    ["scheme link", "zikirmatik://circle/join?code=abcdefgh", "ABCDEFGH"],
    ["scheme link with extra params", "zikirmatik://circle/join?code=ABCDEFGH&x=1", "ABCDEFGH"],
    ["code= with empty value", "zikirmatik://circle/join?code=", null],
    ["URL whose path has no code", "https://zikirmatikasistan.app/tr/about", null]
  ])("%s", (_label, input, expected) => {
    expect(parseCircleCode(input)).toBe(expected);
  });

  it("round-trips a code pasted from the tr share message", () => {
    const message = buildCircleShareMessage({ name: "Ailem", code: "ABCDEFGH", locale: "tr" });
    expect(parseCircleCode(message)).toBe("ABCDEFGH");
  });

  it("round-trips a code pasted from the en share message", () => {
    const message = buildCircleShareMessage({ name: "Family", code: "ABCDEFGH", locale: "en" });
    expect(parseCircleCode(message)).toBe("ABCDEFGH");
  });

  it("strips a non-breaking space between halves (real behavior: \\s matches NBSP)", () => {
    expect(parseCircleCode("ABCD EFGH")).toBe("ABCDEFGH");
  });

  it("does not strip an RTL mark between halves, so the code is rejected (real behavior: \\u200F is not \\s)", () => {
    expect(parseCircleCode("ABCD‏EFGH")).toBeNull();
  });
});

describe("computeDisplayTotal", () => {
  it("computes total minus my server contribution plus my local contribution", () => {
    expect(computeDisplayTotal(0, 1000, 100, 120)).toBe(1020);
  });

  it("never goes backwards even if the server total temporarily looks lower", () => {
    expect(computeDisplayTotal(1500, 1000, 100, 100)).toBe(1500);
  });

  it("serverMine greater than localMine (another device contributed more) still never drops below prev", () => {
    expect(computeDisplayTotal(100, 500, 300, 50)).toBeGreaterThanOrEqual(100);
    expect(computeDisplayTotal(100, 500, 300, 50)).toBe(250);
  });

  it("all zeros returns 0", () => {
    expect(computeDisplayTotal(0, 0, 0, 0)).toBe(0);
  });

  it("clamps at prev when serverTotal - serverMine goes negative (real behavior: stays >= 0 when prev >= 0)", () => {
    expect(computeDisplayTotal(10, 5, 50, 0)).toBe(10);
  });

  it("handles large numbers", () => {
    expect(computeDisplayTotal(1_000_000, 2_000_000, 500_000, 100_000)).toBe(1_600_000);
  });

  it("returns prev when prev is greater than any computed value", () => {
    expect(computeDisplayTotal(999_999, 10, 5, 2)).toBe(999_999);
  });
});

describe("buildCircleLogPayload", () => {
  it("builds a circle-sourced dhikr log payload", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });

    expect(payload).toEqual({
      userId: "u1",
      dhikrId: "d1",
      count: 45,
      targetCount: 1000,
      date: "2026-09-17",
      source: "circle",
      circleId: "c1",
      isCompleted: false
    });
  });

  it("sets source to 'circle'", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });
    expect(payload.source).toBe("circle");
  });

  it("sets isCompleted to false", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });
    expect(payload.isCompleted).toBe(false);
  });

  it("sets targetCount to the circle's goalCount", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });
    expect(payload.targetCount).toBe(1000);
  });

  it("sets circleId to circle.id and dhikrId to circle.dhikrId", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });
    expect(payload.circleId).toBe("c1");
    expect(payload.dhikrId).toBe("d1");
  });

  it("does not include customDhikrId or virdProgramId keys", () => {
    const payload = buildCircleLogPayload({
      userId: "u1",
      circle: { id: "c1", dhikrId: "d1", goalCount: 1000 },
      count: 45,
      date: "2026-09-17"
    });
    expect(payload).not.toHaveProperty("customDhikrId");
    expect(payload).not.toHaveProperty("virdProgramId");
  });
});
