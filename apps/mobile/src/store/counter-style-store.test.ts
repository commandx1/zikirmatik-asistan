import { beforeEach, describe, expect, it } from "vitest";
import { useCounterStyleStore } from "./counter-style-store";

describe("counter-style-store", () => {
  beforeEach(() => {
    useCounterStyleStore.setState({ counterStyle: "halka", material: "kehribar", soundPack: "off" });
  });

  it("defaults to halka style, kehribar material, and sound off", () => {
    const state = useCounterStyleStore.getState();

    expect(state.counterStyle).toBe("halka");
    expect(state.material).toBe("kehribar");
    expect(state.soundPack).toBe("off");
  });

  it("updates counterStyle independently of material and soundPack", () => {
    useCounterStyleStore.getState().setCounterStyle("tesbih");

    expect(useCounterStyleStore.getState().counterStyle).toBe("tesbih");
    expect(useCounterStyleStore.getState().material).toBe("kehribar");
    expect(useCounterStyleStore.getState().soundPack).toBe("off");
  });

  it("updates material independently of counterStyle", () => {
    useCounterStyleStore.getState().setMaterial("gumus");

    expect(useCounterStyleStore.getState().material).toBe("gumus");
    expect(useCounterStyleStore.getState().counterStyle).toBe("halka");
  });

  it("updates soundPack independently of the other fields", () => {
    useCounterStyleStore.getState().setSoundPack("tik");

    expect(useCounterStyleStore.getState().soundPack).toBe("tik");
    expect(useCounterStyleStore.getState().counterStyle).toBe("halka");
    expect(useCounterStyleStore.getState().material).toBe("kehribar");
  });
});
