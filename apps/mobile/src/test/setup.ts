// Vitest setupFiles: vi.mock çağrıları hoist edilir ve HER test dosyasına
// uygulanır (bkz. vitest.config.ts). Buradaki üç mock, 27+ test dosyasındaki
// birebir aynı inline vi.mock kopyalarının birleşimidir (bkz. görev notu):
//   - @react-native-async-storage/async-storage: gövdesiz vi.fn() stub'ları
//     (çoğunluk deseni — gerçek bir bellek-içi depoya ihtiyaç duyan testler
//     kendi vi.mock'unu KORUR, bu yerel çağrı paylaşılanı ezer).
//   - react-native: yalnızca testlerde kullanılan minimum Platform yüzeyi.
//   - ../i18n: t(key) => key + language "tr"; src/i18n/index.ts'i
//     mock'lamadan import etmek expo-localization üzerinden react-native'i
//     çeker ve vitest'in SSR dönüşümü "Expected 'from', got 'typeOf'" ile
//     patlar — bu mock o zinciri baştan keser.
import { vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

vi.mock("../i18n", () => ({
  i18n: {
    t: (key: string) => key,
    language: "tr"
  }
}));
