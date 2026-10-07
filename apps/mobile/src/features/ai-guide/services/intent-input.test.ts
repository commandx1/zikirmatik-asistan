import { describe, expect, it } from "vitest";
import { canSendIntent } from "./intent-input";

describe("canSendIntent (MOB-AIR-04)", () => {
  it("is disabled for empty or whitespace-only input", () => {
    expect(canSendIntent("", false)).toBe(false);
    expect(canSendIntent("  \n\t ", false)).toBe(false);
  });
  it("is enabled for real text and disabled while loading", () => {
    expect(canSendIntent("huzur", false)).toBe(true);
    expect(canSendIntent("huzur", true)).toBe(false);
  });
});
