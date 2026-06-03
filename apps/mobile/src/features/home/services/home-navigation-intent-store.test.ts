import { beforeEach, describe, expect, it } from "vitest";
import type { EsmaulHusnaItem } from "../../focus/types";
import { useHomeNavigationIntentStore } from "./home-navigation-intent-store";

const item: EsmaulHusnaItem = {
  nameArabic: "الرَّحْمٰنُ",
  transliteration: "Er-Rahmân",
  meaning: "Merhamet eden.",
  virtue: "Kalbi yumuşatır.",
  dhikrDay: "Pazar"
};

describe("home-navigation-intent-store", () => {
  beforeEach(() => {
    useHomeNavigationIntentStore.setState({
      pendingDailyEsmaStart: undefined,
      esmaListFocusRequestId: 0
    });
  });

  it("stores and consumes a pending daily esma start request", () => {
    useHomeNavigationIntentStore.getState().requestDailyEsmaStart(item);

    expect(useHomeNavigationIntentStore.getState().pendingDailyEsmaStart).toEqual(item);

    useHomeNavigationIntentStore.getState().consumeDailyEsmaStart();

    expect(useHomeNavigationIntentStore.getState().pendingDailyEsmaStart).toBeUndefined();
  });

  it("increments the esma list focus request until it is consumed", () => {
    useHomeNavigationIntentStore.getState().requestEsmaListFocus();
    const requestId = useHomeNavigationIntentStore.getState().esmaListFocusRequestId;

    expect(requestId).toBe(1);

    useHomeNavigationIntentStore.getState().consumeEsmaListFocus(requestId);

    expect(useHomeNavigationIntentStore.getState().esmaListFocusRequestId).toBe(0);
  });
});
