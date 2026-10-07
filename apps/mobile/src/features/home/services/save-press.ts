export type SavePressAction = "ignore" | "login-prompt" | "save" | "free-save";

/**
 * Kaydet düğmesinin kararı (M-02 / M-04):
 * - sayım 0 → hiçbir şey (düğme zaten pasif; sunucuya 0 yazılmaz, B-9);
 * - misafir + seçili zikir → kalıcı kayıt için giriş istemi, ilerleme cihazda kalır;
 * - serbest mod → önce ad isteyen sayfa (misafir de adlandırabilir, ardından giriş istemi).
 */
export function resolveSavePress(input: { hasSelectedDhikr: boolean; count: number; isMember: boolean }): SavePressAction {
  if (input.count <= 0) return "ignore";
  if (!input.hasSelectedDhikr) return "free-save";
  return input.isMember ? "save" : "login-prompt";
}
