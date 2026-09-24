import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../env", () => ({ API_BASE_URL: "http://api.test" }));

const { ApiError, request } = await import("./client");
const { registerAuthBridge } = await import("./auth-bridge");

const errors = { failed: "failed-msg", unreachable: "unreachable-msg" };
const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  const text = body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text } as Response;
}

function authHeader(call: number) {
  return (fetchMock.mock.calls[call]![1] as RequestInit & { headers: Record<string, string> }).headers.authorization;
}

async function rejection(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error("expected rejection");
    },
    (error: unknown) => error as InstanceType<typeof ApiError>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  registerAuthBridge({ getAccessToken: () => undefined, refresh: async () => {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("request", () => {
  it("unwraps a {data} envelope and passes bare bodies through", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { data: { id: 1 } }));
    await expect(request("/x", { errors })).resolves.toEqual({ id: 1 });

    fetchMock.mockResolvedValueOnce(reply(200, { id: 2 }));
    await expect(request("/x", { errors })).resolves.toEqual({ id: 2 });

    fetchMock.mockResolvedValueOnce(reply(200, "plain text"));
    await expect(request("/x", { errors })).resolves.toBe("plain text");

    expect(fetchMock.mock.calls[0]![0]).toBe("http://api.test/x");
  });

  it("returns {} for an empty body by default, emptyValue when given", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, undefined));
    await expect(request("/x", { errors })).resolves.toEqual({});

    fetchMock.mockResolvedValueOnce(reply(200, undefined));
    await expect(request("/x", { errors, emptyValue: [] })).resolves.toEqual([]);

    fetchMock.mockResolvedValueOnce(reply(200, { data: null }));
    await expect(request("/x", { errors, emptyValue: undefined })).resolves.toBeUndefined();
  });

  it("extracts error messages with string > message > error > fallback precedence", async () => {
    const cases: [unknown, string][] = [
      ["raw failure", "raw failure"],
      [{ message: "m", error: "e" }, "m"],
      [{ message: " ", error: "e" }, "e"],
      [{ data: { error: "inner" } }, "inner"],
      [{}, "failed-msg"],
      [undefined, "failed-msg"]
    ];
    for (const [body, expected] of cases) {
      fetchMock.mockResolvedValueOnce(reply(400, body));
      expect((await rejection(request("/x", { errors }))).message).toBe(expected);
    }
  });

  it("classifies >=500 as transient and <500 as terminal, keeping status and code", async () => {
    fetchMock.mockResolvedValueOnce(reply(503, { message: "down" }));
    const server = await rejection(request("/x", { errors }));
    expect(server).toBeInstanceOf(ApiError);
    expect([server.kind, server.status]).toEqual(["transient", 503]);

    fetchMock.mockResolvedValueOnce(reply(409, { message: "dup", code: "DUPLICATE" }));
    const client = await rejection(request("/x", { errors }));
    expect([client.kind, client.status, client.code]).toEqual(["terminal", 409, "DUPLICATE"]);
  });

  it("maps network failures to transient unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
    const error = await rejection(request("/x", { errors }));
    expect([error.kind, error.message, error.status]).toEqual(["transient", "unreachable-msg", undefined]);
  });

  it("attaches the trimmed bridge token for auth: true and an explicit token string", async () => {
    registerAuthBridge({ getAccessToken: () => "  bridge-token ", refresh: async () => {} });
    fetchMock.mockResolvedValue(reply(200, {}));

    await request("/x", { errors, auth: true });
    await request("/x", { errors, auth: " explicit " });
    await request("/x", { errors });

    expect(authHeader(0)).toBe("Bearer bridge-token");
    expect(authHeader(1)).toBe("Bearer explicit");
    expect(authHeader(2)).toBeUndefined();
  });

  it("sends JSON body and method", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, {}));
    await request("/x", { errors, method: "PATCH", body: { a: 1 } });
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: "PATCH", body: '{"a":1}' });
  });

  it("aborts after timeoutMs and reports unreachable", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
        })
    );
    const pending = rejection(request("/x", { errors, timeoutMs: 1000 }));
    await vi.advanceTimersByTimeAsync(1000);
    expect((await pending).message).toBe("unreachable-msg");
  });

  it("does not attach a signal without timeoutMs", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, {}));
    await request("/x", { errors });
    expect(fetchMock.mock.calls[0]![1]).not.toHaveProperty("signal");
  });

  it("on 401 with auth: true refreshes once and retries once with the new token", async () => {
    let token = "old";
    const refresh = vi.fn(async () => {
      token = "new";
    });
    registerAuthBridge({ getAccessToken: () => token, refresh });
    fetchMock.mockResolvedValueOnce(reply(401, { message: "expired" })).mockResolvedValueOnce(reply(200, { ok: 1 }));

    await expect(request("/x", { errors, auth: true })).resolves.toEqual({ ok: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect([authHeader(0), authHeader(1)]).toEqual(["Bearer old", "Bearer new"]);
  });

  it("does not loop when the retry also returns 401", async () => {
    let token = "old";
    const refresh = vi.fn(async () => {
      token = `${token}+`;
    });
    registerAuthBridge({ getAccessToken: () => token, refresh });
    fetchMock.mockResolvedValue(reply(401, { message: "expired" }));

    expect((await rejection(request("/x", { errors, auth: true }))).status).toBe(401);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("on 401 with an unchanged token throws the original error without retrying", async () => {
    const refresh = vi.fn(async () => {});
    registerAuthBridge({ getAccessToken: () => "same", refresh });
    fetchMock.mockResolvedValueOnce(reply(401, { message: "expired" }));

    const error = await rejection(request("/x", { errors, auth: true }));
    expect([error.status, error.message]).toEqual([401, "expired"]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on 401 without auth: true", async () => {
    const refresh = vi.fn(async () => {});
    registerAuthBridge({ getAccessToken: () => "t", refresh });
    fetchMock.mockResolvedValue(reply(401, { message: "expired" }));

    await rejection(request("/x", { errors }));
    await rejection(request("/x", { errors, auth: "explicit" }));
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("applies the parse hook to the unwrapped body", async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { data: { n: "2" } }));
    const parse = vi.fn((raw: unknown) => Number((raw as { n: string }).n));
    await expect(request("/x", { errors, parse })).resolves.toBe(2);
    expect(parse).toHaveBeenCalledWith({ n: "2" });
  });
});
