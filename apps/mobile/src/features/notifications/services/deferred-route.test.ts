import { describe, expect, it, vi } from "vitest";
import { createDeferredRoute } from "./deferred-route";

describe("createDeferredRoute (B-18)", () => {
  it("holds a route until the navigator is ready, then pushes it once", () => {
    const push = vi.fn();
    const d = createDeferredRoute(push);
    d.go("/(tabs)/stats");
    expect(push).not.toHaveBeenCalled();
    d.setReady(true);
    d.setReady(true);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/(tabs)/stats");
  });

  it("pushes immediately once ready and keeps only the latest pending route", () => {
    const push = vi.fn();
    const d = createDeferredRoute(push);
    d.go("/a");
    d.go("/b");
    d.setReady(true);
    expect(push.mock.calls).toEqual([["/b"]]);
    d.go("/c");
    expect(push).toHaveBeenLastCalledWith("/c");
  });
});
