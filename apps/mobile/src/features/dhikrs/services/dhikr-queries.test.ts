import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./dhikrs-api-client", () => ({ listVerifiedActiveDhikrs: vi.fn() }));
vi.mock("./dhikr-logs-api-client", () => ({ listDhikrLogsByUser: vi.fn() }));
vi.mock("./user-dhikrs-api-client", () => ({ listUserDhikrs: vi.fn() }));

const { listVerifiedActiveDhikrs } = await import("./dhikrs-api-client");
const { listDhikrLogsByUser } = await import("./dhikr-logs-api-client");
const { queryClient } = await import("../../../lib/query-client");
const { fetchDhikrCatalog, fetchDhikrLogs } = await import("./dhikr-queries");

describe("dhikr-queries", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.mocked(listVerifiedActiveDhikrs).mockReset().mockResolvedValue([]);
    vi.mocked(listDhikrLogsByUser).mockReset().mockResolvedValue([]);
  });

  it("katalog eşzamanlı ve taze çağrılarda tek istek atar", async () => {
    await Promise.all([fetchDhikrCatalog(), fetchDhikrCatalog()]);
    await fetchDhikrCatalog();
    expect(listVerifiedActiveDhikrs).toHaveBeenCalledTimes(1);
  });

  it("loglar eşzamanlı çağrıyı tekilleştirir ama sonraki çağrıda yeniden fetch eder", async () => {
    await Promise.all([fetchDhikrLogs("u1"), fetchDhikrLogs("u1")]);
    expect(listDhikrLogsByUser).toHaveBeenCalledTimes(1);
    await fetchDhikrLogs("u1");
    expect(listDhikrLogsByUser).toHaveBeenCalledTimes(2);
    expect(listDhikrLogsByUser).toHaveBeenLastCalledWith("u1");
  });

  it("hata yeniden denenmeden çağırana düşer", async () => {
    vi.mocked(listVerifiedActiveDhikrs).mockRejectedValue(new Error("down"));
    await expect(fetchDhikrCatalog()).rejects.toThrow("down");
    expect(listVerifiedActiveDhikrs).toHaveBeenCalledTimes(1);
  });
});
