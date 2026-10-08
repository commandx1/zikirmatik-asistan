import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/env", () => ({ API_BASE_URL: "http://api.test" }));

const { verifyProvider, refreshSession, logoutSession, AuthApiError } = await import("./auth-api-client");
const { registerAuthBridge } = await import("../../../lib/http/auth-bridge");

const fetchMock = vi.fn();
const reply = (status: number, body?: unknown) =>
  ({ ok: status < 300, status, text: async () => (body === undefined ? "" : JSON.stringify(body)) }) as Response;
const lastCall = () => fetchMock.mock.calls.at(-1)! as [string, RequestInit & { headers: Record<string, string> }];

const refresh = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  refresh.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  registerAuthBridge({ getAccessToken: () => "stale-token", refresh });
});

describe("auth-api-client", () => {
  it("verifyProvider: kimliksiz POST (Bearer yok), gövde aynen gider, yanıt açılır", async () => {
    fetchMock.mockResolvedValue(reply(200, { data: { userId: "u1", accessToken: "a", refreshToken: "r", isNewUser: true } }));
    const body = { provider: "google" as const, platform: "android" as const, idToken: "t", deviceId: "d1" };
    await expect(verifyProvider(body)).resolves.toMatchObject({ userId: "u1", isNewUser: true });
    const [url, init] = lastCall();
    expect(url).toBe("http://api.test/v1/auth/provider/verify");
    expect(init.headers.authorization).toBeUndefined();
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it("boş yanıt gövdesi {} olur (çökmez)", async () => {
    fetchMock.mockResolvedValue(reply(200, { data: null }));
    await expect(refreshSession({ refreshToken: "r" })).resolves.toEqual({});
  });

  it("refresh 401 alırsa yenileme döngüsüne GİRMEZ: tek istek, refresh() çağrılmaz", async () => {
    fetchMock.mockResolvedValue(reply(401, { message: "Oturum yenilenemedi." }));
    const error = await refreshSession({ refreshToken: "r" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthApiError);
    expect(error).toMatchObject({ kind: "terminal", status: 401, message: "Oturum yenilenemedi." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("sağlayıcı doğrulama 5xx 'transient', ağ hatası 'transient' + unreachable", async () => {
    fetchMock.mockResolvedValueOnce(reply(500, { message: "boom" }));
    await expect(verifyProvider({ provider: "apple", platform: "ios", idToken: "t", deviceId: "d1" })).rejects.toMatchObject({ kind: "transient", status: 500 });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(refreshSession({ refreshToken: "r" })).rejects.toMatchObject({
      kind: "transient",
      message: "auth:errors.serverUnreachable"
    });
  });

  it("logoutSession: 204 boş gövdede undefined döner; hata fırlatır (çağıran yutar)", async () => {
    fetchMock.mockResolvedValueOnce(reply(204));
    await expect(logoutSession({ refreshToken: "r" })).resolves.toBeUndefined();
    expect(lastCall()[0]).toBe("http://api.test/v1/auth/logout");
    expect(lastCall()[1].headers.authorization).toBeUndefined();
    fetchMock.mockResolvedValueOnce(reply(500, {}));
    await expect(logoutSession({ refreshToken: "r" })).rejects.toMatchObject({ kind: "transient" });
  });
});
