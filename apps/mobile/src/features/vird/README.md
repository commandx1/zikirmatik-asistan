# Vird (mobil)

Dosya haritası:
- `types.ts` — `VirdProgramLocal` (sunucu `VirdProgram` + `clientId`/`origin`/`dhikrs` denormalizasyonu), `VirdReminderPrefs`, `VirdDayProgressByDate`.
- `services/vird-day.ts` — saf gün algoritması (`dayIndexFor`, `expectedItemsForDay`, `isDayComplete`, `slotProgress`). `apps/api/src/modules/vird/utils/vird-day.ts` ile KASITLI olarak aynı mantık/itemKey biçimi.
- `services/vird-streak.ts` — `home/services/local-streak.ts` üzerine yerel (yaklaşık, çevrimdışı) vird serisi. Bugünkü Vird kartının gösterdiği seri budur (bkz. components/todays-vird-card.tsx); authoritative değer sunucudan gelir (bkz. vird-store.ts `virdStreak`).
- `services/vird-api-client.ts` + `vird-error-codes.ts` — tüm `v1/vird/*` uçları (programlar zorunlu auth, şablonlar opsiyonel auth), `_id → id` eşlemesi.
- `services/vird-sync.ts` — sunucu senkronu için PAYLAŞILAN ağ yardımcıları (`pushLocalVirdProgram`: bir yerel programı clientId ile it, 409'da mevcut kaydı çek, opsiyonel activate; `toLocalVirdProgram`; `buildVirdTodaySnapshot`). Hem `hooks/use-vird-backend-sync.ts` hem `../../auth/services/guest-migration.ts` bunu kullanır — aynı mantığın iki kopyası YOK.
- `services/prayer-times.ts` + `data/tr-provinces.ts` — `adhan` ile vakit hesabı (81 il).
- `services/vird-reminder-notifications.ts` — lokal dilim hatırlatmaları (`kind: "vird-slot-reminder"`, Android kanalı `vird-reminders`).
- `hooks/use-vird-reminder-sync.ts` — yukarıdakini store'a bağlar. `app/_layout.tsx`'e mount edilmiştir (`useEventNotificationSync()`'in yanına).
- `hooks/use-vird-backend-sync.ts` — programları + bugünkü ilerlemeyi sunucuyla senkronlar (mount + AppState 'active' + auth değişimi). `app/_layout.tsx`'e mount edilmiştir (`useDhikrBackendSync()`'in yanına, aynı guest-migration gate'i paylaşır).
- `hooks/use-vird-counter-bridge.ts` — ana sayaç (home-context.tsx) ile vird'i bağlar: her artışta `recordProgress`, log payload'ı için `buildLogFields`, zikri dhikr-store'a ekleyen `ensureVirdItemSnapshot` ve seçimle atomik kurulacak bağlamı üreten saf `buildActiveVirdContext` (activeVirdContext'i KENDİSİ set ETMEZ/seçim YAPMAZ — home-context.tsx bunu `selectDhikr`'in üçüncü parametresi + kendi `requestDhikrTransition`'ıyla atomik olarak yapar, bkz. `HomeContextValue.startVirdItem`; bkz. dhikr-store.ts `selectDhikr` yorumu — iki ayrı store yazımına bölünseydi unsaved-guard erteledikçe bağlam kaybolurdu).
- `components/todays-vird-card.tsx` — ana ekranda (SelectedDhikrMeaning sonrası, Esma bölümünden önce) bugünkü vird kartı. Boş durumda CTA, aktif programda dilim satırları/halkaları + seri.
- `store/vird-store.ts` (proje kökünde `../../store/`) — persist edilen tek kaynak. `resetVird()` `store/session-boundary.ts`'e (logout akışı) bağlıdır.

Item key biçimi (sunucu ile birebir aynı): `` `${slot}:${prayerIndex ?? 0}:${ref}` `` — `ref` = `dhikrId ?? customDhikrId`. Örn. `morning:0:507f...`, `prayer:3:istighfar`.

## Bu turda (mobil vird entegrasyonu — 1. yarı) tamamlananlar
- Sayaç bağlamı (`dhikr-store.ts` `activeVirdContext`), köprü hook, Bugünkü Vird kartı, sunucu senkron hook'u, misafir→üye göçü (programlar + son 30 gün ilerleme), `app/_layout.tsx` mount'ları, `session-boundary.ts` reset'i.

## Sonraki worker (ekranlar) için notlar
- UI ekranları (segment seçici, program editörü, şablon rafı, il seçici) bu turda YOK. `focus/*`, `collections/*`, `ai-guide/*`, `theme-selector/*`, `profile/*`'a dokunulmadı.
- `home-context.tsx`'in `startVirdItem(program, item)` context alanı (bkz. `HomeContextValue`) dışa açıktır — ekranlar da bir vird item'ını sayaca yüklemek için bunu kullanabilir (item'ı denormalize snapshot'tan ekler, `activeVirdContext`'i kurar, mevcut unsaved-guard'lı geçişle seçer).
- `todays-vird-card.tsx`'ın boş durumu yalnızca `useVirdStore.setFocusSegment('vird')` + `router.push('/(tabs)/focus')` çağırır — focus sekmesinin `focusSegment`'i OKUYUP bir "vird" segmentine geçmesi henüz YOKTUR, ekran worker'ı bunu eklemelidir.
- Sunucu-only (bu cihazda hiç yerel karşılığı olmayan, ör. başka bir cihazda oluşturulmuş) bir program için `dhikrs` denormalizasyonu BOŞTUR (`toLocalVirdProgram` bkz. vird-sync.ts) — ad/anlam gösterimi ve `startVirdItem`'ın snapshot eklemesi bu durumda genel bir yer tutucuya (`vird:home.itemFallbackName`) düşer. İçerik-çözümleme (dhikr id'lerinden ad/anlam çekme) bir sonraki worker'ın işi.
