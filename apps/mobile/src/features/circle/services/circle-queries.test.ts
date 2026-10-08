import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./circle-api-client", () => ({ fetchCircles: vi.fn() }));

const { fetchCircles } = await import("./circle-api-client");
const { queryClient } = await import("../../../lib/query-client");
const { qk } = await import("../../../lib/query-keys");
const { fetchCirclesForUser } = await import("./circle-queries");

beforeEach(() => {
  queryClient.clear();
  vi.mocked(fetchCircles).mockReset().mockResolvedValue([{ id: "c1" }] as never);
});

describe("fetchCirclesForUser", () => {
  it("arka plan senkronu ile odak tazelemesi aynı anda gelirse tek istek atılır", async () => {
    const [a, b] = await Promise.all([fetchCirclesForUser("u1"), fetchCirclesForUser("u1")]);
    expect(fetchCircles).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("her ayrı çağrı taze fetch eder ve sonucu qk.circles(userId) altında tutar", async () => {
    await fetchCirclesForUser("u1");
    await fetchCirclesForUser("u1");
    expect(fetchCircles).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(qk.circles("u1"))).toEqual([{ id: "c1" }]);
    expect(queryClient.getQueryData(qk.circles("u2"))).toBeUndefined();
  });

  it("oturumsuz (undefined) kullanıcı ayrı anahtar kullanır; hata yeniden denenmez", async () => {
    await fetchCirclesForUser(undefined);
    expect(queryClient.getQueryData(qk.circles(undefined))).toBeDefined();
    vi.mocked(fetchCircles).mockClear().mockRejectedValue(new Error("down"));
    await expect(fetchCirclesForUser("u1")).rejects.toThrow("down");
    expect(fetchCircles).toHaveBeenCalledTimes(1);
  });
});
