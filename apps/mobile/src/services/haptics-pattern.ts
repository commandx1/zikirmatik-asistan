/**
 * User-selectable haptic pattern for the dhikr counter. Kept in sync with the
 * backend (`hapticsPattern` on the user document) — see
 * `apps/api/src/modules/users/schemas/user.schema.ts`.
 *
 * - "off": no haptic feedback at all.
 * - "hafif" (light): a single light impact per tap.
 * - "orta" (medium, default): a single medium impact per tap.
 * - "tesbih": two quick light impacts per tap, mimicking a physical tesbih bead click.
 *
 * Deliberately dependency-free (no `expo-haptics` import, unlike `./haptics`):
 * stores and network-layer types (profile-store, users-api-client) need this
 * type/helper without transitively pulling in the native haptics module,
 * which drags in `react-native`/`expo-modules-core` and breaks under plain
 * Node test environments (no `__DEV__`, no Flow transform for RN's entry
 * file). `./haptics` re-exports both for call sites that already need the
 * native module anyway.
 */
export type HapticsPattern = "off" | "hafif" | "orta" | "tesbih";

/**
 * Resolves a possibly missing/invalid stored pattern to a concrete
 * `HapticsPattern`, falling back to the legacy `hapticsEnabled` boolean for
 * clients/backends that have not migrated to `hapticsPattern` yet.
 */
export function resolveHapticsPattern(
  pattern?: string | null,
  hapticsEnabled?: boolean
): HapticsPattern {
  if (pattern === "off" || pattern === "hafif" || pattern === "orta" || pattern === "tesbih") {
    return pattern;
  }

  return hapticsEnabled === false ? "off" : "orta";
}
