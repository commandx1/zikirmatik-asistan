import { beforeEach, describe, expect, it, vi } from "vitest";

const app = vi.hoisted(() => ({ nativeBuildVersion: "100" as string | null }));
vi.mock("expo-application", () => ({
  get nativeBuildVersion() {
    return app.nativeBuildVersion;
  },
}));
vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("./env", () => ({ API_BASE_URL: "http://localhost" }));

import { isUpdateRequired } from "./app-config";

describe("isUpdateRequired (MOB-SYM-02)", () => {
  beforeEach(() => {
    app.nativeBuildVersion = "100";
  });

  it("build minimumdan eskiyse zorunlu güncelleme", () => {
    expect(isUpdateRequired("101")).toBe(true);
  });

  it("min sürüm ≤ build iken modal yok", () => {
    expect(isUpdateRequired("100")).toBe(false);
    expect(isUpdateRequired("99")).toBe(false);
  });

  it("boş ve sayı olmayan min sürümde modal yok", () => {
    expect(isUpdateRequired("")).toBe(false);
    expect(isUpdateRequired("abc")).toBe(false);
    expect(isUpdateRequired("0")).toBe(false);
  });

  it("build numarası okunamıyorsa modal yok", () => {
    app.nativeBuildVersion = null;
    expect(isUpdateRequired("101")).toBe(false);
  });
});
