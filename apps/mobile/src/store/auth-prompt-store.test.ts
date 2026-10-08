import { beforeEach, describe, expect, it } from "vitest";
import { useAuthPromptStore } from "./auth-prompt-store";

beforeEach(() => useAuthPromptStore.setState({ visible: false, reason: "default" }));

describe("auth-prompt-store", () => {
  it("açılışta varsayılan neden 'default'", () => {
    useAuthPromptStore.getState().open();
    expect(useAuthPromptStore.getState()).toMatchObject({ visible: true, reason: "default" });
  });

  it("Kaydet kaynaklı açılış nedeni 'save' taşır; sonraki parametresiz açılış 'default'e döner", () => {
    useAuthPromptStore.getState().open("save");
    expect(useAuthPromptStore.getState().reason).toBe("save");
    useAuthPromptStore.getState().open();
    expect(useAuthPromptStore.getState().reason).toBe("default");
  });

  it("close yalnız görünürlüğü kapatır (neden korunur)", () => {
    useAuthPromptStore.getState().open("save");
    useAuthPromptStore.getState().close();
    expect(useAuthPromptStore.getState()).toMatchObject({ visible: false, reason: "save" });
  });
});
