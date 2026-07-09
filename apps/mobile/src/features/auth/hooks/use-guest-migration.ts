import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useGuestMigrationStore } from "../../../store/guest-migration-store";
import { runGuestMigration } from "../services/guest-migration";

// Module-level in-flight lock: React 18 strict/double effects and rapid
// re-renders must never start two concurrent migration runs.
let inFlight = false;

/**
 * Drains a pending guest→member migration snapshot once the user is
 * authenticated. While the snapshot is pending/running, useDhikrBackendSync
 * stays gated so backend hydration cannot overwrite unmigrated guest data.
 */
export function useGuestMigration() {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const migrationStatus = useGuestMigrationStore((s) => s.status);
  const attempts = useGuestMigrationStore((s) => s.attempts);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) {
      return;
    }
    if (migrationStatus !== "pending" || inFlight) {
      return;
    }

    const store = useGuestMigrationStore.getState();
    const snapshot = store.snapshot;
    if (!snapshot || snapshot.items.length === 0) {
      store.completeRun();
      return;
    }

    inFlight = true;
    store.beginRun();

    runGuestMigration(snapshot, { userId, accessToken })
      .then(() => {
        useGuestMigrationStore.getState().completeRun();
      })
      .catch(async (error) => {
        const message = error instanceof Error ? error.message : "Guest migration failed";
        // Exponential backoff before releasing the retry: a transient network
        // failure (e.g. logging in while offline) must not burn every attempt
        // within milliseconds. inFlight stays held during the wait; if the app
        // dies here, the persisted state resumes as "pending" on next launch.
        const currentAttempts = useGuestMigrationStore.getState().attempts;
        const backoffMs = Math.min(30_000, 2_000 * 2 ** currentAttempts);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        useGuestMigrationStore.getState().failRun(message);
      })
      .finally(() => {
        inFlight = false;
      });
  }, [authStatus, userId, accessToken, migrationStatus, attempts]);
}
