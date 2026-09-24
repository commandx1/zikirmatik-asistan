import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];

function record(label: string) {
  return (...args: unknown[]) => {
    calls.push(label);
    return args;
  };
}

const fireTapHaptic = vi.fn(record("tap"));
const fireLapHaptic = vi.fn(record("lap"));
const playClickSound = vi.fn(record("click"));

vi.mock("./haptics", () => ({
  fireTapHaptic: (...args: unknown[]) => fireTapHaptic(...args),
  fireLapHaptic: (...args: unknown[]) => fireLapHaptic(...args)
}));

vi.mock("./click-sound", () => ({
  playClickSound: (...args: unknown[]) => playClickSound(...args)
}));

import { fireCounterFeedback } from "./counter-feedback";

beforeEach(() => {
  calls.length = 0;
  fireTapHaptic.mockClear();
  fireLapHaptic.mockClear();
  playClickSound.mockClear();
});

describe("fireCounterFeedback", () => {
  it("fires tap haptic then click sound, in that order, for a plain tap", () => {
    const lapCompleted = fireCounterFeedback({ prev: 1, next: 2, lapSize: 33, pattern: "orta", soundPack: "tik" });

    expect(calls).toEqual(["tap", "click"]);
    expect(lapCompleted).toBe(false);
    expect(fireTapHaptic).toHaveBeenCalledWith("orta");
    expect(playClickSound).toHaveBeenCalledWith("tik");
    expect(fireLapHaptic).not.toHaveBeenCalled();
  });

  it("also fires the lap haptic, after tap+click, exactly at a lap boundary", () => {
    const lapCompleted = fireCounterFeedback({ prev: 32, next: 33, lapSize: 33, pattern: "hafif", soundPack: "ahsap" });

    expect(calls).toEqual(["tap", "click", "lap"]);
    expect(lapCompleted).toBe(true);
    expect(fireLapHaptic).toHaveBeenCalledWith("hafif");
  });

  it("does not fire the lap haptic just short of a boundary", () => {
    const lapCompleted = fireCounterFeedback({ prev: 31, next: 32, lapSize: 33, pattern: "orta", soundPack: "off" });

    expect(calls).toEqual(["tap", "click"]);
    expect(lapCompleted).toBe(false);
  });

  it("supports a non-default lapSize (e.g. a vird item's target)", () => {
    const lapCompleted = fireCounterFeedback({ prev: 9, next: 10, lapSize: 10, pattern: "orta", soundPack: "off" });

    expect(lapCompleted).toBe(true);
  });

  it("is a no-op when next === prev", () => {
    fireCounterFeedback({ prev: 5, next: 5, lapSize: 33, pattern: "orta", soundPack: "tik" });

    expect(calls).toEqual([]);
    expect(fireTapHaptic).not.toHaveBeenCalled();
    expect(playClickSound).not.toHaveBeenCalled();
    expect(fireLapHaptic).not.toHaveBeenCalled();
  });
});
