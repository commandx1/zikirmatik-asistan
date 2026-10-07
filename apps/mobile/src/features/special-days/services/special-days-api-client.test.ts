import { afterEach, describe, expect, it, vi } from "vitest";
import { registerAuthBridge } from "../../../lib/http/auth-bridge";

const { getSpecialDayDetail, getSpecialDaysHome } = await import("./special-days-api-client");

describe("special-days GET'leri misafire açık (A-22, MOB-OZG-*)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    registerAuthBridge({ getAccessToken: () => undefined, refresh: async () => {} });
  });

  function stubFetch() {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("misafir: home isteği token olmadan gider ve başarılı döner", async () => {
    const fetchMock = stubFetch();
    await getSpecialDaysHome("2026-10-07");
    const init = fetchMock.mock.calls[0]![1] as { headers: Record<string, string> };
    expect(fetchMock.mock.calls[0]![0]).toContain("/v1/special-days/home?date=2026-10-07");
    expect(init.headers.authorization).toBeUndefined();
  });

  it("üyenin (bayat olabilecek) tokenı özel gün isteklerine eklenmez", async () => {
    registerAuthBridge({ getAccessToken: () => "stale-token", refresh: async () => {} });
    const fetchMock = stubFetch();
    await getSpecialDaysHome();
    await getSpecialDayDetail("abc");
    for (const call of fetchMock.mock.calls) {
      expect((call[1] as { headers: Record<string, string> }).headers.authorization).toBeUndefined();
    }
  });
});
