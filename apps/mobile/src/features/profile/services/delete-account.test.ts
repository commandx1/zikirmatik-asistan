import { describe, expect, it, vi } from "vitest";
import { runDeleteAccount } from "./delete-account";

describe("runDeleteAccount (MOB-GIR-28/29, B-6)", () => {
  it("deletes on the server, then signs out", async () => {
    const order: string[] = [];
    const res = await runDeleteAccount("u1", {
      deleteUser: async (id) => void order.push(`delete:${id}`),
      signOut: async () => void order.push("signOut")
    });
    expect(res).toEqual({ ok: true });
    expect(order).toEqual(["delete:u1", "signOut"]);
  });

  it("API failure: no throw, no signOut, ok=false (session kept, UI shows error)", async () => {
    const signOut = vi.fn();
    const res = await runDeleteAccount("u1", { deleteUser: async () => Promise.reject(new Error("500")), signOut });
    expect(res).toEqual({ ok: false });
    expect(signOut).not.toHaveBeenCalled();
  });
});
