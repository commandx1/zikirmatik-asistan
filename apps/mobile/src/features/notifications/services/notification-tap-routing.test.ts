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
