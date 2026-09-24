import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import type { CounterSoundPack } from "../store/counter-style-store";
// ESM import yerine require() de çalışırdı (Metro ikisini de aynı şekilde
// bundle-zamanı asset id'sine çözer) — ama static import, testte
// vi.mock(".../tik.wav", ...) ile taklit edilebilmesi için tercih edildi:
// Vitest'in mock kaydı require()'ı değil modül grafiğini (import) devreye
// sokuyor; require() gerçek .wav ikilisini okumaya çalışıp parse hatası
// veriyordu.
import tikSound from "../../assets/sounds/tik.wav";
import ahsapSound from "../../assets/sounds/ahsap.wav";

// Sayaca her dokunuşta çalınan kısa "tık" sesi.
//
// Kasıtlı olarak expo-audio'nun HOOK DIŞI API'si kullanılır (createAudioPlayer):
// bu dosya bir React bileşeni değil, modül seviyesinde yaşayan bir singleton
// player havuzu servisidir — useAudioPlayer() bileşen yaşam döngüsüne bağlı
// olduğu için burada uygun değildir (bkz. expo-audio SDK 54 dokümanı: hook
// dışı `createAudioPlayer` "Usable outside React components").
//
// Her ses paketi ("tik" | "ahsap") için ayrı, 3 player'lık bir "round-robin"
// havuz tutulur: hızlı art arda dokunuşlarda bir player henüz bitmeden aynı
// player'ı yeniden başlatıp önceki çalışı kesmek yerine, sıradaki boş
// player'a geçilir — üst üste binen dokunuşlarda ses kesilmez. Havuzlar
// TEMBEL oluşturulur: bir ses paketi hiç çalınmadıysa onun player'ları hiç
// yaratılmaz/yüklenmez.
//
// Bu modüldeki HER fonksiyon try/catch ile korunur ve ASLA throw etmez: ses
// efekti sayacın temel işlevini (saymayı) hiçbir koşulda bozmamalı.

const POOL_SIZE = 3;

type SoundKey = Exclude<CounterSoundPack, "off">;

// Metro'nun bundle zamanında sayısal bir asset id'sine çözdüğü statik
// kaynaklar. ".wav" Metro'nun varsayılan assetExts listesinde olduğu için
// metro.config.js'e ek bir şey eklemeye gerek yoktu (bkz.
// metro-config/src/defaults). TypeScript tarafı için gereken "*.wav"
// ambient module bildirimi src/types/assets.d.ts'e eklendi.
const SOUND_SOURCES: Record<SoundKey, number> = {
  tik: tikSound,
  ahsap: ahsapSound
};

type PlayerPool = {
  players: AudioPlayer[];
  nextIndex: number;
};

const pools: Partial<Record<SoundKey, PlayerPool>> = {};

let audioModeConfigured = false;

// İlk çalmadan önce bir kez çağrılır. iOS'ta sessiz anahtar açıkken tık
// sesinin çalmaması için playsInSilentMode: false, ve efektin diğer seslerle
// (ör. arka planda çalan bir müzik uygulaması) çakışmadan karışabilmesi için
// interruptionMode: 'mixWithOthers' kullanılır.
//
// NOT (Android): "ringer" (zil) sessizde olsa bile medya ses akışı (media
// stream) cihaza göre susmayabilir — bu, işletim sisteminin ringer/medya
// akışlarını ayrı tutmasından kaynaklanan bir platform sınırlamasıdır ve
// expo-audio/setAudioModeAsync bunu değiştirmez; burada ek bir şey
// yapılmıyor.
async function ensureAudioModeConfigured(): Promise<void> {
  if (audioModeConfigured) {
    return;
  }
  // Eşzamanlı ilk çağrılarda setAudioModeAsync'i birden çok kez tetiklememek
  // için await'ten ÖNCE true yapılır.
  audioModeConfigured = true;

  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers"
    });
  } catch {
    // Ses modu ayarlanamazsa (ör. native modül yok / test ortamı) sessizce
    // devam edilir; çalma denemesi yine de yapılır.
  }
}

function getPool(pack: SoundKey): PlayerPool {
  const existing = pools[pack];
  if (existing) {
    return existing;
  }

  const players: AudioPlayer[] = [];
  for (let i = 0; i < POOL_SIZE; i += 1) {
    players.push(createAudioPlayer(SOUND_SOURCES[pack]));
  }

  const pool: PlayerPool = { players, nextIndex: 0 };
  pools[pack] = pool;
  return pool;
}

/**
 * Sayaç dokunuşu için kısa tık sesini çalar.
 *
 * `pack === 'off'` ise no-op'tur. Aksi halde ilgili paketin round-robin
 * havuzundan sıradaki player'a geçilir, başa sarılır (`seekTo(0)`) ve
 * çalınır — böylece hızlı art arda dokunuşlarda önceki çalma üstüne
 * binmeden her dokunuş kendi player'ında duyulur.
 *
 * Asla throw etmez.
 */
export function playClickSound(pack: CounterSoundPack): void {
  if (pack === "off") {
    return;
  }

  try {
    void ensureAudioModeConfigured();

    const pool = getPool(pack);
    // pool.players always has POOL_SIZE entries; nextIndex is kept in range by the modulo below.
    const player = pool.players[pool.nextIndex]!;
    pool.nextIndex = (pool.nextIndex + 1) % pool.players.length;

    void player.seekTo(0).catch(() => {
      // Konumlandırma başarısız olsa bile çalmayı yine de dene.
    });
    player.play();
  } catch {
    // Ses çalma efekti hiçbir koşulda sayaç akışını kesmemeli.
  }
}
