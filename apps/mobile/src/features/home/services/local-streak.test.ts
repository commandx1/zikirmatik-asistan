import { describe, expect, it } from "vitest";
import { resolveActivityDateKey } from "./local-streak";

describe("resolveActivityDateKey", () => {
  it("resolves today via lastActivityAt even when the label is a non-Turkish string", () => {
    const today = new Date(2026, 6, 15, 10, 0, 0);
    const activityAt = new Date(2026, 6, 15, 14, 30, 0);

    const dayKey = resolveActivityDateKey(
      { lastActivityLabel: "Today at 14:30", lastActivityAt: activityAt.toISOString() },
      today
    );

    expect(dayKey).toBe("2026-07-15");
  });

  it("falls back to Turkish-prefix label parsing when lastActivityAt is absent (legacy data)", () => {
    const today = new Date(2026, 6, 15, 10, 0, 0);

    expect(resolveActivityDateKey({ lastActivityLabel: "Bugün 14:30" }, today)).toBe("2026-07-15");
    expect(resolveActivityDateKey({ lastActivityLabel: "Dün 09:00" }, today)).toBe("2026-07-14");
  });
});
