import { describe, expect, it } from "vitest";
import { resolveSavePress } from "./save-press";

describe("resolveSavePress", () => {
  it("MOB-KAY-09 / M-04: count 0 is ignored for everyone (no 0-log can overwrite a completed one)", () => {
    for (const isMember of [true, false]) {
      expect(resolveSavePress({ hasSelectedDhikr: true, count: 0, isMember })).toBe("ignore");
      expect(resolveSavePress({ hasSelectedDhikr: false, count: 0, isMember })).toBe("ignore");
    }
  });

  it("MOB-KAY-06 / M-02: a guest pressing save on a selected dhikr gets the login prompt", () => {
    expect(resolveSavePress({ hasSelectedDhikr: true, count: 7, isMember: false })).toBe("login-prompt");
  });

  it("members save; free mode asks for a name first", () => {
    expect(resolveSavePress({ hasSelectedDhikr: true, count: 7, isMember: true })).toBe("save");
    expect(resolveSavePress({ hasSelectedDhikr: false, count: 7, isMember: true })).toBe("free-save");
    expect(resolveSavePress({ hasSelectedDhikr: false, count: 7, isMember: false })).toBe("free-save");
  });
});
