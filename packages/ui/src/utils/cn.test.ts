import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins only truthy class parts", () => {
    expect(cn("a", false, "b", undefined, "c")).toBe("a b c");
  });
});
