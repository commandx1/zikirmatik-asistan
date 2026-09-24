import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiGuideLastKey } from "../../../lib/storage/keys";
import type { AiGuideRecommendationRaw } from "../types";

/**
 * AsyncStorage cache payload şekli. `version: 2` ile dil-bağımlı alanların
 * artık RAW (LocalizedText) saklandığını işaretliyoruz — v1'de (bu alan
 * yokken) çözülmüş plain string saklanıyordu. Okuma bu versiyonu kontrol
 * edip eski şekilli cache'i sessizce görmezden gelir.
 */
export const AI_GUIDE_CACHE_VERSION = 2;

export type LastAiGuideResult = {
  prompt: string;
  assistantNote?: string;
  recommendationId?: string;
  recommendations: AiGuideRecommendationRaw[];
};

/** Son sonucu okur; yoksa, bozuksa ya da versiyonu uymuyorsa null. */
export async function readAiGuideCache(userId: string): Promise<LastAiGuideResult | null> {
  try {
    const raw = await AsyncStorage.getItem(aiGuideLastKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<LastAiGuideResult & { version: number }> | null;
    if (!parsed || parsed.version !== AI_GUIDE_CACHE_VERSION || !Array.isArray(parsed.recommendations)) {
      return null;
    }
    return {
      prompt: parsed.prompt ?? "",
      assistantNote: parsed.assistantNote,
      recommendationId: parsed.recommendationId,
      recommendations: parsed.recommendations
    };
  } catch {
    return null;
  }
}

/** Yazma hataları yutulur (cache best-effort). */
export async function writeAiGuideCache(userId: string, result: LastAiGuideResult): Promise<void> {
  try {
    await AsyncStorage.setItem(aiGuideLastKey(userId), JSON.stringify({ version: AI_GUIDE_CACHE_VERSION, ...result }));
  } catch {
    // ignore cache write errors
  }
}
