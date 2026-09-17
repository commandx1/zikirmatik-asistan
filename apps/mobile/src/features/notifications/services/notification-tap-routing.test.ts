import { describe, expect, it } from "vitest";
import { extractNotificationRoute } from "./notification-tap-routing";

function responseWithData(data: unknown) {
  return { notification: { request: { content: { data } } } };
}

describe("extractNotificationRoute", () => {
  it("returns the special-day detail route from a campaign push", () => {
    const response = responseWithData({
      route: "/special-days/019f5125-4876-72e3-bf41-2635d906ddbc"
    });

    expect(extractNotificationRoute(response)).toBe(
      "/special-days/019f5125-4876-72e3-bf41-2635d906ddbc"
    );
  });

  it("returns the Friday campaign tab route", () => {
    const response = responseWithData({ route: "/(tabs)/special-days" });

    expect(extractNotificationRoute(response)).toBe("/(tabs)/special-days");
  });

  it("returns the home route from a local streak reminder", () => {
    const response = responseWithData({
      kind: "streak-reminder",
      route: "/(tabs)/home"
    });

    expect(extractNotificationRoute(response)).toBe("/(tabs)/home");
  });

  it("returns the stats tab route from the weekly summary campaign", () => {
    const response = responseWithData({ route: "/(tabs)/stats" });

    expect(extractNotificationRoute(response)).toBe("/(tabs)/stats");
  });

  it("returns the vird hub route with a highlighted slot from a local vird reminder", () => {
    const response = responseWithData({
      kind: "vird-slot-reminder",
      route: "/vird?slot=morning"
    });

    expect(extractNotificationRoute(response)).toBe("/vird?slot=morning");
  });

  it("returns the vird hub route with a highlighted prayer slot + prayerIndex", () => {
    const response = responseWithData({
      kind: "vird-slot-reminder",
      route: "/vird?slot=prayer&prayerIndex=3"
    });

    expect(extractNotificationRoute(response)).toBe("/vird?slot=prayer&prayerIndex=3");
  });

  it("rejects routes outside the allowlist", () => {
    expect(
      extractNotificationRoute(responseWithData({ route: "/settings" }))
    ).toBeNull();
    expect(
      extractNotificationRoute(
        responseWithData({ route: "https://evil.example.com" })
      )
    ).toBeNull();
    expect(
      extractNotificationRoute(
        responseWithData({ route: "/special-days/../auth" })
      )
    ).toBeNull();
  });

  it("returns the circle detail route for a 24-hex-char id", () => {
    const response = responseWithData({ route: "/circle/507f1f77bcf86cd799439011" });
    expect(extractNotificationRoute(response)).toBe("/circle/507f1f77bcf86cd799439011");
  });

  it("rejects a circle id with 23 hex chars", () => {
    expect(
      extractNotificationRoute(responseWithData({ route: "/circle/507f1f77bcf86cd79943901" }))
    ).toBeNull();
  });

  it("rejects an uppercase hex circle id (real behavior: pattern only allows a-f0-9)", () => {
    expect(
      extractNotificationRoute(responseWithData({ route: "/circle/507F1F77BCF86CD799439011" }))
    ).toBeNull();
  });

  it("rejects a circle route with a trailing path segment", () => {
    expect(
      extractNotificationRoute(responseWithData({ route: "/circle/507f1f77bcf86cd799439011/extra" }))
    ).toBeNull();
  });

  it("rejects the bare /circle route", () => {
    expect(extractNotificationRoute(responseWithData({ route: "/circle" }))).toBeNull();
  });

  it("rejects a double-slash-prefixed circle route", () => {
    expect(
      extractNotificationRoute(responseWithData({ route: "//circle/507f1f77bcf86cd799439011" }))
    ).toBeNull();
  });

  it("still allows an existing route (sanity check)", () => {
    expect(extractNotificationRoute(responseWithData({ route: "/(tabs)/home" }))).toBe("/(tabs)/home");
  });

  it("returns null for missing or malformed payloads", () => {
    expect(extractNotificationRoute(null)).toBeNull();
    expect(extractNotificationRoute(undefined)).toBeNull();
    expect(extractNotificationRoute({})).toBeNull();
    expect(extractNotificationRoute(responseWithData(undefined))).toBeNull();
    expect(extractNotificationRoute(responseWithData("route"))).toBeNull();
    expect(extractNotificationRoute(responseWithData({ route: 42 }))).toBeNull();
    expect(extractNotificationRoute(responseWithData({}))).toBeNull();
  });
});
