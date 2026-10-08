import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/env", () => ({ API_BASE_URL: "http://api.test" }));

const { getUserStreak, StreaksApiError } = await import("./streaks-api-client");
const { registerAuthBridge } = await import("../../../lib/http/auth-bridge");

const fetchMock = vi.fn();
const reply = (status: number, body: unknown) =>
  ({ ok: status < 300, status, text: async () => JSON.stringify(body) }) as Response;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  registerAuthBridge({ getAccessToken: () => "tok", refresh: async () => {} });
});

describe("getUserStreak", () => {
  it("kimlikli GET /v1/streaks/:userId ve yanıtı açar", async () => {
    const streak = { userId: "u1", currentStreak: 3, longestStreak: 9, totalDaysActive: 12 };
    fetchMock.mockResolvedValue(reply(200, { data: streak }));
    await expect(getUserStreak("u1")).resolves.toEqual(streak);
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("http://api.test/v1/streaks/u1");
    expect(init.method).toBe("GET");
    expect(init.headers.authorization).toBe("Bearer tok");
  });

  it("401'de token yenilenip bir kez daha denenir", async () => {
    let token = "old";
    registerAuthBridge({
      getAccessToken: () => token,
      refresh: async () => {
        token = "new";
      }
    });
    fetchMock.mockResolvedValueOnce(reply(401, {})).mockResolvedValueOnce(reply(200, { data: { currentStreak: 1 } }));
    await expect(getUserStreak("u1")).resolves.toEqual({ currentStreak: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("404 terminal (mesaj home çevirisi), ağ hatası transient", async () => {
    fetchMock.mockResolvedValueOnce(reply(404, {}));
    const error = await getUserStreak("u1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StreaksApiError);
    expect(error).toMatchObject({ kind: "terminal", status: 404, message: "home:streaksApi.fetchFailed" });
    fetchMock.mockRejectedValueOnce(new Error("x"));
    await expect(getUserStreak("u1")).rejects.toMatchObject({ kind: "transient", message: "home:streaksApi.unreachable" });
  });
});
