import { describe, expect, it } from "vitest";
import { createOnceGate, validateFreeSaveDraft } from "./free-save-draft";

describe("validateFreeSaveDraft", () => {
  it("MOB-KAY-02: empty / blank name is rejected", () => {
    expect(validateFreeSaveDraft({ name: "", target: "" })).toEqual({ ok: false, error: "nameRequired" });
    expect(validateFreeSaveDraft({ name: "   ", target: "33" })).toEqual({ ok: false, error: "nameRequired" });
  });

  it("MOB-KAY-03: target 0 / negative / non-number is invalid; empty means unlimited", () => {
    expect(validateFreeSaveDraft({ name: "A", target: "0" })).toEqual({ ok: false, error: "targetInvalid" });
    expect(validateFreeSaveDraft({ name: "A", target: "-3" })).toEqual({ ok: false, error: "targetInvalid" });
    expect(validateFreeSaveDraft({ name: "A", target: "abc" })).toEqual({ ok: false, error: "targetInvalid" });
    expect(validateFreeSaveDraft({ name: " A ", target: "" })).toEqual({ ok: true, name: "A", target: 0 });
    expect(validateFreeSaveDraft({ name: "A", target: "33" })).toEqual({ ok: true, name: "A", target: 33 });
  });
});

describe("createOnceGate (B-49)", () => {
  it("MOB-KAY-04: a double tap enters once; release re-arms it", () => {
    const gate = createOnceGate();
    expect([gate.enter(), gate.enter()]).toEqual([true, false]);
    gate.release();
    expect(gate.enter()).toBe(true);
  });
});
