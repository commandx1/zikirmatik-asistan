import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../home/services/streaks-api-client", () => ({ getUserStreak: vi.fn() }));

const { getUserStreak } = await import("../../home/services/streaks-api-client");
const { queryClient } = await import("../../../lib/query-client");
const { qk } = await import("../../../lib/query-keys");
const { fetchUserStreak } = await import("./streak-queries");

const streak = { userId: "u1", currentStreak: 2, longestStreak: 5, totalDaysActive: 8 };

beforeEach(() => {
  queryClient.clear();
  vi.mocked(getUserStreak).mockReset().mockResolvedValue(streak);
});

describe("fetchUserStreak", () => {
  it("eşzamanlı çağrıları tekilleştirir, sonrakinde taze fetch eder (staleTime 0)", async () => {
    await Promise.all([fetchUserStreak("u1"), fetchUserStreak("u1")]);
    expect(getUserStreak).toHaveBeenCalledTimes(1);
    await fetchUserStreak("u1");
    expect(getUserStreak).toHaveBeenCalledTimes(2);
    expect(getUserStreak).toHaveBeenLastCalledWith("u1");
  });

  it("sonucu kullanıcıya özgü anahtarda tutar; iki kullanıcı birbirinin cache'ini görmez", async () => {
    await fetchUserStreak("u1");
    expect(queryClient.getQueryData(qk.streak("u1"))).toEqual(streak);
    expect(queryClient.getQueryData(qk.streak("u2"))).toBeUndefined();
    await fetchUserStreak("u2");
    expect(getUserStreak).toHaveBeenLastCalledWith("u2");
  });

  it("hata yeniden denenmeden fırlar", async () => {
    vi.mocked(getUserStreak).mockRejectedValue(new Error("down"));
    await expect(fetchUserStreak("u1")).rejects.toThrow("down");
    expect(getUserStreak).toHaveBeenCalledTimes(1);
  });
});
