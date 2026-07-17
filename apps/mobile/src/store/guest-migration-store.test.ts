import { describe, expect, it } from "vitest";
import {
  MAX_GUEST_MIGRATION_ATTEMPTS,
  rescueRehydratedState,
  type GuestMigrationSnapshot,
  type GuestMigrationStatus
} from "./guest-migration-store";

function makeSnapshot(): GuestMigrationSnapshot {
  return {
    id: "snap-1",
    capturedAt: new Date().toISOString(),
    dateKey: "2026-07-09",
    items: [
      {
        id: "subhanallah",
        source: "ready",
        name: "Sübhanallah",
        transliteration: "Subhanallah",
        current: 33,
        target: 33,
        isFavorite: false
      }
    ]
  };
}

function makeState(status: GuestMigrationStatus, opts?: { snapshot?: GuestMigrationSnapshot; attempts?: number }) {
  return {
    status,
    snapshot: opts?.snapshot,
    attempts: opts?.attempts ?? 0
  };
}

describe("rescueRehydratedState", () => {
  it("resumes a mid-run death as pending", () => {
    const state = makeState("running", { snapshot: makeSnapshot(), attempts: 1 });
    rescueRehydratedState(state);
    expect(state.status).toBe("pending");
    // attempts are preserved: a resumed run is not a fresh round.
    expect(state.attempts).toBe(1);
  });

  it("re-arms a failed run with an intact snapshot as a fresh pending round", () => {
    const state = makeState("failed", {
      snapshot: makeSnapshot(),
      attempts: MAX_GUEST_MIGRATION_ATTEMPTS
    });
    rescueRehydratedState(state);
    expect(state.status).toBe("pending");
    expect(state.attempts).toBe(0);
  });

  it("leaves a failed run without a snapshot terminal", () => {
    const state = makeState("failed", { attempts: MAX_GUEST_MIGRATION_ATTEMPTS });
    rescueRehydratedState(state);
    expect(state.status).toBe("failed");
    expect(state.attempts).toBe(MAX_GUEST_MIGRATION_ATTEMPTS);
  });

  it("does not touch completed or idle states", () => {
    for (const status of ["completed", "idle", "pending"] as const) {
      const state = makeState(status, { snapshot: makeSnapshot(), attempts: 2 });
      rescueRehydratedState(state);
      expect(state.status).toBe(status);
      expect(state.attempts).toBe(2);
    }
  });
});
