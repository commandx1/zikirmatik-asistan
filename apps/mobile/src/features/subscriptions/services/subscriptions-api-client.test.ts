import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/env", () => ({ API_BASE_URL: "http://api.test" }));

const { createSubscription, syncSubscriptionForUser, SubscriptionsApiError } = await import("./subscriptions-api-client");
const { registerAuthBridge } = await import("../../../lib/http/auth-bridge");

const fetchMock = vi.fn();
const reply = (status: number, body: unknown) =>
  ({ ok: status < 300, status, text: async () => JSON.stringify(body) }) as Response;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  registerAuthBridge({ getAccessToken: () => "tok", refresh: async () => {} });
});

const payload = {
  userId: "u1",
  plan: "premium" as const,
  provider: "apple" as const,
  status: "active" as const,
  productId: "p",
  startDate: "2026-01-01",
  endDate: "2027-01-01"
};

describe("subscriptions-api-client", () => {
  it("createSubscription: kimlikli POST /v1/subscriptions, gövde JSON", async () => {
    fetchMock.mockResolvedValue(reply(201, { data: { _id: "s1" } }));
    await expect(createSubscription(payload)).resolves.toEqual({ _id: "s1" });
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe("http://api.test/v1/subscriptions");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("syncSubscriptionForUser: yol kullanıcı kimliğini taşır, varsayılan gövde {}", async () => {
    fetchMock.mockResolvedValue(reply(200, { data: { userId: "u1", isPremium: true } }));
    await expect(syncSubscriptionForUser("u1")).resolves.toEqual({ userId: "u1", isPremium: true });
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/subscriptions/sync-user/u1");
    expect(init.body).toBe("{}");
  });

  it("503 doğrulayıcı hatası 'transient' ve kodu korur; 403 'terminal'", async () => {
    fetchMock.mockResolvedValueOnce(reply(503, { data: { code: "SUBSCRIPTION_VERIFIER_UNAVAILABLE", message: "x" } }));
    const transient = await createSubscription(payload).catch((e: unknown) => e);
    expect(transient).toBeInstanceOf(SubscriptionsApiError);
    expect(transient).toMatchObject({ kind: "transient", status: 503, code: "SUBSCRIPTION_VERIFIER_UNAVAILABLE" });
    fetchMock.mockResolvedValueOnce(reply(403, { code: "SUBSCRIPTION_NOT_VERIFIED" }));
    await expect(createSubscription(payload)).rejects.toMatchObject({
      kind: "terminal",
      status: 403,
      message: "subscriptions:errors.requestFailed"
    });
  });

  it("ağ hatası 'transient' + serverUnreachable mesajı", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(syncSubscriptionForUser("u1")).rejects.toMatchObject({
      kind: "transient",
      message: "subscriptions:errors.serverUnreachable"
    });
  });
});
