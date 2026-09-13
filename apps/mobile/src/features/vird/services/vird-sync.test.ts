import { beforeAll, describe, expect, it, vi } from "vitest";
import type { VirdProgram, VirdTodayResponse } from "@zikirmatik/shared";
import type { VirdProgramLocal } from "../types";

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string) => key,
    language: "tr"
  }
}));

const createVirdProgram = vi.fn();
const fetchVirdPrograms = vi.fn();
const activateVirdProgram = vi.fn();

vi.mock("./vird-api-client", async () => {
  const actual = await vi.importActual<typeof import("./vird-api-client")>("./vird-api-client");
  return {
    ...actual,
    createVirdProgram: (...args: unknown[]) => createVirdProgram(...args),
    fetchVirdPrograms: (...args: unknown[]) => fetchVirdPrograms(...args),
    activateVirdProgram: (...args: unknown[]) => activateVirdProgram(...args)
  };
});

let VirdApiError: typeof import("./vird-api-client").VirdApiError;
let buildCreateVirdProgramRequest: typeof import("./vird-sync").buildCreateVirdProgramRequest;
let buildVirdTodaySnapshot: typeof import("./vird-sync").buildVirdTodaySnapshot;
let pushLocalVirdProgram: typeof import("./vird-sync").pushLocalVirdProgram;
let toLocalVirdProgram: typeof import("./vird-sync").toLocalVirdProgram;

beforeAll(async () => {
  ({ VirdApiError } = await import("./vird-api-client"));
  ({ buildCreateVirdProgramRequest, buildVirdTodaySnapshot, pushLocalVirdProgram, toLocalVirdProgram } = await import(
    "./vird-sync"
  ));
});

function makeTodayResponse(overrides: Partial<VirdTodayResponse> = {}): VirdTodayResponse {
  return {
    program: null,
    dayIndex: 1,
    slots: {},
    isDayComplete: false,
    virdStreak: { currentStreak: 0, longestStreak: 0 },
    ...overrides
  };
}

function makeLocalProgram(overrides: Partial<VirdProgramLocal> = {}): VirdProgramLocal {
  return {
    id: "client-1",
    clientId: "client-1",
    origin: "local",
    kind: "routine",
    status: "draft",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
    startDate: "2026-01-01",
    phases: [],
    prayerSelection: [1, 2, 3, 4, 5],
    reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
    dhikrs: { "dhikr-1": { ref: "dhikr-1", isCustom: false, name: "Sübhanallah" } },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function makeServerProgram(overrides: Partial<VirdProgram> = {}): VirdProgram {
  return {
    id: "server-1",
    userId: "user-1",
    clientId: "client-1",
    kind: "routine",
    status: "draft",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
    startDate: "2026-01-01",
    phases: [],
    prayerSelection: [1, 2, 3, 4, 5],
    reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("buildCreateVirdProgramRequest", () => {
  it("only carries the server-accepted fields, keyed by clientId", () => {
    const program = makeLocalProgram();
    expect(buildCreateVirdProgramRequest(program)).toEqual({
      clientId: "client-1",
      title: { tr: "Test Vird", en: "Test Vird" },
      kind: "routine",
      source: "manual",
      templateKey: undefined,
      phases: [],
      startDate: "2026-01-01",
      prayerSelection: [1, 2, 3, 4, 5],
      reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } }
    });
  });
});

describe("buildVirdTodaySnapshot", () => {
  it("returns undefined when there is no active program", () => {
    expect(buildVirdTodaySnapshot(makeTodayResponse(), "2026-02-14")).toBeUndefined();
  });

  it("flattens every slot's items into a single itemKey -> {count,target} map", () => {
    const response = makeTodayResponse({
      program: { id: "p1" } as VirdTodayResponse["program"],
      slots: {
        morning: {
          done: false,
          items: [{ itemKey: "morning:0:d1", dhikrId: "d1", prayerIndex: null, count: 33, target: 33, completed: true }]
        },
        prayer: {
          done: false,
          items: [
            { itemKey: "prayer:1:d2", dhikrId: "d2", prayerIndex: 1, count: 5, target: 10, completed: false },
            { itemKey: "prayer:2:d2", dhikrId: "d2", prayerIndex: 2, count: 0, target: 10, completed: false }
          ]
        }
      }
    });

    const result = buildVirdTodaySnapshot(response, "2026-02-14");

    expect(result).toEqual({
      dateKey: "2026-02-14",
      progress: {
        "morning:0:d1": { count: 33, target: 33 },
        "prayer:1:d2": { count: 5, target: 10 },
        "prayer:2:d2": { count: 0, target: 10 }
      }
    });
  });
});

describe("toLocalVirdProgram", () => {
  it("marks the result as origin:'server' and preserves dhikrs/clientId from the previous local record", () => {
    const server = makeServerProgram({ clientId: undefined, status: "active" });
    const previousLocal = makeLocalProgram();

    const result = toLocalVirdProgram(server, previousLocal);

    expect(result.origin).toBe("server");
    expect(result.id).toBe("server-1");
    expect(result.clientId).toBe("client-1");
    expect(result.dhikrs).toBe(previousLocal.dhikrs);
    expect(result.status).toBe("active");
  });

  it("falls back to the server id as clientId when there is no local record and no server-echoed clientId", () => {
    const server = makeServerProgram({ clientId: undefined });
    const result = toLocalVirdProgram(server);

    expect(result.clientId).toBe("server-1");
    expect(result.dhikrs).toEqual({});
  });
});

describe("pushLocalVirdProgram", () => {
  it("returns the created program on a plain successful create", async () => {
    createVirdProgram.mockReset().mockResolvedValue(makeServerProgram());
    fetchVirdPrograms.mockReset();
    activateVirdProgram.mockReset();

    const result = await pushLocalVirdProgram(makeLocalProgram(), "token-1");

    expect(result.id).toBe("server-1");
    expect(fetchVirdPrograms).not.toHaveBeenCalled();
    expect(activateVirdProgram).not.toHaveBeenCalled();
  });

  it("falls back to fetching the existing program by clientId on a 409 conflict", async () => {
    createVirdProgram.mockReset().mockRejectedValue(new VirdApiError("terminal", "conflict", 409));
    fetchVirdPrograms.mockReset().mockResolvedValue([makeServerProgram({ id: "server-2", clientId: "client-1" })]);
    activateVirdProgram.mockReset();

    const result = await pushLocalVirdProgram(makeLocalProgram(), "token-1");

    expect(result.id).toBe("server-2");
    expect(activateVirdProgram).not.toHaveBeenCalled();
  });

  it("re-throws a non-409 error without falling back", async () => {
    createVirdProgram.mockReset().mockRejectedValue(new VirdApiError("transient", "network down"));
    fetchVirdPrograms.mockReset();

    await expect(pushLocalVirdProgram(makeLocalProgram(), "token-1")).rejects.toThrow("network down");
    expect(fetchVirdPrograms).not.toHaveBeenCalled();
  });

  it("re-throws the original 409 when no program with a matching clientId is found", async () => {
    createVirdProgram.mockReset().mockRejectedValue(new VirdApiError("terminal", "conflict", 409));
    fetchVirdPrograms.mockReset().mockResolvedValue([]);

    await expect(pushLocalVirdProgram(makeLocalProgram(), "token-1")).rejects.toThrow("conflict");
  });

  it("activates the program when requested and it is not already active", async () => {
    createVirdProgram.mockReset().mockResolvedValue(makeServerProgram({ status: "draft" }));
    activateVirdProgram.mockReset().mockResolvedValue(makeServerProgram({ status: "active" }));

    const result = await pushLocalVirdProgram(makeLocalProgram(), "token-1", { activate: true });

    expect(activateVirdProgram).toHaveBeenCalledWith("server-1", "token-1");
    expect(result.status).toBe("active");
  });

  it("does not call activate when the program is already active", async () => {
    createVirdProgram.mockReset().mockResolvedValue(makeServerProgram({ status: "active" }));
    activateVirdProgram.mockReset();

    await pushLocalVirdProgram(makeLocalProgram(), "token-1", { activate: true });

    expect(activateVirdProgram).not.toHaveBeenCalled();
  });
});
